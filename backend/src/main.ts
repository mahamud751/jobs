import "dotenv/config";
import { mkdirSync } from "fs";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { join } from "path";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/http";

async function bootstrap() {
  mkdirSync("uploads/public", { recursive: true });
  mkdirSync("uploads/private", { recursive: true });
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix("api");
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.enableCors({
    origin: [process.env.WEB_ORIGIN || "http://localhost:3010", process.env.ADMIN_ORIGIN || "http://localhost:3001"],
    credentials: true,
  });
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useStaticAssets(join(process.cwd(), "uploads", "public"), { prefix: "/uploads/" });
  const config = new DocumentBuilder()
    .setTitle("Chalok API")
    .setDescription(`Bangladesh driver hiring and job platform.

Roles: DRIVER, EMPLOYER, SUPPORT, CONTENT_MANAGER, ADMIN, SUPER_ADMIN.

Public driver profiles never include phone, license number, NID, or street address.
A driver shares a phone number for a job by applying. A phone from search is shared only after the driver accepts a contact request.

License and NID files are downloaded only by the owner or an admin.

Paid plans are stored but checkout returns 501 until bKash, Nagad, or SSLCommerz is connected.
SMS is logged as skipped until a provider such as an SMS gateway is configured.`)
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("Auth", "Registration, login, OTP, and the current user")
    .addTag("Drivers", "Public search and private profile management")
    .addTag("Employers", "Employer profile and owned jobs")
    .addTag("Jobs", "Job search and employer posting")
    .addTag("Applications", "Apply and review hiring status")
    .addTag("Locations", "Divisions, districts, upazilas, and thanas")
    .addTag("Notifications", "In-app notices. Email is logged. SMS waits for a provider.")
    .addTag("Complaints", "Report a fake job, fraud, or profile")
    .addTag("Contact", "Consent before a searched driver's phone is shared")
    .addTag("Content", "About, privacy, terms, help, and the contact form")
    .addTag("Admin", "Verification, approvals, areas, complaints, audit, and plans")
    .addTag("Documents", "Private license and identity files")
    .addTag("Payments", "Future paid job posts and subscriptions")
    .addTag("Privacy", "Export and deletion requests")
    .addTag("Public", "Health and homepage payload")
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));
  await app.listen(process.env.PORT || 4000);
}

bootstrap();
