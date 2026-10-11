import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthDto, SignupDto } from './dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	/** Create an account and get a login token */
	@Post('signup') // post request to /auth/signup will come here
	signup(@Body() data: SignupDto) {
		return this.authService.signup(data);
	}

	/** Log in and get a token (valid for 15 minutes) */
	@HttpCode(HttpStatus.OK) // it will return 200 rather than (default) 201 status
	@Post('signin')
	signin(@Body() data: AuthDto) {
		return this.authService.signin(data);
	}
}
