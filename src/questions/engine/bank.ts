/**
 * QuestionBank: content/questions/**.json を読み込み、payload を各レンダラーの schema で検証して保持する。
 * 問題作成者がファイルを置く → manifest 再生成 → リロード、で反映される。
 */
import { questionBaseSchema, type QuestionBase } from '../contracts';
import { getRenderer } from '../renderers/registry';

export type QuestionFileReader = (relPath: string) => Promise<unknown>;

export interface BankLoadReport {
  loaded: number;
  skipped: { file: string; index: number; reason: string }[];
}

export class QuestionBank {
  private readonly byId = new Map<string, QuestionBase>();
  private readonly bySubject = new Map<string, QuestionBase[]>();

  static async load(
    files: string[],
    read: QuestionFileReader,
    opts: { includeSamples?: boolean } = {},
  ): Promise<{ bank: QuestionBank; report: BankLoadReport }> {
    const bank = new QuestionBank();
    const report: BankLoadReport = { loaded: 0, skipped: [] };
    for (const file of files) {
      if (!opts.includeSamples && file.startsWith('questions/_samples/')) continue;
      const raw = await read(file);
      if (!Array.isArray(raw)) {
        report.skipped.push({ file, index: -1, reason: '配列ではありません' });
        continue;
      }
      raw.forEach((q: unknown, index: number) => {
        const base = questionBaseSchema.safeParse(q);
        if (!base.success)
          return report.skipped.push({ file, index, reason: base.error.issues[0]?.message ?? 'invalid' });
        const r = getRenderer(base.data.type);
        if (!r) return report.skipped.push({ file, index, reason: `未登録タイプ ${base.data.type}` });
        const p = r.schema.safeParse(base.data.payload);
        if (!p.success)
          return report.skipped.push({
            file,
            index,
            reason: `payload: ${p.error.issues[0]?.message ?? 'invalid'}`,
          });
        bank.add({ ...base.data, payload: p.data } as QuestionBase);
        report.loaded++;
      });
    }
    return { bank, report };
  }

  add(q: QuestionBase): void {
    if (this.byId.has(q.id)) throw new Error(`問題 id 重複: ${q.id}`);
    this.byId.set(q.id, q);
    const list = this.bySubject.get(q.subject) ?? [];
    list.push(q);
    this.bySubject.set(q.subject, list);
  }

  get(id: string): QuestionBase | undefined {
    return this.byId.get(id);
  }

  get size(): number {
    return this.byId.size;
  }

  all(): QuestionBase[] {
    return [...this.byId.values()];
  }

  subject(s: string): QuestionBase[] {
    return this.bySubject.get(s) ?? [];
  }
}
