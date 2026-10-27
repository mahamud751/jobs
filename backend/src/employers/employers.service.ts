import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { EmployerType } from "../generated/prisma/client";
import { placeSelect } from "../common/present";
import { LocationsService } from "../locations/locations.service";
import { PrismaService } from "../prisma/prisma.service";

export class EmployerUpdate {
  displayName?: string;
  companyName?: string;
  contactPerson?: string;
  about?: string;
  addressLine?: string;
  website?: string;
  districtCode?: string | null;
  type?: EmployerType;
}

@Injectable()
export class EmployersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly locations: LocationsService,
  ) {}

  async mine(userId: string) {
    const employer = await this.prisma.employerProfile.findUnique({
      where: { userId },
      include: { district: { select: placeSelect } },
    });
    if (!employer) throw new NotFoundException("Employer profile not found");
    return employer;
  }

  async update(userId: string, dto: EmployerUpdate) {
    const employer = await this.mine(userId);
    if ((dto.type || employer.type) === EmployerType.COMPANY && dto.companyName === "") {
      throw new BadRequestException("Company name is required");
    }
    const districtId =
      dto.districtCode === undefined
        ? undefined
        : dto.districtCode
          ? (await this.locations.requireDistrict(dto.districtCode, true)).id
          : null;
    const saved = await this.prisma.employerProfile.update({
      where: { id: employer.id },
      data: {
        displayName: dto.displayName,
        companyName: dto.companyName,
        contactPerson: dto.contactPerson,
        about: dto.about,
        addressLine: dto.addressLine,
        website: dto.website,
        type: dto.type,
        districtId,
      },
      include: { district: { select: placeSelect } },
    });
    if (dto.displayName) {
      await this.prisma.user.update({ where: { id: userId }, data: { name: dto.displayName } });
    }
    return saved;
  }

  async setLogo(userId: string, logoUrl: string) {
    const employer = await this.mine(userId);
    return this.prisma.employerProfile.update({ where: { id: employer.id }, data: { logoUrl } });
  }
}
