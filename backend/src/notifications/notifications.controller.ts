import { Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser, JwtAuthGuard, type AuthUser } from "../common/auth";
import { NotificationsService } from "./notifications.service";

@ApiTags("Notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query("page") page?: string, @Query("pageSize") pageSize?: string) {
    return this.notifications.list(user.id, Number(page) || 1, Number(pageSize) || 20);
  }

  @Patch(":id/read")
  read(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.notifications.markRead(user.id, id);
  }

  @Post("read-all")
  readAll(@CurrentUser() user: AuthUser) {
    return this.notifications.markAll(user.id);
  }
}
