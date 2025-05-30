import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Word } from './entities/words.entity';
import { WordBook } from './entities/word-books.entity';
import { WordMiddle } from './entities/word-middle.entity';
import { User } from 'src/user/entity/user.entity';
import { WordProgress } from './entities/word-progress.entity';

@Injectable()
export class WordsService {
  constructor(
    @InjectRepository(Word)
    private wordsRepository: Repository<Word>,
    @InjectRepository(WordMiddle)
    private wordMiddleRepository:Repository<WordMiddle>,
    @InjectRepository(WordBook)
    private wordBookRepository: Repository<WordBook>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(WordProgress)
    private wordProgressRepository: Repository<WordProgress>,
  ) {}

  // 🔥 단어 관련 비즈니스 로직
  // ✅ 모든 단어 조회 로직(프론트에 넘겨줄 데이터)
  async findAll(): Promise<Word[]> {
    return this.wordsRepository.find();
  }

  // ✅ 처음시작 & 이어보기 - 레벨별 필터링 & 단어 진도 조회
  async getWordsAndProgress(userUuid: string, level: string) {
    const user = await this.userRepository.findOne({ where: { uuid: userUuid } });
    if (!user) throw new Error('유저 없음');

    // 전체 단어 중 해당 레벨만 필터링
    const words = await this.wordsRepository.find({
      where: { word_level: level },
      order: { word_id: 'ASC' },
    });

    // 해당 유저의 진도 가져오기
    const progress = await this.wordProgressRepository.findOne({
      where: { user: { user_id: user.user_id }, learning_level: level },
    });

    return {
      learning_level: level,
      current_index: progress?.current_index ?? 0,
      words,
    };
  }

  // ✅ 진도 저장
  async updateWordProgress(userUuid: string, level: string, index: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { uuid: userUuid } });
    if (!user) throw new Error('유저를 찾을 수 없습니다.');

    const existing = await this.wordProgressRepository.findOne({
      where: { user: { user_id: user.user_id }, learning_level: level },
    });

    if (existing) {
      existing.current_index = index;
      await this.wordProgressRepository.save(existing);
    } else {
      const progress = this.wordProgressRepository.create({
        user,
        learning_level: level,
        current_index: index,
      });
      await this.wordProgressRepository.save(progress);
    }
  }

  // ✅ 진도 리셋
  async resetWordProgress(userUuid: string, level: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { uuid: userUuid } });
    if (!user) throw new Error('유저를 찾을 수 없습니다.');

    const progress = await this.wordProgressRepository.findOne({
      where: { user: { user_id: user.user_id }, learning_level: level },
    });

    if (progress) {
      // 완전 삭제하고 싶다면 이 줄 사용
      // await this.wordProgressRepository.remove(progress);

      // 또는 단순 초기화
      progress.current_index = 0;
      await this.wordProgressRepository.save(progress);
    }
  }

  /* // ❌ 특정 단어 검색 로직
  async searchWord(query:string): pormise<Word[]> {
    return this.wordsRepository.find({
      where: [
        { word: Like(`%${query}%`) }, // 단어 검색
      ],
    });
  } */

  // 🔥 단어장 관련 비즈니스 로직
  // ✅ 단어장 생성 로직
  async createWordBook(userUuid: string, wordbook_title: string): Promise<WordBook> {
    // ✅ uuid로 user 조회
    const user = await this.userRepository.findOne({ where: { uuid: userUuid } });
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
    
    // ✅ 1. 같은 이름의 단어장이 있는지 검사
    const existingBook = await this.wordBookRepository.findOne({
      where: { user: { user_id: user.user_id }, wordbook_title },
    });
  
    if (existingBook) {
      throw new Error('이미 같은 이름의 단어장이 존재합니다.');
    }
  
    // ✅ 2. 새 단어장 생성
    const wordBook = this.wordBookRepository.create({ user, wordbook_title });
  
    // ✅ 3. 저장 후 반환
    return await this.wordBookRepository.save(wordBook);
  }

  // ✅ 단어장 목록 조회 로직
  async getUserWordBooks(userUuid: string): Promise<WordBook[]> {
    // ✅ uuid로 user 조회
    const user = await this.userRepository.findOne({ where: { uuid: userUuid } });
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }
  
    return this.wordBookRepository.find({
      where: { user: { user_id: user.user_id } },
      relations: ['word_middle', 'word_middle.word'], // 단어장에 속한 단어도 같이 조회
    });
  }

  // ✅ 단어장에 단어 추가(즐겨찾기) 로직
  async addWordToWordBook(wordbookId: number, wordId: number): Promise<void> {
    // 단어장과 단어 찾기
    const wordBook = await this.wordBookRepository.findOne({ where: { wordbook_id: wordbookId } });
    const word = await this.wordsRepository.findOne({ where: { word_id: wordId } });

    if (!wordBook || !word) {
      throw new Error('단어장 또는 단어를 찾을 수 없습니다.');
    }

    // 이미 추가된 단어인지 확인
    const alreadyExists = await this.wordMiddleRepository.findOne({
      where: {
        wordbook: { wordbook_id: wordbookId },
        word: { word_id: wordId },
      },
    });

    if (alreadyExists) {
      throw new Error('이미 이 단어장에 추가된 단어입니다.');
    }
    
    // 중복이 아니라면 추가 진행
    // 단어와 단어장을 연결하는 중간 테이블(WordMiddle) 객체 생성
    const wordMiddle = this.wordMiddleRepository.create({
      wordbook: wordBook,
      word: word,
      added_at: new Date(),
    });

    // DB에 저장
    await this.wordMiddleRepository.save(wordMiddle);
  }

  // ✅ 단어장에 단어 제거(즐겨찾기 해제) 로직
  async removeWordFromWordBook(wordbookId: number, wordId: number): Promise<void> {
    // 특정 단어장 내 특정 단어를 삭제
    await this.wordMiddleRepository.delete({
      wordbook: { wordbook_id: wordbookId },
      word: { word_id: wordId },
    });
  }

  // ✅ 단어장 삭제 로직
  async deleteWordBook(wordbookId: number, userUuid: string): Promise<void> {
    // ✅ uuid로 user 조회
    const user = await this.userRepository.findOne({ where: { uuid: userUuid } });
    if (!user) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    const wordBook = await this.wordBookRepository.findOne({
      where: { wordbook_id: wordbookId },
      relations: ['user'],
    });

    if (!wordBook) {
      throw new Error('단어장을 찾을 수 없습니다.');
    }

    if (wordBook.user.user_id !== user.user_id) {
      throw new Error('본인의 단어장만 삭제할 수 있습니다.');
    }

    // 특정 단어장 삭제 (단어장에 연결된 단어들도 `CASCADE`로 자동 삭제)
    await this.wordBookRepository.remove(wordBook);
  }
}