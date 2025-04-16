import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserWordsDocument = UserWords & Document;

@Schema({ timestamps: true })
export class UserWords {
  @Prop({ required: true })
  uuid: string; // 유저 고유 식별자 (varchar 36, unique)

  @Prop({ required: true, type: [Number] })
  shuffled_word_ids: number[]; // 셔플된 단어 id 배열
}

export const UserWordsSchema = SchemaFactory.createForClass(UserWords);