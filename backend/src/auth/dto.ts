import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EmployerType } from "../generated/prisma/client";
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

const phone = /^01[3-9]\d{8}$/;
const passwordRule = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export class RegisterDriverDto {
  @ApiProperty({ example: "01711111111" })
  @Matches(phone, { message: "Enter a valid Bangladesh mobile number" })
  phone!: string;

  @ApiProperty({ minLength: 8 })
  @MinLength(8)
  @Matches(passwordRule, { message: "Password must include a letter and a number" })
  password!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(80)
  fullName!: string;

  @ApiProperty({ example: "dhaka" })
  @IsString()
  districtCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class RegisterEmployerDto {
  @ApiProperty({ example: "01722222221" })
  @Matches(phone, { message: "Enter a valid Bangladesh mobile number" })
  phone!: string;

  @ApiProperty()
  @MinLength(8)
  @Matches(passwordRule, { message: "Password must include a letter and a number" })
  password!: string;

  @ApiProperty({ enum: EmployerType })
  @IsEnum(EmployerType)
  type!: EmployerType;

  @ApiProperty()
  @IsString()
  @MaxLength(120)
  displayName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  companyName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  contactPerson?: string;

  @ApiPropertyOptional({ example: "dhaka" })
  @IsOptional()
  @IsString()
  districtCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class LoginDto {
  @ApiProperty({ description: "Mobile number or email" })
  @IsString()
  identifier!: string;

  @ApiProperty()
  @IsString()
  password!: string;
}

export class OtpRequestDto {
  @ApiProperty()
  @Matches(phone, { message: "Enter a valid Bangladesh mobile number" })
  phone!: string;

  @ApiProperty({ enum: ["verify", "reset"] })
  @IsString()
  purpose!: "verify" | "reset";
}

export class OtpVerifyDto {
  @ApiProperty()
  @Matches(phone, { message: "Enter a valid Bangladesh mobile number" })
  phone!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @Matches(phone, { message: "Enter a valid Bangladesh mobile number" })
  phone!: string;

  @ApiProperty()
  @IsString()
  code!: string;

  @ApiProperty()
  @MinLength(8)
  @Matches(passwordRule, { message: "Password must include a letter and a number" })
  password!: string;
}

export class RefreshDto {
  @ApiProperty()
  @IsString()
  refreshToken!: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword!: string;

  @ApiProperty()
  @MinLength(8)
  @Matches(passwordRule, { message: "Password must include a letter and a number" })
  password!: string;
}
