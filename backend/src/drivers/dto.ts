import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DrivingCategory, JobType, LicenseClass, VehicleType } from "../generated/prisma/client";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class SearchDriversDto {
  @IsOptional() @IsString() division?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() areaId?: string;
  @IsOptional() @IsEnum(VehicleType) vehicle?: VehicleType;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) experienceMin?: number;
  @IsOptional() @IsEnum(LicenseClass) licenseClass?: LicenseClass;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) salaryMax?: number;
  @IsOptional() @IsEnum(JobType) jobType?: JobType;
  @IsOptional() @IsEnum(DrivingCategory) category?: DrivingCategory;
  @IsOptional() @IsString() verified?: string;
  @IsOptional() @IsString() available?: string;
  @IsOptional() @IsString() q?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize?: number;
}

export class UpdateDriverDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) fullName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(800) bio?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) addressLine?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() districtCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() areaId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() workDistrictCode?: string | null;
  @ApiPropertyOptional({ enum: LicenseClass }) @IsOptional() @IsEnum(LicenseClass) licenseClass?: LicenseClass;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) licenseNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() licenseExpiry?: string | null;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(60) experienceYears?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(500000) expectedSalaryMin?: number | null;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(500000) expectedSalaryMax?: number | null;
  @ApiPropertyOptional({ enum: JobType }) @IsOptional() @IsEnum(JobType) jobPreference?: JobType;
  @ApiPropertyOptional({ enum: DrivingCategory, isArray: true })
  @IsOptional() @IsArray() @IsEnum(DrivingCategory, { each: true }) drivingCategories?: DrivingCategory[];
  @ApiPropertyOptional({ enum: VehicleType, isArray: true })
  @IsOptional() @IsArray() @IsEnum(VehicleType, { each: true }) vehicles?: VehicleType[];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isJobSeeker?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isAvailable?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) educationLevel?: string;
}

export class ExperienceDto {
  @ApiProperty() @IsString() @MaxLength(120) employer!: string;
  @ApiProperty() @IsString() @MaxLength(80) role!: string;
  @ApiPropertyOptional({ enum: VehicleType }) @IsOptional() @IsEnum(VehicleType) vehicleType?: VehicleType;
  @ApiPropertyOptional({ enum: DrivingCategory }) @IsOptional() @IsEnum(DrivingCategory) category?: DrivingCategory;
  @ApiProperty() @Type(() => Number) @IsInt() @Min(1970) @Max(2100) startYear!: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(1970) @Max(2100) endYear?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(400) description?: string;
}

export class ReferenceDto {
  @ApiProperty() @IsString() @MaxLength(80) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) relation?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(240) note?: string;
}

export class ActivationDto {
  @ApiProperty() @IsBoolean() active!: boolean;
}
