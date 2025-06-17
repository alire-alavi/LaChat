import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import { WinstonLogger } from './logger/winston.logger';
import { AppModule } from './app.module';
import { AppConfig } from './config/app-config.schema';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: WinstonModule.createLogger({
            instance: WinstonLogger,
        }),
    });

    // Valiation Pipe
    app.useGlobalPipes(new ValidationPipe()); // <-- Add this line

    // OpenAPI Documents
    const swaggerConfig = new DocumentBuilder()
        .setTitle('Chat authentication and user API')
        .setDescription("APIs for receieving and returning the user ' credentials")
        .setVersion('0.0.1')
        .build();
    const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, documentFactory);

    const configService = app.get(ConfigService<AppConfig>);

    // DONOT use this in Production
    // Instead handle specific origins
    app.enableCors();

    const port = configService.get<number>('APP_PORT', 3000);
    await app.listen(port);
}
bootstrap();
