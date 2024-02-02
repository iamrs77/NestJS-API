import { Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User, Bookmark } from '@prisma/client';
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('signup') // post request to /auth/aignup will come here
    signup() {
        return this.authService.signup();
    }

    @Post('signin')
    signin() {
        return this.authService.signin();
    }
}
