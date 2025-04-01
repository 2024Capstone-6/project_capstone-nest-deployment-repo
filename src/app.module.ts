import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './auth/profile/profile.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuizGameModule } from './quiz-game/quiz-game.module';
import { WordsModule } from './words/words.module';
import { GrammarsModule } from './grammars/grammars.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: ['dist/**/*.entity.js'],
      migrations: ['dist/migrations/*.js'],
      synchronize: false,
      logging: true,
      extra: { connectTimeout: 60000 },
    }),
    AuthModule,
    ProfileModule,
    QuizGameModule,
    WordsModule,
    GrammarsModule,
    ChatbotModule,
    AuthModule,
    MongooseModule.forRoot('mongodb+srv://mymongo:1234@cluster0.ltogx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}