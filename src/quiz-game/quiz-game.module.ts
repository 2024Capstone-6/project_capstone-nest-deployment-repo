import { Module } from '@nestjs/common';
import { QuizGameService } from './quiz-game.service';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizGameRoom, ChatRoomSchema } from './schemas/quiz-game.schema';
import { QuizGameController } from './quiz-game.controller';
import { QuizGameGateway } from './quiz-game.gateway';
import { WordsModule } from 'src/words/words.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuizGameRoom.name, schema: ChatRoomSchema },
    ]),
    WordsModule
  ]
  ,
  providers: [QuizGameGateway, QuizGameService],
  controllers: [QuizGameController],
  exports: [QuizGameService]
})
export class QuizGameModule {}