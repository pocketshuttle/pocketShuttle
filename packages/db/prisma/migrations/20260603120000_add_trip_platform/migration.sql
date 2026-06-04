-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('family_trip', 'school_trip', 'interstate_trip', 'corporate_trip');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('scheduled', 'active', 'paused', 'completed', 'cancelled', 'emergency');

-- CreateEnum
CREATE TYPE "TripParticipantRole" AS ENUM ('passenger', 'child', 'driver', 'assistant', 'traveler');

-- CreateEnum
CREATE TYPE "TripParticipantStatus" AS ENUM ('scheduled', 'boarded', 'dropped', 'absent');

-- CreateEnum
CREATE TYPE "TripViewerPermission" AS ENUM ('view_location', 'view_events', 'receive_alerts', 'emergency_contact');

-- CreateEnum
CREATE TYPE "TripEventType" AS ENUM ('trip_started', 'trip_paused', 'trip_ended', 'participant_present', 'participant_boarded', 'participant_dropped', 'participant_absent', 'stop_reached', 'route_deviation', 'unusual_stop', 'emergency_triggered', 'emergency_resolved', 'eta_updated');

-- CreateEnum
CREATE TYPE "SafetyState" AS ENUM ('normal', 'attention', 'emergency');

-- CreateTable
CREATE TABLE "trips" (
    "id" TEXT NOT NULL,
    "trip_type" "TripType" NOT NULL,
    "title" TEXT NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'scheduled',
    "safety_state" "SafetyState" NOT NULL DEFAULT 'normal',
    "origin" JSONB,
    "destination" JSONB,
    "driver_id" TEXT,
    "vehicle_id" TEXT,
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_by" TEXT,
    "legacy_school_id" TEXT,
    "legacy_bus_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_participants" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "participant_type" TEXT NOT NULL,
    "user_id" TEXT,
    "role" "TripParticipantRole" NOT NULL,
    "status" "TripParticipantStatus" NOT NULL DEFAULT 'scheduled',
    "boarded_at" TIMESTAMP(3),
    "dropped_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_viewers" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "viewer_id" TEXT NOT NULL,
    "viewer_type" TEXT NOT NULL,
    "permissions" "TripViewerPermission"[],
    "expires_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_viewers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_events" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "event_type" "TripEventType" NOT NULL,
    "actor_id" TEXT,
    "actor_type" TEXT,
    "payload" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_locations" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trips_trip_type_status_idx" ON "trips"("trip_type", "status");

-- CreateIndex
CREATE INDEX "trips_legacy_school_id_vehicle_id_created_at_idx" ON "trips"("legacy_school_id", "vehicle_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "trip_participants_trip_id_participant_type_participant_id_key" ON "trip_participants"("trip_id", "participant_type", "participant_id");

-- CreateIndex
CREATE INDEX "trip_participants_participant_type_participant_id_idx" ON "trip_participants"("participant_type", "participant_id");

-- CreateIndex
CREATE INDEX "trip_participants_user_id_idx" ON "trip_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "trip_viewers_trip_id_viewer_type_viewer_id_key" ON "trip_viewers"("trip_id", "viewer_type", "viewer_id");

-- CreateIndex
CREATE INDEX "trip_viewers_viewer_type_viewer_id_idx" ON "trip_viewers"("viewer_type", "viewer_id");

-- CreateIndex
CREATE INDEX "trip_events_trip_id_timestamp_idx" ON "trip_events"("trip_id", "timestamp");

-- CreateIndex
CREATE INDEX "trip_events_event_type_timestamp_idx" ON "trip_events"("event_type", "timestamp");

-- CreateIndex
CREATE INDEX "trip_locations_trip_id_timestamp_idx" ON "trip_locations"("trip_id", "timestamp");

-- AddForeignKey
ALTER TABLE "trip_participants" ADD CONSTRAINT "trip_participants_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_viewers" ADD CONSTRAINT "trip_viewers_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_events" ADD CONSTRAINT "trip_events_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_locations" ADD CONSTRAINT "trip_locations_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
