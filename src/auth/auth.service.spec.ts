import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as argon from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

const SECRET = 'unit-test-secret';

describe('AuthService', () => {
	let service: AuthService;
	let jwt: JwtService;
	const prisma = {
		user: {
			create: jest.fn(),
			findUnique: jest.fn(),
		},
	};

	beforeEach(async () => {
		jest.resetAllMocks();

		const moduleRef = await Test.createTestingModule({
			imports: [JwtModule.register({})],
			providers: [
				AuthService,
				{ provide: PrismaService, useValue: prisma },
				{ provide: ConfigService, useValue: { get: () => SECRET } },
			],
		}).compile();

		service = moduleRef.get(AuthService);
		jwt = moduleRef.get(JwtService);
	});

	describe('signup', () => {
		const dto = { email: 'alice@example.com', password: 'secret123' };

		it('saves a hash instead of the password and returns a token', async () => {
			prisma.user.create.mockImplementation(({ data }) =>
				Promise.resolve({ id: 7, ...data }),
			);

			const result = await service.signup(dto);

			const { hash } = prisma.user.create.mock.calls[0][0].data;
			expect(hash).not.toBe(dto.password);
			expect(await argon.verify(hash, dto.password)).toBe(true);

			const payload = await jwt.verifyAsync(result.access_token, {
				secret: SECRET,
			});
			expect(payload).toMatchObject({ sub: 7, email: dto.email });
		});

		it('throws 409 when the email is already used', async () => {
			prisma.user.create.mockRejectedValue(
				new PrismaClientKnownRequestError('Unique constraint failed', {
					code: 'P2002',
					clientVersion: 'test',
				}),
			);

			await expect(service.signup(dto)).rejects.toBeInstanceOf(
				ConflictException,
			);
		});

		it('passes other errors on instead of hiding them', async () => {
			const dbDown = new Error('database is down');
			prisma.user.create.mockRejectedValue(dbDown);

			await expect(service.signup(dto)).rejects.toBe(dbDown);
		});
	});

	describe('signin', () => {
		it('returns a token when the password is right', async () => {
			prisma.user.findUnique.mockResolvedValue({
				id: 3,
				email: 'alice@example.com',
				hash: await argon.hash('secret123'),
			});

			const result = await service.signin({
				email: 'alice@example.com',
				password: 'secret123',
			});

			const payload = await jwt.verifyAsync(result.access_token, {
				secret: SECRET,
			});
			expect(payload.sub).toBe(3);
		});

		it('gives the same 401 for an unknown email and a wrong password', async () => {
			prisma.user.findUnique.mockResolvedValue(null);
			const unknownEmail = await service
				.signin({ email: 'nobody@example.com', password: 'secret123' })
				.catch((error) => error);

			prisma.user.findUnique.mockResolvedValue({
				id: 3,
				email: 'alice@example.com',
				hash: await argon.hash('secret123'),
			});
			const wrongPassword = await service
				.signin({ email: 'alice@example.com', password: 'wrong' })
				.catch((error) => error);

			expect(unknownEmail).toBeInstanceOf(UnauthorizedException);
			expect(wrongPassword).toBeInstanceOf(UnauthorizedException);
			expect(wrongPassword.message).toBe(unknownEmail.message);
		});
	});
});
