import { Injectable, Logger } from "@nestjs/common";
import { NotificationChannel, Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { pageOf, paged } from "../common/http";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async push(input: {
    userId: string;
    type: string;
    title: string;
    body: string;
    meta?: Prisma.InputJsonValue;
    email?: string | null;
  }) {
    await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        channel: NotificationChannel.IN_APP,
        meta: input.meta,
      },
    });
    if (input.email) {
      await this.prisma.notification.create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          channel: NotificationChannel.EMAIL,
          isRead: true,
          meta: { delivery: "logged", to: input.email },
        },
      });
      this.logger.log(`Email logged for ${input.email}: ${input.title}`);
    }
  }

  async smsSkipped(userId: string, title: string, body: string) {
    await this.prisma.notification.create({
      data: {
        userId,
        type: "SMS",
        title,
        body,
        channel: NotificationChannel.SMS,
        isRead: true,
        meta: { delivery: "skipped", reason: "SMS provider is not configured. Third-party cost." },
      },
    });
  }

  async list(userId: string, page?: number, pageSize?: number) {
    const paging = pageOf(page, pageSize || 20);
    const where = { userId, channel: NotificationChannel.IN_APP };
    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: paging.skip,
        take: paging.pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);
    return paged(data, total, paging.page, paging.pageSize);
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId, channel: NotificationChannel.IN_APP },
      data: { isRead: true },
    });
    return { ok: true };
  }

  markAll(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, channel: NotificationChannel.IN_APP, isRead: false },
      data: { isRead: true },
    });
  }
}
