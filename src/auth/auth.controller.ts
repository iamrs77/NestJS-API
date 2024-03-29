import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('signup') // post request to /auth/aignup will come here
    signup(@Body() data: AuthDto) {
        return this.authService.signup(data);
    }

    @HttpCode(HttpStatus.OK) // it will return 200 rather than (default) 201 status
    @Post('signin')
    signin(@Body() data: AuthDto) {
        return this.authService.signin(data);
    }
}
