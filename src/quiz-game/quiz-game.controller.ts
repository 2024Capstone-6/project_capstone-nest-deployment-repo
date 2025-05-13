import { Controller, Post, Get, Param, Body, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { QuizGameService } from './quiz-game.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // JWT 인증 가드
import { CreateRoomDto } from './dto/create-room.dto';

@Controller('quiz-game')
export class QuizGameController {
  constructor(private readonly quizGameService: QuizGameService) {}

  // 1. 방 생성 (로그인 필요)
  @UseGuards(JwtAuthGuard)
  @Post('rooms')
  async createRoom(@Body() createRoomDto: CreateRoomDto, @Req() req) {
    console.log('[방생성] req.user:', req.user);
    const uuid = req.user.uuid;
    console.log('[방생성] uuid:', uuid);
    const room = await this.quizGameService.createRoom(createRoomDto, uuid);
    return room;
  }

  // 2. 방 목록 조회 (누구나)
  @Get('rooms')
  async getRooms() {
    return this.quizGameService.getRooms();
  }

  // 3. 특정 방 정보 조회 (누구나)
  @Get('rooms/:roomId')
  async getRoom(@Param('roomId') roomId: string) {
    const room = await this.quizGameService.getRoomById(roomId);
    if (!room) throw new NotFoundException('방을 찾을 수 없습니다.');
    return room;
  }

  // (선택) 방 삭제 (방장만)
  // @UseGuards(JwtAuthGuard)
  // @Delete('rooms/:roomCode')
  // async deleteRoom(@Param('roomCode') roomCode: string, @Req() req) {
  //   const userId = req.user.userId;
  //   return this.quizGameService.deleteRoom(roomCode, userId);
  // }
}
