import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from './user.service';

describe('UserService', () => {
	let service: UserService;
	const prisma = {
		user: {
			update: jest.fn(),
		},
	};

	beforeEach(async () => {
		jest.resetAllMocks();

		const moduleRef = await Test.createTestingModule({
			providers: [
				UserService,
				{ provide: PrismaService, useValue: prisma },
			],
		}).compile();

		service = moduleRef.get(UserService);
	});

	it('returns the updated user without the password hash', async () => {
		prisma.user.update.mockResolvedValue({
			id: 1,
			email: 'alice@example.com',
			firstname: 'Alice',
			hash: 'secret-hash',
		});

		const user = await service.editUser(1, { firstname: 'Alice' });

		expect(prisma.user.update).toHaveBeenCalledWith({
			where: { id: 1 },
			data: { firstname: 'Alice' },
		});
		expect(user).toEqual({
			id: 1,
			email: 'alice@example.com',
			firstname: 'Alice',
		});
	});

	it('throws 409 when the new email belongs to someone else', async () => {
		prisma.user.update.mockRejectedValue(
			new PrismaClientKnownRequestError('Unique constraint failed', {
				code: 'P2002',
				clientVersion: 'test',
			}),
		);

		await expect(
			service.editUser(1, { email: 'bob@example.com' }),
		).rejects.toBeInstanceOf(ConflictException);
	});
});
