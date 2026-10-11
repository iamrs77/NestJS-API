import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { GetUser } from '../auth/decorator';
import { JwtGuard } from '../auth/guard';
import { EditUserDto } from './dto';
import { UserService } from './user.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtGuard) // we can also use it for particular route
@Controller('users')
export class UserController {
	constructor(private userService: UserService) {}

	/** Get the logged-in user */
	@Get('me')
	getMe(@GetUser() user: User) {
		return user;
	}

	/** Change your email, first name or last name */
	@Patch()
	editUser(@GetUser('id') userId: number, @Body() dto: EditUserDto) {
		return this.userService.editUser(userId, dto);
	}
}
