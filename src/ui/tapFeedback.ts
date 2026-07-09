import Phaser from 'phaser';

// タップされたことを目で分かるようにする共通フィードバック。
// 少しだけ拡大してから元へ戻し、演出が終わった後に本来の処理を走らせる。
// TitleSceneのSTART、GameSceneのリトライなど、押せるもの全てで使い回す。

// 拡大演出の調整値（変更時はドキュメント15 §3.1も更新する）
const TAP_SCALE = 1.06;   // 拡大倍率
const TAP_DURATION = 90;  // 片道の時間（ミリ秒）。yoyoで往復するので体感は約180ms

// scaleとイベントを持つゲームオブジェクトなら何でも渡せる
type TapTarget = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform;

export interface TapFeedbackOptions {
  // trueなら1回だけ受け付ける（シーン遷移のような二重発火を防ぐ）
  once?: boolean;
}

// targetのpointerdownに拡大フィードバックを付け、演出後にonTapを呼ぶ。
// 呼ぶ前に target.setInteractive(...) を済ませておくこと。
export function attachTapFeedback(
  scene: Phaser.Scene,
  target: TapTarget,
  onTap: () => void,
  options: TapFeedbackOptions = {},
): void {
  const once = options.once ?? true;
  let locked = false; // 演出中の再入と、遷移の二重発火を防ぐ錠

  target.on('pointerdown', () => {
    if (locked) return;
    locked = true;

    // 元の大きさを基準に倍率を掛ける（画像ごとにscaleが違うため固定値にしない）
    const base = target.scale;

    scene.tweens.add({
      targets: target,
      scale: base * TAP_SCALE, // 少しふくらむ
      duration: TAP_DURATION,
      yoyo: true,              // 元の大きさへ戻す
      ease: 'Quad.easeOut',
      onComplete: () => {
        onTap();                   // 演出が終わってから本来の処理を実行する
        if (!once) locked = false; // 繰り返し押せるボタンは錠を外す
      },
    });
  });
}