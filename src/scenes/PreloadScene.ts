import Phaser from 'phaser';
import { MERGE_LADDER } from '../data/merge_ladder';
import { setDicts, t } from '../services/i18n';
import ja from '../locales/ja.json';
// 現時点は日本語固定。言語選択UIはタイトル画面（④）で対応予定

// ゲーム開始前にキャラ画像をまとめて読み込むシーン
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // i18n初期化：現時点は日本語固定（jaをcurrentとfallback両方に渡す）
    // 言語選択UIを付ける時に、detectLocale()と他言語importをここへ追加する
    setDicts(ja, ja);

    // ラダーの全キャラ画像をassetキーで読み込む
    for (const tier of MERGE_LADDER) {
      this.load.image(tier.asset, `assets/characters/${tier.asset}.png`);
    }

    // 効果音を読み込む（drop=落下, merge=合体, gameover=ゲームオーバー）
    this.load.audio('sfx_drop', 'assets/audio/sfx_drop.wav');
    this.load.audio('sfx_merge', 'assets/audio/sfx_merge.wav');
    this.load.audio('sfx_gameover', 'assets/audio/sfx_gameover.wav');

    // 簡単な読み込み表示（中央のテキスト）
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const label = this.add.text(cx, cy, `${t('common.loading')}...`, {
      fontSize: '28px',
      color: '#a86b78',
    }).setOrigin(0.5);

    // 進捗に合わせてテキストを更新
    this.load.on('progress', (p: number) => {
      label.setText(`${t('common.loading')}... ${Math.round(p * 100)}%`);
    });
  }

  create() {
    // 読み込みが終わったらゲーム画面へ
    this.scene.start('GameScene');
  }
}