import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Word } from './entities/words.entity';
import { WordBook } from './entities/word-books.entity';
import { WordMiddle } from './entities/word-middle.entity';
import { WordsService } from './words.service';
import { WordsController } from './words.controller';
import { UserModule } from 'src/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserWords, UserWordsSchema } from './schema/user-words.schema';
import { UserWordsController } from './user-words.controller';
import { UserWordsService } from './user-words.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Word, WordBook, WordMiddle]),
    UserModule,
    MongooseModule.forFeature([
      {name: UserWords.name, schema: UserWordsSchema}
    ])
  ],
  providers: [WordsService,UserWordsService],
  controllers: [WordsController,UserWordsController],
  exports: [WordsService,UserWordsService],
})
export class WordsModule {}