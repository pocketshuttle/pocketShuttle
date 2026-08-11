import { pathToFileURL } from "node:url";

import { Client, Schedule } from "@upstash/qstash";

export type QStashScheduleDefinition = {
  name: string;
  path: string;
  cron: string;
  retries: number;
};

export const QSTASH_SCHEDULES: readonly QStashScheduleDefinition[] = [
  {
    name: "reset-student",
    path: "/api/cron-jobs/reset-student",
    cron: "45 2 * * *",
    retries: 3,
  },
  {
    name: "reset-status",
    path: "/api/cron-jobs/reset-status",
    cron: "0 9 * * *",
    retries: 3,
  },
  {
    name: "subscriptions",
    path: "/api/cron-jobs/subscriptions",
    cron: "15 * * * *",
    retries: 0,
  },
  {
    name: "trip-templates",
    path: "/api/cron-jobs/trip-templates",
    cron: "*/15 * * * *",
    retries: 0,
  },
  {
    name: "recurring-trip-suggestions",
    path: "/api/cron-jobs/recurring-trip-suggestions",
    cron: "0 6 * * *",
    retries: 0,
  },
  {
    name: "outbound-webhooks",
    path: "/api/cron-jobs/outbound-webhooks",
    cron: "*/5 * * * *",
    retries: 0,
  },
  {
    name: "support-retention",
    path: "/api/cron-jobs/support-retention",
    cron: "20 3 * * *",
    retries: 3,
  },
] as const;

type QStashCommand = "sync" | "check" | "remove";
type Environment = Record<string, string | undefined>;

type QStashConfig = {
  token: string;
  destinationBaseUrl: URL;
  prefix: string;
};

function requiredEnvironmentValue(
  environment: Environment,
  name: string
) {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

export function loadQStashConfig(
  environment: Environment = process.env
): QStashConfig {
  const token = requiredEnvironmentValue(environment, "QSTASH_TOKEN");
  const destination = requiredEnvironmentValue(
    environment,
    "QSTASH_DESTINATION_BASE_URL"
  );
  const prefix = requiredEnvironmentValue(
    environment,
    "QSTASH_SCHEDULE_PREFIX"
  );
  const destinationBaseUrl = new URL(destination);

  if (destinationBaseUrl.protocol !== "https:") {
    throw new Error("QSTASH_DESTINATION_BASE_URL must use https");
  }
  if (!/^[A-Za-z0-9._-]+$/.test(prefix)) {
    throw new Error(
      "QSTASH_SCHEDULE_PREFIX may contain only letters, numbers, periods, underscores, and hyphens"
    );
  }

  return { token, destinationBaseUrl, prefix };
}

export function qstashScheduleId(prefix: string, name: string) {
  return `${prefix}-${name}`;
}

export function qstashDestination(baseUrl: URL, path: string) {
  return new URL(path, baseUrl).toString();
}

export function hasFutureNextRun(
  schedule: Pick<Schedule, "nextScheduleTime">,
  now = Date.now()
) {
  return (
    typeof schedule.nextScheduleTime === "number" &&
    Number.isFinite(schedule.nextScheduleTime) &&
    schedule.nextScheduleTime > now
  );
}

function matchesDefinition(
  schedule: Schedule,
  definition: QStashScheduleDefinition,
  config: QStashConfig
) {
  return (
    schedule.scheduleId === qstashScheduleId(config.prefix, definition.name) &&
    schedule.destination ===
      qstashDestination(config.destinationBaseUrl, definition.path) &&
    schedule.cron === definition.cron &&
    schedule.method.toUpperCase() === "GET" &&
    schedule.retries === definition.retries &&
    schedule.isPaused === false &&
    hasFutureNextRun(schedule)
  );
}

async function syncSchedules(client: Client, config: QStashConfig) {
  for (const definition of QSTASH_SCHEDULES) {
    await client.schedules.create({
      destination: qstashDestination(
        config.destinationBaseUrl,
        definition.path
      ),
      scheduleId: qstashScheduleId(config.prefix, definition.name),
      cron: definition.cron,
      method: "GET",
      retries: definition.retries,
      label: ["pocketshuttle-cron", definition.name],
    });
    console.log(`Synced QStash schedule: ${definition.name}`);
  }
}

async function checkSchedules(client: Client, config: QStashConfig) {
  const remoteSchedules = await client.schedules.list();
  const byId = new Map(
    remoteSchedules.map((schedule) => [schedule.scheduleId, schedule])
  );
  const invalid: string[] = [];

  for (const definition of QSTASH_SCHEDULES) {
    const schedule = byId.get(
      qstashScheduleId(config.prefix, definition.name)
    );
    if (!schedule || !matchesDefinition(schedule, definition, config)) {
      invalid.push(definition.name);
      continue;
    }
    console.log(
      `Verified QStash schedule: ${definition.name}; next run ${new Date(
        schedule.nextScheduleTime as number
      ).toISOString()}`
    );
  }

  if (invalid.length > 0) {
    throw new Error(`Missing or mismatched schedules: ${invalid.join(", ")}`);
  }
}

async function removeSchedules(client: Client, config: QStashConfig) {
  const remoteSchedules = await client.schedules.list();
  const existingIds = new Set(
    remoteSchedules.map((schedule) => schedule.scheduleId)
  );

  for (const definition of QSTASH_SCHEDULES) {
    const scheduleId = qstashScheduleId(config.prefix, definition.name);
    if (!existingIds.has(scheduleId)) {
      console.log(`QStash schedule already absent: ${definition.name}`);
      continue;
    }
    await client.schedules.delete(scheduleId);
    console.log(`Removed QStash schedule: ${definition.name}`);
  }
}

function sanitizedError(error: unknown, config: QStashConfig | null) {
  let message = error instanceof Error ? error.message : "Unknown QStash error";
  if (!config) return message;
  for (const value of [
    config.token,
    config.destinationBaseUrl.toString(),
    config.prefix,
  ]) {
    message = message.split(value).join("[redacted]");
  }
  return message;
}

export async function runQStashCommand(
  command: QStashCommand,
  environment: Environment = process.env
) {
  let config: QStashConfig | null = null;
  try {
    config = loadQStashConfig(environment);
    const client = new Client({ token: config.token });
    if (command === "sync") await syncSchedules(client, config);
    if (command === "check") await checkSchedules(client, config);
    if (command === "remove") await removeSchedules(client, config);
  } catch (error) {
    throw new Error(sanitizedError(error, config));
  }
}

async function main() {
  const command = process.argv[2];
  if (!(["sync", "check", "remove"] as string[]).includes(command)) {
    throw new Error("Usage: qstash-schedules <sync|check|remove>");
  }
  await runQStashCommand(command as QStashCommand);
}

const entrypoint = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : null;
if (entrypoint === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "QStash command failed");
    process.exitCode = 1;
  });
}
