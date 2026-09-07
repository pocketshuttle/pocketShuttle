export type MobileRole = "parent" | "driver" | "teacher";

export type MobileActor = {
  id: string;
  role: MobileRole;
  name: string;
  email: string;
  image: string | null;
  schoolId: string | null;
};

export type TripLocation = {
  lat: number;
  lng: number;
  speed?: number | null;
  heading?: number | null;
  accuracy?: number | null;
  timestamp: string;
};

export type TripEvent = {
  id: string;
  eventType: string;
  actorType?: string | null;
  payload?: Record<string, unknown> | null;
  timestamp: string;
};

export type MobileTrip = {
  id: string;
  title: string;
  tripType: string;
  status: string;
  safetyState: string;
  origin?: unknown;
  destination?: unknown;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  schoolId?: string | null;
  locations: TripLocation[];
  events: TripEvent[];
};

export type TripCollection = {
  active: MobileTrip[];
  recent: MobileTrip[];
  historyCutoff: string | null;
  plan: { code: string; name: string; status: string };
};

export type StatusEvent = { id: string; eventType: string; createdAt: string };

export type ParentChild = {
  id: string;
  fullName: string;
  age?: number | null;
  grade?: string | null;
  address?: string | null;
  image?: string | null;
  schoolCoords?: { latitude: number; longitude: number } | null;
  activeDriver?: { id: string; full_name?: string | null } | null;
};

export type ConnectionAssignment = {
  id: string;
  status: string;
  billingStatus?: string | null;
  trialEndsAt?: string | null;
  lastStatus?: string | null;
  lastStatusAt?: string | null;
  child: {
    id: string;
    fullName: string;
    age?: number | null;
    grade?: string | null;
    address?: string | null;
    image?: string | null;
  };
  events?: StatusEvent[];
};

export type CustomPlaceSummary = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

export type TripTemplateSummary = {
  id: string;
  title: string;
  schedule?: { frequency?: string } | null;
  nextRunAt?: string | null;
};

export type Connection = {
  id: string;
  status: string;
  requestedBy?: string | null;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
  parent: {
    id: string;
    full_name?: string | null;
    phoneNumber?: string | null;
    image?: string | null;
  };
  driver: {
    id: string;
    full_name: string;
    phoneNumber?: string | null;
    image?: string | null;
    liveAddress?: { latitude?: number; longitude?: number } | null;
    verificationStatus?: string | null;
    shareProfile?: { shareId: string } | null;
    lastActiveAt?: string | null;
  };
  assignments: ConnectionAssignment[];
  customPlaces?: CustomPlaceSummary[];
  tripTemplates?: TripTemplateSummary[];
};

export type DriverInvite = {
  id: string;
  driverId?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  status: string;
  expiresAt: string;
  createdAt?: string;
};

export type DriverSearchResult = {
  id: string;
  full_name: string;
  email?: string | null;
  phoneNumber?: string | null;
  image?: string | null;
  verificationStatus?: string | null;
  vehicle?: string | null;
  vehicleCapacity?: number | null;
  shareId?: string | null;
  existingConnection?: { id: string; status: string; note?: string | null } | null;
  activeAssignmentCount?: number;
};

export type KnownDriverEvent = {
  id: string;
  assignmentId: string;
  eventType: string;
  actorType?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  driver: { id: string; full_name: string };
  parent: { id: string; full_name?: string | null };
  child: { id: string; fullName: string };
};

export type PlanLimits = {
  planCode: string;
  planName: string;
  status: string;
  enforcementEnabled: boolean;
  maxChildren: number | null;
  maxConnectedDrivers: number | null;
  childCount: number;
  driverCount: number;
};

export type ParentDashboard = {
  profile: MobileActor;
  limits: PlanLimits;
  children: Array<{
    id: string;
    name: string | null;
    image?: string | null;
    grade?: string | null;
    source: string;
    attendance?: string | null;
    status?: string | null;
    presence?: string | null;
  }>;
  assignments: Array<{
    id: string;
    status: string;
    lastStatus?: string | null;
    lastStatusAt?: string | null;
    events?: StatusEvent[];
    child: { id: string; fullName: string; image?: string | null };
    driver: {
      id: string;
      full_name: string;
      phoneNumber?: string | null;
      plateNumber?: string | null;
      liveAddress?: { latitude?: number; longitude?: number } | null;
      lastActiveAt?: string | null;
    };
  }>;
  trips: TripCollection;
};

export type DriverDashboard = {
  profile: MobileActor;
  connectionCounts: { approved: number; pending: number };
  driver: {
    id: string;
    full_name?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
    serviceAreas?: string[];
    liveAddress?: { latitude?: number; longitude?: number } | null;
    lastActiveAt?: string | null;
    verificationStatus: string;
    verificationRejectionReason?: string | null;
    shareId: string | null;
    carMake?: string | null;
    carModel?: string | null;
    carColor?: string | null;
    plateNumber?: string | null;
    vehicleCapacity?: number | null;
    bus?: {
      id: string;
      bus_product_name: string;
      bus_number: string;
      route?: { route_name: string } | null;
    } | null;
  } | null;
  assignments: Array<{
    id: string;
    status: string;
    lastStatus?: string | null;
    lastStatusAt?: string | null;
    events?: StatusEvent[];
    child: {
      id: string;
      fullName: string;
      address?: string | null;
      pickupNote?: string | null;
    };
    parent: {
      id: string;
      full_name?: string | null;
      phoneNumber?: string | null;
    };
  }>;
  trips: TripCollection;
};

export type TeacherDashboard = {
  profile: MobileActor;
  teacher: {
    full_name?: string | null;
    bus?: {
      id: string;
      bus_product_name: string;
      bus_number: string;
      route?: { route_name: string } | null;
    } | null;
  } | null;
  students: Array<{
    id: string;
    full_name?: string | null;
    grade?: string | null;
    attendance?: string | null;
    status?: string | null;
    presence?: string | null;
  }>;
  trips: TripCollection;
};

/* ---------- Billing & Pro Family (Phase 3) ---------- */

export type UsageEntry = { current: number; limit: number | null };

export type BillingPlan = {
  code: string;
  name: string;
  audience?: string;
  tier: string;
  description?: string | null;
  features?: unknown;
  entitlements?: Record<string, boolean | number | null>;
  isPurchasable: boolean;
  checkoutState: "INCLUDED" | "READY" | "PAYSTACK_SETUP_REQUIRED" | "CLOSED";
  price: { amountMinor: number; currency: string; interval: string } | null;
};

export type BillingSubscription = {
  billingAccount: {
    id: string;
    type: string;
    billingEmail?: string | null;
    enforcementEnabled: boolean;
    paidCheckoutEnabled: boolean;
  };
  current: {
    planCode: string;
    planName: string;
    status: string;
    currentPeriodEnd?: string | null;
    graceEndsAt?: string | null;
    entitlements: Record<string, boolean | number | null>;
  };
  usage: Record<string, UsageEntry>;
  payments: Array<{
    id: string;
    providerReference?: string | null;
    amountMinor: number;
    currency: string;
    status: string;
    paidAt?: string | null;
    createdAt: string;
  }>;
};

export type CustomPlace = CustomPlaceSummary & { isActive: boolean; placeType?: string | null };

export type TripTemplate = {
  id: string;
  title: string;
  tripType?: string;
  schedule?: { frequency?: string } | null;
  nextRunAt?: string | null;
  isActive: boolean;
  createdAt?: string;
};

export type RecurringTripSuggestion = {
  id: string;
  destinationLabel: string | null;
  occurrenceCount: number;
  createdAt?: string;
};

export type NotificationChannel = "PUSH" | "SMS" | "WHATSAPP";

export type NotificationPreference = {
  channel: NotificationChannel;
  enabled: boolean;
  destination?: string | null;
  consentedAt?: string | null;
};

export type ViewerInvite = {
  id: string;
  name: string;
  email?: string | null;
  phoneNumber?: string | null;
  status: string;
  emergencyContact: boolean;
  deliveryStatus: string;
  expiresAt: string;
  createdAt: string;
};

export type ProWorkspace = {
  plan: {
    code: string;
    name: string;
    status: string;
    entitlements: Record<string, boolean | number | null>;
    historyCutoff?: string | null;
  };
  usage: Record<string, UsageEntry>;
  places: CustomPlace[];
  templates: TripTemplate[];
  trips: Array<{
    id: string;
    title: string;
    status: string;
    safetyState: string;
    createdAt: string;
    viewers: Array<{ id: string; viewerId: string; viewerType: string; expiresAt?: string | null }>;
    viewerInvites: ViewerInvite[];
    events: Array<{ id: string; eventType: string; timestamp: string }>;
  }>;
  preferences: NotificationPreference[];
  deliveries: Array<{
    id: string;
    channel: string;
    status: string;
    eventType?: string | null;
    createdAt: string;
  }>;
};
