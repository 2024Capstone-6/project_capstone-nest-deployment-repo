import { Controller, Delete, Get, Post, Body, Param, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GrammarsService } from './grammars.service';
import { Grammar } from './entities/grammars.entity';
import { GrammarBook } from './entities/grammar-books.entity';

@UseGuards(AuthGuard('jwt'))
@Controller('grammars')
export class GrammarsController {
  constructor(private readonly grammarsService: GrammarsService) {}

  // 🔥 문법 관련
  // ✅ 모든 문법 조회 API
  @Get()
  async getAllGrammars(): Promise<Grammar[]> {
    return this.grammarsService.findAll();
  }

  // 🔥 문법장 관련
  // ✅ 문법장 생성 API
  @Post('/books')
  async createGrammarBook(@Request() req, @Body() body: { grammarbook_title: string }) {
    return this.grammarsService.createGrammarBook(req.user.uuid, body.grammarbook_title)
  }

  // ✅ 문법장 조회 API
  @Get('/books')
  async getUserGrammarBooks(@Request() req): Promise<GrammarBook[]> {
    return this.grammarsService.getUserGrammarBooks(req.user.uuid);
  }
  
  // ✅ 문법장에 문법 추가(즐겨찾기) API
  @Post('/books/:grammarbookId/grammars')
  async addGrammarToGrammarBook(
    @Param('grammarbookId') grammarbookId: number,
    @Body() body: { grammar_id: number }
  ): Promise<void> {
    return this.grammarsService.addGrammarToGrammarBook(grammarbookId, body.grammar_id);
  }
  
  // ✅ 문법장에 문법 제거(즐겨찾기 해제) API
   @Delete('/books/:grammarbookId/grammars/:grammarId')
   async removeGrammarFromGrammarBook(
    @Param('grammarbookId') grammarbookId: number,
    @Param('grammarId') grammarId: number
  ): Promise<void> {
    return this.grammarsService.removeGrammarFromGrammarBook(grammarbookId, grammarId);
  }
  
  // ✅ 문법장 삭제 API
  @Delete('/books/:grammarbookId')
  async deleteGrammarBook(@Param('grammarbookId') grammarbookId: number, @Request() req): Promise<void> {
    return this.grammarsService.deleteGrammarBook(grammarbookId, req.user.uuid);
  }
}
