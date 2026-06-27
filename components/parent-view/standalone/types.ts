export type Child = {
  id: string;
  fullName: string;
  age?: number | null;
  grade?: string | null;
  address?: string | null;
  schoolCoords?: { latitude: number; longitude: number } | null;
  image?: string | null;
};

export type DriverSummary = {
  id: string;
  full_name: string;
  email?: string | null;
  phoneNumber?: string | null;
  image?: string | null;
  verificationStatus?: string | null;
  vehicle?: string | null;
  shareId?: string | null;
  liveAddress?: { latitude: number; longitude: number } | null;
  lastActiveAt?: string | Date | null;
  existingConnection?: { id: string; status: string; note?: string | null } | null;
};

export type Assignment = {
  id: string;
  status: string;
  billingStatus: string;
  trialEndsAt?: string | Date | null;
  monthlyAmount?: number | null;
  currency?: string | null;
  lastStatus?: string | null;
  lastStatusAt?: string | Date | null;
  child: Child;
  events?: Array<{ id: string; eventType: string; createdAt: string | Date }>;
  payments?: Array<{ id: string; status: string; authorizationUrl?: string | null }>;
};

export type Connection = {
  id: string;
  status: string;
  requestedBy?: string | null;
  note?: string | null;
  driver: DriverSummary & { shareProfile?: { shareId: string } | null };
  assignments: Assignment[];
};

export type Invite = {
  id: string;
  email?: string | null;
  phoneNumber?: string | null;
  status: string;
  expiresAt: string | Date;
};

export type AssignmentWithDriver = Assignment & { driver: DriverSummary };
