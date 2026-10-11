import { IsEmail, IsOptional, IsString } from 'class-validator';
import { NormalizeEmail, OptionalNotNull } from '../../common/dto-decorators';

// every field is optional, only the ones you send are changed
export class EditUserDto {
	/** @example 'new@example.com' */
	@NormalizeEmail()
	@IsEmail()
	@OptionalNotNull()
	email?: string;

	/** @example 'Rohit' */
	@IsString()
	@IsOptional()
	firstname?: string;

	/** @example 'Sharma' */
	@IsString()
	@IsOptional()
	lastname?: string;
}
