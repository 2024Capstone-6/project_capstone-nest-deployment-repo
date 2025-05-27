import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes } from 'mongoose';

// 메시지 서브스키마
@Schema({ _id: false })
export class Message {
  @Prop({ required: true })
  text: string;

  @Prop({ type: String, required: true }) // <-- uuid string으로!
  sender: string;

  @Prop({ default: Date.now })
  timestamp: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// 난이도 레벨 상수
export const DIFFICULTY_LEVELS = [
  'JLPT N1', 'JLPT N2', 'JLPT N3', 'JLPT N4', 'JLPT N5',
  'JPT 550', 'JPT 650', 'JPT 750', 'JPT 850', 'JPT 950',
  'BJT J4', 'BJT J3', 'BJT J2', 'BJT J1', 'BJT J1+'
];

// 방 스키마
@Schema({ timestamps: true, toJSON: { virtuals: true } })
export class Room extends Document {
  @Prop({ required: true, unique: true })
  roomId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [String], ref: 'User', default: [] })
  participants: string[];

  @Prop({ enum: ['lobby', 'playing', 'closed'], default: 'lobby' })
  status: string;

  @Prop({ type: [MessageSchema], default: [] })
  messages: Message[];

  @Prop({ default: 8 })
  maxParticipants: number;

  // **난이도 필드 추가**
  @Prop({ required: true, enum: DIFFICULTY_LEVELS })
  difficulty: string;

  // **참가자별 준비 상태 추가**
  @Prop({ type: Map, of: Boolean, default: {} })
  readyStatus: Record<string, boolean>;
}

export const RoomSchema = SchemaFactory.createForClass(Room);

// 가상 필드 (참가자 수)
RoomSchema.virtual('participantCount').get(function () {
  return this.participants?.length || 0;
});



