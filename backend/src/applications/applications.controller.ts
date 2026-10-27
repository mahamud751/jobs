import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { ApplicationStatus, Role } from "../generated/prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard, type AuthUser } from "../common/auth";
import { ApplicationsService } from "./applications.service";

class ApplyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(800)
  coverNote?: string;
}

class StatusDto {
  @ApiProperty({ enum: ApplicationStatus })
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(400)
  note?: string;
}

@ApiTags("Applications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class ApplicationsController {
  constructor(private readonly applications: ApplicationsService) {}

  @Post("jobs/:ref/applications")
  @Roles(Role.DRIVER)
  apply(@CurrentUser() user: AuthUser, @Param("ref") ref: string, @Body() dto: ApplyDto) {
    return this.applications.apply(user, ref, dto.coverNote);
  }

  @Get("applications/me")
  @Roles(Role.DRIVER)
  mine(@CurrentUser() user: AuthUser) {
    return this.applications.mine(user.id);
  }

  @Get("jobs/:id/applications")
  @Roles(Role.EMPLOYER)
  forJob(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.applications.forJob(user.id, id);
  }

  @Patch("applications/:id")
  @Roles(Role.DRIVER, Role.EMPLOYER)
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: StatusDto) {
    return this.applications.updateStatus(user, id, dto.status, dto.note);
  }
}
