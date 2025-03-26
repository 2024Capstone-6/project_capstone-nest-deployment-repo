import { Controller, Delete, Get, Post, Body, Param, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WordsService } from './words.service';
import { Word } from './entities/words.entity';
import { WordBook } from './entities/word-books.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('words')
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  // 🔥 단어 관련
  // ✅ 모든 단어 조회 API
  @Get()
  async getAllWords(): Promise<Word[]> {
    return this.wordsService.findAll();
  }

  // ❌ 특정 단어 검색 API

  // 🔥 단어장 관련
  // ✅ 단어장 생성 API
  @Post('/books')
  async createWordBook(@Request() req, @Body() body: { wordbook_title: string }) {
    return this.wordsService.createWordBook(req.user.uuid, body.wordbook_title);
  }

  // ✅ 단어장 조회 API
  @Get('/books')
  async getUserWordBooks(@Request() req): Promise<WordBook[]> {
    return this.wordsService.getUserWordBooks(req.user.uuid);
  }

  // ✅ 단어장에 단어 추가(즐겨찾기) API
  @Post('/books/:wordbookId/words')
  async addWordToWordBook(
    @Param('wordbookId') wordbookId: number,
    @Body() body: { word_id: number }
  ): Promise<void> {
    return this.wordsService.addWordToWordBook(wordbookId, body.word_id);
  }

  // ✅ 단어장에 단어 제거(즐겨찾기 해제) API
  @Delete('/books/:wordbookId/words/:wordId')
  async removeWordFromWordBook(
    @Param('wordbookId') wordbookId: number,
    @Param('wordId') wordId: number
  ): Promise<void> {
    return this.wordsService.removeWordFromWordBook(wordbookId, wordId);
  }

  // ✅ 단어장 삭제 API
  @Delete('/books/:wordbookId')
  async deleteWordBook(@Param('wordbookId') wordbookId: number, @Request() req): Promise<void> {
    return this.wordsService.deleteWordBook(wordbookId, req.user.uuid);
  } 
}