import { ValidationPipe } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_PIPE } from "@nestjs/core";
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AdminModule } from "./admin/admin.module";
import { ApplicationsModule } from "./applications/applications.module";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { ComplaintsModule } from "./complaints/complaints.module";
import { ContactRequestsModule } from "./contact-requests/contact-requests.module";
import { ContentModule } from "./content/content.module";
import { DocumentsModule } from "./documents/documents.module";
import { DriversModule } from "./drivers/drivers.module";
import { EmployersModule } from "./employers/employers.module";
import { JobsModule } from "./jobs/jobs.module";
import { LocationsModule } from "./locations/locations.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PaymentsModule } from "./payments/payments.module";
import { PrismaModule } from "./prisma/prisma.module";
import { PublicModule } from "./public/public.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuditModule,
    NotificationsModule,
    LocationsModule,
    AuthModule,
    DriversModule,
    EmployersModule,
    JobsModule,
    ApplicationsModule,
    ContactRequestsModule,
    ComplaintsModule,
    ContentModule,
    DocumentsModule,
    PaymentsModule,
    AdminModule,
    PublicModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    },
  ],
})
export class AppModule {}
