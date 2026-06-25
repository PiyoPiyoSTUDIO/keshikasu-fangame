import { createClient } from '@supabase/supabase-js';

// URLと公開キーを環境変数から読み込む（公開キーはRLS前提で安全）
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

// 匿名ログイン（セッションが無ければ作成する）
export async function ensureAnonSignIn(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    await supabase.auth.signInAnonymously();
  }
}

// 自己ベストを保存する（1ユーザー1行をupsert）
async function saveBest(name: string, best: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // セッション未確立時は黙ってスキップ
  await supabase.from('scores').upsert(
    {
      user_id: user.id,                  // 自分の行を一意に特定
      name,
      best,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}

// ベスト更新時のみサーバーへ送る（only-if-best）。失敗してもゲームは止めない
export async function submitBest(name: string, finalScore: number): Promise<void> {
  try {
    await ensureAnonSignIn();         // 背景で匿名セッション確保
    await saveBest(name, finalScore); // 自分の1行をupsert
  } catch {
    // オフライン・サーバー障害時は黙ってスキップ。次回更新時に再送される
  }
}

// ランキング上位を取得する（表示はタイトル画面で利用予定）
export async function fetchTop(limit = 50): Promise<{ name: string; best: number }[]> {
  try {
    const { data } = await supabase
      .from('scores')
      .select('name, best')
      .order('best', { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return []; // 取得失敗時は空配列
  }
}