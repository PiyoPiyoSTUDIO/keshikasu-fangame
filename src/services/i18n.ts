// 軽量i18n（依存ゼロ）。キーから現在言語の文字列を返し、無ければjaへフォールバックする
// 方式A: 辞書はVite importで各シーンから直接渡す（ランタイムfetchなし）

type Dict = Record<string, string>;

// 対応ロケール一覧（jaが基準・フォールバック）
export const SUPPORTED = ['ja', 'en', 'ko', 'zh-CN', 'zh-TW'] as const;
export type Locale = typeof SUPPORTED[number];

let current: Dict = {};  // 現在の言語の辞書
let fallback: Dict = {}; // 常にja（フォールバック用）

// 端末またはlocalStorageからロケールを推定する（対応外はjaに寄せる）
export function detectLocale(): Locale {
  // 1) ユーザーが手動選択した値を最優先（設定画面で保存・将来対応）
  const saved = localStorage.getItem('locale');
  if (saved && (SUPPORTED as readonly string[]).includes(saved)) {
    return saved as Locale;
  }

  // 2) 端末言語から推定
  const lang = navigator.language; // 例: "ko", "zh-TW", "ja-JP"
  if ((SUPPORTED as readonly string[]).includes(lang)) {
    return lang as Locale;
  }

  // 3) 地域サフィックスを落として再判定（例: "ja-JP" → "ja"）
  const base = lang.split('-')[0];
  if (base === 'zh') return 'zh-TW'; // 既定は繁体。簡体の精密判定は将来対応
  if ((SUPPORTED as readonly string[]).includes(base)) {
    return base as Locale;
  }

  // 4) どれにも当たらなければja
  return 'ja';
}

// 辞書を登録する（fallbackには必ずjaの辞書を渡すこと）
export function setDicts(currentDict: Dict, jaDict: Dict) {
  current = currentDict;
  fallback = jaDict;
}

// キーを翻訳する。無ければja、それも無ければキー文字列をそのまま返す
export function t(key: string): string {
  return current[key] ?? fallback[key] ?? key;
}