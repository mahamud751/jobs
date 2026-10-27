import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DriversModule } from "../drivers/drivers.module";
import { JobsModule } from "../jobs/jobs.module";
import { LocationsModule } from "../locations/locations.module";
import { PrivacyController, PublicController } from "./public.controller";

@Module({
  imports: [AuthModule, DriversModule, JobsModule, LocationsModule],
  controllers: [PublicController, PrivacyController],
})
export class PublicModule {}
