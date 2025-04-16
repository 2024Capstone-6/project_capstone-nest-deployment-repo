import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GrammarsService } from './grammars.service';
import { Grammar } from './entities/grammars.entity';
import { GrammarBook } from './entities/grammar-books.entity';

@Controller('grammars')
export class GrammarsController {
  constructor(private readonly grammarsService: GrammarsService) {}

  // 🔥 문법 관련
  // ✅ 모든 문법 조회 API
  @Get()
  async getAllWords(): Promise<Grammar[]> {
    return this.grammarsService.findAll(); 
  }
}
