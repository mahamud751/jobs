import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ApplicationStatus, JobStatus } from "../generated/prisma/client";
import { AuthUser } from "../common/auth";
import { driverInclude, toPublicDriver } from "../common/present";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";

const terminal: ApplicationStatus[] = [ApplicationStatus.HIRED, ApplicationStatus.REJECTED, ApplicationStatus.WITHDRAWN];

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async apply(user: AuthUser, ref: string, coverNote?: string) {
    if (!user.phoneVerified) throw new ForbiddenException("Verify your mobile number before applying");
    const driver = await this.prisma.driverProfile.findUnique({ where: { userId: user.id } });
    if (!driver || !driver.isProfileActive) throw new ForbiddenException("Complete and activate your driver profile first");
    const job = await this.prisma.jobPost.findFirst({
      where: { OR: [{ id: ref }, { slug: ref }], status: JobStatus.ACTIVE },
      include: { employer: true },
    });
    if (!job) throw new NotFoundException("Job not found");
    if (job.deadline && job.deadline < new Date()) throw new BadRequestException("Applications are closed");
    const existing = await this.prisma.application.findUnique({
      where: { jobId_driverId: { jobId: job.id, driverId: driver.id } },
    });
    if (existing) throw new BadRequestException("You already applied for this job");
    const application = await this.prisma.application.create({
      data: {
        jobId: job.id,
        driverId: driver.id,
        coverNote,
        history: { create: { status: ApplicationStatus.SUBMITTED, actorId: user.id } },
      },
    });
    await this.notifications.push({
      userId: job.employer.userId,
      type: "NEW_APPLICATION",
      title: "নতুন আবেদন",
      body: `${driver.fullName} আবেদন করেছেন: ${job.title}`,
      meta: { applicationId: application.id, jobId: job.id },
    });
    return application;
  }

  async mine(userId: string) {
    const driver = await this.prisma.driverProfile.findUnique({ where: { userId } });
    if (!driver) return [];
    return this.prisma.application.findMany({
      where: { driverId: driver.id },
      include: {
        history: { orderBy: { createdAt: "asc" } },
        job: {
          select: {
            id: true,
            slug: true,
            title: true,
            status: true,
            district: { select: { nameEn: true, nameBn: true } },
            employer: { select: { displayName: true, companyName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async forJob(userId: string, jobId: string) {
    const job = await this.prisma.jobPost.findFirst({
      where: { id: jobId, employer: { userId } },
    });
    if (!job) throw new NotFoundException("Job not found");
    const rows = await this.prisma.application.findMany({
      where: { jobId },
      include: { history: { orderBy: { createdAt: "asc" } }, driver: { include: driverInclude } },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      coverNote: row.coverNote,
      createdAt: row.createdAt,
      history: row.history,
      driver: { ...toPublicDriver(row.driver), phone: row.driver.user.phone },
    }));
  }

  async updateStatus(user: AuthUser, id: string, status: ApplicationStatus, note?: string) {
    const application = await this.prisma.application.findUnique({
      include: { job: { include: { employer: true } }, driver: true },
      where: { id },
    });
    if (!application) throw new NotFoundException("Application not found");
    const isEmployer = application.job.employer.userId === user.id;
    const isDriver = application.driver.userId === user.id;
    if (status === ApplicationStatus.WITHDRAWN) {
      if (!isDriver) throw new ForbiddenException();
    } else if (!isEmployer) {
      throw new ForbiddenException();
    }
    if (terminal.includes(application.status)) throw new BadRequestException("This application is closed");
    const saved = await this.prisma.application.update({
      where: { id },
      data: {
        status,
        history: { create: { status, note, actorId: user.id } },
      },
      include: { history: { orderBy: { createdAt: "asc" } } },
    });
    const titles: Record<string, string> = {
      UNDER_REVIEW: "আবেদন পর্যালোচনাধীন",
      INTERVIEW: "সাক্ষাৎকারের জন্য নির্বাচিত",
      HIRED: "নিয়োগ সম্পন্ন",
      REJECTED: "আবেদন বাতিল",
      WITHDRAWN: "আবেদন প্রত্যাহার",
    };
    const target = status === ApplicationStatus.WITHDRAWN ? application.job.employer.userId : application.driver.userId;
    await this.notifications.push({
      userId: target,
      type: "APPLICATION_STATUS",
      title: titles[status] || "আবেদনের হালনাগাদ",
      body: note ? `${application.job.title}: ${note}` : application.job.title,
      meta: { applicationId: id, status },
    });
    return saved;
  }
}
