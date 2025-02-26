import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { WordBook } from '../../words/entities/word-books.entity';
import { GrammarBook } from '../../grammars/entities/grammar-books.entity';
import { QuizGame } from '../../quiz-game/entities/quiz-game.entity';
import { ChatLog } from '../../chatbot/entities/chat-log.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ type: 'varchar', length: 30 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'text', nullable: true })
  profile_image: string;

  @Column({ type: 'boolean', default: false })
  email_verified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  google_id: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @OneToMany(() => WordBook, (wordBook) => wordBook.user, { cascade: true, onDelete: 'CASCADE' })
  word_books: WordBook[];

  @OneToMany(() => GrammarBook, (grammarBook) => grammarBook.user, { cascade: true, onDelete: 'CASCADE' })
  grammar_books: GrammarBook[];

  @OneToMany(() => QuizGame, (quizGame) => quizGame.ex_user, { cascade: true, onDelete: 'CASCADE' })
  quiz_games: QuizGame[];

  @OneToMany(() => ChatLog, (chatLog) => chatLog.user, { cascade: true, onDelete: 'CASCADE' })
  chat_logs: ChatLog[];
}
