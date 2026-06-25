import type { SaveData } from '../types';

// localStorageのキー（自己ベスト保存用）
const SAVE_KEY = 'keshikasu.save';

// 自己ベストを読み込む。無ければ0を返す（初回・オフラインでも安全）
export function loadLocalBest(): number {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw) as SaveData;
    return typeof data.best === 'number' ? data.best : 0;
  } catch {
    // 破損・パース失敗時は0扱い（ゲーム進行を止めない）
    return 0;
  }
}

// 自己ベストを保存する（best値と更新時刻を記録）
export function saveLocalBest(best: number): void {
  try {
    const data: SaveData = { best, updatedAt: Date.now() };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // 保存失敗（容量超過・プライベートモード等）は黙ってスキップ
  }
}