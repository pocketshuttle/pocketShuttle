import "server-only";

import { distanceMeters, jsonPoint, Point } from "@/lib/trip-automation";
import { notifyRecurringTripSuggestion } from "@/lib/recurring-trip-suggestion-notifications";
import db from "@/packages/db/client";

const CLUSTER_WINDOW_DAYS = 60;
const CLUSTER_RADIUS_METERS = 150;
const MIN_OCCURRENCES = 4;
const MAX_BILLING_ACCOUNTS_PER_RUN = 200;

type TripPoint = { tripId: string; point: Point; createdAt: Date; label: string | null };

type Cluster = {
  points: TripPoint[];
  centroid: Point;
};

function labelFor(destination: unknown): string | null {
  if (!destination || typeof destination !== "object" || Array.isArray(destination)) return null;
  const record = destination as Record<string, unknown>;
  const label = record.address ?? record.name;
  return typeof label === "string" && label.trim().length > 0 ? label : null;
}

function clusterPoints(tripPoints: TripPoint[]): Cluster[] {
  const clusters: Cluster[] = [];
  const assigned = new Set<string>();

  for (const seed of tripPoints) {
    if (assigned.has(seed.tripId)) continue;
    const members = [seed];
    assigned.add(seed.tripId);
    let centroid = seed.point;

    let grew = true;
    while (grew) {
      grew = false;
      for (const candidate of tripPoints) {
        if (assigned.has(candidate.tripId)) continue;
        if (distanceMeters(centroid, candidate.point) <= CLUSTER_RADIUS_METERS) {
          members.push(candidate);
          assigned.add(candidate.tripId);
          centroid = {
            lat: members.reduce((sum, item) => sum + item.point.lat, 0) / members.length,
            lng: members.reduce((sum, item) => sum + item.point.lng, 0) / members.length,
          };
          grew = true;
        }
      }
    }

    clusters.push({ points: members, centroid });
  }

  return clusters;
}

export async function runRecurringTripSuggestionSweep() {
  const windowStart = new Date(Date.now() - CLUSTER_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const billingAccounts = await db.billingAccount.findMany({
    where: { type: "FAMILY", parentId: { not: null } },
    select: { id: true, parentId: true },
    take: MAX_BILLING_ACCOUNTS_PER_RUN,
  });

  let suggestionsCreated = 0;

  for (const billingAccount of billingAccounts) {
    if (!billingAccount.parentId) continue;

    const trips = await db.trip.findMany({
      where: {
        createdBy: billingAccount.parentId,
        tripType: "family_trip",
        createdAt: { gte: windowStart },
      },
      select: { id: true, destination: true, createdAt: true },
      take: 300,
    });

    const tripPoints: TripPoint[] = trips.flatMap((trip) => {
      const point = jsonPoint(trip.destination);
      return point
        ? [{ tripId: trip.id, point, createdAt: trip.createdAt, label: labelFor(trip.destination) }]
        : [];
    });

    if (tripPoints.length < MIN_OCCURRENCES) continue;

    const clusters = clusterPoints(tripPoints).filter(
      (cluster) => cluster.points.length >= MIN_OCCURRENCES
    );
    if (!clusters.length) continue;

    const [activeTemplates, existingSuggestions] = await Promise.all([
      db.tripTemplate.findMany({
        where: { billingAccountId: billingAccount.id, isActive: true },
        select: { destination: true },
      }),
      db.recurringTripSuggestion.findMany({
        where: { billingAccountId: billingAccount.id, status: { in: ["PENDING", "DISMISSED"] } },
        select: { destinationLat: true, destinationLng: true },
      }),
    ]);

    const activeTemplatePoints = activeTemplates.flatMap((template) => {
      const point = jsonPoint(template.destination);
      return point ? [point] : [];
    });

    const survivingClusters = clusters.filter((cluster) => {
      const coveredByTemplate = activeTemplatePoints.some(
        (point) => distanceMeters(point, cluster.centroid) <= CLUSTER_RADIUS_METERS
      );
      if (coveredByTemplate) return false;

      const alreadySuggested = existingSuggestions.some(
        (suggestion) =>
          distanceMeters(
            { lat: suggestion.destinationLat, lng: suggestion.destinationLng },
            cluster.centroid
          ) <= CLUSTER_RADIUS_METERS
      );
      return !alreadySuggested;
    });

    if (!survivingClusters.length) continue;

    const parent = await db.parent.findUnique({
      where: { id: billingAccount.parentId },
      select: { full_name: true, email: true },
    });

    for (const cluster of survivingClusters) {
      const mostRecent = [...cluster.points].sort(
        (left, right) => right.createdAt.getTime() - left.createdAt.getTime()
      )[0];

      const suggestion = await db.recurringTripSuggestion.create({
        data: {
          billingAccountId: billingAccount.id,
          destinationLat: cluster.centroid.lat,
          destinationLng: cluster.centroid.lng,
          destinationLabel: mostRecent.label,
          occurrenceCount: cluster.points.length,
          lastTripId: mostRecent.tripId,
          notifiedAt: new Date(),
        },
      });
      suggestionsCreated += 1;

      try {
        await notifyRecurringTripSuggestion({
          suggestionId: suggestion.id,
          parentId: billingAccount.parentId,
          parentName: parent?.full_name,
          parentEmail: parent?.email,
          destinationLabel: suggestion.destinationLabel,
          occurrenceCount: suggestion.occurrenceCount,
        });
      } catch (error) {
        console.error("[recurring-trip-suggestions] notify failed", error);
      }
    }
  }

  return { billingAccountsScanned: billingAccounts.length, suggestionsCreated };
}
