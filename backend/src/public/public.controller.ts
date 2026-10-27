import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JobStatus } from "../generated/prisma/client";
import { CurrentUser, JwtAuthGuard, type AuthUser } from "../common/auth";
import { AuthService } from "../auth/auth.service";
import { DriversService } from "../drivers/drivers.service";
import { JobsService } from "../jobs/jobs.service";
import { LocationsService } from "../locations/locations.service";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("Public")
@Controller()
export class PublicController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobsService,
    private readonly drivers: DriversService,
    private readonly locations: LocationsService,
    private readonly auth: AuthService,
  ) {}

  @Get("health")
  @ApiOperation({ summary: "Database connectivity check" })
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { ok: true, service: "chalok-api", time: new Date().toISOString() };
  }

  @Get("home")
  @ApiOperation({ summary: "Homepage jobs, drivers, coverage, and counts" })
  async home() {
    const [jobs, drivers, coverage, driverCount, jobCount, employerCount, liveDistricts] = await Promise.all([
      this.jobs.search({ pageSize: 6 }),
      this.drivers.search({ pageSize: 6 }),
      this.locations.coverage(),
      this.prisma.driverProfile.count({
        where: {
          isProfileActive: true,
          isJobSeeker: true,
          isAvailable: true,
          user: { phoneVerified: true, isBlocked: false, isActive: true },
          district: { serviceActive: true },
          vehicles: { some: {} },
        },
      }),
      this.prisma.jobPost.count({ where: { status: JobStatus.ACTIVE, district: { serviceActive: true } } }),
      this.prisma.employerProfile.count(),
      this.prisma.district.count({ where: { serviceActive: true } }),
    ]);
    return {
      jobs: jobs.data,
      drivers: drivers.data,
      coverage,
      counts: { driverCount, jobCount, employerCount, liveDistricts },
    };
  }
}

@ApiTags("Privacy")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("privacy")
export class PrivacyController {
  constructor(private readonly auth: AuthService) {}

  @Get("me/export")
  @ApiOperation({ summary: "Download the signed-in user's stored profile and applications" })
  exportMe(@CurrentUser() user: AuthUser) {
    return this.auth.exportMe(user.id);
  }

  @Post("me/deletion")
  @ApiOperation({ summary: "Ask an admin to delete this account" })
  deletion(@CurrentUser() user: AuthUser) {
    return this.auth.requestDeletion(user.id);
  }
}
