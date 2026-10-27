import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { ComplaintType } from "../generated/prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { CurrentUser, JwtAuthGuard, type AuthUser } from "../common/auth";
import { ComplaintsService } from "./complaints.service";

class CreateComplaintDto {
  @ApiProperty({ enum: ComplaintType })
  @IsEnum(ComplaintType)
  type!: ComplaintType;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  againstUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  againstJobId?: string;
}

@ApiTags("Complaints")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("complaints")
export class ComplaintsController {
  constructor(private readonly complaints: ComplaintsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateComplaintDto) {
    return this.complaints.create(user.id, dto);
  }

  @Get("me")
  mine(@CurrentUser() user: AuthUser) {
    return this.complaints.mine(user.id);
  }
}
