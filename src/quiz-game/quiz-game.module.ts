import { Module } from '@nestjs/common';
import { QuizGameService } from './quiz-game.service';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizGameRoom, ChatRoomSchema } from './schemas/quiz-game.schema';
import { QuizGameController } from './quiz-game.controller';
import { QuizGameGateway } from './quiz-game.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuizGameRoom.name, schema: ChatRoomSchema }
    ])
  ],
  providers: [QuizGameGateway, QuizGameService],
  controllers: [QuizGameController],
  exports: [QuizGameService]
})
export class QuizGameModule {}