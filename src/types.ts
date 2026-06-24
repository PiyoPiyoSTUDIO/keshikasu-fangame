// マージ段階1つ分の定義（多言語対応）
export interface MergeTier {
  id: number; // 段階番号（1が最小）
  key: string; // キャラクター識別子（例: "bee"）
  nameKey: string; // 表示名のL10Nキー（例: "char.bee.name"）
  radius: number; // 表示時の物理半径（px、仮想解像度450x800基準・初期値）
  score: number; // この段階に合体した時の加算スコア
  spawnable: boolean; // ドロップ抽選の対象か
  asset: string; // スプライト画像のテクスチャキー
}

// ローカル保存データ（localStorage）
export interface SaveData {
  best: number; // 自己ベストスコア
  updatedAt: number; // 更新時刻（UNIXミリ秒）
}

// サーバー（Supabase）のランキング1行
export interface ScoreRecord {
  name: string; // 表示名
  best: number; // 自己ベストスコア
}
