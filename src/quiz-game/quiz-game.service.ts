import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { InjectRepository } from '@nestjs/typeorm'; 
import { Word } from 'src/words/entities/words.entity';
import { Repository } from 'typeorm';

type Message = {
  sender: string; // uuid
  text: string;
  timestamp: Date;
};

@Injectable()
export class QuizGameService {
  constructor(
    @InjectModel(Room.name)
    private readonly roomModel: Model<Room>,
    @InjectRepository(Word)
    private wordRepository: Repository<Word>,
  ) {}

  // 방 생성
  async createRoom(dto: CreateRoomDto, uuid: string) {
    const roomId = this.generateRoomCode(6);
    const room = new this.roomModel({
      roomId: roomId,
      name: dto.name,
      participants: [uuid],
      status: 'lobby'
    });
    return room.save();
  }

  // 전체 방 목록 조회
  async getRooms() {
    return this.roomModel.find().lean();
  }

  // 특정 방 조회
  async getRoomById(roomId: string) {
    return this.roomModel.findOne({ roomId: roomId }).lean();
  }

  // 방에 참가자 추가 (중복 방지)
  async addParticipant(roomId: string, uuid: string): Promise<boolean> {
    const room = await this.roomModel.findOne({ roomId: roomId });
    if (!room) return false;
    // 이미 참가 중이면 무시
    if (room.participants.includes(uuid)) return true;
    // 최대 인원 제한 (예: 8명)
    if (room.participants.length >= 8) return false;
    room.participants.push(uuid);
    await room.save();
    return true;
  }

  // 방에서 참가자 제거
  async removeParticipant(roomId: string, uuid: string) {
    const room = await this.roomModel.findOne({ roomId });
    if (!room) return;
    room.participants = room.participants.filter(
      (id) => id && id.toString() !== uuid.toString()
    );
    await room.save();
  }

  // 방 삭제
  async deleteRoom(roomId: string) {
    await this.roomModel.deleteOne({ roomId: roomId });
  }

  // 특정 유저가 참가 중인 모든 방 찾기
  async getRoomsByUser(uuid: string) {
    return this.roomModel.find({ participants: uuid }).lean();
  }

  // 메시지 저장하기
  async addMessage(roomId: string, message: Message): Promise<Message> {
    const room = await this.roomModel.findOne({ roomId });
    if (!room) throw new Error('방이 존재하지 않습니다.');
    room.messages.push(message);
    await room.save();
    return message;
  }

  // (선택) 점수 갱신 등 추가 로직도 여기에 작성 가능

  // 랜덤 6자리 방 코드 생성
  private generateRoomCode(length: number) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

    async getWords(level?: string): Promise<Word> {
    const query = this.wordRepository.createQueryBuilder('word');
    if (level && ['JLPT N1', 'JLPT N2', 'JLPT N3', 'JLPT N4', 'JLPT N5','JPT 550','JPT 650','JPT 750','JPT 850','JPT 950','BJT J4','BJT J3','BJT J2','BJT J1','BJT J1+'].includes(level)) {
      query.where('word.word_level = :level', { level });
    }
    const word = await query.orderBy('RAND()').limit(1).getOne();
  
    if (!word) {
      throw new NotFoundException('단어 없다');
    }
    return word;
  }
}

