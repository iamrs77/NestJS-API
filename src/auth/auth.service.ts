import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(private prismaService: PrismaService) {}

    signup() {
        return 'User signed up';
    }

    signin() {
        return 'User signed in';
    }
}
