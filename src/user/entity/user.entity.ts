import { Entity, PrimaryGeneratedColumn, Column, OneToMany, BeforeInsert } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { WordBook } from '../../words/entities/word-books.entity';
import { GrammarBook } from '../../grammars/entities/grammar-books.entity';
import { ChatLog } from '../../chatbot/entities/chat-log.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  user_id: number;

  @Column({ type: 'varchar', length: 36, unique: true })
  uuid: string;

  @BeforeInsert()
  generateUUID() {
    this.uuid = uuidv4();
  }

  @Column({ type: 'varchar', length: 30 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string;

  @Column({ type: 'text', nullable: true })
  profile_image: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @OneToMany(() => WordBook, (wordBook) => wordBook.user, { cascade: true, onDelete: 'CASCADE' })
  word_books: WordBook[];

  @OneToMany(() => GrammarBook, (grammarBook) => grammarBook.user, { cascade: true, onDelete: 'CASCADE' })
  grammar_books: GrammarBook[];

  @OneToMany(() => ChatLog, (chatLog) => chatLog.user, { cascade: true, onDelete: 'CASCADE' })
  chat_logs: ChatLog[];
}
