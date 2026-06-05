import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { randomUUID } from "node:crypto";
import { AppModule } from "./app.module";
import { loadConfig } from "./shared/config/app.config";

async function bootstrap() {
  const config = loadConfig();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.use((req: any, res: any, next: () => void) => {
    const requestId = req.headers["x-request-id"] ?? randomUUID();
    const correlationId = req.headers["x-correlation-id"] ?? requestId;
    req.requestId = requestId;
    req.correlationId = correlationId;
    res.setHeader("x-request-id", requestId);
    res.setHeader("x-correlation-id", correlationId);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  await app.listen(config.port);
}

void bootstrap();
