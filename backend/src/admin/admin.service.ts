import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AreaKind,
  ComplaintStatus,
  JobStatus,
  Prisma,
  Role,
  VerificationStatus,
} from "../generated/prisma/client";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { unlink } from "fs/promises";
import { AuthUser, FULL_ADMIN } from "../common/auth";
import { hashSecret, pageOf, paged } from "../common/http";
import { driverInclude, jobInclude, toOwnerDriver, toPublicJob } from "../common/present";
import { AuditService } from "../audit/audit.service";
import { ComplaintsService } from "../complaints/complaints.service";
import { ContentService } from "../content/content.service";
import { LocationsService } from "../locations/locations.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly places: LocationsService,
    private readonly reports: ComplaintsService,
    private readonly content: ContentService,
    private readonly notifications: NotificationsService,
    private readonly audit: AuditService,
  ) {}

  async stats() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [drivers, employers, activeJobs, pendingJobs, applications, openComplaints, recentUsers, deletionRequests, roles, byDistrict] =
      await Promise.all([
        this.prisma.driverProfile.count(),
        this.prisma.employerProfile.count(),
        this.prisma.jobPost.count({ where: { status: JobStatus.ACTIVE } }),
        this.prisma.jobPost.count({ where: { status: JobStatus.PENDING_APPROVAL } }),
        this.prisma.application.count(),
        this.prisma.complaint.count({ where: { status: ComplaintStatus.OPEN } }),
        this.prisma.user.count({ where: { createdAt: { gte: since } } }),
        this.prisma.user.count({ where: { deletionRequestedAt: { not: null } } }),
        this.prisma.user.groupBy({ by: ["role"], _count: true }),
        this.prisma.jobPost.groupBy({ by: ["districtId"], where: { status: JobStatus.ACTIVE }, _count: true }),
      ]);
    const districts = await this.prisma.district.findMany({
      where: { id: { in: byDistrict.map((row) => row.districtId) } },
      select: { id: true, nameEn: true, nameBn: true, code: true },
    });
    return {
      drivers,
      employers,
      activeJobs,
      pendingJobs,
      applications,
      openComplaints,
      recentUsers,
      deletionRequests,
      roles: roles.map((row) => ({ role: row.role, count: row._count })),
      jobsByDistrict: byDistrict.map((row) => ({
        count: row._count,
        district: districts.find((district) => district.id === row.districtId),
      })),
    };
  }

  async drivers(query: { q?: string; verification?: VerificationStatus; page?: number }, sensitive: boolean) {
    const paging = pageOf(query.page, 20);
    const where: Prisma.DriverProfileWhereInput = {};
    if (query.verification) where.verificationStatus = query.verification;
    if (query.q) {
      where.OR = [
        { fullName: { contains: query.q, mode: "insensitive" } },
        { user: { phone: { contains: query.q } } },
      ];
    }
    const [rows, total] = await Promise.all([
      this.prisma.driverProfile.findMany({
        where,
        include: driverInclude,
        orderBy: { updatedAt: "desc" },
        skip: paging.skip,
        take: paging.pageSize,
      }),
      this.prisma.driverProfile.count({ where }),
    ]);
    const data = rows.map((row) => ({
      ...toOwnerDriver(row, []),
      phone: row.user.phone,
      licenseNumber: sensitive ? row.licenseNumber : undefined,
      userId: row.userId,
      blocked: false,
    }));
    const users = await this.prisma.user.findMany({
      where: { id: { in: rows.map((row) => row.userId) } },
      select: { id: true, isBlocked: true, phoneVerified: true },
    });
    for (const item of data) {
      const user = users.find((entry) => entry.id === item.userId);
      item.blocked = !!user?.isBlocked;
    }
    return paged(data, total, paging.page, paging.pageSize);
  }

  async driver(id: string, sensitive: boolean) {
    const row = await this.prisma.driverProfile.findUnique({ where: { id }, include: driverInclude });
    if (!row) throw new NotFoundException("Driver not found");
    const documents = await this.prisma.document.findMany({
      where: { userId: row.userId },
      select: { id: true, kind: true, fileName: true, createdAt: true },
    });
    const user = await this.prisma.user.findUnique({ where: { id: row.userId } });
    return {
      ...toOwnerDriver(row, documents),
      licenseNumber: sensitive ? row.licenseNumber : undefined,
      userId: row.userId,
      blocked: user?.isBlocked,
      deletionRequestedAt: user?.deletionRequestedAt,
    };
  }

  async verify(actor: AuthUser, id: string, status: VerificationStatus, note: string | undefined, ip?: string) {
    const driver = await this.prisma.driverProfile.findUnique({ where: { id } });
    if (!driver) throw new NotFoundException("Driver not found");
    const saved = await this.prisma.driverProfile.update({
      where: { id },
      data: {
        verificationStatus: status,
        verificationNote: note,
        verifiedAt: status === VerificationStatus.VERIFIED ? new Date() : null,
      },
    });
    await this.notifications.push({
      userId: driver.userId,
      type: "VERIFICATION",
      title: status === VerificationStatus.VERIFIED ? "প্রোফাইল যাচাই হয়েছে" : "যাচাইয়ের হালনাগাদ",
      body: note || status,
    });
    await this.audit.log({ actorId: actor.id, action: "DRIVER_VERIFY", entityType: "DriverProfile", entityId: id, summary: status, ip });
    return saved;
  }

  async featureDriver(actor: AuthUser, id: string, featured: boolean, ip?: string) {
    const saved = await this.prisma.driverProfile.update({ where: { id }, data: { featured } });
    await this.audit.log({ actorId: actor.id, action: "DRIVER_FEATURE", entityType: "DriverProfile", entityId: id, summary: String(featured), ip });
    return saved;
  }

  async employers(q?: string, page?: number) {
    const paging = pageOf(page, 20);
    const where: Prisma.EmployerProfileWhereInput = q
      ? { OR: [{ displayName: { contains: q, mode: "insensitive" } }, { companyName: { contains: q, mode: "insensitive" } }] }
      : {};
    const [data, total] = await Promise.all([
      this.prisma.employerProfile.findMany({
        where,
        include: { district: true, user: { select: { phone: true, email: true, isBlocked: true, phoneVerified: true } }, _count: { select: { jobs: true } } },
        orderBy: { createdAt: "desc" },
        skip: paging.skip,
        take: paging.pageSize,
      }),
      this.prisma.employerProfile.count({ where }),
    ]);
    return paged(data, total, paging.page, paging.pageSize);
  }

  async setEmployer(actor: AuthUser, id: string, isVerified: boolean, ip?: string) {
    const saved = await this.prisma.employerProfile.update({ where: { id }, data: { isVerified } });
    await this.audit.log({ actorId: actor.id, action: "EMPLOYER_VERIFY", entityType: "EmployerProfile", entityId: id, summary: String(isVerified), ip });
    return saved;
  }

  async jobs(status?: JobStatus, q?: string, page?: number) {
    const paging = pageOf(page, 20);
    const where: Prisma.JobPostWhereInput = {};
    if (status) where.status = status;
    if (q) where.title = { contains: q, mode: "insensitive" };
    const [rows, total] = await Promise.all([
      this.prisma.jobPost.findMany({
        where,
        include: jobInclude,
        orderBy: { createdAt: "desc" },
        skip: paging.skip,
        take: paging.pageSize,
      }),
      this.prisma.jobPost.count({ where }),
    ]);
    return paged(rows.map((job) => toPublicJob(job, true)), total, paging.page, paging.pageSize);
  }

  async job(id: string) {
    const job = await this.prisma.jobPost.findUnique({ where: { id }, include: jobInclude });
    if (!job) throw new NotFoundException("Job not found");
    const applications = await this.prisma.application.findMany({
      where: { jobId: id },
      include: { driver: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: "desc" },
    });
    return { ...toPublicJob(job, true), applications };
  }

  featureJob(actor: AuthUser, id: string, featured: boolean, ip?: string) {
    return this.prisma.jobPost.update({ where: { id }, data: { featured } }).then(async (saved) => {
      await this.audit.log({ actorId: actor.id, action: "JOB_FEATURE", entityType: "JobPost", entityId: id, summary: String(featured), ip });
      return saved;
    });
  }

  users(query: { q?: string; role?: Role; blocked?: string; deletion?: string; page?: number }) {
    const paging = pageOf(query.page, 20);
    const where: Prisma.UserWhereInput = {};
    if (query.role) where.role = query.role;
    if (query.blocked === "true") where.isBlocked = true;
    if (query.deletion === "true") where.deletionRequestedAt = { not: null };
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: "insensitive" } },
        { phone: { contains: query.q } },
        { email: { contains: query.q, mode: "insensitive" } },
      ];
    }
    return Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true, name: true, phone: true, email: true, role: true, isActive: true, isBlocked: true,
          blockReason: true, phoneVerified: true, deletionRequestedAt: true, createdAt: true, lastLoginAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: paging.skip,
        take: paging.pageSize,
      }),
      this.prisma.user.count({ where }),
    ]).then(([data, total]) => paged(data, total, paging.page, paging.pageSize));
  }

  async setUser(actor: AuthUser, id: string, input: { isBlocked?: boolean; blockReason?: string; isActive?: boolean }, ip?: string) {
    if (id === actor.id) throw new BadRequestException("You cannot change your own access");
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    if (user.role === Role.SUPER_ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException("Only a super admin can change this account");
    }
    const saved = await this.prisma.user.update({
      where: { id },
      data: { isBlocked: input.isBlocked, blockReason: input.blockReason, isActive: input.isActive },
      select: { id: true, isBlocked: true, isActive: true, blockReason: true },
    });
    await this.audit.log({ actorId: actor.id, action: "USER_ACCESS", entityType: "User", entityId: id, metadata: input, ip });
    return saved;
  }

  async createStaff(actor: AuthUser, input: { phone: string; email?: string; password: string; role: Role; name: string }, ip?: string) {
    if (actor.role !== Role.SUPER_ADMIN) throw new ForbiddenException("Only a super admin can add staff");
    const allowed: Role[] = [Role.ADMIN, Role.CONTENT_MANAGER, Role.SUPPORT];
    if (!allowed.includes(input.role)) {
      throw new BadRequestException("Staff role must be admin, content manager, or support");
    }
    const exists = await this.prisma.user.findFirst({ where: { OR: [{ phone: input.phone }, ...(input.email ? [{ email: input.email }] : [])] } });
    if (exists) throw new BadRequestException("Phone or email already exists");
    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        phone: input.phone,
        email: input.email,
        role: input.role,
        phoneVerified: true,
        passwordHash: await bcrypt.hash(input.password, 10),
      },
      select: { id: true, name: true, phone: true, role: true },
    });
    await this.audit.log({ actorId: actor.id, action: "STAFF_CREATE", entityType: "User", entityId: user.id, summary: input.role, ip });
    return user;
  }

  async anonymize(actor: AuthUser, id: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: { driver: true, employer: true, documents: true } });
    if (!user) throw new NotFoundException("User not found");
    if (user.role === Role.SUPER_ADMIN || user.id === actor.id) throw new ForbiddenException("This account cannot be removed");
    if (!FULL_ADMIN.includes(actor.role)) throw new ForbiddenException();
    const phone = `d${Date.now().toString().slice(-10)}`;
    await this.prisma.$transaction(async (tx) => {
      if (user.driver) {
        await tx.driverVehicle.deleteMany({ where: { driverId: user.driver.id } });
        await tx.driverReference.deleteMany({ where: { driverId: user.driver.id } });
        await tx.driverProfile.update({
          where: { id: user.driver.id },
          data: {
            fullName: "Removed profile",
            bio: null,
            addressLine: null,
            licenseNumber: null,
            photoUrl: null,
            isProfileActive: false,
            isJobSeeker: false,
            isAvailable: false,
          },
        });
      }
      if (user.employer) {
        await tx.employerProfile.update({
          where: { id: user.employer.id },
          data: { displayName: "Removed employer", about: null, addressLine: null, contactPerson: null, logoUrl: null },
        });
        await tx.jobPost.updateMany({ where: { employerId: user.employer.id, status: { in: [JobStatus.ACTIVE, JobStatus.PENDING_APPROVAL] } }, data: { status: JobStatus.CLOSED, closedAt: new Date() } });
      }
      await tx.document.deleteMany({ where: { userId: id } });
      await tx.user.update({
        where: { id },
        data: {
          name: "Removed user",
          email: null,
          phone,
          isActive: false,
          isBlocked: true,
          deletionRequestedAt: null,
          passwordHash: hashSecret(randomBytes(24).toString("hex")),
        },
      });
    });
    for (const doc of user.documents) {
      await unlink(doc.path).catch(() => undefined);
    }
    await this.audit.log({ actorId: actor.id, action: "USER_ANONYMIZE", entityType: "User", entityId: id, ip });
    return { ok: true };
  }

  complaints(status?: ComplaintStatus, page?: number) {
    return this.reports.adminList(status, page);
  }

  async setComplaint(actor: AuthUser, id: string, status: ComplaintStatus, adminNote: string | undefined, ip?: string) {
    const saved = await this.reports.update(id, status, adminNote);
    await this.audit.log({ actorId: actor.id, action: "COMPLAINT_UPDATE", entityType: "Complaint", entityId: id, summary: status, ip });
    return saved;
  }

  locations() {
    return this.places.tree(false);
  }

  async setDistrict(actor: AuthUser, id: string, serviceActive: boolean, ip?: string) {
    const saved = await this.places.setService(id, serviceActive);
    await this.audit.log({
      actorId: actor.id,
      action: serviceActive ? "DISTRICT_ENABLE" : "DISTRICT_DISABLE",
      entityType: "District",
      entityId: id,
      summary: saved.nameEn,
      ip,
    });
    return saved;
  }

  async addArea(actor: AuthUser, input: { districtId: string; nameEn: string; nameBn: string; kind: AreaKind }, ip?: string) {
    const saved = await this.places.addArea(input);
    await this.audit.log({ actorId: actor.id, action: "AREA_CREATE", entityType: "Area", entityId: saved.id, summary: saved.nameEn, ip });
    return saved;
  }

  async removeArea(actor: AuthUser, id: string, ip?: string) {
    const saved = await this.places.removeArea(id);
    await this.audit.log({ actorId: actor.id, action: "AREA_DELETE", entityType: "Area", entityId: id, ip });
    return saved;
  }

  messages() {
    return this.content.messages();
  }

  readMessage(id: string) {
    return this.content.markMessage(id);
  }

  pages() {
    return this.content.list();
  }

  async savePage(actor: AuthUser, slug: string, input: { titleEn: string; titleBn: string; bodyEn: string; bodyBn: string }, ip?: string) {
    const saved = await this.content.save(slug, input);
    await this.audit.log({ actorId: actor.id, action: "CONTENT_SAVE", entityType: "ContentPage", entityId: saved.id, summary: slug, ip });
    return saved;
  }

  auditLog(page?: number) {
    const paging = pageOf(page, 30);
    return Promise.all([
      this.prisma.auditLog.findMany({
        include: { actor: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "desc" },
        skip: paging.skip,
        take: paging.pageSize,
      }),
      this.prisma.auditLog.count(),
    ]).then(([data, total]) => paged(data, total, paging.page, paging.pageSize));
  }

  plans() {
    return this.prisma.plan.findMany({ orderBy: { priceBdt: "asc" } });
  }

  async setPlan(actor: AuthUser, id: string, isActive: boolean, ip?: string) {
    if (actor.role !== Role.SUPER_ADMIN) throw new ForbiddenException("Only a super admin can change plans");
    const saved = await this.prisma.plan.update({ where: { id }, data: { isActive } });
    await this.audit.log({ actorId: actor.id, action: "PLAN_UPDATE", entityType: "Plan", entityId: id, summary: String(isActive), ip });
    return saved;
  }
}
