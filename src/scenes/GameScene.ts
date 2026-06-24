import Phaser from 'phaser';
import { MergeTier } from '../types';
import { spawnableTiers, tierById } from '../data/merge_ladder';

// ゲーム本体のシーン（タップでケシカスを落として物理で積む）
export class GameScene extends Phaser.Scene {
  private score = 0; // 現在のスコア
  private scoreText!: Phaser.GameObjects.Text; // スコア表示テキスト
  private canDrop = true; // 今ドロップ可能か（クールタイム制御）
  private readonly dropCooldown = 600; // ドロップ後の待機時間（ミリ秒）
  private nextTierId = 1; // 次に落とす段階のid（NEXT）
  private nextPreview!: Phaser.GameObjects.Image; // NEXTのプレビュー画像
  private deadlineY = 120; // この高さより上に積み上がるとアウト判定
  private overTime = 0; // デッドラインを超え続けている時間（ミリ秒）
  private isGameOver = false; // ゲームオーバー中か

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

    // デッドライン（薄い線で表示）
    const dl = this.add.graphics();
    dl.lineStyle(2, 0xe79bb0, 0.7); // 薄ピンクの線
    dl.lineBetween(0, this.deadlineY, w, this.deadlineY);

    // スコア表示（画面上部・中央）
    this.scoreText = this.add.text(w / 2, 30, '0', {
      fontSize: '48px',
      color: '#a8566b',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(1000); // 最前面に表示

    // NEXTプレビュー（右上。原点を右上に置き、右マージン10pxで配置）
    this.nextPreview = this.add.image(w - 30, 10, '')
      .setOrigin(1, 0) // 原点を画像の右上に → 右端から10px内側に揃う
      .setDepth(1000);
    this.pickNext(); // 最初の「次のケシカス」を決める

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

  // 毎フレーム呼ばれる。デッドライン超過を監視する
  update(_time: number, delta: number) {
    if (this.isGameOver) return;

    // 落下中以外でデッドラインより上にある物体があるか調べる
    let over = false;
    for (const body of this.matter.world.getAllBodies()) {
      const go = (body as MatterJS.BodyType).gameObject;
      if (!go) continue; // 壁・床は除外
      // ほぼ静止していて、デッドラインを超えている個体だけ対象
      const speed = Math.hypot(body.velocity.x, body.velocity.y);
      if (body.position.y < this.deadlineY && speed < 1.5) {
        over = true;
        break;
      }
    }

    // 超え続けた時間を積算。一定時間続いたらゲームオーバー
    if (over) {
      this.overTime += delta;
      if (this.overTime > 1500) this.gameOver();
    } else {
      this.overTime = 0; // 超えていなければリセット
    }
  }

  // 次に落とす段階を抽選し、NEXTプレビューを更新する
  private pickNext() {
    const tiers = spawnableTiers();
    this.nextTierId = tiers[Phaser.Math.Between(0, tiers.length - 1)].id;
    const tier = tierById(this.nextTierId)!;
    this.nextPreview.setTexture(tier.asset);

    // 高さだけ56pxに固定し、幅は元画像の比率を保つ（歪み防止）
    const targetH = 56;
    const ratio = targetH / this.nextPreview.height; // テクスチャ実寸から倍率を算出
    this.nextPreview.setScale(ratio);
  }

  // ドロップ可能な段階（1〜3段）からランダムに1つ選んで落とす
  private dropKeshi(x: number) {
    if (this.isGameOver) return; // ゲームオーバー中はドロップ不可
    if (!this.canDrop) return; // クールタイム中は無視

    // 今のNEXTを落とす
    const tier = tierById(this.nextTierId)!;
    this.spawn(tier, x, 70);

    // 次のNEXTを決めてプレビュー更新
    this.pickNext();

    // クールタイム開始：一定時間後に再びドロップ可能にする
    this.canDrop = false;
    this.time.delayedCall(this.dropCooldown, () => {
      this.canDrop = true;
    });
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
    const merged = this.spawn(next, mx, my);

    // ポップ演出（少し大きくしてから元に戻す）
    const base = merged.scale;
    this.tweens.add({
      targets: merged,
      scale: base * 1.25, // 一瞬ふくらむ
      duration: 110,
      yoyo: true,         // 元の大きさに戻す
      ease: 'Quad.easeOut',
    });

    // スコア加算（次段階のscore）
    this.addScore(next.score);
  }
  

  // スコアを加算して画面表示を更新する
  private addScore(points: number) {
    this.score += points;
    this.scoreText.setText(String(this.score));
  }

  // ゲームオーバー処理（入力停止＋結果表示＋リトライ）
  private gameOver() {
    this.isGameOver = true;
    const w = this.scale.width;
    const h = this.scale.height;

    // 半透明オーバーレイ
    this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.45).setDepth(2000);

    // 結果テキスト
    this.add.text(w / 2, h / 2 - 60, 'GAME OVER', {
      fontSize: '52px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2001);
    this.add.text(w / 2, h / 2, `Score ${this.score}`, {
      fontSize: '36px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(2001);

    // リトライボタン（タップでシーン再起動）
    const retry = this.add.text(w / 2, h / 2 + 70, 'RETRY', {
      fontSize: '40px', color: '#fce0e3', backgroundColor: '#a8566b',
      padding: { x: 24, y: 12 },
    }).setOrigin(0.5).setDepth(2001).setInteractive({ useHandCursor: true });

    retry.on('pointerdown', () => this.scene.restart());
  }
}