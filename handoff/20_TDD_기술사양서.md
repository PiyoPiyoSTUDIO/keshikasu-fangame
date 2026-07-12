# 20. TDD — 기술 사양서

- **문서 버전**: v1.3 (Phase 1 머지 기준)
- **최종 수정**: 2026-07-09
- **범위**: Phase 1(머지)의 클라이언트 아키텍처 · 데이터 스키마 · 폴더구조. 서버 상세는 `50_서버사양` 참조.
- **v1.2 변경점**: `src/ui/` 폴더 신설 반영 / **§7.1 Phaser 4 입력 판정 규칙 신설**(Container 히트영역 함정)
- **v1.3 변경점(2026-07-13)**: §7.2 탭 피드백 규칙에 retry 실적용(=`once` 기본 true) 반영 / **§7.3 scene.restart() 규칙 신설**(상태 리셋 + 입력 리스너 shutdown 해제) / §9에 restart 리셋 원칙 링크

---

## 1. 목적
머지 게임을 "데이터 주도(data-driven)"로 설계해, Phase 2(클리커) · Phase 3(수집)로 확장할 때 구조를 갈아엎지 않도록 한다.

## 2. 기술 스택 상세 (실제 설치 버전, lockfile 고정)
| 항목 | 실제 버전 | 비고 |
|---|---|---|
| 언어 | TypeScript **5.9.3** | 정적 타입 |
| 엔진 | Phaser **4.2.0** | 2026 정식판 |
| 물리 | Matter (Phaser 내장) | 별도 설치 불필요 |
| 빌드 | Vite **8.1.0** | `package.json` + lockfile로 버전 고정 |
| 백엔드 | @supabase/supabase-js **2.108.2** | 랭킹 · 세이브 (2026-06-25 설치) |
| 앱화(차후) | Capacitor | 미설치. 웹 → 네이티브 |
| 다국어 | 경량 자체 i18n | 의존성 추가 없음, 상세 `25_L10N사양` |

> 버전 갱신 시 이 표와 `99` §2를 함께 고친다. (추측 금지 — 실제 설치 버전 기재)

## 3. 아키텍처 개요
- **클라이언트(브라우저)**: 게임 로직 · 물리 · 렌더 전부 처리. Phase 1 코어는 오프라인으로도 동작.
- **로컬 저장(localStorage)**: 자기 최고점 보관. 서버 없이 동작. (중단 판 저장은 Vol.2)
- **서버(Supabase)**: 랭킹 조회 · 최고점 클라우드 백업. 네트워크 없으면 graceful하게 생략.

```
[Browser]
  index.html
    ├─ #wallpaper (キャンバス外の装飾レイヤー, z-index 0)
    └─ #game ──── Phaser(canvas, z-index 1) ── localStorage
                       │
                       └── (online) ── supabase-js ── Supabase
```

### 3.1 벽지 레이어 (`#wallpaper`) — 캔버스 **바깥**
`index.html`에 인라인 CSS/JS로 구현된 전(全)화면 배경 장식. **Phaser 관할이 아니다.**

- **역할**: 캔버스(450×800 FIT) 양옆에 생기는 레터박스 여백을 케시카스 문구 사선 티커로 채운다.
- **적용 범위**: 전 화면 공통(A안). 씬 전환과 무관하게 항상 존재 → **씬 코드 무수정**.
- **격리 원칙**:
  - `pointer-events: none` → 게임 입력을 절대 가로채지 않는다.
  - `z-index: 0` (`#game`은 `1`) → 항상 캔버스 뒤.
  - `aria-hidden="true"` → 스크린리더 대상 제외.
- **확장 훅**: `<html data-wp="default">`. 씬별 벽지가 필요해지면 CSS 변수만 오버라이드.
- **데이터 주입**: 문구는 `#wallpaper[data-words]`, 띠 개수는 `[data-bands]`. **로케일 전환 대상이 아님**(4개 언어 동시 표시, `25` §13).
- **접근성**: `@media (prefers-reduced-motion: reduce)` → 애니메이션 정지.
- **튜닝값 전량**: `15_구현현황` §3.2

> 원칙: **색 · 속도 · 각도 · 문구 변경은 `index.html`의 CSS 변수 / `data-*` 속성만 수정**한다. TypeScript 쪽을 건드리지 않는다.

## 4. 폴더 구조

### 4.1 목표 구조 (Phase 1~3 확장 대비)
```
keshikasu-fangame/
├─ public/
│  └─ assets/
│     ├─ characters/
│     ├─ ui/
│     ├─ audio/
│     ├─ logo/
│     └─ fonts/
├─ src/
│  ├─ main.ts
│  ├─ config.ts
│  ├─ types.ts
│  ├─ vite-env.d.ts
│  ├─ scenes/
│  │  ├─ BootScene.ts
│  │  ├─ PreloadScene.ts
│  │  ├─ TitleScene.ts
│  │  ├─ GameScene.ts
│  │  └─ GameOverScene.ts
│  ├─ objects/
│  │  └─ Keshi.ts
│  ├─ systems/
│  │  ├─ MergeSystem.ts
│  │  └─ ScoreSystem.ts
│  ├─ ui/
│  │  └─ tapFeedback.ts
│  ├─ data/
│  │  └─ merge_ladder.ts
│  ├─ locales/
│  │  ├─ ja.json
│  │  ├─ en.json
│  │  ├─ ko.json
│  │  ├─ zh-CN.json
│  │  └─ zh-TW.json
│  └─ services/
│     ├─ saveLocal.ts
│     ├─ supabase.ts
│     └─ i18n.ts
├─ index.html
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ .gitignore
└─ .github/workflows/
   ├─ deploy.yml
   └─ keepalive.yml
```

### 4.2 실물과의 차이 (2026-07-09 시점)
| 항목 | 상태 |
|---|---|
| `ui/tapFeedback.ts` | ✅ **생성됨** (Cycle 5d) |
| `scenes/BootScene.ts` | **미생성**. PreloadScene이 진입 씬. **5e에서 생성 예정** |
| `scenes/GameOverScene.ts` | **미생성**. 게임오버는 GameScene 내 오버레이 |
| `objects/Keshi.ts` | **미생성**. GameScene이 직접 스프라이트+바디 생성 |
| `systems/MergeSystem.ts` · `ScoreSystem.ts` | **미생성**. 로직이 GameScene에 인라인 |
| `assets/fonts/` | **미생성**. 시스템 폰트 사용 중 |
| `.github/workflows/keepalive.yml` | **미생성** (`50` §8 미착수) |
| `.env` | 존재. **gitignore 대상, 커밋 안 함** |
| `.gitattributes` | **미생성** (바이너리 CRLF 보호, `99` §6.3) |

> 실제 파일 목록의 source of truth는 **`15_구현현황` §4**. 본 문서는 목표 구조를 기술한다.

### 4.3 경로별 역할
| 경로 | 역할 |
|---|---|
| `index.html` | 진입 HTML. `#game`(Phaser 마운트) + **`#wallpaper`(캔버스 바깥 벽지, §3.1)** |
| `config.ts` | Phaser 게임 설정(해상도 · 물리 · 스케일 · 씬 배열) |
| `types.ts` | 공용 타입 정의 |
| `vite-env.d.ts` | `import.meta.env` 타입 정의 |
| `scenes/` | 화면 단위(부트 → 프리로드 → 타이틀 → 게임) |
| **`ui/tapFeedback.ts`** | **탭 확대 피드백 공용 헬퍼(`attachTapFeedback`). 씬·서비스 어느 쪽도 아닌 표현 계층** |
| `objects/Keshi.ts` | 떨어지는 케시카스 1개(스프라이트 + 물리바디) *(계획)* |
| `systems/MergeSystem.ts` | 합체 감지 · 처리 *(계획)* |
| `systems/ScoreSystem.ts` | 점수 계산 · 최고점 *(계획)* |
| `data/merge_ladder.ts` | 합체 사다리 데이터(확장 핵심) |
| `locales/*.json` | 언어별 문자열 테이블(L10N 데이터, 상세 `25`) |
| `services/saveLocal.ts` | localStorage 입출력 |
| `services/supabase.ts` | 익명로그인 · 랭킹 · 백업 (지연 초기화 + null 가드) |
| `services/i18n.ts` | 키 → 문자열 조회 · 폴백(ja) · 언어감지 |

> **`ui/` vs `services/` 구분**: `services/`는 외부 세계(localStorage · 네트워크 · 사전 데이터)와 통신한다. `ui/`는 화면 표현만 다루며 부수효과가 없다.

## 5. 씬(Scene) 구성
| 씬 | 책임 | 상태 |
|---|---|---|
| BootScene | 로딩 화면용 최소 에셋(캐릭터 4종) 로드, i18n 초기화, PreloadScene으로 이동 | 미생성 (5e) |
| PreloadScene | 이미지 · 음원 · 데이터 로드, 로딩 표시 | ✅ 진입 씬 |
| TitleScene | 시작 버튼, 랭킹 보기, 언어 선택 | ✅ (랭킹·언어는 자리만) |
| GameScene | 코어 루프(드롭 · 물리 · 합체 · 점수 · 게임오버 판정) | ✅ |
| GameOverScene | 결과 · 다시하기 · 최고점 전송 | 미생성(GameScene 오버레이) |

**현재 씬 배열**: `[PreloadScene, TitleScene, GameScene]` (`config.ts`)
**5e 이후 목표**: `[BootScene, PreloadScene, TitleScene, GameScene]`

## 6. 데이터 스키마 (클라이언트)

### 6.1 합체 사다리 1단 정의
```typescript
// マージ段階1つ分の定義（多言語対応）
export interface MergeTier {
  id: number;          // 段階番号（1が最小）
  key: string;         // キャラクター識別子（例: "bee"）
  nameKey: string;     // 表示名のL10Nキー（例: "char.bee.name"）
  radius: number;      // 物理判定の半径（px）
  score: number;       // この段階に合体した時の加算スコア
  spawnable: boolean;  // ドロップ抽選の対象かどうか
  asset: string;       // スプライト画像キー（文字なし画像は全言語共通）
}
```

- 실제 데이터: 동물 11종(bee → mammoth). radius 24~130. spawnable = 1~3단.
- 헬퍼: `tierById()`, `spawnableTiers()`

### 6.2 로컬 저장 데이터
```typescript
// ローカル保存データ（localStorage: keshikasu.save）
export interface SaveData {
  best: number;          // 自己ベストスコア
  updatedAt: number;     // 更新時刻（UNIXミリ秒）
  // current?: 中断盤面は将来対応（Vol.2）
}
```

### 6.3 서버 랭킹 1행 (참조용; 상세는 `50`)
```typescript
// サーバー（Supabase）のランキング1行
export interface ScoreRecord {
  name: string;          // 表示名
  best: number;          // 自己ベストスコア
}
```

## 7. 물리(Matter) 설정
```typescript
import Phaser from 'phaser';

// ゲーム全体の設定
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,            // WebGL優先、不可ならCanvasに自動切替
  parent: 'game',               // index.htmlの<div id="game">にマウント
  width: 450,                   // 仮想解像度の幅（縦持ち想定）
  height: 800,                  // 仮想解像度の高さ
  backgroundColor: '#fce0e3',   // 背景色（ケシカスの淡いピンク）
  scale: {
    mode: Phaser.Scale.FIT,     // 画面に合わせて拡大縮小
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'matter',          // Matter物理を使用
    matter: {
      gravity: { x: 0, y: 1 },  // 下向き重力
      debug: false,             // 開発時のみtrueにする
    },
  },
  scene: [],                    // シーンは後で登録する
};
```

- **합체 감지**: 같은 `key`의 두 바디가 충돌(`collisionstart`)하면 둘 제거 → 충돌 중점에 다음 단계 1개 생성.
- **데드라인**: 플레이필드 상단 y좌표(현재 120). 바디가 이 위에 일정 시간(1500ms) 머물면 게임오버.
- **드롭 쿨다운**: 낙하 직후 짧은 입력 잠금(현재 600ms, 중복 드롭 방지).
- **Phaser 4 주의**: 바디 목록은 `world.getAllBodies()` (v3와 API 상이).

### 7.1 ★ 입력 판정(히트영역) 규칙 — Phaser 4 필수 준수
**Phaser 4.2.0은 히트 판정 직전 로컬 좌표에 `displayOrigin`을 더한다.**

`src/input/InputManager.js`
```js
pointWithinHitArea: function (gameObject, x, y) {
    //  Normalize the origin
    x += gameObject.displayOriginX;
    y += gameObject.displayOriginY;
    ...
}
```
`src/gameobjects/container/Container.js`
```js
displayOriginX: { get: function () { return this.width * 0.5; } }
```

#### 규칙
1. **히트영역 좌표를 손으로 계산해 넘기지 않는다.** 반드시 객체 크기에서 파생시킨다.
   ```typescript
   // NG: 中心基準のRectangleを渡すとdisplayOrigin補正が二重に掛かる
   container.setInteractive(
     new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
     Phaser.Geom.Rectangle.Contains,
   );

   // OK: setSize後は引数なしでPhaserにRectangle(0,0,w,h)を作らせる
   container.setSize(w, h);
   container.setInteractive({ useHandCursor: true });
   ```
2. **Container에 `pixelPerfect`는 불가.** 소스에 `console.warn('Cannot pixelPerfect test a Container.')`. 텍스처 기반(Image/Sprite)만 가능.
3. **`pixelPerfect`의 `alphaTolerance` 기본값 = 1.** 알파 1/255 이상이면 눌림. **반투명 그림자를 텍스처에 포함시키면 그림자도 눌린다** → 그림자는 별도 비인터랙티브 레이어로.
4. Text · Image는 `Origin` 컴포넌트를 정상 보유하므로 기본 경로가 옳게 동작한다.

> **재현 실측**(220×84 버튼, 중심 `(225, 440)`): 그려진 영역 `x 115~335 / y 398~482` vs 잘못된 히트영역 `x 5~225 / y 356~440`. 겹침 = 버튼 면적의 **1/4**. Cycle 5c에서 수정.

### 7.2 탭 피드백 규칙
- 모든 누를 수 있는 오브젝트는 `ui/tapFeedback.ts`의 `attachTapFeedback()`을 사용한다.
- **연출 완료 후** 본 처리를 실행한다(`onComplete`). `pointerdown` 즉시 씬을 바꾸면 연출이 보이지 않는다.
- **`once` 판정 기준(확정)**: **눌린 순간 그 버튼이 파괴되는가**로 정한다.
  - **파괴형 → `once: true`(기본값)**. 예: START(씬 전환), **retry(`scene.restart()`로 자기까지 파괴)**. 연타해도 1회만 발화되어 이중 실행을 막는다.
  - **잔존형 → `{ once: false }`**. 눌린 뒤에도 화면에 남아 반복해서 눌러야 하는 버튼(설정 토글 등).
- ⚠️ **retry는 `once: true`가 정답**이다. "다시하기니까 반복 가능=false"로 오판하기 쉬우나(옛 문서 오류), 버튼 오브젝트 자체는 restart로 파괴되고 다음 `gameOver()`에서 **새로 생성**되므로 각 인스턴스는 1회만 발화하면 된다. (2026-07-13 Cycle 5d 확정, 라이브 U11-b 통과)

### 7.3 ★ scene.restart() 규칙 — 상태 리셋 + 입력 리스너 해제
`scene.restart()`는 **같은 씬 인스턴스를 재사용**하고 `create()`만 다시 부른다. **생성자와 클래스 필드 초기화자(`private x = 0`)는 재실행되지 않으며**, input 플러그인 등 씬 부속 객체도 파괴되지 않는다. 이를 모르면 아래 2버그가 난다(Cycle 5d에서 GameScene에 실재, 수정 완료).

1. **판 상태는 `create()` 첫머리에서 명시 리셋한다.** 필드 선언의 `= 초기값`에 의존하지 않는다.
   ```typescript
   // 例: GameScene.create()先頭
   this.score = 0;
   this.canDrop = true;
   this.nextTierId = 1;
   this.overTime = 0;
   this.isGameOver = false;
   ```
   - 누락 시: 이전 판의 `isGameOver=true`가 생존 → 재시작 후 드롭 가드에 항상 걸려 **입력 전면 불능**.
2. **`this.input.on(...)`은 명명 메서드로 등록(context 명시)하고 `shutdown`에서 `off` 해제한다.**
   ```typescript
   this.input.on('pointerdown', this.onPointerDown, this);
   this.events.once('shutdown', () => {
     this.input.off('pointerdown', this.onPointerDown, this);
   });
   ```
   - 누락 시: restart마다 리스너가 누적 → 탭 1회에 드롭 N회.
   - `off`가 정확히 먹으려면 **인라인 화살표가 아니라 안정된 함수 참조 + 동일 context**가 필수.

> **적용 대상**: restart로 재사용될 수 있는 모든 씬. QA는 `40` §4 F9(재시작 후 드롭 재개)·F10(반복 무누적)으로 회귀 검증.

## 8. 합체 처리 흐름
1. `collisionstart` 이벤트 수신
2. 두 바디의 `key`가 같고, 둘 다 미합체 상태인지 확인
3. 같으면 → 두 바디 제거, 다음 단계 `MergeTier` 생성, 점수 가산
4. 최고 단계면 추가 보너스(Vol.2에서 정의)

## 9. 데이터 영속성
- **즉시**: 최고점 갱신 시 `saveLocal`로 localStorage 기록(오프라인 보장).
- **백업/랭킹**: 온라인이면 `supabase.ts`로 upsert + 상위 N 조회. 실패해도 게임 진행에 영향 없음.
- **환경변수 부재 시**: `supabase.ts`는 **지연 초기화**(`getClient()`)로 `null`을 반환하고 조용히 생략한다. 모듈 최상단에서 `createClient()`를 호출하면 import 시점에 throw되어 Phaser 부팅 전에 게임이 죽는다. (Cycle 4에서 실제 발생)
- **only-if-best 판정**: 반드시 `loadLocalBest()`(저장값)와 비교한다. 실시간 갱신되는 `this.best`와 비교하면 게임오버 시점에 항상 동일해져 판정이 무너진다.
- **재시작 시 런타임 상태**: `scene.restart()`는 필드 초기화자를 재실행하지 않으므로 `isGameOver` 등 판 상태는 `create()`에서 명시 리셋해야 한다. 상세 §7.3.

## 10. 명명 규칙
- 파일: 클래스 = PascalCase(`GameScene.ts`), 그 외 = camelCase(`saveLocal.ts`, `tapFeedback.ts`), 데이터 = snake_case(`merge_ladder.ts`)
- 에셋 키: `char_<key>`, `ui_<name>`, `sfx_<name>`, `logo_<name>__<locale>` (상세 `30_에셋파이프라인`)
- L10N 키: `<도메인>.<요소>` (예: `game.score`, `result.retry`, `char.bee.name`) (상세 `25_L10N사양`)
- 벽지 CSS: 변수 `--wp-*`, 클래스 `.wp-*`, 컨테이너 `#wallpaper` (충돌 방지 prefix)
- 코드 주석: **일본어**(한국어 단어 금지). 작성 후 한글 자음(ㄱ-ㅎ) 0건 확인.
- ※ **예외(표시 데이터)**: `locales/*.json`의 값, `index.html`의 `data-words` 값. 한글-금지 룰은 **코드 로직·주석(ts/sql/yaml/sh)** 한정. (상세 `25` §11)

## 11. 확장성 설계
- **모드 분리**: GameScene을 모드 1로 보고, Phase 2(클리커) · Phase 3(수집)는 별도 씬/시스템으로 추가. 공용은 `services/`(저장 · 서버) · `ui/`(표현)로 재사용.
- **데이터 주도**: 캐릭터/단계 추가 = `merge_ladder.ts` 수정만. 코드 변경 최소.
- **벽지 주도**: 배경 장식 변경 = `index.html`의 CSS 변수 / `data-*` 수정만. 씬 코드 무관.
- **39종 자산**: Phase 3 도감을 위해 에셋 키 체계를 처음부터 전체 캐릭터로 확장 가능하게 잡는다.

## 12. 빌드/실행 (요약; 상세 `60`)
- 개발: `npm run dev` → **`http://localhost:5173/`** (서브경로 X)
- 빌드: `npm run build` → `dist/` (이때만 base = `/keshikasu-fangame/`)
- 배포: main push → `deploy.yml` 자동 배포 (상세 `60`)

## 13. 미해결
- `objects/` · `systems/` 분리 리팩터링 (현재 GameScene 인라인) — 필요해질 때
- GameOverScene 생성 여부 (BootScene은 5e에서 생성 확정)
- 가상 해상도(450×800) 최종 확정 — 실제 일러스트 비율 보고 조정
- 벽지 티커: 저사양 기기 프레임 실측(띠 30개 상시 애니메이션, `will-change` 30개)
- 벽지 폰트 스택: 현재 시스템 폰트 의존 → ko/zh 자형 기기별 차이 가능
- START 버튼을 작가 PNG + `pixelPerfect`로 교체(§7.1-3 그림자 분리 필수)
