import { Module } from '@nestjs/common';
import { QuizGameService } from './quiz-game.service';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizGameController } from './quiz-game.controller';
import { QuizGameGateway } from './quiz-game.gateway';
import { WordsModule } from 'src/words/words.module';
import { Room, RoomSchema } from './schemas/room.schema';
import { User, UserSchema } from './schemas/user.schema';
import { AuthModule } from 'src/auth/auth.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      { name: User.name, schema: UserSchema },
    ]),
    WordsModule,
    AuthModule
  ],
  providers: [QuizGameGateway, QuizGameService],
  controllers: [QuizGameController],
  exports: [QuizGameService]
})
export class QuizGameModule {}