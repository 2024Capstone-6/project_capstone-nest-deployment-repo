import { Controller, Get, Post, Body } from '@nestjs/common';
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
  async getWords() {
    return this.quizgameservice.getWords()
  }
}