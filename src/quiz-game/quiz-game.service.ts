import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QuizGameRoom } from './schemas/quiz-game.schema';
import { v4 as uuidv4 } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm'; 
import { Word } from 'src/words/entities/words.entity';
import { Repository } from 'typeorm';

@Injectable()
export class QuizGameService {
  constructor(
    @InjectModel(QuizGameRoom.name) private QuizGameRoomModel: Model<QuizGameRoom>,
    @InjectRepository(Word)
    private wordRepository: Repository<Word>,
  ) {}

  async createRoom(name: string): Promise<QuizGameRoom> {
    const newRoom = new this.QuizGameRoomModel({
      roomId: uuidv4(),
      name,
      participants: [],
      status: 'lobby',
      participantCount: 0,
    });
    return newRoom.save();
  }

  async getLobbyRooms(): Promise<QuizGameRoom[]> {
    return this.QuizGameRoomModel.find({ status: 'lobby' }).exec();
  }

  async addParticipant(roomId: string, userId: string): Promise<QuizGameRoom> {
    const updatedRoom = await this.QuizGameRoomModel.findOneAndUpdate(
      { roomId },
      { 
        $addToSet: { participants: userId },
        $inc: { participantCount: 1 }
      },
      { new: true },
    ).exec();

    if (!updatedRoom) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }
    return updatedRoom;
  }

  async removeParticipant(roomId: string, userId: string): Promise<QuizGameRoom> {
    const updatedRoom = await this.QuizGameRoomModel.findOneAndUpdate(
      { roomId },
      { 
        $pull: { participants: userId },
        $inc: { participantCount: -1 }
      },
      { new: true },
    ).exec();

    if (!updatedRoom) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }
    return updatedRoom;
  }

  async getRoom(roomId: string): Promise<QuizGameRoom> {
    const room = await this.QuizGameRoomModel.findOne({ roomId }).exec();
    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }
    return room;
  }

  // 채팅저장
  async saveMessage(roomId: string, message: string, sender: string): Promise<void> {
    await this.QuizGameRoomModel.updateOne(
      { roomId },
      {
        $push: {
          messages: {
            text: message,
            sender,
            timestamp: new Date(),
          },
        },
      },
    );
  }

  async getWords(): Promise<Word> { // 단어받을용ㅇㅇ
    const word = await this.wordRepository
    .createQueryBuilder('word')
    .orderBy('RAND()')
    .limit(1)
    .getOne();

    if (!word) {
      throw new NotFoundException('단어 없다');
    }

    return word;
  }
}