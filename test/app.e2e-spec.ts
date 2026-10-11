import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { setupApp } from '../src/setup-app';

// these tests run against a real database (see .env.test) and run in order:
// later tests use the tokens and ids saved by earlier ones
const PORT = 3333;

const alice = { email: 'alice@example.com', password: 'alice-password' };
const bob = { email: 'bob@example.com', password: 'bob-password' };

describe('Bookmarks API (e2e)', () => {
	let app: INestApplication;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleRef.createNestApplication();
		setupApp(app);
		await app.listen(PORT);

		// start every run with an empty database
		const prisma = app.get(PrismaService);
		await prisma.$transaction([
			prisma.bookmark.deleteMany(),
			prisma.user.deleteMany(),
		]);

		pactum.request.setBaseUrl(`http://localhost:${PORT}`);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('Auth', () => {
		describe('Signup', () => {
			it('fails without a body', () => {
				return pactum.spec().post('/auth/signup').expectStatus(400);
			});

			it('fails with an invalid email', () => {
				return pactum
					.spec()
					.post('/auth/signup')
					.withBody({
						email: 'not-an-email',
						password: alice.password,
					})
					.expectStatus(400);
			});

			it('fails with a password shorter than 8 characters', () => {
				return pactum
					.spec()
					.post('/auth/signup')
					.withBody({ email: alice.email, password: 'short' })
					.expectStatus(400);
			});

			it('creates an account and returns a token', () => {
				return pactum
					.spec()
					.post('/auth/signup')
					.withBody(alice)
					.expectStatus(201)
					.expectJsonSchema({
						type: 'object',
						required: ['access_token'],
						properties: { access_token: { type: 'string' } },
					});
			});

			it('creates a second account', () => {
				return pactum
					.spec()
					.post('/auth/signup')
					.withBody(bob)
					.expectStatus(201);
			});

			it('rejects an email that is already used, even in different case', () => {
				return pactum
					.spec()
					.post('/auth/signup')
					.withBody({
						email: ' ALICE@Example.com',
						password: 'another-password',
					})
					.expectStatus(409);
			});
		});

		describe('Signin', () => {
			it('fails without a body', () => {
				return pactum.spec().post('/auth/signin').expectStatus(400);
			});

			it('gives 401 for a wrong password', () => {
				return pactum
					.spec()
					.post('/auth/signin')
					.withBody({
						email: alice.email,
						password: 'wrong-password',
					})
					.expectStatus(401)
					.expectBodyContains('Credentials Incorrect');
			});

			it('gives the same 401 for an email that does not exist', () => {
				return pactum
					.spec()
					.post('/auth/signin')
					.withBody({
						email: 'nobody@example.com',
						password: 'whatever',
					})
					.expectStatus(401)
					.expectBodyContains('Credentials Incorrect');
			});

			it('logs in', () => {
				return pactum
					.spec()
					.post('/auth/signin')
					.withBody(alice)
					.expectStatus(200)
					.stores('aliceToken', 'access_token');
			});

			it('logs in the second user', () => {
				return pactum
					.spec()
					.post('/auth/signin')
					.withBody(bob)
					.expectStatus(200)
					.stores('bobToken', 'access_token');
			});
		});
	});

	describe('Users', () => {
		describe('Get me', () => {
			it('gives 401 without a token', () => {
				return pactum.spec().get('/users/me').expectStatus(401);
			});

			it('gives 401 with a bad token', () => {
				return pactum
					.spec()
					.get('/users/me')
					.withBearerToken('not-a-real-token')
					.expectStatus(401);
			});

			it('returns the logged-in user without the password hash', () => {
				return pactum
					.spec()
					.get('/users/me')
					.withBearerToken('$S{aliceToken}')
					.expectStatus(200)
					.expectJsonLike({ email: alice.email })
					.expect((ctx) => {
						expect(ctx.res.json).not.toHaveProperty('hash');
					})
					.stores('aliceId', 'id');
			});
		});

		describe('Edit user', () => {
			it('updates the name and email', () => {
				return pactum
					.spec()
					.patch('/users')
					.withBearerToken('$S{aliceToken}')
					.withBody({
						firstname: 'Alice',
						email: 'Alice.New@Example.com',
					})
					.expectStatus(200)
					.expectJsonLike({
						firstname: 'Alice',
						email: 'alice.new@example.com',
					})
					.expect((ctx) => {
						expect(ctx.res.json).not.toHaveProperty('hash');
					});
			});

			it('ignores fields you are not allowed to change', () => {
				return pactum
					.spec()
					.patch('/users')
					.withBearerToken('$S{aliceToken}')
					.withBody({ id: 999, hash: 'not-a-real-hash' })
					.expectStatus(200)
					.expectJsonLike({ id: '$S{aliceId}' });
			});

			it('still logs in with the new email and the old password', () => {
				return pactum
					.spec()
					.post('/auth/signin')
					.withBody({
						email: 'alice.new@example.com',
						password: alice.password,
					})
					.expectStatus(200);
			});

			it('rejects an email that belongs to another user', () => {
				return pactum
					.spec()
					.patch('/users')
					.withBearerToken('$S{aliceToken}')
					.withBody({ email: bob.email })
					.expectStatus(409);
			});

			it('rejects an invalid or empty email', async () => {
				await pactum
					.spec()
					.patch('/users')
					.withBearerToken('$S{aliceToken}')
					.withBody({ email: 'not-an-email' })
					.expectStatus(400);
				await pactum
					.spec()
					.patch('/users')
					.withBearerToken('$S{aliceToken}')
					.withBody({ email: null })
					.expectStatus(400);
			});
		});
	});

	describe('Bookmarks', () => {
		const bookmark = {
			title: 'NestJS docs',
			description: 'Official documentation',
			link: 'https://docs.nestjs.com',
		};

		it('gives 401 without a token', () => {
			return pactum.spec().get('/bookmarks').expectStatus(401);
		});

		it('starts with an empty list', () => {
			return pactum
				.spec()
				.get('/bookmarks')
				.withBearerToken('$S{aliceToken}')
				.expectStatus(200)
				.expectJsonLength(0);
		});

		it('rejects a bookmark without a title', () => {
			return pactum
				.spec()
				.post('/bookmarks')
				.withBearerToken('$S{aliceToken}')
				.withBody({ link: bookmark.link })
				.expectStatus(400);
		});

		it('rejects a link that is not a URL', () => {
			return pactum
				.spec()
				.post('/bookmarks')
				.withBearerToken('$S{aliceToken}')
				.withBody({ ...bookmark, link: 'not a link' })
				.expectStatus(400);
		});

		it('creates a bookmark', () => {
			return pactum
				.spec()
				.post('/bookmarks')
				.withBearerToken('$S{aliceToken}')
				.withBody(bookmark)
				.expectStatus(201)
				.expectJsonLike({ ...bookmark, userId: '$S{aliceId}' })
				.stores('bookmarkId', 'id');
		});

		it('lists the new bookmark', () => {
			return pactum
				.spec()
				.get('/bookmarks')
				.withBearerToken('$S{aliceToken}')
				.expectStatus(200)
				.expectJsonLength(1);
		});

		it('gets the bookmark by id', () => {
			return pactum
				.spec()
				.get('/bookmarks/{id}')
				.withPathParams('id', '$S{bookmarkId}')
				.withBearerToken('$S{aliceToken}')
				.expectStatus(200)
				.expectJsonLike({ id: '$S{bookmarkId}', ...bookmark });
		});

		it('gives 400 for an id that is not a number', () => {
			return pactum
				.spec()
				.get('/bookmarks/abc')
				.withBearerToken('$S{aliceToken}')
				.expectStatus(400);
		});

		it('gives 404 for an id that does not exist', () => {
			return pactum
				.spec()
				.get('/bookmarks/999999')
				.withBearerToken('$S{aliceToken}')
				.expectStatus(404);
		});

		it('edits the bookmark', () => {
			return pactum
				.spec()
				.patch('/bookmarks/{id}')
				.withPathParams('id', '$S{bookmarkId}')
				.withBearerToken('$S{aliceToken}')
				.withBody({ title: 'NestJS documentation' })
				.expectStatus(200)
				.expectJsonLike({
					title: 'NestJS documentation',
					link: bookmark.link,
				});
		});

		it('does not allow the title to be set to null', () => {
			return pactum
				.spec()
				.patch('/bookmarks/{id}')
				.withPathParams('id', '$S{bookmarkId}')
				.withBearerToken('$S{aliceToken}')
				.withBody({ title: null })
				.expectStatus(400);
		});

		describe("another user can't touch it", () => {
			it('is not in their list', () => {
				return pactum
					.spec()
					.get('/bookmarks')
					.withBearerToken('$S{bobToken}')
					.expectStatus(200)
					.expectJsonLength(0);
			});

			it('cannot get it', () => {
				return pactum
					.spec()
					.get('/bookmarks/{id}')
					.withPathParams('id', '$S{bookmarkId}')
					.withBearerToken('$S{bobToken}')
					.expectStatus(404);
			});

			it('cannot edit it', () => {
				return pactum
					.spec()
					.patch('/bookmarks/{id}')
					.withPathParams('id', '$S{bookmarkId}')
					.withBearerToken('$S{bobToken}')
					.withBody({ title: 'taken over' })
					.expectStatus(404);
			});

			it('cannot delete it', () => {
				return pactum
					.spec()
					.delete('/bookmarks/{id}')
					.withPathParams('id', '$S{bookmarkId}')
					.withBearerToken('$S{bobToken}')
					.expectStatus(404);
			});

			// proves the 404s above came from the ownership check,
			// not from the bookmark being gone
			it('is still there, unchanged, for the owner', () => {
				return pactum
					.spec()
					.get('/bookmarks/{id}')
					.withPathParams('id', '$S{bookmarkId}')
					.withBearerToken('$S{aliceToken}')
					.expectStatus(200)
					.expectJsonLike({ title: 'NestJS documentation' });
			});
		});

		it('deletes the bookmark', () => {
			return pactum
				.spec()
				.delete('/bookmarks/{id}')
				.withPathParams('id', '$S{bookmarkId}')
				.withBearerToken('$S{aliceToken}')
				.expectStatus(204);
		});

		it('is gone after delete', async () => {
			await pactum
				.spec()
				.get('/bookmarks/{id}')
				.withPathParams('id', '$S{bookmarkId}')
				.withBearerToken('$S{aliceToken}')
				.expectStatus(404);
			await pactum
				.spec()
				.get('/bookmarks')
				.withBearerToken('$S{aliceToken}')
				.expectStatus(200)
				.expectJsonLength(0);
		});
	});

	describe('Docs', () => {
		it('serves the Swagger docs', () => {
			return pactum
				.spec()
				.get('/docs-json')
				.expectStatus(200)
				.expectJsonLike({ info: { title: 'Bookmarks API' } });
		});
	});
});
