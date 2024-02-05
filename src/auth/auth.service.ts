import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) {}

    async signup(data: AuthDto) {
        // generate the password
        let hash = await argon.hash(data.password);
        // save to db
        const user = await this.prisma.user.create({
            data: {
                email: data.email,
                hash,
            },
        });

        delete user.hash;
        // return saved user
        return user;
    }

    signin() {
        return 'User signed in';
    }
}
