import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { setupApp } from './setup-app';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	setupApp(app);

	const config = app.get(ConfigService);
	await app.listen(config.get('PORT') ?? 3000);
}
bootstrap();
