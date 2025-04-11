import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grammar } from './entities/grammars.entity';
import { GrammarMiddle } from './entities/grammar-middle.entity';
import { GrammarBook } from './entities/grammar-books.entity';
import { User } from 'src/user/entity/user.entity';

@Injectable()
export class GrammarsService {
  constructor(
    @InjectRepository(Grammar)
    private grammarsRepository: Repository<Grammar>,
    @InjectRepository(GrammarMiddle)
    private grammarMiddleRepository: Repository<GrammarMiddle>,
    @InjectRepository(GrammarBook)
    private grammarBookRepository: Repository<GrammarBook>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 🔥 문법 관련 비즈니스 로직
  // ✅ 모든 문법 조회 로직(프론트에 넘겨줄 데이터)
  async findAll(): Promise<Grammar[]> {
    return this.grammarsRepository.find();
  }

  // 🔥 문법장 관련 비즈니스 로직
  // ✅ 문법장 생성 로직
  async createGrammarBook(userUuid: string, grammarbook_title: string): Promise<GrammarBook> {
    // ✅ uuid로 user 조회
    const user = await this.userRepository.findOne({ where: { uuid: userUuid } });
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.')
    }

    // ✅ 1. 같은 이름의 문법장이 있는지 검사
    const existingBook = await this.grammarBookRepository.findOne({
      where: { user: { user_id: user.user_id }, grammarbook_title },
    });

    if (existingBook) {
      throw new Error('이미 같은 이름의 문법장이 존재합니다.');
    }

    // ✅ 2. 새 문법장 생성
    const grammarBook = this.grammarBookRepository.create({ user, grammarbook_title });

    // ✅ 3. 저장 후 반환
    return await this.grammarBookRepository.save(grammarBook)
  }

  // ✅ 문법장 목록 조회 로직
  async getUserGrammarBooks(userUuid: string): Promise<GrammarBook[]> {
    // ✅ uuid로 user 조회
    const user = await this.userRepository.findOne({ where: { uuid: userUuid } });
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.')
    }

    return this.grammarBookRepository.find({
      where: { user: { user_id: user.user_id } },
      relations: ['grammar_middle', 'grammar_middle.grammar'], // 문법장에 속한 단어도 같이 조회
    })
  }

  // ✅ 문법장에 문법 추가(즐겨찾기) 로직
  async addGrammarToGrammarBook(grammarbookId: number, grammarId: number): Promise<void> {
    // 문법장과 문법 찾기
    const grammarBook = await this.grammarBookRepository.findOne({ where: { grammarbook_id: grammarbookId } });
    const grammar = await this.grammarsRepository.findOne({ where: { grammar_id: grammarId } });

    if (!grammarBook || !grammar) {
      throw new Error('문법장 또는 문법을 찾을 수 없습니다.')
    }

    // 이미 추가된 문법인지 확인
    const alreadyExists = await this.grammarMiddleRepository.findOne({
      where: {
        grammarbook: { grammarbook_id: grammarbookId },
        grammar: { grammar_id: grammarId}
      },
    });
    
    if (alreadyExists) {
      throw new Error('이미 이 문법장에 추가된 문법입니다.');
    }

    // 중복이 아니라면 추가 진행
    // 문법과 문법장을 연결하는 중간 테이블(WordMiddle) 객체 생성
    const grammarMiddle = this.grammarMiddleRepository.create({
      grammarbook: grammarBook,
      grammar: grammar,
      added_at: new Date(),
    });

    // DB에 저장
    await this.grammarMiddleRepository.save(grammarMiddle)
  }

  // ✅ 문법장에 문법 제거(즐겨찾기 해제) 로직
  async removeGrammarFromGrammarBook(grammarbookID: number, grammarId: number): Promise<void> {
    // 특정 문법장 내 특정 문법을 삭제
    await this.grammarMiddleRepository.delete({
      grammarbook: { grammarbook_id: grammarbookID },
      grammar: { grammar_id: grammarId },
    });  
  }

  // ✅ 문법장 삭제 로직
  async deleteGrammarBook(grammarbookId: number, userUuid: string): Promise<void> {
    // ✅ uuid로 user 조회
    const user = await this.userRepository.findOne({ where: { uuid: userUuid } });
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    const grammarBook = await this.grammarBookRepository.findOne({
      where: { grammarbook_id: grammarbookId },
      relations: ['user'],
    });

    if (!grammarBook) {
      throw new Error('문법장을 찾을 수 없습니다.');
    }

    if (grammarBook.user.user_id !== user.user_id) {
      throw new Error('본인의 문법장만 삭제할 수 있습니다.');
    }

    // 특정 문법장 삭제 (문법장에 연결된 문법들도 `CASCADE`로 자동 삭제)
    await this.grammarBookRepository.remove(grammarBook);
  }
}
