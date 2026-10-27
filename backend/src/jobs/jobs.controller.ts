import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "../generated/prisma/client";
import { Request } from "express";
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard, type AuthUser } from "../common/auth";
import { clientIp } from "../common/http";
import { JobDto, RepublishDto, SearchJobsDto } from "./dto";
import { JobsService } from "./jobs.service";

@ApiTags("Jobs")
@Controller("jobs")
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  @Get()
  @ApiOperation({ summary: "Search active job posts in live districts" })
  search(@Query() query: SearchJobsDto) {
    return this.jobs.search(query);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  @ApiOperation({ summary: "Create a job. It stays pending until an admin approves it." })
  create(@CurrentUser() user: AuthUser, @Body() dto: JobDto, @Req() req: Request) {
    return this.jobs.create(user, dto, clientIp(req));
  }

  @Patch(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: JobDto, @Req() req: Request) {
    return this.jobs.update(user, id, dto, clientIp(req));
  }

  @Post(":id/close")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  close(@CurrentUser() user: AuthUser, @Param("id") id: string, @Req() req: Request) {
    return this.jobs.close(user, id, clientIp(req));
  }

  @Post(":id/republish")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  republish(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: RepublishDto, @Req() req: Request) {
    return this.jobs.republish(user, id, dto.deadline, clientIp(req));
  }

  @Get(":ref")
  @ApiOperation({ summary: "Job detail by slug or id" })
  one(@Param("ref") ref: string) {
    return this.jobs.one(ref);
  }
}
