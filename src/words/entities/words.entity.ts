import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { WordMiddle } from './word-middle.entity';

@Entity('words')
export class Word {
  @PrimaryGeneratedColumn()
  word_id: number;

  @Column({ type: 'varchar', length: 50 })
  word: string;

  @Column({ type: 'varchar', length: 50 })
  word_meaning: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  word_furigana: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  word_level: string;

  @Column({ type: 'json', nullable: true })
  word_quiz: string[];

  @OneToMany(() => WordMiddle, (wordMiddle) => wordMiddle.word, { cascade: true, onDelete: 'CASCADE' })
  word_middle: WordMiddle[];
}
