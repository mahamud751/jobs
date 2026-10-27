import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async page(slug: string) {
    const page = await this.prisma.contentPage.findUnique({ where: { slug } });
    if (!page) throw new NotFoundException("Page not found");
    return page;
  }

  list() {
    return this.prisma.contentPage.findMany({ orderBy: { slug: "asc" } });
  }

  async save(slug: string, input: { titleEn: string; titleBn: string; bodyEn: string; bodyBn: string }) {
    return this.prisma.contentPage.upsert({
      where: { slug },
      create: { slug, ...input },
      update: input,
    });
  }

  createMessage(input: { name: string; email?: string; phone?: string; subject: string; message: string; website?: string }) {
    if (input.website) return { ok: true };
    return this.prisma.contactMessage.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        subject: input.subject,
        message: input.message,
      },
    });
  }

  messages() {
    return this.prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  }

  markMessage(id: string) {
    return this.prisma.contactMessage.update({ where: { id }, data: { isRead: true } });
  }
}
