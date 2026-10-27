export type Place = { id: string; nameEn: string; nameBn: string; code?: string; serviceActive?: boolean };
export type Area = { id: string; nameEn: string; nameBn: string; kind: string };
export type District = Place & { areas: Area[]; division?: Place };
export type Division = Place & { districts: District[] };

export type Driver = {
  id: string;
  userId?: string;
  fullName: string;
  photoUrl?: string | null;
  bio?: string | null;
  district?: Place & { division?: Place };
  area?: Area | null;
  workDistrict?: Place | null;
  experienceYears: number;
  expectedSalaryMin?: number | null;
  expectedSalaryMax?: number | null;
  jobPreference?: string | null;
  drivingCategories: string[];
  vehicles: string[];
  experiences: { id: string; employer: string; role: string; vehicleType?: string | null; category?: string | null; startYear: number; endYear?: number | null; description?: string | null }[];
  educationLevel?: string | null;
  isAvailable: boolean;
  verified: boolean;
  licenseClass?: string | null;
  featured?: boolean;
  memberSince?: string;
  addressLine?: string | null;
  licenseNumber?: string | null;
  licenseExpiry?: string | null;
  verificationStatus?: string;
  verificationNote?: string | null;
  isJobSeeker?: boolean;
  isProfileActive?: boolean;
  references?: { id: string; name: string; phone?: string | null; relation?: string | null; note?: string | null }[];
  documents?: { id: string; kind: string; fileName: string; createdAt: string }[];
  phone?: string;
  email?: string | null;
  phoneVerified?: boolean;
};

export type Job = {
  id: string;
  slug: string;
  title: string;
  description: string;
  district: Place & { division?: Place };
  area?: Area | null;
  areaText?: string | null;
  vehicleType: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryNegotiable?: boolean;
  workingHours?: string | null;
  holidays?: string | null;
  experienceRequired: number;
  licenseClass?: string | null;
  jobType: string;
  drivingCategory?: string | null;
  deadline?: string | null;
  applyInstructions?: string | null;
  featured?: boolean;
  status: string;
  showPhone?: boolean;
  rejectionReason?: string | null;
  createdAt: string;
  employer: {
    id: string;
    type: string;
    displayName: string;
    companyName?: string | null;
    about?: string | null;
    isVerified: boolean;
    district?: Place | null;
    phone?: string;
  };
  applicationCount?: number;
};

export type Page<T> = { data: T[]; meta: { page: number; pageSize: number; total: number; totalPages: number } };

export type Me = {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  role: string;
  phoneVerified: boolean;
  language: string;
  deletionRequestedAt?: string | null;
  unreadNotifications: number;
  driver: Driver | null;
  employer: {
    id: string;
    type: string;
    displayName: string;
    companyName?: string | null;
    contactPerson?: string | null;
    about?: string | null;
    addressLine?: string | null;
    website?: string | null;
    isVerified: boolean;
    district?: Place | null;
    jobs: { total: number; pending: number; active: number };
  } | null;
};

export type HomePayload = {
  jobs: Job[];
  drivers: Driver[];
  coverage: { code: string; nameEn: string; nameBn: string; live: boolean; liveDistricts: number; districts: number }[];
  counts: { driverCount: number; jobCount: number; employerCount: number; liveDistricts: number };
};
