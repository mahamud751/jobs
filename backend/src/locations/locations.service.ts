import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AreaKind } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  tree(activeOnly = false) {
    return this.prisma.division.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        districts: {
          where: activeOnly ? { serviceActive: true } : undefined,
          orderBy: { nameEn: "asc" },
          include: { areas: { orderBy: { nameEn: "asc" } } },
        },
      },
    }).then((rows) => (activeOnly ? rows.filter((row) => row.districts.length > 0) : rows));
  }

  async coverage() {
    const divisions = await this.prisma.division.findMany({
      orderBy: { sortOrder: "asc" },
      include: { districts: { select: { serviceActive: true } } },
    });
    return divisions.map((division) => ({
      code: division.code,
      nameEn: division.nameEn,
      nameBn: division.nameBn,
      live: division.districts.some((district) => district.serviceActive),
      liveDistricts: division.districts.filter((district) => district.serviceActive).length,
      districts: division.districts.length,
    }));
  }

  async requireDistrict(code: string, activeOnly = false) {
    const district = await this.prisma.district.findUnique({
      where: { code },
      include: { division: true },
    });
    if (!district) throw new BadRequestException("District not found");
    if (activeOnly && !district.serviceActive) {
      throw new BadRequestException("Service is not open in this district yet");
    }
    return district;
  }

  async requireArea(areaId: string, districtId: string) {
    const area = await this.prisma.area.findFirst({ where: { id: areaId, districtId } });
    if (!area) throw new BadRequestException("Area does not belong to the selected district");
    return area;
  }

  async setService(districtId: string, serviceActive: boolean) {
    const district = await this.prisma.district.findUnique({ where: { id: districtId } });
    if (!district) throw new NotFoundException("District not found");
    return this.prisma.district.update({
      where: { id: districtId },
      data: {
        serviceActive,
        launchedAt: serviceActive ? district.launchedAt || new Date() : district.launchedAt,
      },
      include: { division: true },
    });
  }

  async addArea(input: { districtId: string; nameEn: string; nameBn: string; kind: AreaKind }) {
    const district = await this.prisma.district.findUnique({ where: { id: input.districtId } });
    if (!district) throw new NotFoundException("District not found");
    return this.prisma.area.create({ data: input });
  }

  async removeArea(id: string) {
    const used = await this.prisma.area.findUnique({
      where: { id },
      include: { _count: { select: { drivers: true, jobs: true } } },
    });
    if (!used) throw new NotFoundException("Area not found");
    if (used._count.drivers || used._count.jobs) {
      throw new BadRequestException("This area is used by drivers or jobs and cannot be deleted");
    }
    await this.prisma.area.delete({ where: { id } });
    return { ok: true };
  }
}
