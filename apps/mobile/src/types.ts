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
  locations: TripLocation[];
  events: TripEvent[];
};

export type TripCollection = {
  active: MobileTrip[];
  recent: MobileTrip[];
  historyCutoff: string | null;
  plan: { code: string; name: string; status: string };
};

export type ParentDashboard = {
  profile: MobileActor;
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
  driver: {
    verificationStatus: string;
    plateNumber?: string | null;
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
