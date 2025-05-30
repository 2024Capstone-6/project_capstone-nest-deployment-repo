import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Word } from './entities/words.entity';
import { WordBook } from './entities/word-books.entity';
import { WordMiddle } from './entities/word-middle.entity';
import { WordsService } from './words.service';
import { WordsController } from './words.controller';
import { UserModule } from 'src/user/user.module';
import { WordProgress } from './entities/word-progress.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Word, WordBook, WordMiddle, WordProgress]),
    UserModule,
  ],
  providers: [WordsService],
  controllers: [WordsController],
  exports: [WordsService,TypeOrmModule.forFeature([Word])],
})
export class WordsModule {}