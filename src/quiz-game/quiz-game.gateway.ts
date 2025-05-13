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
    let uuid: string;
    try {
      const payload = this.jwtService.verify(token);
      uuid = payload.sub;
    } catch {
      client.emit('error', { message: '토큰이 유효하지 않습니다.' });
      return;
    }

    // 방 입장 처리
    const result = await this.quizGameService.addParticipant(data.roomId, uuid);
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
    let uuid: string;
    try {
      const payload = this.jwtService.verify(token);
      uuid = payload.sub;
    } catch {
      return;
    }

    await this.quizGameService.removeParticipant(data.roomId, uuid);
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
      uuid = payload.sub;
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
      uuid = payload.sub;
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
}
