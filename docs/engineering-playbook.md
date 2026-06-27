# PocketShuttle Engineering Playbook

## 1. Product Principle

PocketShuttle is a realtime movement accountability and safety platform.

It should not be built as only:

* A school bus app
* A parent-child tracker
* A transport company dashboard

The core product is:

> Helping trusted people know where someone is, what trip they are on, what is happening, and when something may be wrong.

## 2. Core Architecture Rule

Every major feature must connect back to:

* Trip
* Participant
* Viewer
* Driver
* Vehicle
* Location Stream
* Event
* Notification
* Safety State

Do not build features around schools first.

Schools, families, transport companies, and companies are customer segments.
Trips and relationships are the platform.

## 3. Core Database Entities

### users

Stores all platform users.

Required fields:

* id
* name
* email
* phone
* role
* created_at
* updated_at

Roles:

* parent
* traveler
* driver
* school_admin
* transport_operator
* super_admin

## trips

Represents any movement journey.

Fields:

* id
* trip_type
* title
* driver_id
* vehicle_id
* status
* origin
* destination
* started_at
* ended_at
* created_by
* created_at

Trip types:

* family_trip
* school_trip
* interstate_trip
* corporate_trip

Trip status:

* scheduled
* active
* paused
* completed
* cancelled
* emergency

## trip_participants

People physically involved in a trip.

Fields:

* id
* trip_id
* user_id
* role
* boarded_at
* dropped_at
* status

Participant roles:

* passenger
* child
* driver
* assistant
* traveler

## trip_viewers

People allowed to monitor a trip.

Fields:

* id
* trip_id
* viewer_id
* permission_level
* expires_at
* created_at

Permission levels:

* view_location
* view_events
* receive_alerts
* emergency_contact

## trip_locations

Stores location updates.

Fields:

* id
* trip_id
* lat
* lng
* speed
* heading
* accuracy
* timestamp

Rules:

* Moving: update every 3-5 seconds
* Slow movement: update every 8-10 seconds
* Stationary: update every 15-20 seconds

Do not save every frontend render. Save intentional tracking updates only.

## trip_events

Stores important trip activity.

Fields:

* id
* trip_id
* event_type
* actor_id
* payload
* timestamp

Event types:

* trip_started
* trip_ended
* participant_boarded
* participant_dropped
* stop_reached
* route_deviation
* unusual_stop
* emergency_triggered
* emergency_resolved
* eta_updated

## relationships

Defines who can monitor whom outside a single trip.

Fields:

* id
* requester_id
* target_id
* relationship_type
* status
* created_at

Relationship types:

* parent_child
* family
* school_student
* company_vehicle
* emergency_contact

Status:

* pending
* active
* revoked
* blocked

## 4. API Design Rules

Use domain-based APIs.

Good:

```txt
POST /api/trips
POST /api/trips/:id/start
POST /api/trips/:id/location
POST /api/trips/:id/events
POST /api/trips/:id/share
POST /api/trips/:id/emergency
```

Avoid:

```txt
POST /api/school-bus/location
POST /api/children/track
POST /api/parent/bus
```

The API should support school, family, and interstate use cases without rewriting the foundation.

## 5. Realtime Engine

Realtime updates should support:

* Active trip location
* Driver/traveler movement
* Participant status
* Emergency events
* ETA updates
* Unusual stop detection

Frontend should subscribe to:

```txt
trip:{trip_id}:location
trip:{trip_id}:events
trip:{trip_id}:status
```

Only authorized viewers should receive trip updates.

## 6. Notification Rules

Notification priority:

1. Push notification
2. SMS
3. WhatsApp
4. Email

Use push for normal updates.

Use SMS or WhatsApp for:

* Emergency alerts
* Long unexpected stops
* Route deviation
* Failed arrival confirmation

Example alerts:

* Driver is nearby
* Passenger boarded
* Vehicle stopped unusually
* Trip ended
* Emergency alert triggered

## 7. Safety Engine

Safety is not an add-on. It is core.

Required safety features:

* Panic button
* Live share
* Trip timeout logic
* Route deviation detection
* Emergency contact alerts
* Arrival confirmation

Emergency flow:

```txt
User triggers panic
→ Trip status becomes emergency
→ Emergency event is created
→ Viewers are notified
→ Location sharing frequency increases
→ Emergency remains active until resolved
```

## 8. Geofencing

Geofencing should trigger events, not hardcoded UI behavior.

Examples:

* Near school
* Near destination
* At checkpoint
* Route deviation
* Terminal arrival

A geofence trigger should create a `trip_event`, then the notification engine decides who gets alerted.

## 9. Frontend Structure

Recommended structure:

```txt
app/
  trips/
    page.tsx
    [tripId]/
      page.tsx

components/
  trips/
    TripMap.tsx
    TripStatusCard.tsx
    TripParticipants.tsx
    TripEvents.tsx
    StartTripButton.tsx
    EmergencyButton.tsx

lib/
  trips/
    create-trip.ts
    update-location.ts
    end-trip.ts
    permissions.ts

services/
  realtime/
  notifications/
  safety/
  geofencing/
```

## 10. Codex Rules

Before Codex writes code, it must answer:

```txt
Which trip entity does this affect?
Which relationship or permission does this depend on?
Does this affect realtime updates?
Does this trigger notifications?
Does this affect safety?
```

Codex should not:

* Build school-only logic
* Hardcode parent-child assumptions
* Add dependencies without approval
* Modify auth/payment/env config unless asked
* Rewrite large parts of the app unnecessarily

## 11. Phase 1 Build Priority

Start with the independent B2C model.

Build first:

* User auth
* Create family trip
* Start trip
* Share trip link
* View live trip
* Send location updates
* Trigger emergency alert
* End trip
* Notify viewers

Do not start with school dashboards.

## 12. Phase 2

Add school support:

* School admin
* Routes
* Buses
* Students
* Parent visibility
* Driver assignment

## 13. Phase 3

Add interstate transport:

* Digital manifests
* Passenger tracking
* Vehicle live location
* Family trip monitoring
* Arrival verification

## 14. Phase 4

Expand safety network:

* Corporate movement
* Women safety travel
* Logistics accountability
* Advanced alerts

## 15. Definition of Done

Every completed task must include:

* Files changed
* What was added
* What was avoided
* How to test
* Realtime impact
* Notification impact
* Safety impact

```
```
