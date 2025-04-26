import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { QuizGameService } from './quiz-game.service';

@Controller('api/rooms')
export class QuizGameController {
  constructor(private readonly quizgameservice: QuizGameService) {}

  @Get()
  async getRooms() {
    return this.quizgameservice.getLobbyRooms();
  }

  @Post()
  async createRoom(@Body() body: { name: string }) {
    return this.quizgameservice.createRoom(body.name);
  }

  @Get('/solo')
  async getWords(@Query('level') level?: string) { //원하는 레벨을 받을수 있게끔 수정 요청은 /solo?level=N1 이렇게
    return this.quizgameservice.getWords(level);
  }
}