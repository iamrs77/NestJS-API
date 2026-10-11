import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorator';
import { JwtGuard } from '../auth/guard';
import { BookmarkService } from './bookmark.service';
import { CreateBookmarkDto, EditBookmarkDto } from './dto';

@ApiTags('bookmarks')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('bookmarks')
export class BookmarkController {
	constructor(private bookmarkService: BookmarkService) {}

	/** List your bookmarks */
	@Get()
	getBookmarks(@GetUser('id') userId: number) {
		return this.bookmarkService.getBookmarks(userId);
	}

	/** Get one of your bookmarks */
	@Get(':id')
	getBookmarkById(
		@GetUser('id') userId: number,
		@Param('id', ParseIntPipe) bookmarkId: number,
	) {
		return this.bookmarkService.getBookmarkById(userId, bookmarkId);
	}

	/** Save a new bookmark */
	@Post()
	createBookmark(
		@GetUser('id') userId: number,
		@Body() dto: CreateBookmarkDto,
	) {
		return this.bookmarkService.createBookmark(userId, dto);
	}

	/** Change one of your bookmarks */
	@Patch(':id')
	editBookmarkById(
		@GetUser('id') userId: number,
		@Param('id', ParseIntPipe) bookmarkId: number,
		@Body() dto: EditBookmarkDto,
	) {
		return this.bookmarkService.editBookmarkById(userId, bookmarkId, dto);
	}

	/** Delete one of your bookmarks */
	@HttpCode(HttpStatus.NO_CONTENT)
	@Delete(':id')
	deleteBookmarkById(
		@GetUser('id') userId: number,
		@Param('id', ParseIntPipe) bookmarkId: number,
	) {
		return this.bookmarkService.deleteBookmarkById(userId, bookmarkId);
	}
}
