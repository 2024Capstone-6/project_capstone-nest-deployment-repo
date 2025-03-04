import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Word } from './entities/words.entity';
import { WordBook } from './entities/word-books.entity';
import { WordMiddle } from './entities/word-middle.entity';
import { User } from 'src/user/entity/user.entity';

@Injectable()
export class WordsService {
  constructor(
    @InjectRepository(Word)
    private wordsRepository: Repository<Word>,
    @InjectRepository(WordMiddle)
    private wordMiddleRepository:Repository<WordMiddle>,
    @InjectRepository(WordBook)
    private wordBookRepository: Repository<WordBook>,
  ) {}

  // 🔥 단어 관련 비즈니스 로직
  // ✅ 모든 단어 조회 로직(프론트에 넘겨줄 데이터)
  async findAll(): Promise<Word[]> {
    return this.wordsRepository.find();
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
  async createWordBook(user:User, wordbook_title:string): Promise<WordBook> {
    // 단어장 객체 생성
    const wordBook = this.wordBookRepository.create({user, wordbook_title});
    // DB에 저장 후 반환
    return await this.wordBookRepository.save(wordBook)
  }

  // ✅ 단어장 목록 조회 로직
  async getUserWordBooks(userId: number): Promise<WordBook[]> {
    return this.wordBookRepository.find({
      where: {user : { user_id: userId}},
      relations: ['word_middle', 'word_middle.word'], // 단어장에 속한 단어도 같이 조회
    })
  }

  // ✅ 단어장에 단어 추가(즐겨찾기) 로직
  async addWordToWordBook(wordbookId: number, wordId: number): Promise<void> {
    // 단어장과 단어 찾기
    const wordBook = await this.wordBookRepository.findOne({ where: { wordbook_id: wordbookId } });
    const word = await this.wordsRepository.findOne({ where: { word_id: wordId } });

    if (!wordBook || !word) {
      throw new Error('단어장 또는 단어를 찾을 수 없습니다.');
    }

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
  async deleteWordBook(wordbookId: number): Promise<void> {
    // 특정 단어장 삭제 (단어장에 연결된 단어들도 `CASCADE`로 자동 삭제)
    await this.wordBookRepository.delete({ wordbook_id: wordbookId });
  }
}