import { Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { User } from '@prisma/client';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';

@UseGuards(JwtGuard) // we can also use it for particular route
@Controller('users')
export class UserController {
    @Get('me')
    getMe(@GetUser('') user: User, @GetUser('id') userId: number) {
        return { user };
    }

    @Patch('')
    editUser() {}
}
