import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

class Message {
  constructor(public text: string, public sender: string, public timestamp: Date) {}
}

@Schema({ timestamps: true })
export class QuizGameRoom extends Document {
  @Prop({ required: true, unique: true })
  roomId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [String], default: [] })
  participants: string[];

  @Prop({ default: 'lobby' })
  status: 'active' | 'lobby' | 'archived';

  @Prop({ type: Number, default: 0 })
  participantCount: number;

  @Prop({ type: [Message], _id: false })
  messages: Message[];
}

export const ChatRoomSchema = SchemaFactory.createForClass(QuizGameRoom);