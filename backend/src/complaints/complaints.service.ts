import { Injectable, NotFoundException } from "@nestjs/common";
import { ComplaintStatus, ComplaintType } from "../generated/prisma/client";
import { pageOf, paged } from "../common/http";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ComplaintsService {
  constructor(private readonly prisma: PrismaService) {}

  create(reporterId: string, input: { type: ComplaintType; description: string; againstUserId?: string; againstJobId?: string }) {
    return this.prisma.complaint.create({ data: { reporterId, ...input } });
  }

  mine(reporterId: string) {
    return this.prisma.complaint.findMany({ where: { reporterId }, orderBy: { createdAt: "desc" } });
  }

  async adminList(status?: ComplaintStatus, page?: number) {
    const paging = pageOf(page, 20);
    const where = status ? { status } : {};
    const [data, total] = await Promise.all([
      this.prisma.complaint.findMany({
        where,
        include: { reporter: { select: { id: true, name: true, phone: true, role: true } } },
        orderBy: { createdAt: "desc" },
        skip: paging.skip,
        take: paging.pageSize,
      }),
      this.prisma.complaint.count({ where }),
    ]);
    return paged(data, total, paging.page, paging.pageSize);
  }

  async update(id: string, status: ComplaintStatus, adminNote?: string) {
    const row = await this.prisma.complaint.findUnique({ where: { id } });
    if (!row) throw new NotFoundException("Complaint not found");
    return this.prisma.complaint.update({ where: { id }, data: { status, adminNote } });
  }
}
