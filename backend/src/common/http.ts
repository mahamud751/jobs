import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { MulterError } from "multer";
import { createHash, timingSafeEqual } from "crypto";

export function pageOf(page?: number, pageSize?: number) {
  const safePage = Math.max(1, page || 1);
  const safeSize = Math.min(50, Math.max(1, pageSize || 12));
  return { page: safePage, pageSize: safeSize, skip: (safePage - 1) * safeSize };
}

export function paged<T>(data: T[], total: number, page: number, pageSize: number) {
  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export function asDhakaDeadline(value?: string | null) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(`${value}T23:59:59+06:00`);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function hashSecret(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function assertSalary(min?: number | null, max?: number | null) {
  if (min != null && max != null && min > max) {
    throw new HttpException("Minimum salary cannot exceed maximum salary", HttpStatus.BAD_REQUEST);
  }
}

export function clientIp(req: { ip?: string; headers: Record<string, string | string[] | undefined> }) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length) return forwarded.split(",")[0].trim();
  return req.ip;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    if (exception instanceof MulterError) {
      response.status(400).json({ statusCode: 400, message: exception.message });
      return;
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const raw = typeof body === "string" ? body : (body as { message?: string | string[] }).message;
      const message = Array.isArray(raw) ? raw.join(", ") : raw || "Request failed";
      response.status(status).json({
        statusCode: status,
        message,
        error: typeof body === "object" ? (body as { error?: string }).error : undefined,
      });
      return;
    }
    console.error(exception);
    response.status(500).json({ statusCode: 500, message: "Internal server error" });
  }
}
