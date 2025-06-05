import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { QuizGameService } from './quiz-game.service';
import { JwtService } from '@nestjs/jwt';

const SCORE_TABLE = [100, 70, 50, 30];
const ROUND_TIME = 10000; // 10초
const TOTAL_ROUNDS = 10;

const roomTimers = new Map<string, NodeJS.Timeout>();

@WebSocketGateway({ cors: true })
export class QuizGameGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly quizGameService: QuizGameService,
    private readonly jwtService: JwtService,
  ) {}

  // 유저가 방에 입장
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const token = client.handshake.auth?.token;
    if (!token) {
      client.emit('error', { message: '인증 토큰이 없습니다.' });
      return;
    }
    let name: string;
    try {
      const payload = this.jwtService.verify(token);
      name = payload.name;
    } catch {
      client.emit('error', { message: '토큰이 유효하지 않습니다아?.' });
      return;
    }

    // 방 상태 확인
    const room = await this.quizGameService.getRoomById(data.roomId);
    if (!room) {
      client.emit('error', { message: '방이 존재하지 않습니다.' });
      return;
    }
    if (room.status === 'playing') {
      client.emit('error', { message: '이미 게임이 시작된 방입니다.' });
      return;
    }

    // 방 입장 처리
    const result = await this.quizGameService.addParticipant(data.roomId, name);
    if (!result) {
      client.emit('error', { message: '방이 존재하지 않거나 입장 불가.' });
      return;
    }

    client.join(data.roomId);

    // 방 정보 갱신 브로드캐스트 (방 내부)
    const updatedRoom = await this.quizGameService.getRoomById(data.roomId);
    this.server.to(data.roomId).emit('roomUpdate', updatedRoom);

    // 전체 방 목록 실시간 동기화 (로비)
    const allRooms = await this.quizGameService.getRooms();
    this.server.emit('roomListUpdate', allRooms);
  }

  // 유저가 방에서 나감
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const token = client.handshake.auth?.token;
    if (!token) return;
    let name: string;
    try {
      const payload = this.jwtService.verify(token);
      name = payload.name;
    } catch {
      return;
    }

    await this.quizGameService.removeParticipant(data.roomId, name);
    client.leave(data.roomId);

    // 방 정보 갱신 브로드캐스트 (방 내부)
    const updatedRoom = await this.quizGameService.getRoomById(data.roomId);
    if (updatedRoom && updatedRoom.participants.length > 0) {
      this.server.to(data.roomId).emit('roomUpdate', updatedRoom);
    } else {
      // 방에 인원이 0명이면 방 삭제
      await this.quizGameService.deleteRoom(data.roomId);
    }

    // 전체 방 목록 실시간 동기화 (로비)
    const allRooms = await this.quizGameService.getRooms();
    this.server.emit('roomListUpdate', allRooms);
  }

  // 소켓 연결이 끊겼을 때 (브라우저 종료/새로고침 등)
  async handleDisconnect(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) return;
    let uuid: string;
    try {
      const payload = this.jwtService.verify(token);
      uuid = payload.name;
    } catch {
      return;
    }

    // 사용자가 참가 중인 모든 방에서 제거
    const userRooms = await this.quizGameService.getRoomsByUser(uuid);
    for (const room of userRooms) {
      await this.quizGameService.removeParticipant(room.roomId, uuid);

      const updatedRoom = await this.quizGameService.getRoomById(room.roomId);
      if (updatedRoom && updatedRoom.participants.length > 0) {
        this.server.to(room.roomId).emit('roomUpdate', updatedRoom);
      } else {
        await this.quizGameService.deleteRoom(room.roomId);
        this.server.emit('roomDeleted', { roomId: room.roomId });
      }
    }

    // 전체 방 목록 실시간 동기화 (로비)
    const allRooms = await this.quizGameService.getRooms();
    this.server.emit('roomListUpdate', allRooms);
  }

  // 메시지 전송
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { roomId: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    const token = client.handshake.auth?.token;
    if (!token) {
      client.emit('error', { message: '인증 토큰이 없습니다.' });
      return;
    }
    let uuid: string;
    try {
      const payload = this.jwtService.verify(token);
      uuid = payload.name;
    } catch {
      client.emit('error', { message: '토큰이 유효하지 않습니다.' });
      return;
    }

    // 메시지 저장 (서비스에서 처리)
    const message = await this.quizGameService.addMessage(data.roomId, {
      sender: uuid,
      text: data.text,
      timestamp: new Date(),
    });

    // 해당 방 참가자에게 메시지 브로드캐스트
    this.server.to(data.roomId).emit('newMessage', message);
  }

  // 준비 상태 변경 (참가자가 "준비" 버튼 클릭 시)
  @SubscribeMessage('ready')
  async handleReady(
  @MessageBody() data: { roomId: string; ready: boolean },
  @ConnectedSocket() client: Socket,
  ) {
  const token = client.handshake.auth?.token;
  if (!token) {
    client.emit('error', { message: '인증 토큰이 없습니다.' });
    return;
  }
  let uuid: string;
  try {
    const payload = this.jwtService.verify(token);
    uuid = payload.name;
  } catch {
    client.emit('error', { message: '토큰이 유효하지 않습니다.' });
    return;
  }

  // 준비 상태 업데이트 (서비스에서 처리)
  const room = await this.quizGameService.setReadyStatus(data.roomId, uuid, data.ready);

  // 실시간 방 정보 갱신
  this.server.to(data.roomId).emit('roomUpdate', room); 

  // 룸이 null인지 아닌지 점검 (방이터졌다던가)
  if (!room) {
  client.emit('error', { message: '방이 존재하지 않습니다.' });
  return;
  }

  // 모든 참가자가 준비됐는지 확인
  const allReady = room.participants.length > 0 &&
    room.participants.every((id: string) => room.readyStatus[id]);

  if (allReady && room.status === 'lobby') {
    // status를 'playing'으로 변경
    await this.quizGameService.setRoomStatus(room.roomId, 'playing');

    // 최신 방 정보 다시 가져오기 (선택)
    const updatedRoom = await this.quizGameService.getRoomById(room.roomId);
    // 방 전체에 최신 정보 브로드캐스트
    this.server.to(data.roomId).emit('roomUpdate', updatedRoom);

    // 게임 시작 이벤트 브로드캐스트 (게임로직 필요시)
    this.server.to(data.roomId).emit('gameStarted', { roomId: data.roomId });

    // 게임 시작: 첫 문제 출제
    await this.quizGameService.gameInit(data.roomId, TOTAL_ROUNDS);
    this.startNewQuestion(data.roomId);

    const allRooms = await this.quizGameService.getRooms();
    this.server.emit('roomListUpdate', allRooms);
    }
  }
  async startNewQuestion(roomId: string) {
    const room = await this.quizGameService.getRoomById(roomId);
    if (!room) throw new Error('방이 존재하지 않습니다.');
    if (room.currentRound > room.totalRounds) {
      room.status = 'lobby';
      room.readyStatus={};
      await room.save();
      this.server.to(roomId).emit('gameOver', { totalScores: room.totalScores });
      const updatedRoom = await this.quizGameService.getRoomById(room.roomId);
      this.server.to(roomId).emit('roomUpdate', updatedRoom);
      roomTimers.delete(roomId);
      return;
    }
    // 문제 출제 (모든 참가자에게 동일)
    const next = await this.quizGameService.getNextWord(room.difficulty);
    await this.quizGameService.updateQuestion(room, next.word, next.answer, next.choices);
    console.log('서버: newQuestion emit 시도', roomId, next.word, next.choices);
    this.server.to(roomId).emit('newQuestion', {
      question: next.word,
      choices: next.choices,
      round: room.currentRound,
      totalRounds: room.totalRounds,
    });

    if (roomTimers.has(roomId)) clearTimeout(roomTimers.get(roomId));
    const timeout = setTimeout(async () => {
      await this.quizGameService.incrementRound(roomId);
      this.startNewQuestion(roomId);
    }, ROUND_TIME);
    roomTimers.set(roomId, timeout);
  }

  @SubscribeMessage('submitAnswer')
  async handleSubmitAnswer(@MessageBody() data, @ConnectedSocket() client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
    client.emit('error', { message: '인증 토큰이 없습니다.' });
    return;
    }
    let uuid: string;
    try {
    const payload = this.jwtService.verify(token);
    uuid = payload.name;
    } catch {
    client.emit('error', { message: '토큰이 유효하지 않습니다.' });
    return;
    }
    const room = await this.quizGameService.getRoomById(data.roomId);
    if (!room) {
      client.emit('error', { message: '방이 존재하지 않습니다.' });
      return;
    }
    if (!room.answeredUsers) room.answeredUsers = [];
    if (room.answeredUsers.includes(uuid)) {
      client.emit('answerResult', { correct: true, alreadyAnswered: true });
      return;
    }
    // **정답 비교 시 trim()으로 공백 방지**
    const isCorrect = (data.answer?.trim() ?? '') === (room.currentAnswer?.trim() ?? '');
    if (!isCorrect) {
      client.emit('answerResult', { correct: false, totalScore: 0 });
      return;
    }
    room.answeredUsers.push(uuid);
    await room.save();
    const order = room.answeredUsers.length;
    const totalScore = SCORE_TABLE[order - 1] ?? 0;
    const updatedRoom = await this.quizGameService.addScore(data.roomId, uuid, totalScore);
    console.log('DB반영테스트', updatedRoom.totalScores);
    this.server.to(data.roomId).emit('roomUpdate', updatedRoom);
    console.log('[서버] 정답 제출:', uuid, '점수:', totalScore);
    client.emit('answerResult', { correct: true, totalScore });
  }

}
