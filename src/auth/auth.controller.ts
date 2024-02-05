import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    // @Post('signup') // post request to /auth/aignup will come here
    // signup(@Req() req: Request) {
    //     console.log(req.body);
    //     return this.authService.signup();
    // }

    @Post('signup') // post request to /auth/aignup will come here
    signup(@Body() data: AuthDto) {
        return this.authService.signup(data);
    }

    @Post('signin')
    signin() {
        return this.authService.signin();
    }
}
