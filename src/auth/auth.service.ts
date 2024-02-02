import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
    signup() {
        return 'User signed up';
    }

    signin() {
        return 'User signed in';
    }
}
