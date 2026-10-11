import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';

@Injectable()
export class BookmarkService {
	constructor(private prisma: PrismaService) {}

	getBookmarks(userId: number) {
		return this.prisma.bookmark.findMany({
			where: {
				userId,
			},
			orderBy: {
				id: 'asc',
			},
		});
	}

	async getBookmarkById(userId: number, bookmarkId: number) {
		const bookmark = await this.prisma.bookmark.findFirst({
			where: {
				id: bookmarkId,
				userId,
			},
		});

		// same 404 when it doesn't exist and when it belongs to someone else,
		// so nobody can find out which ids exist
		if (!bookmark) {
			throw new NotFoundException('Bookmark not found');
		}
		return bookmark;
	}

	createBookmark(userId: number, dto: CreateBookmarkDto) {
		return this.prisma.bookmark.create({
			data: {
				userId,
				...dto,
			},
		});
	}

	async editBookmarkById(
		userId: number,
		bookmarkId: number,
		dto: EditBookmarkDto,
	) {
		// throws 404 if the user doesn't own it
		await this.getBookmarkById(userId, bookmarkId);

		return this.prisma.bookmark.update({
			where: {
				id: bookmarkId,
			},
			data: {
				...dto,
			},
		});
	}

	async deleteBookmarkById(userId: number, bookmarkId: number) {
		// throws 404 if the user doesn't own it
		await this.getBookmarkById(userId, bookmarkId);

		await this.prisma.bookmark.delete({
			where: {
				id: bookmarkId,
			},
		});
	}
}
