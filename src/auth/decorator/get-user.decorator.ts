import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import { User } from '@prisma/client';

// @GetUser() gives the whole logged-in user, @GetUser('id') gives one field
export const GetUser = createParamDecorator(
	(data: keyof User | undefined, ctx: ExecutionContext) => {
		const request: Express.Request = ctx.switchToHttp().getRequest();
		if (data) {
			return request.user[data];
		}
		return request.user;
	},
);
