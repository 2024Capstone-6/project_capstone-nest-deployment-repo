import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Grammar } from './entities/grammars.entity';
import { GrammarMiddle } from './entities/grammar-middle.entity';
import { GrammarBook } from './entities/grammar-books.entity';
import { GrammarsService } from './grammars.service';
import { GrammarsController } from './grammars.controller';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Grammar, GrammarMiddle, GrammarBook]),
    UserModule,
  ],
  providers: [GrammarsService],
  controllers: [GrammarsController],
  exports: [GrammarsService]
})
export class GrammarsModule {}
