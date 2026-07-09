import Phaser from 'phaser';
import { t } from '../services/i18n';
import { loadLocalBest } from '../services/saveLocal';
import { attachTapFeedback } from '../ui/tapFeedback';

// タイトル画面のシーン（背景・ロゴ・START・自己ベストを配置）
// ④の骨組み＋装飾。ランキング/言語ボタンは場所のみ確保し、機能は後続サイクルで実装する
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;

    // 背景（草原シーン）をカバー配置：画面全体を覆い、はみ出す分は左右が切れる
    const bg = this.add.image(w / 2, h / 2, 'ui_title_bg');
    const cover = Math.max(w / bg.width, h / bg.height); // 大きい方の倍率で覆う
    bg.setScale(cover);

    // ロゴ（消しかす）を左上に置き、軽く上下に揺らす
    const logo = this.add.image(120, 96, 'logo_title');
    logo.setScale(200 / logo.width); // 横幅200px目安に縮小（比率維持）
    this.tweens.add({
      targets: logo,
      y: logo.y - 8,   // 少し上へ
      duration: 900,
      yoyo: true,      // 元へ戻す
      repeat: -1,      // ずっと繰り返す
      ease: 'Sine.easeInOut',
    });

    // STARTボタン（角丸＋影＋白フチの立体的なボタン）
    const btnW = 220;
    const btnH = 84;
    const btnY = 440;
    const start = this.add.container(w / 2, btnY);

    const shadow = this.add.graphics();                        // 影（少し下にずらした角丸）
    shadow.fillStyle(0x8a4256, 0.35);
    shadow.fillRoundedRect(-btnW / 2 + 4, -btnH / 2 + 6, btnW, btnH, 28);

    const face = this.add.graphics();                          // ボタン本体
    face.fillStyle(0xe98aa0, 1);                               // 濃いめピンク
    face.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 28);
    face.lineStyle(4, 0xffffff, 0.9);                          // 白フチ
    face.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 28);

    const label = this.add.text(0, 0, t('title.start'), {
      fontSize: '44px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);

    start.add([shadow, face, label]);
    start.setSize(btnW, btnH);
    // Containerはwidth/heightからヒットエリアRectangle(0,0,w,h)を自動生成する。
    // ここで中心基準のRectangleを明示すると、displayOrigin(＝幅/2・高さ/2)の補正が
    // 二重に掛かり、判定範囲がボタン半分ぶん左上へずれる（Phaser 4.2.0のソースで確認）
    start.setInteractive({ useHandCursor: true });
    // タップで少し拡大→元の大きさへ戻ってからGameSceneへ移る。
    // onceの既定はtrueなので、演出中に連打しても遷移は1回だけ
    attachTapFeedback(this, start, () => this.scene.start('GameScene'));

    // STARTの上に人気2匹（ぶた・うさぎ）を乗せて軽くバウンスさせる
    const charY = btnY - btnH / 2 - 6;                         // ボタン上辺あたり
    const pig = this.add.image(w / 2 - 46, charY, 'char_pig').setOrigin(0.5, 1);
    pig.setScale(56 / pig.height);                             // 高さ56px目安
    const rabbit = this.add.image(w / 2 + 46, charY, 'char_rabbit').setOrigin(0.5, 1);
    rabbit.setScale(56 / rabbit.height);
    // 上下に軽く跳ねる。2匹の位相をずらして自然に見せる
    this.tweens.add({ targets: pig, y: charY - 14, duration: 480, yoyo: true, repeat: -1, ease: 'Quad.easeInOut' });
    this.tweens.add({ targets: rabbit, y: charY - 14, duration: 480, yoyo: true, repeat: -1, ease: 'Quad.easeInOut', delay: 240 });

    // ランキングボタン（STARTの下）— 場所のみ確保。機能はランキング表示サイクルで実装
    this.add.text(w / 2, 560, '🏆', {
      fontSize: '32px', backgroundColor: '#f7c6cf', padding: { x: 18, y: 10 },
    }).setOrigin(0.5);

    // 言語ボタン（右上）— 場所のみ確保。機能は言語選択サイクルで実装
    this.add.text(w - 40, 40, '🌐', {
      fontSize: '28px', backgroundColor: '#f7c6cf', padding: { x: 14, y: 8 },
    }).setOrigin(0.5);

    // 自己ベスト表示（左下）。草原の上でも読めるよう白フチを付ける
    const best = loadLocalBest();
    this.add.text(20, h - 36, `${t('game.best')} ${best}`, {
      fontSize: '24px', color: '#a8566b', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setStroke('#ffffff', 5);
  }
}