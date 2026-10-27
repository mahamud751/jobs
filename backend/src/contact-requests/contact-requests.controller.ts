import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { Role } from "../generated/prisma/client";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard, type AuthUser } from "../common/auth";
import { ContactRequestsService } from "./contact-requests.service";

class CreateContactDto {
  @ApiProperty()
  @IsString()
  driverId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(400)
  message?: string;
}

class RespondContactDto {
  @ApiProperty({ enum: ["ACCEPTED", "DECLINED"] })
  @IsIn(["ACCEPTED", "DECLINED"])
  status!: "ACCEPTED" | "DECLINED";
}

@ApiTags("Contact")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("contact-requests")
export class ContactRequestsController {
  constructor(private readonly contacts: ContactRequestsService) {}

  @Post()
  @Roles(Role.EMPLOYER)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateContactDto) {
    return this.contacts.create(user, dto.driverId, dto.message);
  }

  @Get()
  @Roles(Role.EMPLOYER, Role.DRIVER)
  list(@CurrentUser() user: AuthUser) {
    return this.contacts.list(user);
  }

  @Patch(":id")
  @Roles(Role.DRIVER)
  respond(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: RespondContactDto) {
    return this.contacts.respond(user, id, dto.status);
  }
}
