import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';

// ゲーム全体の設定（背景はケシカスの淡いピンク）
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,            // WebGL優先、不可ならCanvasに自動切替
  parent: 'game',              // index.htmlの<div id="game">にマウント
  width: 450,                  // 仮想解像度の幅（縦持ち想定）
  height: 800,                 // 仮想解像度の高さ
  backgroundColor: '#fce0e3',  // 背景色（淡いピンク）
  scale: {
    mode: Phaser.Scale.FIT,            // 画面に合わせて拡大縮小
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'matter',         // Matter物理を使用
    matter: {
      gravity: { x: 0, y: 1 }, // 下向き重力
      debug: false,            // 開発時のみtrueにする
    },
  },
  scene: [GameScene],                   // ゲームシーンを登録
};