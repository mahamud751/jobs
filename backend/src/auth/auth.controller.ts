import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { CurrentUser, JwtAuthGuard, type AuthUser } from "../common/auth";
import { AuthService } from "./auth.service";
import {
  ChangePasswordDto,
  LoginDto,
  OtpRequestDto,
  OtpVerifyDto,
  RefreshDto,
  RegisterDriverDto,
  RegisterEmployerDto,
  ResetPasswordDto,
} from "./dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register/driver")
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  @ApiOperation({ summary: "Create a driver account" })
  registerDriver(@Body() dto: RegisterDriverDto) {
    return this.auth.registerDriver(dto);
  }

  @Post("register/employer")
  @Throttle({ default: { limit: 8, ttl: 60000 } })
  @ApiOperation({ summary: "Create an individual or company employer account" })
  registerEmployer(@Body() dto: RegisterEmployerDto) {
    return this.auth.registerEmployer(dto);
  }

  @Post("login")
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: "Log in with mobile number or email" })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.identifier, dto.password);
  }

  @Post("refresh")
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post("logout")
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Post("otp/request")
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: "Request a mobile OTP. SMS is logged until a provider is configured." })
  requestOtp(@Body() dto: OtpRequestDto) {
    return this.auth.requestOtp(dto.phone, dto.purpose);
  }

  @Post("otp/verify")
  verify(@Body() dto: OtpVerifyDto) {
    return this.auth.verifyPhone(dto.phone, dto.code);
  }

  @Post("password/reset")
  reset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.phone, dto.code, dto.password);
  }

  @Post("password/change")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  change(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user.id, dto.currentPassword, dto.password);
  }

  @Get("me")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Current user, driver or employer profile, and unread count" })
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }
}
