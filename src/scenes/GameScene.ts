import Phaser from 'phaser';

// ゲーム本体のシーン（タップで円を落として物理で積む）
export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const wall = 20; // 壁・床の厚み

    // 物理の壁・床（静的ボディ＝動かない）
    this.matter.add.rectangle(w / 2, h - wall / 2, w, wall, { isStatic: true }); // 床
    this.matter.add.rectangle(wall / 2, h / 2, wall, h, { isStatic: true });     // 左壁
    this.matter.add.rectangle(w - wall / 2, h / 2, wall, h, { isStatic: true }); // 右壁

    // 床と壁を見える線として描く（シーン起動の確認用）
    const g = this.add.graphics();
    g.fillStyle(0xcf8b9b, 1); // 濃いめのピンク
    g.fillRect(0, h - wall, w, wall);  // 床
    g.fillRect(0, 0, wall, h);         // 左壁
    g.fillRect(w - wall, 0, wall, h);  // 右壁

    // タップした位置に円を落とす
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.dropCircle(pointer.x);
    });
  }

  // 見える円（描画オブジェクト）に物理ボディを付けて落とす
  private dropCircle(x: number) {
    const radius = 30;
    const ball = this.add.circle(x, 70, radius, 0x6aa6ff); // 水色の円
    this.matter.add.gameObject(ball, {
      shape: { type: 'circle', radius }, // 円形の当たり判定
      restitution: 0.3,                  // 反発（弾み）
      friction: 0.1,                     // 摩擦
    });
  }
}