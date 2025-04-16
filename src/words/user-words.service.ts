import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserWords, UserWordsDocument } from "../words/schema/user-words.schema";

@Injectable()
export class UserWordsService {
  constructor(
    @InjectModel(UserWords.name)
    private readonly userWordsModel: Model<UserWordsDocument>,
  ) {}

  // 셔플된 단어 ID 배열 저장 (업서트: 있으면 수정, 없으면 생성)
  async saveShuffledWords(uuid: string, shuffledWordIds: number[]): Promise<UserWords> {
    return this.userWordsModel.findOneAndUpdate(
      { uuid },
      { shuffled_word_ids: shuffledWordIds },
      { upsert: true, new: true }
    );
  }

  // uuid로 셔플된 단어 ID 배열 조회
  async getShuffledWords(uuid: string): Promise<UserWords | null> {
    return this.userWordsModel.findOne({ uuid });
  }
}