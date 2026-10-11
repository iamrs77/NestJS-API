import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { NormalizeEmail } from '../../common/dto-decorators';

// used for sign in
export class AuthDto {
	/** @example 'me@example.com' */
	@NormalizeEmail()
	@IsEmail()
	@IsNotEmpty()
	email: string;

	/** @example 'secret123' */
	@IsString()
	@IsNotEmpty()
	password: string;
}

// sign up has the same fields, but new passwords must be at least 8 characters.
// sign in doesn't check the length, a wrong password should just fail with 401.
export class SignupDto extends AuthDto {
	/** @example 'secret123' */
	@MinLength(8)
	password: string;
}
