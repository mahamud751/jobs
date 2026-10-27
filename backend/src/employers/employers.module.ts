import { Module } from "@nestjs/common";
import { JobsModule } from "../jobs/jobs.module";
import { LocationsModule } from "../locations/locations.module";
import { EmployersController } from "./employers.controller";
import { EmployersService } from "./employers.service";

@Module({
  imports: [LocationsModule, JobsModule],
  controllers: [EmployersController],
  providers: [EmployersService],
})
export class EmployersModule {}
