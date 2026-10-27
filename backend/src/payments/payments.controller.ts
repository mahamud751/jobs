import { Controller, Get, NotImplementedException, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/auth";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("Payments")
@Controller()
export class PaymentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("plans")
  @ApiOperation({ summary: "Free plan is active. Paid plans are stored for a later gateway launch." })
  plans() {
    return this.prisma.plan.findMany({ orderBy: { priceBdt: "asc" } });
  }

  @Post("payments/checkout")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Reserved for bKash, Nagad, or SSLCommerz. Not billed in this version." })
  checkout() {
    throw new NotImplementedException(
      "Payment gateway is not enabled. bKash, Nagad, or SSLCommerz is a separate third-party cost.",
    );
  }
}
