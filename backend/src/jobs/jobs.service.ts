import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { JobStatus, Prisma, Role } from "../generated/prisma/client";
import { randomBytes } from "crypto";
import { AuthUser } from "../common/auth";
import { asDhakaDeadline, assertSalary, pageOf, paged } from "../common/http";
import { jobInclude, toPublicJob } from "../common/present";
import { AuditService } from "../audit/audit.service";
import { LocationsService } from "../locations/locations.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { JobDto, SearchJobsDto } from "./dto";

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locations: LocationsService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async expireDue() {
    const now = new Date();
    await this.prisma.jobPost.updateMany({
      where: {
        status: JobStatus.ACTIVE,
        OR: [{ deadline: { lt: now } }, { expiresAt: { lt: now } }],
      },
      data: { status: JobStatus.EXPIRED },
    });
  }

  async search(query: SearchJobsDto) {
    await this.expireDue();
    const paging = pageOf(query.page, query.pageSize);
    const now = new Date();
    const where: Prisma.JobPostWhereInput = {
      status: JobStatus.ACTIVE,
      district: { serviceActive: true },
      AND: [
        { OR: [{ deadline: null }, { deadline: { gte: now } }] },
        { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
      ],
    };
    if (query.district) where.district = { code: query.district, serviceActive: true };
    if (query.division) {
      where.district = {
        serviceActive: true,
        ...(query.district ? { code: query.district } : {}),
        division: { code: query.division },
      };
    }
    if (query.areaId) where.areaId = query.areaId;
    if (query.vehicle) where.vehicleType = query.vehicle;
    if (query.jobType) where.jobType = query.jobType;
    if (query.licenseClass) where.licenseClass = query.licenseClass;
    if (query.category) where.drivingCategory = query.category;
    if (query.experience != null) where.experienceRequired = { lte: query.experience };
    if (query.salaryMin != null) {
      (where.AND as Prisma.JobPostWhereInput[]).push({
        OR: [{ salaryNegotiable: true }, { salaryMax: { gte: query.salaryMin } }, { salaryMin: { gte: query.salaryMin } }],
      });
    }
    if (query.q) {
      (where.AND as Prisma.JobPostWhereInput[]).push({
        OR: [
          { title: { contains: query.q, mode: "insensitive" } },
          { description: { contains: query.q, mode: "insensitive" } },
        ],
      });
    }
    const [rows, total] = await Promise.all([
      this.prisma.jobPost.findMany({
        where,
        include: jobInclude,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        skip: paging.skip,
        take: paging.pageSize,
      }),
      this.prisma.jobPost.count({ where }),
    ]);
    return paged(rows.map((job) => toPublicJob(job, true)), total, paging.page, paging.pageSize);
  }

  async one(ref: string) {
    await this.expireDue();
    const job = await this.prisma.jobPost.findFirst({
      where: { OR: [{ id: ref }, { slug: ref }] },
      include: jobInclude,
    });
    if (!job || job.status !== JobStatus.ACTIVE || !job.district.serviceActive) {
      throw new NotFoundException("Job not found");
    }
    return toPublicJob(job, true);
  }

  async mine(userId: string) {
    const employer = await this.employerOf(userId);
    const jobs = await this.prisma.jobPost.findMany({
      where: { employerId: employer.id },
      include: jobInclude,
      orderBy: { createdAt: "desc" },
    });
    return jobs.map((job) => toPublicJob(job, true));
  }

  async create(user: AuthUser, dto: JobDto, ip?: string) {
    if (!user.phoneVerified) throw new ForbiddenException("Verify your mobile number before posting a job");
    const employer = await this.employerOf(user.id);
    const saved = await this.write(employer.id, dto, null);
    await this.audit.log({
      actorId: user.id,
      action: dto.submit === false ? "JOB_DRAFT" : "JOB_SUBMIT",
      entityType: "JobPost",
      entityId: saved.id,
      summary: saved.title,
      ip,
    });
    return toPublicJob(saved, true);
  }

  async update(user: AuthUser, id: string, dto: JobDto, ip?: string) {
    const employer = await this.employerOf(user.id);
    const existing = await this.prisma.jobPost.findFirst({ where: { id, employerId: employer.id } });
    if (!existing) throw new NotFoundException("Job not found");
    if (existing.status === JobStatus.CLOSED || existing.status === JobStatus.EXPIRED) {
      throw new BadRequestException("Republish this job instead of editing it");
    }
    const saved = await this.write(employer.id, dto, existing.id);
    await this.audit.log({
      actorId: user.id,
      action: "JOB_UPDATE",
      entityType: "JobPost",
      entityId: saved.id,
      summary: saved.title,
      ip,
    });
    return toPublicJob(saved, true);
  }

  async close(user: AuthUser, id: string, ip?: string) {
    const employer = await this.employerOf(user.id);
    const job = await this.prisma.jobPost.findFirst({ where: { id, employerId: employer.id } });
    if (!job) throw new NotFoundException("Job not found");
    const saved = await this.prisma.jobPost.update({
      where: { id },
      data: { status: JobStatus.CLOSED, closedAt: new Date() },
      include: jobInclude,
    });
    await this.audit.log({ actorId: user.id, action: "JOB_CLOSE", entityType: "JobPost", entityId: id, ip });
    return toPublicJob(saved, true);
  }

  async republish(user: AuthUser, id: string, deadline: string, ip?: string) {
    const employer = await this.employerOf(user.id);
    const job = await this.prisma.jobPost.findFirst({ where: { id, employerId: employer.id } });
    if (!job) throw new NotFoundException("Job not found");
    const saved = await this.prisma.jobPost.update({
      where: { id },
      data: {
        status: JobStatus.PENDING_APPROVAL,
        deadline: asDhakaDeadline(deadline),
        expiresAt: null,
        rejectionReason: null,
        closedAt: null,
      },
      include: jobInclude,
    });
    await this.audit.log({ actorId: user.id, action: "JOB_REPUBLISH", entityType: "JobPost", entityId: id, ip });
    return toPublicJob(saved, true);
  }

  async approve(actor: AuthUser, id: string, ip?: string) {
    const job = await this.prisma.jobPost.findUnique({ where: { id }, include: jobInclude });
    if (!job) throw new NotFoundException("Job not found");
    const expiresAt = job.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const saved = await this.prisma.jobPost.update({
      where: { id },
      data: {
        status: JobStatus.ACTIVE,
        approvedAt: new Date(),
        approvedById: actor.id,
        rejectionReason: null,
        expiresAt,
      },
      include: jobInclude,
    });
    await this.notifications.push({
      userId: saved.employer.user.id,
      type: "JOB_APPROVED",
      title: "বিজ্ঞাপন অনুমোদিত হয়েছে",
      body: saved.title,
      meta: { slug: saved.slug },
    });
    await this.notifyMatches(saved);
    await this.audit.log({
      actorId: actor.id,
      action: "JOB_APPROVE",
      entityType: "JobPost",
      entityId: id,
      summary: saved.title,
      ip,
    });
    return toPublicJob(saved, true);
  }

  async reject(actor: AuthUser, id: string, reason: string, ip?: string) {
    const job = await this.prisma.jobPost.findUnique({ where: { id }, include: jobInclude });
    if (!job) throw new NotFoundException("Job not found");
    const saved = await this.prisma.jobPost.update({
      where: { id },
      data: { status: JobStatus.REJECTED, rejectionReason: reason },
      include: jobInclude,
    });
    await this.notifications.push({
      userId: saved.employer.user.id,
      type: "JOB_REJECTED",
      title: "বিজ্ঞাপন বাতিল হয়েছে",
      body: `${saved.title}: ${reason}`,
      meta: { slug: saved.slug },
    });
    await this.audit.log({
      actorId: actor.id,
      action: "JOB_REJECT",
      entityType: "JobPost",
      entityId: id,
      summary: reason,
      ip,
    });
    return toPublicJob(saved, true);
  }

  private async write(employerId: string, dto: JobDto, existingId: string | null) {
    assertSalary(dto.salaryMin, dto.salaryMax);
    const district = await this.locations.requireDistrict(dto.districtCode, true);
    if (dto.areaId) await this.locations.requireArea(dto.areaId, district.id);
    const status = dto.submit === false ? JobStatus.DRAFT : JobStatus.PENDING_APPROVAL;
    const data = {
      title: dto.title,
      description: dto.description,
      districtId: district.id,
      areaId: dto.areaId || null,
      areaText: dto.areaText,
      vehicleType: dto.vehicleType,
      salaryMin: dto.salaryMin,
      salaryMax: dto.salaryMax,
      salaryNegotiable: dto.salaryNegotiable ?? false,
      workingHours: dto.workingHours,
      holidays: dto.holidays,
      experienceRequired: dto.experienceRequired ?? 0,
      licenseClass: dto.licenseClass,
      jobType: dto.jobType,
      drivingCategory: dto.drivingCategory,
      deadline: dto.deadline === undefined ? undefined : asDhakaDeadline(dto.deadline),
      applyInstructions: dto.applyInstructions,
      showPhone: dto.showPhone ?? false,
      status,
      rejectionReason: null,
    };
    if (!existingId) {
      const slug = `${dto.vehicleType.toLowerCase().replace(/_/g, "-")}-driver-${district.code}-${randomBytes(3).toString("hex")}`;
      return this.prisma.jobPost.create({ data: { ...data, employerId, slug }, include: jobInclude });
    }
    return this.prisma.jobPost.update({ where: { id: existingId }, data, include: jobInclude });
  }

  private async notifyMatches(job: Prisma.JobPostGetPayload<{ include: typeof jobInclude }>) {
    const drivers = await this.prisma.driverProfile.findMany({
      where: {
        isProfileActive: true,
        isJobSeeker: true,
        isAvailable: true,
        districtId: job.districtId,
        vehicles: { some: { type: job.vehicleType } },
        user: { isBlocked: false, isActive: true, phoneVerified: true },
      },
      include: { user: true },
      take: 200,
    });
    for (const driver of drivers) {
      await this.notifications.push({
        userId: driver.userId,
        type: "JOB_MATCH",
        title: "আপনার এলাকায় নতুন চাকরি",
        body: job.title,
        email: driver.user.email,
        meta: { slug: job.slug },
      });
    }
  }

  private async employerOf(userId: string) {
    const employer = await this.prisma.employerProfile.findUnique({ where: { userId } });
    if (!employer) throw new ForbiddenException("Employer profile required");
    return employer;
  }
}

export const employerRoles = [Role.EMPLOYER];
