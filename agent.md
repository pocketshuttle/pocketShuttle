# PocketShuttle Codex Instructions

## Product Identity

PocketShuttle is a realtime movement accountability and safety platform.

It is NOT:

* A school bus app
* A child tracking app
* A transport company dashboard

It IS:

* A trip platform
* A safety platform
* An accountability platform
* A realtime movement platform

Everything revolves around:

* Trips
* Relationships
* Participants
* Drivers
* Vehicles
* Viewers
* Events
* Location Streams

Schools, families, and transport companies are customer segments, not architectural foundations.

---

## Architectural Guardrails

Never build:

* School-specific systems that bypass Trips
* Parent-specific systems that bypass Relationships
* Vehicle-specific systems that bypass Trips
* Notification logic inside UI components
* Realtime logic inside React components
* Permission logic only in the frontend

Always route through:

* Trip
* Relationship
* Permission
* Notification
* Safety

---

## Core Domain Model

### User

Roles:

* Parent
* Traveler
* Driver
* School Admin
* Transport Operator
* Super Admin

### Trip

Trip Types:

* family_trip
* school_trip
* interstate_trip
* corporate_trip

Trip Status:

* scheduled
* active
* paused
* completed
* cancelled
* emergency

### Trip Participant

Someone physically involved in the trip.

### Trip Viewer

Someone allowed to monitor a trip.

### Trip Event

Examples:

* trip_started
* participant_boarded
* participant_dropped
* stop_reached
* route_deviation
* unusual_stop
* emergency_triggered
* trip_ended

### Relationship

Defines who can monitor whom.

Examples:

* parent_child
* family
* school_student
* company_vehicle
* emergency_contact

---

## Technology Decisions

Frontend:

* Next.js App Router
* TypeScript
* Tailwind

Backend:

* Next.js API Routes
* TypeScript

Notifications:

* Firebase

Maps:

* Google Maps

Rules:

* Do not introduce Redux.
* Do not introduce Zustand unless requested.
* Do not introduce React Query unless requested.
* Do not introduce a new ORM unless requested.
* Do not introduce a new realtime provider unless requested.
* Prefer existing infrastructure.

---

## Database Rules

Preferred tables:

* users
* trips
* trip_participants
* trip_viewers
* trip_locations
* trip_events
* relationships
* vehicles
* notifications

Avoid:

* school_bus_tracking
* child_locations
* parent_bus_map

Unless explicitly justified.

---

## API Rules

Prefer:

POST /api/trips

GET /api/trips/:tripId

POST /api/trips/:tripId/start

POST /api/trips/:tripId/end

POST /api/trips/:tripId/location

POST /api/trips/:tripId/events

POST /api/trips/:tripId/share

POST /api/trips/:tripId/emergency

Avoid school-specific endpoints unless they reuse the generic trip system internally.

---

## Realtime Rules

Location Frequency:

* Moving: 3-5 seconds
* Slow Movement: 8-10 seconds
* Stationary: 15-20 seconds

Channels:

trip:{tripId}:location

trip:{tripId}:events

trip:{tripId}:status

Only authorized viewers may subscribe.

---

## Notification Rules

Priority:

1. Push
2. SMS
3. WhatsApp
4. Email

Critical Alerts:

* Emergency triggered
* Route deviation
* Unexpected stop
* Arrival failure
* Trip timeout

Notification logic belongs in services, not components.

---

## Safety Rules

Treat safety as a core domain.

Features:

* Panic button
* Emergency alerts
* Live sharing
* Route deviation detection
* Geofencing
* Arrival confirmation
* Trip timeout logic

Emergency Flow:

User triggers panic

→ Trip becomes emergency

→ Event created

→ Notifications sent

→ Live location shared

→ Remains active until resolved

---

## Permission Rules

Always verify:

* Is user part of trip?
* Is user an approved viewer?
* Is user an operator/admin?
* Has access expired?
* Is shared access still valid?

Never trust frontend-only checks.

---

## Performance Rules

Avoid:

* Unnecessary polling
* Duplicate subscriptions
* Excessive map rerenders
* Large realtime payloads

Prefer:

* Event-driven updates
* Incremental updates
* Pagination
* Lazy loading
* Server-side filtering

---

## Security Rules

Never expose:

* API keys
* Service role keys
* Firebase credentials
* Database credentials
* Auth secrets

Never commit .env files.

Never expose live location publicly.

---

## Feature Analysis Format

Before implementation always provide:

### Problem

What problem is being solved?

### Existing Architecture

Which services, APIs, or tables already support it?

### Proposed Change

Smallest safe implementation.

### Risks

Potential breaking changes.

### Realtime Impact

Tracking impact.

### Notification Impact

Alert impact.

### Safety Impact

Emergency impact.

Only then implement.

---

## Codex Workflow

Before coding:

1. Inspect relevant files.
2. Explain current implementation.
3. Identify smallest safe change.
4. Explain risks.

Require approval before:

* Auth changes
* Database schema changes
* Payment changes
* Environment changes
* Production configuration changes

After coding:

1. Summarize files changed.
2. Explain what changed.
3. Explain what was avoided.
4. Provide test steps.
5. Mention realtime impact.
6. Mention notification impact.
7. Mention safety impact.

---

## Testing Rules

Verify:

* Authorized viewer can view trip
* Unauthorized viewer is denied
* Trip starts correctly
* Location updates work
* Events are created
* Notifications trigger correctly
* Emergency flow works
* Trip ends correctly

---

## Definition of Done

A task is complete only when:

* Code is implemented
* Permissions are verified
* Realtime impact reviewed
* Notification impact reviewed
* Safety impact reviewed
* Build passes
* Lint passes
* Test steps provided
* Files changed summarized

---

## Required Reading

Before implementing PocketShuttle features:

Read:

docs/engineering-playbook.md

Follow the trip-first architecture.
