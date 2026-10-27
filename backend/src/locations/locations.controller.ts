import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { LocationsService } from "./locations.service";

@ApiTags("Locations")
@Controller("locations")
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Get("tree")
  @ApiOperation({ summary: "Divisions, districts, and upazilas or thanas" })
  tree(@Query("activeOnly") activeOnly?: string) {
    return this.locations.tree(activeOnly === "true");
  }

  @Get("coverage")
  @ApiOperation({ summary: "Which divisions currently have live service" })
  coverage() {
    return this.locations.coverage();
  }
}
