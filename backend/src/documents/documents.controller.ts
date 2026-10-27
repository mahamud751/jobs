import { Controller, ForbiddenException, Get, NotFoundException, Param, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { DocumentKind, Role } from "../generated/prisma/client";
import { Response } from "express";
import { resolve } from "path";
import { CurrentUser, JwtAuthGuard, type AuthUser } from "../common/auth";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("Documents")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("documents")
export class DocumentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(":id")
  async download(@Param("id") id: string, @CurrentUser() user: AuthUser, @Res() res: Response) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException("Document not found");
    const fullAdmin = user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN;
    const sensitive = doc.kind === DocumentKind.LICENSE || doc.kind === DocumentKind.NID;
    if (doc.userId !== user.id && !fullAdmin) {
      if (!(user.role === Role.SUPPORT && !sensitive)) throw new ForbiddenException();
    }
    return res.sendFile(resolve(process.cwd(), doc.path));
  }
}
