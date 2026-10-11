const REQUIRED_VARIABLES = ['DATABASE_URL', 'JWT_SECRET'];

// fail at startup with a clear message instead of a confusing error on the first request
export function validateEnv(config: Record<string, unknown>) {
	const missing = REQUIRED_VARIABLES.filter((key) => !config[key]);
	if (missing.length > 0) {
		throw new Error(
			`Missing environment variables: ${missing.join(', ')}. ` +
				'Copy .env.example to .env to get started.',
		);
	}
	return config;
}
