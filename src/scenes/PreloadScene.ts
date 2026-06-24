import Phaser from 'phaser';
import { MERGE_LADDER } from '../data/merge_ladder';

// ゲーム開始前にキャラ画像をまとめて読み込むシーン
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('PreloadScene');
  }

  preload() {
    // ラダーの全キャラ画像をassetキーで読み込む
    for (const tier of MERGE_LADDER) {
      this.load.image(tier.asset, `assets/characters/${tier.asset}.png`);
    }

    // 簡単な読み込み表示（中央のテキスト）
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;
    const label = this.add.text(cx, cy, 'Loading...', {
      fontSize: '28px',
      color: '#a86b78',
    }).setOrigin(0.5);

    // 進捗に合わせてテキストを更新
    this.load.on('progress', (p: number) => {
      label.setText(`Loading... ${Math.round(p * 100)}%`);
    });
  }

  create() {
    // 読み込みが終わったらゲーム画面へ
    this.scene.start('GameScene');
  }
}