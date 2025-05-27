import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from './schemas/room.schema';
import { CreateRoomDto } from './dto/create-room.dto';
import { InjectRepository } from '@nestjs/typeorm'; 
import { Word } from 'src/words/entities/words.entity';
import { Repository } from 'typeorm';
import { Client } from 'socket.io/dist/client';

type Message = {
  sender: string; // uuid
  text: string;
  timestamp: Date;
};

const SCORE_TABLE = [100, 70, 50, 30];
const TOTAL_ROUNDS = 10;

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
      status: 'lobby',
      difficulty: dto.difficulty,
    });
    return room.save();
  }

  // 전체 방 목록 조회
  async getRooms() {
    return this.roomModel.find();
  }

  // 특정 방 조회
  async getRoomById(roomId: string) {
    return this.roomModel.findOne({ roomId: roomId });
  }

  // 방에 참가자 추가 (중복 방지)
  async addParticipant(roomId: string, uuid: string): Promise<boolean> {
    const room = await this.roomModel.findOne({ roomId: roomId });
    if (!room) return false;
    // 이미 참가 중이면 무시
    if (room.participants.includes(uuid)) return true;
    // 최대 인원 제한 4명
    if (room.participants.length >= 4) return false;
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
    return this.roomModel.find({ participants: uuid });
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

  async getWords(level?: string): Promise<Word | null> {
  const validLevels = [
    'JLPT N1', 'JLPT N2', 'JLPT N3', 'JLPT N4', 'JLPT N5',
    'JPT 550','JPT 650','JPT 750','JPT 850','JPT 950',
    'BJT J4','BJT J3','BJT J2','BJT J1','BJT J1+'
  ];

  // level이 없거나, 유효하지 않으면 무조건 null 반환
  if (!level || !validLevels.includes(level)) {
    return null;
  }

  const query = this.wordRepository.createQueryBuilder('word');
  query.where('word.word_level = :level', { level });
  const word = await query.orderBy('RAND()').limit(1).getOne();
  return word;
  }

  async setReadyStatus(roomId: string, uuid: string, ready: boolean) {
  const room = await this.roomModel.findOne({ roomId });
  if (!room) throw new Error('방이 존재하지 않습니다.');
  if (!room.participants.includes(uuid)) throw new Error('방 참가자가 아님');
  if (!room.readyStatus) room.readyStatus = {}; // 혹시 undefined면 초기화
  room.readyStatus[uuid] = ready;
  room.markModified('readyStatus'); // ★ 이 줄을 꼭 추가!
  await room.save();
  // 최신 상태로 다시 조회해서 반환
  return await this.roomModel.findOne({ roomId });
  }

    // 방 상태(status) 변경 (예: 'playing' 등)
  async setRoomStatus(roomId: string, status: string) {
    await this.roomModel.updateOne({ roomId }, { status});
  }

  // 이거는 그룹게임 단어불러오는 로직임
  async getNextWord(level: string) {
  const validLevels = [
    'JLPT N1', 'JLPT N2', 'JLPT N3', 'JLPT N4', 'JLPT N5',
    'JPT 550','JPT 650','JPT 750','JPT 850','JPT 950',
    'BJT J4','BJT J3','BJT J2','BJT J1','BJT J1+'
  ];
  if (!level || !validLevels.includes(level)) {
    throw new Error('유효하지 않은 레벨');
  }

  // 1. 해당 레벨에서 랜덤 단어 1개 추출
  const query = this.wordRepository.createQueryBuilder('word');
  query.where('word.word_level = :level', { level });
  const word = await query.orderBy('RAND()').limit(1).getOne();
  if (!word) throw new Error('해당 레벨의 단어가 없습니다.');

  // 2. 객관식 선택지 만들기 (정답 + 오답 3개, 중복 없이)
  // 정답
  const answer = word.word_furigana;
  // 오답 후보 추출 (정답 제외, 랜덤 3개)
  const wrongs = await this.wordRepository.createQueryBuilder('word')
    .where('word.word_level = :level', { level })
    .andWhere('word.word_furigana != :answer', { answer })
    .orderBy('RAND()')
    .limit(3)
    .getMany();

  // 선택지 배열 만들기 (정답 + 오답 3개)
  const choices = [answer, ...wrongs.map(w => w.word_furigana)];
  // 선택지 셔플
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }

  // 3. 반환
  return {
    word: word.word,        // 문제로 보여줄 한자 등
    answer: answer,         // 정답(후리가나 등)
    choices: choices        // 객관식 선택지
  };
  }

  async gameInit(roomId: string, totalRounds = 10) {
    const room = await this.getRoomById(roomId);
    if (!room) throw new Error('방이 존재하지 않습니다.');
    room.currentRound = 1;
    room.totalRounds = totalRounds;
    room.totalScores = {};
    room.answeredUsers = [];
    await room.save();
    return room;
  }

  async updateQuestion(roomId: string, word: string, answer: string, choices: string[]) {
    const room = await this.getRoomById(roomId);
    if (!room) throw new Error('방이 존재하지 않습니다.');
    room.currentQuestion = word;
    room.currentAnswer = answer;
    room.answeredUsers = [];
    await room.save();
    return room;
  }

  async incrementRound(roomId: string) {
    const room = await this.getRoomById(roomId);
    if (!room) throw new Error('방이 존재하지 않습니다.');
    room.currentRound += 1;
    await room.save();
    return room;
  }

  async addScore(roomId: string, uuid: string, score: number) {
    const room = await this.getRoomById(roomId);
    if (!room) throw new Error('방이 존재하지 않습니다.');
    if (!room.totalScores) room.totalScores = {};
    room.totalScores[uuid] = (room.totalScores[uuid] || 0) + score;
    await room.save();
    return room;
  }
}

