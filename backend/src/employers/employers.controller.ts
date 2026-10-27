import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { EmployerType, Role } from "../generated/prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { randomBytes } from "crypto";
import { diskStorage } from "multer";
import { extname } from "path";
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard, type AuthUser } from "../common/auth";
import { JobsService } from "../jobs/jobs.service";
import { EmployersService } from "./employers.service";

class UpdateEmployerDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) displayName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160) companyName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) contactPerson?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(800) about?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) addressLine?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160) website?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() districtCode?: string;
  @ApiPropertyOptional({ enum: EmployerType }) @IsOptional() @IsEnum(EmployerType) type?: EmployerType;
}

@ApiTags("Employers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.EMPLOYER)
@Controller("employers")
export class EmployersController {
  constructor(
    private readonly employers: EmployersService,
    private readonly jobs: JobsService,
  ) {}

  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.employers.mine(user.id);
  }

  @Patch("me")
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateEmployerDto) {
    return this.employers.update(user.id, dto);
  }

  @Get("me/jobs")
  jobsMine(@CurrentUser() user: AuthUser) {
    return this.jobs.mine(user.id);
  }

  @Post("me/logo")
  @UseInterceptors(FileInterceptor("logo", {
    storage: diskStorage({
      destination: "uploads/public",
      filename: (_req, file, cb) => cb(null, `${Date.now()}-${randomBytes(4).toString("hex")}${extname(file.originalname).toLowerCase()}`),
    }),
    limits: { fileSize: 2 * 1024 * 1024 },
  }))
  logo(@CurrentUser() user: AuthUser, @UploadedFile() file?: Express.Multer.File) {
    if (!file || !["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      throw new BadRequestException("Logo must be jpg, png, or webp");
    }
    return this.employers.setLogo(user.id, `/uploads/${file.filename}`);
  }
}
