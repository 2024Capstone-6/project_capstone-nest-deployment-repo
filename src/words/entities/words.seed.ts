import { DataSource } from 'typeorm';
import { Word } from './words.entity';

export const seedWords = async (dataSource: DataSource) => {
  const wordsRepository = dataSource.getRepository(Word);
  // 단어 DB에 넣는 데이터
  const initialWords = [
    {
      word: '猫',
      word_meaning: '고양이',
      word_furigana: 'ねこ',
      word_level: 'N5',
      word_quiz: ['ぬく', 'まこ', 'ちゃこ'],
    },
    {
      word: '勉強',
      word_meaning: '공부',
      word_furigana: 'べんきょう',
      word_level: 'N5',
      word_quiz: ['あんきょう', 'べんこう', 'ばんごう'],
    },
    {
      word: '毎朝',
      word_meaning: '매일 아침',
      word_furigana: 'まいあさ',
      word_level: 'N5',
      word_quiz: ['けさ', 'さくや', 'きょうあさ'],
    },
    {
      word_id: 4,
      word: "問題",
      word_meaning: "문제",
      word_furigana: "もんだい",
      word_level: "N5",
      word_quiz: ["まんだい", "もんじろ", "むんだい"]
    },
    {
      word_id: 5,
      word: "お茶",
      word_meaning: "녹차",
      word_furigana: "おちゃ",
      word_level: "N5",
      word_quiz: ["あちゃ", "こうちゃ", "ちゃば"]
    },
    {
      word_id: 6,
      word: "黒",
      word_meaning: "검정",
      word_furigana: "くろ",
      word_level: "N5",
      word_quiz: ["ごくばん", "しろ", "かろ"]
    },
    {
      word_id: 7,
      word: "台所",
      word_meaning: "부엌, 주방",
      word_furigana: "だいどころ",
      word_level: "N5",
      word_quiz: ["めんどころ", "たいどころ", "だいところ"]
    },
    {
      word_id: 8,
      word: "葉書",
      word_meaning: "엽서",
      word_furigana: "はがき",
      word_level: "N5",
      word_quiz: ["ばがき", "はかき", "はばね"]
    },
    {
      word_id: 9,
      word: "ペン",
      word_meaning: "펜",
      word_furigana: "pen",
      word_level: "N5",
      word_quiz: ["ppen", "hen", "fan"]
    },
    {
      word_id: 10,
      word: "ニュース",
      word_meaning: "뉴스",
      word_furigana: "news",
      word_level: "N5",
      word_quiz: ["new", "mas", "news24"]
    },
    {
      word_id: 11,
      word: "花瓶",
      word_meaning: "꽃병",
      word_furigana: "かびん",
      word_level: "N5",
      word_quiz: ["がびん", "かひん", "かおり"]
    },
    {
      word_id: 12,
      word: "フォーク",
      word_meaning: "포크",
      word_furigana: "fork",
      word_level: "N5",
      word_quiz: ["pork", "fulk", "fak"]
    }
  ];

  for (const item of initialWords) {
    const exists = await wordsRepository.findOne({ where: { word: item.word } });
    if (!exists) {
      const wordEntity = wordsRepository.create(item);
      await wordsRepository.save(wordEntity);
      console.log(`✅ 단어 삽입 완료: ${item.word}`);
    } else {
      console.log(`⏩ 이미 존재하는 데이터: ${item.word}`);
    }
  }
};