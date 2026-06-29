import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// クライアントは遅延生成し、生成済みインスタンスをここに保持する
let client: SupabaseClient | null = null;
let initialized = false; // 初期化を一度だけ試みるためのフラグ

// 必要時にクライアントを取得する。環境変数が無ければnullを返し、ランキングを黙って省略する
function getClient(): SupabaseClient | null {
  if (initialized) return client; // 二度目以降はキャッシュを返す
  initialized = true;

  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // URL・キーが空なら生成しない（createClientは空URLでthrowするため）
  if (!url || !key) {
    return null; // ランキング機能のみ無効化。ゲーム本体は継続
  }

  // 公開キーはRLS前提で安全。生成失敗時もnullに倒してゲームを止めない
  try {
    client = createClient(url, key);
  } catch {
    client = null;
  }
  return client;
}

// 匿名ログイン（セッションが無ければ作成する）
export async function ensureAnonSignIn(): Promise<void> {
  const sb = getClient();
  if (!sb) return; // 環境変数が無ければ何もしない
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    await sb.auth.signInAnonymously();
  }
}

// 自己ベストを保存する（1ユーザー1行をupsert）
async function saveBest(name: string, best: number): Promise<void> {
  const sb = getClient();
  if (!sb) return; // 環境変数が無ければスキップ
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return; // セッション未確立時は黙ってスキップ
  await sb.from('scores').upsert(

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
    const sb = getClient();
    if (!sb) return []; // 環境変数が無ければ空配列
    const { data } = await sb
      .from('scores')
      .select('name, best')
      .order('best', { ascending: false })
      .limit(limit);
    return data ?? [];
  } catch {
    return []; // 取得失敗時は空配列
  }
}