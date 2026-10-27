import { Injectable } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(input: {
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    summary?: string;
    metadata?: Prisma.InputJsonValue;
    ip?: string | null;
  }) {
    return this.prisma.auditLog.create({
      data: {
        actorId: input.actorId || null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId || null,
        summary: input.summary,
        metadata: input.metadata,
        ip: input.ip || null,
      },
    });
  }
}
