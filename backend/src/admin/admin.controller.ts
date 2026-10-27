import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { AreaKind, ComplaintStatus, JobStatus, Role, VerificationStatus } from "../generated/prisma/client";
import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";
import { Request } from "express";
import { CurrentUser, FULL_ADMIN, JwtAuthGuard, Roles, RolesGuard, STAFF, type AuthUser } from "../common/auth";
import { clientIp } from "../common/http";
import { RejectJobDto } from "../jobs/dto";
import { JobsService } from "../jobs/jobs.service";
import { AdminService } from "./admin.service";

class PageQuery {
  @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @IsOptional() @IsString() q?: string;
}

class DriverAdminQuery extends PageQuery {
  @IsOptional() @IsEnum(VerificationStatus) verification?: VerificationStatus;
}

class JobAdminQuery extends PageQuery {
  @IsOptional() @IsEnum(JobStatus) status?: JobStatus;
}

class UserAdminQuery extends PageQuery {
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @IsString() blocked?: string;
  @IsOptional() @IsString() deletion?: string;
}

class ComplaintQuery {
  @IsOptional() @IsEnum(ComplaintStatus) status?: ComplaintStatus;
  @IsOptional() @Type(() => Number) @IsInt() page?: number;
}

class VerifyDto {
  @ApiProperty({ enum: VerificationStatus }) @IsEnum(VerificationStatus) status!: VerificationStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(400) note?: string;
}

class FlagDto {
  @ApiProperty() @IsBoolean() featured!: boolean;
}

class VerifiedDto {
  @ApiProperty() @IsBoolean() isVerified!: boolean;
}

class UserAccessDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isBlocked?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(240) blockReason?: string;
}

class StaffDto {
  @ApiProperty() @Matches(/^01[3-9]\d{8}$/) phone!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() email?: string;
  @ApiProperty() @MinLength(8) password!: string;
  @ApiProperty({ enum: Role }) @IsEnum(Role) role!: Role;
  @ApiProperty() @IsString() @MaxLength(80) name!: string;
}

class DistrictDto {
  @ApiProperty() @IsBoolean() serviceActive!: boolean;
}

class AreaDto {
  @ApiProperty() @IsString() districtId!: string;
  @ApiProperty() @IsString() @MaxLength(80) nameEn!: string;
  @ApiProperty() @IsString() @MaxLength(80) nameBn!: string;
  @ApiProperty({ enum: AreaKind }) @IsEnum(AreaKind) kind!: AreaKind;
}

class ComplaintDto {
  @ApiProperty({ enum: ComplaintStatus }) @IsEnum(ComplaintStatus) status!: ComplaintStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(800) adminNote?: string;
}

class ContentDto {
  @ApiProperty() @IsString() titleEn!: string;
  @ApiProperty() @IsString() titleBn!: string;
  @ApiProperty() @IsString() bodyEn!: string;
  @ApiProperty() @IsString() bodyBn!: string;
}

class PlanDto {
  @ApiProperty() @IsBoolean() isActive!: boolean;
}

@ApiTags("Admin")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("admin")
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly jobFlow: JobsService,
  ) {}

  @Get("stats")
  @Roles(...STAFF)
  stats() {
    return this.admin.stats();
  }

  @Get("drivers")
  @Roles(...STAFF)
  drivers(@CurrentUser() user: AuthUser, @Query() query: DriverAdminQuery) {
    return this.admin.drivers(query, FULL_ADMIN.includes(user.role));
  }

  @Get("drivers/:id")
  @Roles(...STAFF)
  driver(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.admin.driver(id, FULL_ADMIN.includes(user.role));
  }

  @Patch("drivers/:id/verification")
  @Roles(...FULL_ADMIN)
  verify(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: VerifyDto, @Req() req: Request) {
    return this.admin.verify(user, id, dto.status, dto.note, clientIp(req));
  }

  @Patch("drivers/:id/featured")
  @Roles(...FULL_ADMIN)
  featureDriver(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: FlagDto, @Req() req: Request) {
    return this.admin.featureDriver(user, id, dto.featured, clientIp(req));
  }

  @Get("employers")
  @Roles(...STAFF)
  employers(@Query() query: PageQuery) {
    return this.admin.employers(query.q, query.page);
  }

  @Patch("employers/:id")
  @Roles(...FULL_ADMIN)
  employer(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: VerifiedDto, @Req() req: Request) {
    return this.admin.setEmployer(user, id, dto.isVerified, clientIp(req));
  }

  @Get("jobs")
  @Roles(...STAFF)
  jobs(@Query() query: JobAdminQuery) {
    return this.admin.jobs(query.status, query.q, query.page);
  }

  @Get("jobs/:id")
  @Roles(...STAFF)
  job(@Param("id") id: string) {
    return this.admin.job(id);
  }

  @Post("jobs/:id/approve")
  @Roles(...FULL_ADMIN)
  approve(@CurrentUser() user: AuthUser, @Param("id") id: string, @Req() req: Request) {
    return this.jobFlow.approve(user, id, clientIp(req));
  }

  @Post("jobs/:id/reject")
  @Roles(...FULL_ADMIN)
  reject(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: RejectJobDto, @Req() req: Request) {
    return this.jobFlow.reject(user, id, dto.reason, clientIp(req));
  }

  @Patch("jobs/:id/featured")
  @Roles(...FULL_ADMIN)
  featureJob(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: FlagDto, @Req() req: Request) {
    return this.admin.featureJob(user, id, dto.featured, clientIp(req));
  }

  @Get("users")
  @Roles(...STAFF)
  users(@Query() query: UserAdminQuery) {
    return this.admin.users(query);
  }

  @Patch("users/:id")
  @Roles(...FULL_ADMIN)
  setUser(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UserAccessDto, @Req() req: Request) {
    return this.admin.setUser(user, id, dto, clientIp(req));
  }

  @Post("staff")
  @Roles(Role.SUPER_ADMIN)
  staff(@CurrentUser() user: AuthUser, @Body() dto: StaffDto, @Req() req: Request) {
    return this.admin.createStaff(user, dto, clientIp(req));
  }

  @Post("users/:id/anonymize")
  @Roles(...FULL_ADMIN)
  anonymize(@CurrentUser() user: AuthUser, @Param("id") id: string, @Req() req: Request) {
    return this.admin.anonymize(user, id, clientIp(req));
  }

  @Get("complaints")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SUPPORT)
  complaints(@Query() query: ComplaintQuery) {
    return this.admin.complaints(query.status, query.page);
  }

  @Patch("complaints/:id")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.SUPPORT)
  complaint(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: ComplaintDto, @Req() req: Request) {
    return this.admin.setComplaint(user, id, dto.status, dto.adminNote, clientIp(req));
  }

  @Get("locations")
  @Roles(...STAFF)
  locations() {
    return this.admin.locations();
  }

  @Patch("districts/:id")
  @Roles(...FULL_ADMIN)
  district(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: DistrictDto, @Req() req: Request) {
    return this.admin.setDistrict(user, id, dto.serviceActive, clientIp(req));
  }

  @Post("areas")
  @Roles(...FULL_ADMIN)
  addArea(@CurrentUser() user: AuthUser, @Body() dto: AreaDto, @Req() req: Request) {
    return this.admin.addArea(user, dto, clientIp(req));
  }

  @Delete("areas/:id")
  @Roles(...FULL_ADMIN)
  removeArea(@CurrentUser() user: AuthUser, @Param("id") id: string, @Req() req: Request) {
    return this.admin.removeArea(user, id, clientIp(req));
  }

  @Get("messages")
  @Roles(...STAFF)
  messages() {
    return this.admin.messages();
  }

  @Patch("messages/:id/read")
  @Roles(...STAFF)
  readMessage(@Param("id") id: string) {
    return this.admin.readMessage(id);
  }

  @Get("content")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.CONTENT_MANAGER)
  pages() {
    return this.admin.pages();
  }

  @Patch("content/:slug")
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.CONTENT_MANAGER)
  savePage(@CurrentUser() user: AuthUser, @Param("slug") slug: string, @Body() dto: ContentDto, @Req() req: Request) {
    return this.admin.savePage(user, slug, dto, clientIp(req));
  }

  @Get("audit")
  @Roles(...FULL_ADMIN)
  audit(@Query("page") page?: string) {
    return this.admin.auditLog(Number(page) || 1);
  }

  @Get("plans")
  @Roles(...FULL_ADMIN)
  plans() {
    return this.admin.plans();
  }

  @Patch("plans/:id")
  @Roles(Role.SUPER_ADMIN)
  plan(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: PlanDto, @Req() req: Request) {
    return this.admin.setPlan(user, id, dto.isActive, clientIp(req));
  }
}
