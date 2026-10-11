import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { BookmarkService } from './bookmark.service';

describe('BookmarkService', () => {
	let service: BookmarkService;
	const prisma = {
		bookmark: {
			findFirst: jest.fn(),
			update: jest.fn(),
			delete: jest.fn(),
		},
	};

	beforeEach(async () => {
		jest.resetAllMocks();

		const moduleRef = await Test.createTestingModule({
			providers: [
				BookmarkService,
				{ provide: PrismaService, useValue: prisma },
			],
		}).compile();

		service = moduleRef.get(BookmarkService);
	});

	it('only looks for bookmarks that belong to the user', async () => {
		prisma.bookmark.findFirst.mockResolvedValue({ id: 1, userId: 5 });

		await service.getBookmarkById(5, 1);

		expect(prisma.bookmark.findFirst).toHaveBeenCalledWith({
			where: { id: 1, userId: 5 },
		});
	});

	it('throws 404 when the bookmark is missing or not yours', async () => {
		prisma.bookmark.findFirst.mockResolvedValue(null);

		await expect(service.getBookmarkById(5, 1)).rejects.toBeInstanceOf(
			NotFoundException,
		);
	});

	it('does not edit a bookmark that is not yours', async () => {
		prisma.bookmark.findFirst.mockResolvedValue(null);

		await expect(
			service.editBookmarkById(5, 1, { title: 'new title' }),
		).rejects.toBeInstanceOf(NotFoundException);
		expect(prisma.bookmark.update).not.toHaveBeenCalled();
	});

	it('does not delete a bookmark that is not yours', async () => {
		prisma.bookmark.findFirst.mockResolvedValue(null);

		await expect(service.deleteBookmarkById(5, 1)).rejects.toBeInstanceOf(
			NotFoundException,
		);
		expect(prisma.bookmark.delete).not.toHaveBeenCalled();
	});
});
