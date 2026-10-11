import { Transform } from 'class-transformer';
import { ValidateIf } from 'class-validator';

// "Me@Example.com " and "me@example.com" should be the same account
export const NormalizeEmail = () =>
	Transform(({ value }) =>
		typeof value === 'string' ? value.trim().toLowerCase() : value,
	);

// like @IsOptional(), but null is still validated (and rejected).
// use it for fields whose database column can't be null.
export const OptionalNotNull = () =>
	ValidateIf((_object, value) => value !== undefined);
