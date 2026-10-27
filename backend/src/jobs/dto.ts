import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { DrivingCategory, JobStatus, JobType, LicenseClass, VehicleType } from "../generated/prisma/client";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class SearchJobsDto {
  @IsOptional() @IsString() division?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() areaId?: string;
  @IsOptional() @IsEnum(VehicleType) vehicle?: VehicleType;
  @IsOptional() @IsEnum(JobType) jobType?: JobType;
  @IsOptional() @IsEnum(LicenseClass) licenseClass?: LicenseClass;
  @IsOptional() @IsEnum(DrivingCategory) category?: DrivingCategory;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) experience?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) salaryMin?: number;
  @IsOptional() @IsString() q?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize?: number;
}

export class JobDto {
  @ApiProperty() @IsString() @MaxLength(120) title!: string;
  @ApiProperty() @IsString() @MinLength(20) @MaxLength(4000) description!: string;
  @ApiProperty() @IsString() districtCode!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() areaId?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) areaText?: string;
  @ApiProperty({ enum: VehicleType }) @IsEnum(VehicleType) vehicleType!: VehicleType;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(500000) salaryMin?: number | null;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(500000) salaryMax?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() salaryNegotiable?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160) workingHours?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(160) holidays?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(40) experienceRequired?: number;
  @ApiPropertyOptional({ enum: LicenseClass }) @IsOptional() @IsEnum(LicenseClass) licenseClass?: LicenseClass;
  @ApiProperty({ enum: JobType }) @IsEnum(JobType) jobType!: JobType;
  @ApiPropertyOptional({ enum: DrivingCategory }) @IsOptional() @IsEnum(DrivingCategory) drivingCategory?: DrivingCategory;
  @ApiPropertyOptional() @IsOptional() @IsDateString() deadline?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(400) applyInstructions?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() showPhone?: boolean;
  @ApiPropertyOptional({ description: "False saves a draft. True sends the job for admin approval." })
  @IsOptional() @IsBoolean() submit?: boolean;
}

export class RepublishDto {
  @ApiProperty() @IsDateString() deadline!: string;
}

export class RejectJobDto {
  @ApiProperty() @IsString() @MinLength(3) @MaxLength(400) reason!: string;
}

export class AdminJobQueryDto {
  @IsOptional() @IsEnum(JobStatus) status?: JobStatus;
  @IsOptional() @IsString() q?: string;
  @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @IsOptional() @Type(() => Number) @IsInt() pageSize?: number;
}
