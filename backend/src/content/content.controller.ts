import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { Throttle } from "@nestjs/throttler";
import { ContentService } from "./content.service";

class ContactDto {
  @ApiProperty() @IsString() @MaxLength(80) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(20) phone?: string;
  @ApiProperty() @IsString() @MaxLength(120) subject!: string;
  @ApiProperty() @IsString() @MinLength(10) @MaxLength(2000) message!: string;
  @ApiPropertyOptional({ description: "Leave empty. Honeypot for spam." })
  @IsOptional() @IsString() website?: string;
}

@ApiTags("Content")
@Controller()
export class ContentController {
  constructor(private readonly content: ContentService) {}

  @Get("content/:slug")
  page(@Param("slug") slug: string) {
    return this.content.page(slug);
  }

  @Post("contact")
  @Throttle({ default: { limit: 6, ttl: 60000 } })
  contact(@Body() dto: ContactDto) {
    return this.content.createMessage(dto);
  }
}
