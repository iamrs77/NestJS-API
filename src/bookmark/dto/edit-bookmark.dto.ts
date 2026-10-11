import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { OptionalNotNull } from '../../common/dto-decorators';

// every field is optional, only the ones you send are changed
export class EditBookmarkDto {
	/** @example 'NestJS documentation' */
	@IsString()
	@IsNotEmpty()
	@OptionalNotNull()
	title?: string;

	/** @example 'Guides and API reference' */
	@IsString()
	@IsOptional()
	description?: string;

	/** @example 'https://docs.nestjs.com' */
	@IsUrl({ require_protocol: true })
	@OptionalNotNull()
	link?: string;
}
