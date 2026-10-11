import {
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private config: ConfigService,
    ) {}

    async signup(data: AuthDto) {
        // generate the password
        let hash = await argon.hash(data.password);
        // save to db
        try {
            const user = await this.prisma.user.create({
                data: {
                    email: data.email,
                    hash,
                },
            });

            // return token for saved user
            let token = await this.signToken(user.id, user.email);
            return { access_token: token };
        } catch (error) {
            if (error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    // prisma defined codes, P2002 = unique constraint failed
                    throw new ConflictException('Credentials Taken');
                }
            }
            // anything else (db down etc.) should surface as a 500, not an empty 201
            throw error;
        }
    }

    async signin(data: AuthDto) {
        // find the user by email
        const user = await this.prisma.user.findUnique({
            where: {
                email: data.email,
            },
        });
        // user does not exist throw exception
        // same message as wrong password so callers can't tell which emails are registered
        if (!user) {
            throw new UnauthorizedException('Credentials Incorrect');
        }

        // compare password
        const pwmatch = await argon.verify(user.hash, data.password);
        // if pass no match throw exception
        if (!pwmatch) {
            throw new UnauthorizedException('Credentials Incorrect');
        }

        // send data
        let token = await this.signToken(user.id, user.email);
        return { access_token: token };
    }

    async signToken(userId: number, email: string): Promise<string> {
        const payload = {
            sub: userId,
            email,
        };

        return this.jwt.signAsync(payload, {
            expiresIn: '15m',
            secret: this.config.get('JWT_SECRET'),
        });
    }
}
