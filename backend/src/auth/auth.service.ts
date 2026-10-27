import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { EmployerType, Prisma, Role } from "../generated/prisma/client";
import * as bcrypt from "bcrypt";
import { randomBytes, randomInt } from "crypto";
import { hashSecret, safeEqual } from "../common/http";
import { driverInclude, placeSelect, toOwnerDriver } from "../common/present";
import { LocationsService } from "../locations/locations.service";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDriverDto, RegisterEmployerDto } from "./dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly locations: LocationsService,
    private readonly notifications: NotificationsService,
  ) {}

  async registerDriver(dto: RegisterDriverDto) {
    await this.ensureFresh(dto.phone, dto.email);
    const district = await this.locations.requireDistrict(dto.districtCode, true);
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.fullName,
        phone: dto.phone,
        email: dto.email || null,
        passwordHash,
        role: Role.DRIVER,
        driver: { create: { fullName: dto.fullName, districtId: district.id } },
      },
    });
    const devOtp = await this.issueOtp(user.phone, user.id, "verify");
    await this.notifications.push({
      userId: user.id,
      type: "WELCOME",
      title: "চালক-এ স্বাগতম",
      body: "প্রোফাইল সম্পূর্ণ করুন এবং মোবাইল নম্বর যাচাই করুন।",
      email: user.email,
    });
    await this.notifications.smsSkipped(user.id, "মোবাইল যাচাই", "SMS provider is not configured.");
    return { ...(await this.tokens(user)), user: this.publicUser(user), devOtp };
  }

  async registerEmployer(dto: RegisterEmployerDto) {
    if (dto.type === EmployerType.COMPANY && !dto.companyName?.trim()) {
      throw new BadRequestException("Company name is required");
    }
    await this.ensureFresh(dto.phone, dto.email);
    const district = dto.districtCode ? await this.locations.requireDistrict(dto.districtCode, true) : null;
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.displayName,
        phone: dto.phone,
        email: dto.email || null,
        passwordHash,
        role: Role.EMPLOYER,
        employer: {
          create: {
            type: dto.type,
            displayName: dto.displayName,
            companyName: dto.companyName,
            contactPerson: dto.contactPerson,
            districtId: district?.id,
          },
        },
      },
    });
    const devOtp = await this.issueOtp(user.phone, user.id, "verify");
    await this.notifications.push({
      userId: user.id,
      type: "WELCOME",
      title: "নিয়োগকর্তা অ্যাকাউন্ট তৈরি হয়েছে",
      body: "মোবাইল যাচাই করে ড্রাইভার নিয়োগের বিজ্ঞাপন পাঠাতে পারবেন।",
      email: user.email,
    });
    return { ...(await this.tokens(user)), user: this.publicUser(user), devOtp };
  }

  async login(identifier: string, password: string) {
    const key = identifier.trim();
    const user = await this.prisma.user.findFirst({
      where: key.includes("@") ? { email: key.toLowerCase() } : { phone: key },
    });
    if (!user) throw new UnauthorizedException("Incorrect phone, email, or password");
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) throw new UnauthorizedException("Incorrect phone, email, or password");
    if (!user.isActive || user.isBlocked) throw new UnauthorizedException("Account is not active");
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return { ...(await this.tokens(user)), user: this.publicUser(user) };
  }

  async refresh(refreshToken: string) {
    const tokenHash = hashSecret(refreshToken);
    const row = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!row || row.expiresAt < new Date()) throw new UnauthorizedException("Refresh token expired");
    if (!row.user.isActive || row.user.isBlocked) throw new UnauthorizedException("Account is not active");
    await this.prisma.refreshToken.delete({ where: { id: row.id } });
    return { ...(await this.tokens(row.user)), user: this.publicUser(row.user) };
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return { ok: true };
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash: hashSecret(refreshToken) } });
    return { ok: true };
  }

  async requestOtp(phone: string, purpose: string) {
    if (!["verify", "reset"].includes(purpose)) throw new BadRequestException("Unknown OTP purpose");
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) return { ok: true };
    const devOtp = await this.issueOtp(phone, user.id, purpose);
    await this.notifications.smsSkipped(user.id, "OTP", "SMS provider is not configured.");
    return { ok: true, devOtp };
  }

  async verifyPhone(phone: string, code: string) {
    const user = await this.consumeOtp(phone, code, "verify");
    await this.prisma.user.update({ where: { id: user.id }, data: { phoneVerified: true } });
    return { ok: true };
  }

  async resetPassword(phone: string, code: string, password: string) {
    const user = await this.consumeOtp(phone, code, "reset");
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(password, 10) },
    });
    await this.prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    return { ok: true };
  }

  async changePassword(userId: string, currentPassword: string, password: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const match = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!match) throw new UnauthorizedException("Current password is incorrect");
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(password, 10) },
    });
    return { ok: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        driver: { include: driverInclude },
        employer: {
          include: {
            district: { select: placeSelect },
            jobs: { select: { status: true } },
          },
        },
        documents: {
          select: { id: true, kind: true, fileName: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!user) throw new UnauthorizedException();
    const unreadNotifications = await this.prisma.notification.count({
      where: { userId, channel: "IN_APP", isRead: false },
    });
    const jobs = user.employer?.jobs || [];
    return {
      ...this.publicUser(user),
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      deletionRequestedAt: user.deletionRequestedAt,
      unreadNotifications,
      driver: user.driver ? toOwnerDriver(user.driver, user.documents) : null,
      employer: user.employer
        ? {
            id: user.employer.id,
            type: user.employer.type,
            displayName: user.employer.displayName,
            companyName: user.employer.companyName,
            logoUrl: user.employer.logoUrl,
            contactPerson: user.employer.contactPerson,
            about: user.employer.about,
            addressLine: user.employer.addressLine,
            website: user.employer.website,
            isVerified: user.employer.isVerified,
            district: user.employer.district,
            jobs: {
              total: jobs.length,
              pending: jobs.filter((job) => job.status === "PENDING_APPROVAL").length,
              active: jobs.filter((job) => job.status === "ACTIVE").length,
            },
          }
        : null,
    };
  }

  async exportMe(userId: string) {
    const me = await this.me(userId);
    const applications = await this.prisma.application.findMany({
      where: { driver: { userId } },
      include: { job: { select: { title: true, slug: true } }, history: true },
    });
    return { exportedAt: new Date().toISOString(), profile: me, applications };
  }

  async requestDeletion(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { deletionRequestedAt: new Date() },
    });
    return { ok: true };
  }

  private async ensureFresh(phone: string, email?: string) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ phone }, ...(email ? [{ email: email.toLowerCase() }] : [])] },
    });
    if (existing) throw new ConflictException("An account with this phone or email already exists");
  }

  private async issueOtp(phone: string, userId: string, purpose: string) {
    const code = String(randomInt(100000, 999999));
    await this.prisma.otpCode.updateMany({
      where: { phone, purpose, consumed: false },
      data: { consumed: true },
    });
    await this.prisma.otpCode.create({
      data: {
        phone,
        userId,
        purpose,
        codeHash: hashSecret(code),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });
    return this.config.get("OTP_DEV") === "true" ? code : undefined;
  }

  private async consumeOtp(phone: string, code: string, purpose: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    const otp = await this.prisma.otpCode.findFirst({
      where: { phone, purpose, consumed: false },
      orderBy: { createdAt: "desc" },
    });
    if (!user || !otp || otp.expiresAt < new Date() || otp.attempts >= 5) {
      throw new BadRequestException("Invalid or expired code");
    }
    if (!safeEqual(otp.codeHash, hashSecret(code))) {
      await this.prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
      throw new BadRequestException("Invalid or expired code");
    }
    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });
    return user;
  }

  private async tokens(user: { id: string; role: Role; phone: string }) {
    const accessToken = await this.jwt.signAsync({ sub: user.id, role: user.role, phone: user.phone });
    const refreshToken = randomBytes(32).toString("hex");
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashSecret(refreshToken),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    return { accessToken, refreshToken };
  }

  private publicUser(user: { id: string; name: string | null; phone: string; email: string | null; role: Role; phoneVerified: boolean; language: string }) {
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      phoneVerified: user.phoneVerified,
      language: user.language,
    };
  }
}

export type SessionUser = Prisma.UserGetPayload<{ select: { id: true } }>;
