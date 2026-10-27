import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ContactRequestStatus, Prisma } from "../generated/prisma/client";
import { AuthUser } from "../common/auth";
import { driverInclude, placeSelect, toPublicDriver } from "../common/present";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ContactRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(user: AuthUser, driverId: string, message?: string) {
    if (!user.phoneVerified) throw new BadRequestException("Verify your mobile number first");
    const employer = await this.prisma.employerProfile.findUnique({ where: { userId: user.id } });
    if (!employer) throw new BadRequestException("Only employers can request contact");
    const driver = await this.prisma.driverProfile.findUnique({ where: { id: driverId }, include: { user: true } });
    if (!driver || !driver.isProfileActive) throw new NotFoundException("Driver not found");
    const existing = await this.prisma.contactRequest.findFirst({
      where: { fromUserId: user.id, driverId },
      orderBy: { createdAt: "desc" },
    });
    if (existing?.status === ContactRequestStatus.ACCEPTED) return this.present(existing.id, user.id);
    const saved = existing
      ? await this.prisma.contactRequest.update({
          where: { id: existing.id },
          data: { status: ContactRequestStatus.PENDING, message },
        })
      : await this.prisma.contactRequest.create({
          data: { fromUserId: user.id, toUserId: driver.userId, driverId, message },
        });
    await this.notifications.push({
      userId: driver.userId,
      type: "CONTACT_REQUEST",
      title: "যোগাযোগের অনুরোধ",
      body: message || `${employer.displayName} আপনার সাথে যোগাযোগ করতে চান।`,
      meta: { contactRequestId: saved.id },
    });
    return saved;
  }

  async list(user: AuthUser) {
    const where: Prisma.ContactRequestWhereInput =
      user.role === "DRIVER" ? { toUserId: user.id } : { fromUserId: user.id };
    const rows = await this.prisma.contactRequest.findMany({
      where,
      include: {
        driver: { include: driverInclude },
        fromUser: { select: { id: true, name: true, phone: true, employer: { select: { displayName: true, type: true, district: { select: placeSelect } } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map((row) => ({
      id: row.id,
      message: row.message,
      status: row.status,
      createdAt: row.createdAt,
      driver: toPublicDriver(row.driver),
      phone: row.status === ContactRequestStatus.ACCEPTED && user.role === "EMPLOYER" ? row.driver.user.phone : undefined,
      from: {
        name: row.fromUser.employer?.displayName || row.fromUser.name,
        type: row.fromUser.employer?.type,
        district: row.fromUser.employer?.district,
      },
    }));
  }

  async respond(user: AuthUser, id: string, status: "ACCEPTED" | "DECLINED") {
    const row = await this.prisma.contactRequest.findFirst({ where: { id, toUserId: user.id }, include: { driver: true } });
    if (!row) throw new NotFoundException("Request not found");
    const saved = await this.prisma.contactRequest.update({
      where: { id },
      data: { status: status === "ACCEPTED" ? ContactRequestStatus.ACCEPTED : ContactRequestStatus.DECLINED },
    });
    await this.notifications.push({
      userId: row.fromUserId,
      type: "CONTACT_RESPONSE",
      title: status === "ACCEPTED" ? "যোগাযোগের অনুমতি দেওয়া হয়েছে" : "যোগাযোগের অনুরোধ প্রত্যাখ্যান",
      body: row.driver.fullName,
      meta: { contactRequestId: id },
    });
    return saved;
  }

  private async present(id: string, userId: string) {
    const row = await this.prisma.contactRequest.findFirst({
      where: { id, fromUserId: userId },
      include: { driver: { include: { user: true } } },
    });
    return {
      ...row,
      phone: row?.status === ContactRequestStatus.ACCEPTED ? row.driver.user.phone : undefined,
    };
  }
}
