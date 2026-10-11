import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// used by main.ts and by the e2e tests, so both run the app the same way
export function setupApp(app: INestApplication) {
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true, // it will remove fields from request that are not in DTO
			transform: true, // controllers get a real DTO instance
		}),
	);

	// API docs at /docs, raw OpenAPI JSON at /docs-json
	const swaggerConfig = new DocumentBuilder()
		.setTitle('Bookmarks API')
		.setDescription(
			'Sign up, log in and manage your own bookmarks. ' +
				'Call /auth/signin, then click "Authorize" and paste the access_token.',
		)
		.setVersion('1.0')
		.addBearerAuth()
		.build();
	const document = SwaggerModule.createDocument(app, swaggerConfig);
	SwaggerModule.setup('docs', app, document, {
		swaggerOptions: { persistAuthorization: true },
	});
}
