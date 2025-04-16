import { Controller, Delete, Get, Post, Body, Param, Request, UseGuards, Query } from '@nestjs/common';
import { UserWordsService } from './user-words.service';

@Controller('user-words')
export class UserWordsController {
  constructor(private readonly userWordsService: UserWordsService) {}

  @Post()
  async saveShuffledWords(
    @Body('uuid') uuid: string,
    @Body('shuffled_word_ids') shuffledWordIds: number[]
  ) {
    return this.userWordsService.saveShuffledWords(uuid, shuffledWordIds);
  }

  @Get()
  async getShuffledWords(@Query('uuid') uuid: string) {
  const data = await this.userWordsService.getShuffledWords(uuid);
  // 데이터가 없으면 빈 객체라도 반환
  if (!data) return { shuffled_word_ids: [] };
  return data;
}
}