import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { apiRequest } from "../../src/api/client";
import { AppButton, Card, Chips, EmptyState, Header, LoadingState, Screen, StatusPill, textStyles } from "../../src/components/ui";
import { timeAgo } from "../../src/lib/child-place-label";

type Ticket = {
  id: string;
  message: string;
  status: "PENDING" | "FIXED";
  priority?: "HIGH" | "NORMAL";
  createdAt: string;
  fixedAt?: string | null;
  deletedAt?: string | null;
};

type TicketView = "track" | "history";

export default function SupportScreen() {
  const router = useRouter();
  const [view, setView] = useState<TicketView>("track");
  const tickets = useQuery({
    queryKey: ["support-tickets", view],
    queryFn: () =>
      apiRequest<{ tickets: Ticket[] }>(view === "history" ? "/api/support-tickets?view=history" : "/api/support-tickets"),
    select: (data) => data.tickets,
    refetchInterval: 30_000,
  });

  return (
    <Screen>
      <Header eyebrow="Help" title="Support" subtitle="Tell us what happened and track the fix. Urgent safety issues are prioritised." />
      <AppButton label="Open a new ticket" onPress={() => router.push("/support/new")} />
      <Chips<TicketView>
        options={[
          { value: "track", label: "Open tickets" },
          { value: "history", label: "History" },
        ]}
        value={view}
        onChange={setView}
      />
      {tickets.isLoading ? <LoadingState label="Loading tickets…" /> : null}
      {tickets.data?.length ? (
        <View style={styles.list}>
          {tickets.data.map((ticket) => (
            <Card key={ticket.id}>
              <View style={styles.row}>
                <View style={styles.pills}>
                  <StatusPill label={ticket.status === "FIXED" ? "Fixed" : "Pending"} />
                  {ticket.priority === "HIGH" ? <StatusPill label="Urgent" danger /> : null}
                </View>
                <Text style={textStyles.muted}>{timeAgo(ticket.createdAt)}</Text>
              </View>
              <Text style={textStyles.body} numberOfLines={4}>
                {ticket.message}
              </Text>
              {ticket.fixedAt ? <Text style={textStyles.muted}>Fixed {timeAgo(ticket.fixedAt)}</Text> : null}
              {view === "history" && ticket.deletedAt ? (
                <Text style={textStyles.muted}>
                  Kept until {new Date(new Date(ticket.deletedAt).getTime() + 21 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </Text>
              ) : null}
            </Card>
          ))}
        </View>
      ) : !tickets.isLoading ? (
        <EmptyState
          title={view === "history" ? "No ticket history" : "No open tickets"}
          message={view === "history" ? "Closed tickets from the last 21 days appear here." : "Open a ticket and we'll get back to you."}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  pills: { flexDirection: "row", gap: 6 },
});
