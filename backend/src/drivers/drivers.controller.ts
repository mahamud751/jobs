import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { DocumentKind, Role } from "../generated/prisma/client";
import { randomBytes } from "crypto";
import { diskStorage } from "multer";
import { extname } from "path";
import { CurrentUser, JwtAuthGuard, Roles, RolesGuard, type AuthUser } from "../common/auth";
import { DriversService } from "./drivers.service";
import { ActivationDto, ExperienceDto, ReferenceDto, SearchDriversDto, UpdateDriverDto } from "./dto";

function storedName(_req: unknown, file: Express.Multer.File, cb: (error: Error | null, name: string) => void) {
  cb(null, `${Date.now()}-${randomBytes(4).toString("hex")}${extname(file.originalname).toLowerCase()}`);
}

@ApiTags("Drivers")
@Controller("drivers")
export class DriversController {
  constructor(private readonly drivers: DriversService) {}

  @Get()
  @ApiOperation({ summary: "Search public driver profiles. Phone, license number, and address are hidden." })
  search(@Query() query: SearchDriversDto) {
    return this.drivers.search(query);
  }

  @Get("me")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DRIVER)
  me(@CurrentUser() user: AuthUser) {
    return this.drivers.mine(user.id);
  }

  @Patch("me")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DRIVER)
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateDriverDto) {
    return this.drivers.update(user.id, dto);
  }

  @Post("me/photo")
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @ApiBody({ schema: { type: "object", properties: { photo: { type: "string", format: "binary" } } } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DRIVER)
  @UseInterceptors(FileInterceptor("photo", {
    storage: diskStorage({ destination: "uploads/public", filename: storedName }),
    limits: { fileSize: 2 * 1024 * 1024 },
  }))
  photo(@CurrentUser() user: AuthUser, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException("Photo is required");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      throw new BadRequestException("Photo must be jpg, png, or webp");
    }
    return this.drivers.setPhoto(user.id, `/uploads/${file.filename}`);
  }

  @Post("me/documents")
  @ApiBearerAuth()
  @ApiConsumes("multipart/form-data")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DRIVER)
  @UseInterceptors(FileInterceptor("file", {
    storage: diskStorage({ destination: "uploads/private", filename: storedName }),
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  document(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Body("kind") kind: DocumentKind,
  ) {
    if (!file) throw new BadRequestException("File is required");
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.mimetype)) throw new BadRequestException("File must be an image or PDF");
    return this.drivers.addDocument(user.id, file, kind);
  }

  @Post("me/experiences")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DRIVER)
  addExperience(@CurrentUser() user: AuthUser, @Body() dto: ExperienceDto) {
    return this.drivers.addExperience(user.id, dto);
  }

  @Delete("me/experiences/:id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DRIVER)
  removeExperience(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.drivers.removeExperience(user.id, id);
  }

  @Post("me/references")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DRIVER)
  addReference(@CurrentUser() user: AuthUser, @Body() dto: ReferenceDto) {
    return this.drivers.addReference(user.id, dto);
  }

  @Delete("me/references/:id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DRIVER)
  removeReference(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.drivers.removeReference(user.id, id);
  }

  @Post("me/activation")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DRIVER)
  activation(@CurrentUser() user: AuthUser, @Body() dto: ActivationDto) {
    return this.drivers.activation(user.id, dto.active);
  }

  @Get(":id")
  @ApiOperation({ summary: "Public driver profile" })
  one(@Param("id") id: string) {
    return this.drivers.publicOne(id);
  }
}
