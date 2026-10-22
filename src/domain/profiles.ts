import type { Config } from './model'
// Authored practice examples only. Never imply current official timings.
export function practiceConfig(exam: Config['exam'], level: string): Config {
  const parts = exam === 'BJT'
    ? [['listening','Nghe',30,true],['combined','Nghe – đọc',30,true],['reading','Đọc',30,false]]
    : [['vocabulary','Từ vựng',30,false],['reading','Ngữ pháp & đọc',60,false],['listening','Nghe',30,true]]
  return { exam, level, year: 2026, version: 'authored-practice-v1', sourceStatus: 'UNVERIFIED', verifiedAt: null,
    sourceUrl: exam === 'JLPT' ? 'https://www.jlpt.jp/e/guideline/testsections.html' : exam === 'BJT' ? 'https://www.kanken.or.jp/bjt/english/' : 'https://www.nat-test.com/en/',
    sections: parts.map(([id,name,minutes,fixedAudio]) => ({id: String(id), name: String(name), budgetMs: Number(minutes)*60000, fixedAudio: Boolean(fixedAudio)})) }
}
