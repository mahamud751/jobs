import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { Role } from "../generated/prisma/client";
import { createParamDecorator } from "@nestjs/common";
import { isObservable, lastValueFrom } from "rxjs";
import { PrismaService } from "../prisma/prisma.service";

export const ROLES_KEY = "roles";
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const FULL_ADMIN: Role[] = [Role.SUPER_ADMIN, Role.ADMIN];
export const STAFF: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.CONTENT_MANAGER, Role.SUPPORT];

export type AuthUser = {
  id: string;
  role: Role;
  phone: string;
  email: string | null;
  name: string | null;
  phoneVerified: boolean;
};

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest().user;
});

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const result = super.canActivate(context);
    const ok = isObservable(result) ? await lastValueFrom(result) : await result;
    if (!ok) return false;
    const req = context.switchToHttp().getRequest();
    const user = await this.prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !user.isActive || user.isBlocked) {
      throw new UnauthorizedException("Account is not active");
    }
    req.user = {
      id: user.id,
      role: user.role,
      phone: user.phone,
      email: user.email,
      name: user.name,
      phoneVerified: user.phoneVerified,
    } satisfies AuthUser;
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const user = context.switchToHttp().getRequest().user as AuthUser | undefined;
    return !!user && roles.includes(user.role);
  }
}
