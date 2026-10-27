import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { DocumentKind, Prisma, VerificationStatus } from "../generated/prisma/client";
import { assertSalary, pageOf, paged } from "../common/http";
import { driverInclude, toOwnerDriver, toPublicDriver } from "../common/present";
import { LocationsService } from "../locations/locations.service";
import { PrismaService } from "../prisma/prisma.service";
import { ExperienceDto, ReferenceDto, SearchDriversDto, UpdateDriverDto } from "./dto";

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locations: LocationsService,
  ) {}

  async search(query: SearchDriversDto) {
    const paging = pageOf(query.page, query.pageSize);
    const where: Prisma.DriverProfileWhereInput = {
      isProfileActive: true,
      isJobSeeker: true,
      user: { isActive: true, isBlocked: false, phoneVerified: true },
      district: { serviceActive: true },
      vehicles: { some: {} },
    };
    const and: Prisma.DriverProfileWhereInput[] = [];
    if (query.available !== "all") where.isAvailable = query.available === "false" ? false : true;
    const districtFilter: Prisma.DistrictWhereInput = { serviceActive: true };
    if (query.district) districtFilter.code = query.district;
    if (query.division) districtFilter.division = { code: query.division };
    where.district = districtFilter;
    if (query.areaId) where.areaId = query.areaId;
    if (query.vehicle) where.vehicles = { some: { type: query.vehicle } };
    if (query.experienceMin != null) where.experienceYears = { gte: query.experienceMin };
    if (query.licenseClass) where.licenseClass = query.licenseClass;
    if (query.jobType) where.jobPreference = query.jobType;
    if (query.category) where.drivingCategories = { has: query.category };
    if (query.verified === "true") where.verificationStatus = VerificationStatus.VERIFIED;
    if (query.salaryMax != null) {
      and.push({ OR: [{ expectedSalaryMin: null }, { expectedSalaryMin: { lte: query.salaryMax } }] });
    }
    if (query.q) and.push({ fullName: { contains: query.q, mode: "insensitive" } });
    if (and.length) where.AND = and;

    const [rows, total] = await Promise.all([
      this.prisma.driverProfile.findMany({
        where,
        include: driverInclude,
        orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
        skip: paging.skip,
        take: paging.pageSize,
      }),
      this.prisma.driverProfile.count({ where }),
    ]);
    return paged(rows.map(toPublicDriver), total, paging.page, paging.pageSize);
  }

  async publicOne(id: string) {
    const driver = await this.prisma.driverProfile.findFirst({
      where: {
        id,
        isProfileActive: true,
        isJobSeeker: true,
        user: { isActive: true, isBlocked: false, phoneVerified: true },
        district: { serviceActive: true },
      },
      include: driverInclude,
    });
    if (!driver) throw new NotFoundException("Driver not found");
    return toPublicDriver(driver);
  }

  async mine(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        driver: { include: driverInclude },
        documents: { select: { id: true, kind: true, fileName: true, createdAt: true } },
      },
    });
    if (!user?.driver) throw new NotFoundException("Driver profile not found");
    return toOwnerDriver(user.driver, user.documents);
  }

  async update(userId: string, dto: UpdateDriverDto) {
    const driver = await this.owned(userId);
    assertSalary(dto.expectedSalaryMin, dto.expectedSalaryMax ?? driver.expectedSalaryMax);
    if (dto.expectedSalaryMax != null && dto.expectedSalaryMin == null) {
      assertSalary(driver.expectedSalaryMin, dto.expectedSalaryMax);
    }
    let districtId = driver.districtId;
    if (dto.districtCode) {
      districtId = (await this.locations.requireDistrict(dto.districtCode, true)).id;
    }
    let areaId = dto.areaId === undefined ? driver.areaId : dto.areaId || null;
    if (areaId) await this.locations.requireArea(areaId, districtId);
    if (dto.districtCode && dto.areaId === undefined && driver.areaId) {
      const stillValid = await this.prisma.area.findFirst({ where: { id: driver.areaId, districtId } });
      if (!stillValid) areaId = null;
    }
    let workDistrictId = driver.workDistrictId;
    if (dto.workDistrictCode !== undefined) {
      workDistrictId = dto.workDistrictCode
        ? (await this.locations.requireDistrict(dto.workDistrictCode, true)).id
        : null;
    }
    if (dto.licenseNumber) {
      await this.prisma.driverProfile.update({
        where: { id: driver.id },
        data: {
          verificationStatus:
            driver.verificationStatus === VerificationStatus.VERIFIED
              ? VerificationStatus.PENDING
              : driver.verificationStatus === VerificationStatus.UNVERIFIED
                ? VerificationStatus.PENDING
                : driver.verificationStatus,
        },
      });
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.driverProfile.update({
        where: { id: driver.id },
        data: {
          fullName: dto.fullName,
          bio: dto.bio,
          addressLine: dto.addressLine,
          districtId,
          areaId,
          workDistrictId,
          licenseClass: dto.licenseClass,
          licenseNumber: dto.licenseNumber,
          licenseExpiry: dto.licenseExpiry === undefined ? undefined : dto.licenseExpiry ? new Date(dto.licenseExpiry) : null,
          experienceYears: dto.experienceYears,
          expectedSalaryMin: dto.expectedSalaryMin,
          expectedSalaryMax: dto.expectedSalaryMax,
          jobPreference: dto.jobPreference,
          drivingCategories: dto.drivingCategories,
          isJobSeeker: dto.isJobSeeker,
          isAvailable: dto.isAvailable,
          educationLevel: dto.educationLevel,
        },
      });
      if (dto.fullName) await tx.user.update({ where: { id: userId }, data: { name: dto.fullName } });
      if (dto.vehicles) {
        await tx.driverVehicle.deleteMany({ where: { driverId: driver.id } });
        if (dto.vehicles.length) {
          await tx.driverVehicle.createMany({
            data: dto.vehicles.map((type) => ({ driverId: driver.id, type })),
          });
        }
      }
    });
    return this.mine(userId);
  }

  async setPhoto(userId: string, photoUrl: string) {
    const driver = await this.owned(userId);
    await this.prisma.driverProfile.update({ where: { id: driver.id }, data: { photoUrl } });
    return { photoUrl };
  }

  async addDocument(userId: string, file: { filename: string; originalname: string; mimetype: string; size: number }, kind: DocumentKind) {
    const allowed: DocumentKind[] = [DocumentKind.LICENSE, DocumentKind.NID, DocumentKind.EXPERIENCE_PROOF, DocumentKind.OTHER];
    if (!allowed.includes(kind)) {
      throw new BadRequestException("Unsupported document type");
    }
    await this.owned(userId);
    const doc = await this.prisma.document.create({
      data: {
        userId,
        kind,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: `uploads/private/${file.filename}`,
      },
    });
    if (kind === DocumentKind.LICENSE || kind === DocumentKind.NID) {
      await this.prisma.driverProfile.updateMany({
        where: { userId, verificationStatus: { in: [VerificationStatus.UNVERIFIED, VerificationStatus.REJECTED] } },
        data: { verificationStatus: VerificationStatus.PENDING },
      });
    }
    return { id: doc.id, kind: doc.kind, fileName: doc.fileName, createdAt: doc.createdAt };
  }

  async addExperience(userId: string, dto: ExperienceDto) {
    const driver = await this.owned(userId);
    const count = await this.prisma.workExperience.count({ where: { driverId: driver.id } });
    if (count >= 12) throw new BadRequestException("Experience limit reached");
    if (dto.endYear && dto.endYear < dto.startYear) throw new BadRequestException("End year is before the start year");
    await this.prisma.workExperience.create({ data: { ...dto, driverId: driver.id } });
    return this.mine(userId);
  }

  async removeExperience(userId: string, id: string) {
    const driver = await this.owned(userId);
    await this.prisma.workExperience.deleteMany({ where: { id, driverId: driver.id } });
    return this.mine(userId);
  }

  async addReference(userId: string, dto: ReferenceDto) {
    const driver = await this.owned(userId);
    const count = await this.prisma.driverReference.count({ where: { driverId: driver.id } });
    if (count >= 5) throw new BadRequestException("Reference limit reached");
    await this.prisma.driverReference.create({ data: { ...dto, driverId: driver.id } });
    return this.mine(userId);
  }

  async removeReference(userId: string, id: string) {
    const driver = await this.owned(userId);
    await this.prisma.driverReference.deleteMany({ where: { id, driverId: driver.id } });
    return this.mine(userId);
  }

  async activation(userId: string, active: boolean) {
    const driver = await this.owned(userId);
    await this.prisma.driverProfile.update({ where: { id: driver.id }, data: { isProfileActive: active } });
    return this.mine(userId);
  }

  private async owned(userId: string) {
    const driver = await this.prisma.driverProfile.findUnique({ where: { userId } });
    if (!driver) throw new NotFoundException("Driver profile not found");
    return driver;
  }
}
