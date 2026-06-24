import Phaser from 'phaser';
import { MergeTier } from '../types';
import { spawnableTiers, tierById } from '../data/merge_ladder';

// ゲーム本体のシーン（タップでケシカスを落として物理で積む）
export class GameScene extends Phaser.Scene {
  private score = 0; // 現在のスコア

  constructor() {
    super('GameScene');
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    const wall = 20; // 壁・床の厚み

    // 物理の壁・床（静的ボディ）
    this.matter.add.rectangle(w / 2, h - wall / 2, w, wall, { isStatic: true }); // 床
    this.matter.add.rectangle(wall / 2, h / 2, wall, h, { isStatic: true });     // 左壁
    this.matter.add.rectangle(w - wall / 2, h / 2, wall, h, { isStatic: true }); // 右壁

    // 床・壁を見える線で描く
    const g = this.add.graphics();
    g.fillStyle(0xcf8b9b, 1); // 濃いめのピンク
    g.fillRect(0, h - wall, w, wall);
    g.fillRect(0, 0, wall, h);
    g.fillRect(w - wall, 0, wall, h);

     // タップした位置にケシカスを落とす
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.dropKeshi(pointer.x);
    });

    // 衝突したら合体判定を行う
    this.matter.world.on('collisionstart', (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
      for (const pair of event.pairs) {
        this.tryMerge(pair.bodyA, pair.bodyB);
      }
    });
  }

  // ドロップ可能な段階（1〜3段）からランダムに1つ選んで落とす
  private dropKeshi(x: number) {
    const tiers = spawnableTiers();
    const tier = tiers[Phaser.Math.Between(0, tiers.length - 1)];
    this.spawn(tier, x, 70);
  }

  // 指定段階のケシカスを生成する（見た目＝画像、物理＝円）
  private spawn(tier: MergeTier, x: number, y: number) {
    // 画像スプライトを置き、当たり判定の直径に合わせて拡大縮小
    const sprite = this.add.image(0, 0, tier.asset);
    const diameter = tier.radius * 2;
    const scale = diameter / Math.max(sprite.width, sprite.height);
    sprite.setScale(scale);

    // スプライトに円の物理ボディを付ける
    const body = this.matter.add.gameObject(sprite, {
      shape: { type: 'circle', radius: tier.radius },
      restitution: 0.2, // 反発
      friction: 0.4,    // 摩擦（転がりすぎ防止）
    }) as Phaser.Physics.Matter.Sprite;

    body.setPosition(x, y);
    // 段階idを覚えておく（後で合体判定に使う）
   body.setData('tierId', tier.id);
    return body;
  }

  // 衝突した2つが同じ段階なら合体させる
  private tryMerge(bodyA: MatterJS.BodyType, bodyB: MatterJS.BodyType) {
    const a = bodyA.gameObject as Phaser.Physics.Matter.Sprite | null;
    const b = bodyB.gameObject as Phaser.Physics.Matter.Sprite | null;
    if (!a || !b) return; // 壁・床はgameObjectが無い

    const ta = a.getData('tierId');
    const tb = b.getData('tierId');
    if (ta == null || tb == null || ta !== tb) return; // 違う段階は合体しない

    // 既に合体処理に使われた個体は無視（二重合体の防止）
    if (a.getData('merged') || b.getData('merged')) return;

    const next = tierById(ta + 1);
    if (!next) return; // 最上段（マンモス）はこれ以上合体しない

    a.setData('merged', true);
    b.setData('merged', true);

    // 合体地点＝2つの中間
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;

    a.destroy();
    b.destroy();

    // 上位段階を1つ生成
    this.spawn(next, mx, my);

    // スコア加算（次段階のscore）
    this.addScore(next.score);
  }

  // スコアを加算する（表示は次のステップで作る）
  private addScore(points: number) {
    this.score += points;
  }
}