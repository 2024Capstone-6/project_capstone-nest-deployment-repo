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
}

export const RoomSchema = SchemaFactory.createForClass(Room);

// 가상 필드 (참가자 수)
RoomSchema.virtual('participantCount').get(function () {
  return this.participants?.length || 0;
});



