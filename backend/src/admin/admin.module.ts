import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { ComplaintsModule } from "../complaints/complaints.module";
import { ContentModule } from "../content/content.module";
import { JobsModule } from "../jobs/jobs.module";
import { LocationsModule } from "../locations/locations.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [JobsModule, LocationsModule, ComplaintsModule, ContentModule, NotificationsModule, AuditModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
