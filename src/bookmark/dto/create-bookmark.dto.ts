import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateBookmarkDto {
	/** @example 'NestJS docs' */
	@IsString()
	@IsNotEmpty()
	title: string;

	/** @example 'Official documentation' */
	@IsString()
	@IsOptional()
	description?: string;

	/** @example 'https://docs.nestjs.com' */
	@IsUrl({ require_protocol: true })
	link: string;
}
