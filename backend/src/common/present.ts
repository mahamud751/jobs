import { Prisma, VerificationStatus } from "../generated/prisma/client";

export const placeSelect = {
  id: true,
  nameEn: true,
  nameBn: true,
  code: true,
} satisfies Prisma.DistrictSelect;

export const areaSelect = {
  id: true,
  nameEn: true,
  nameBn: true,
  kind: true,
} satisfies Prisma.AreaSelect;

export const driverInclude = {
  district: {
    select: {
      id: true,
      nameEn: true,
      nameBn: true,
      code: true,
      serviceActive: true,
      division: { select: placeSelect },
    },
  },
  area: { select: areaSelect },
  workDistrict: { select: placeSelect },
  vehicles: true,
  experiences: { orderBy: { startYear: "desc" as const } },
  references: true,
  user: {
    select: {
      id: true,
      phone: true,
      email: true,
      phoneVerified: true,
      createdAt: true,
    },
  },
} satisfies Prisma.DriverProfileInclude;

export type DriverRow = Prisma.DriverProfileGetPayload<{ include: typeof driverInclude }>;

export const jobInclude = {
  district: {
    select: {
      id: true,
      nameEn: true,
      nameBn: true,
      code: true,
      serviceActive: true,
      division: { select: placeSelect },
    },
  },
  area: { select: areaSelect },
  employer: {
    select: {
      id: true,
      type: true,
      displayName: true,
      companyName: true,
      logoUrl: true,
      about: true,
      isVerified: true,
      district: { select: placeSelect },
      user: { select: { id: true, phone: true } },
    },
  },
  _count: { select: { applications: true } },
} satisfies Prisma.JobPostInclude;

export type JobRow = Prisma.JobPostGetPayload<{ include: typeof jobInclude }>;

export function toPublicDriver(driver: DriverRow) {
  return {
    id: driver.id,
    userId: driver.user.id,
    fullName: driver.fullName,
    photoUrl: driver.photoUrl,
    bio: driver.bio,
    district: driver.district,
    area: driver.area,
    workDistrict: driver.workDistrict,
    experienceYears: driver.experienceYears,
    expectedSalaryMin: driver.expectedSalaryMin,
    expectedSalaryMax: driver.expectedSalaryMax,
    jobPreference: driver.jobPreference,
    drivingCategories: driver.drivingCategories,
    vehicles: driver.vehicles.map((item) => item.type),
    experiences: driver.experiences.map((item) => ({
      id: item.id,
      employer: item.employer,
      role: item.role,
      vehicleType: item.vehicleType,
      category: item.category,
      startYear: item.startYear,
      endYear: item.endYear,
      description: item.description,
    })),
    educationLevel: driver.educationLevel,
    isAvailable: driver.isAvailable,
    verified: driver.verificationStatus === VerificationStatus.VERIFIED,
    licenseClass: driver.licenseClass,
    featured: driver.featured,
    memberSince: driver.user.createdAt,
  };
}

export function toOwnerDriver(
  driver: DriverRow,
  documents: { id: string; kind: string; fileName: string; createdAt: Date }[],
) {
  return {
    ...toPublicDriver(driver),
    addressLine: driver.addressLine,
    licenseNumber: driver.licenseNumber,
    licenseExpiry: driver.licenseExpiry,
    verificationStatus: driver.verificationStatus,
    verificationNote: driver.verificationNote,
    isJobSeeker: driver.isJobSeeker,
    isProfileActive: driver.isProfileActive,
    references: driver.references,
    documents,
    phone: driver.user.phone,
    email: driver.user.email,
    phoneVerified: driver.user.phoneVerified,
  };
}

export function toPublicJob(job: JobRow, includePhone = false) {
  return {
    id: job.id,
    slug: job.slug,
    title: job.title,
    description: job.description,
    district: job.district,
    area: job.area,
    areaText: job.areaText,
    vehicleType: job.vehicleType,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    salaryNegotiable: job.salaryNegotiable,
    workingHours: job.workingHours,
    holidays: job.holidays,
    experienceRequired: job.experienceRequired,
    licenseClass: job.licenseClass,
    jobType: job.jobType,
    drivingCategory: job.drivingCategory,
    deadline: job.deadline,
    applyInstructions: job.applyInstructions,
    featured: job.featured,
    status: job.status,
    showPhone: job.showPhone,
    rejectionReason: job.rejectionReason,
    createdAt: job.createdAt,
    expiresAt: job.expiresAt,
    employer: {
      id: job.employer.id,
      type: job.employer.type,
      displayName: job.employer.displayName,
      companyName: job.employer.companyName,
      logoUrl: job.employer.logoUrl,
      about: job.employer.about,
      isVerified: job.employer.isVerified,
      district: job.employer.district,
      phone: includePhone && job.showPhone ? job.employer.user.phone : undefined,
    },
    applicationCount: job._count.applications,
  };
}
