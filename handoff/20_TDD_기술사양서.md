# 20. TDD — 기술 사양서

- **문서 버전**: v1.0 (Phase 1 머지 기준)
- **최종 수정**: 2026-06-24
- **범위**: Phase 1(머지)의 클라이언트 아키텍처 · 데이터 스키마 · 폴더구조. 서버 상세는 `50_서버사양` 참조.

---

## 1. 목적
머지 게임을 "데이터 주도(data-driven)"로 설계해, Phase 2(클리커) · Phase 3(수집)로 확장할 때 구조를 갈아엎지 않도록 한다.

## 2. 기술 스택 상세
| 항목 | 버전 | 비고 |
|---|---|---|
| 언어 | TypeScript 5.x | 정적 타입 |
| 엔진 | Phaser 4.1.x | 2026 정식판 |
| 물리 | Matter (Phaser 내장) | 별도 설치 불필요 |
| 빌드 | Vite (최신 안정판) | `package.json` + lockfile로 버전 고정 |
| 백엔드 | @supabase/supabase-js 2.x | 랭킹 · 세이브 |
| 앱화(차후) | Capacitor (최신) | 웹 → 네이티브 |
| 다국어 | 경량 자체 i18n | 의존성 추가 없음, 상세 `25_L10N사양` |

> 정확한 패치 버전은 설치 시점의 최신 안정판으로 잡고 lockfile에 고정한다. (추측 금지 — 실제 설치 버전을 `99`에 기록)

## 3. 아키텍처 개요
- **클라이언트(브라우저)**: 게임 로직 · 물리 · 렌더 전부 처리. Phase 1 코어는 오프라인으로도 동작.
- **로컬 저장(localStorage)**: 자기 최고점 · 중단 판 보관. 서버 없이 동작.
- **서버(Supabase)**: 랭킹 조회 · 최고점 클라우드 백업. 네트워크 없으면 graceful하게 생략.

```
[Browser]
  Phaser(game) ── localStorage
       │
       └── (online) ── supabase-js ── Supabase
```

## 4. 폴더 구조
```
keshikasu-fangame/
├─ public/
│  └─ assets/
│     ├─ characters/
│     └─ ui/
├─ src/
│  ├─ main.ts
│  ├─ config.ts
│  ├─ types.ts
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
└─ .github/workflows/keepalive.yml
```

| 경로 | 역할 |
|---|---|
| `config.ts` | Phaser 게임 설정(해상도 · 물리 · 스케일) |
| `types.ts` | 공용 타입 정의 |
| `scenes/` | 화면 단위(부팅 → 프리로드 → 타이틀 → 게임 → 게임오버) |
| `objects/Keshi.ts` | 떨어지는 케시카스 1개(스프라이트 + 물리바디) |
| `systems/MergeSystem.ts` | 합체 감지 · 처리 |
| `systems/ScoreSystem.ts` | 점수 계산 · 최고점 |
| `data/merge_ladder.ts` | 합체 사다리 데이터(확장 핵심) |
| `locales/*.json` | 언어별 문자열 테이블(L10N 데이터, 상세 `25`) |
| `services/saveLocal.ts` | localStorage 입출력 |
| `services/supabase.ts` | 익명로그인 · 랭킹 · 백업 |
| `services/i18n.ts` | 키 → 문자열 조회 · 폴백(ja) · 언어감지 |

## 5. 씬(Scene) 구성
| 씬 | 책임 |
|---|---|
| BootScene | 최소 설정 로드, PreloadScene으로 이동 |
| PreloadScene | 이미지 · 데이터 로드, 로딩 표시 |
| TitleScene | 시작 버튼, 랭킹 보기 |
| GameScene | 코어 루프(드롭 · 물리 · 합체 · 점수 · 게임오버 판정) |
| GameOverScene | 결과 · 다시하기 · 최고점 전송 |

## 6. 데이터 스키마 (클라이언트)

### 6.1 합체 사다리 1단 정의
```typescript
// マージ段階1つ分の定義（多言語対応）
export interface MergeTier {
  id: number;          // 段階番号（1が最小）
  key: string;         // キャラクター識別子（例: "candy"）
  nameKey: string;     // 表示名のL10Nキー（例: "char.candy.name"）
  radius: number;      // 物理判定の半径（px）
  score: number;       // この段階に合体した時の加算スコア
  spawnable: boolean;  // ドロップ抽選の対象かどうか
  asset: string;       // スプライト画像キー（文字なし画像は全言語共通）
}
```

```typescript
// 合体ラダー本体。具体的な段階値はGDD §5確定後に記入する
export const MERGE_LADDER: MergeTier[] = [
  // TODO: GDDの合体ラダー確定後にここを埋める
];
```

### 6.2 로컬 저장 데이터
```typescript
// ローカル保存データ（localStorage）
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
- **데드라인**: 플레이필드 상단 y좌표. 바디가 이 위에 일정 시간 머물면 게임오버.
- **드롭 쿨다운**: 낙하 직후 짧은 입력 잠금(중복 드롭 방지).

## 8. 합체 처리 흐름
1. `collisionstart` 이벤트 수신
2. 두 바디의 `key`가 같고, 둘 다 미합체 상태인지 확인
3. 같으면 → 두 바디 제거, 다음 단계 `MergeTier` 생성, `ScoreSystem`에 가산
4. 최고 단계면 추가 보너스(Vol.2에서 정의)

## 9. 데이터 영속성
- **즉시**: 매 최고점 갱신 시 `saveLocal`로 localStorage 기록(오프라인 보장).
- **백업/랭킹**: 온라인이면 `supabase.ts`로 upsert + 상위 N 조회. 실패해도 게임 진행에 영향 없음(try/catch로 무시).

## 10. 명명 규칙
- 파일: 클래스 = PascalCase(`GameScene.ts`), 그 외 = camelCase(`saveLocal.ts`), 데이터 = snake_case(`merge_ladder.ts`)
- 에셋 키: `char_candy`, `char_ice` 등 `char_<key>` (상세는 `30_에셋파이프라인`)
- L10N 키: `<도메인>.<요소>` (예: `game.score`, `result.retry`, `char.candy.name`) (상세 `25_L10N사양`)
- 코드 주석: **일본어**(한국어 단어 금지). 작성 후 한글 자음(ㄱ-ㅎ) 0건 확인.
- ※ **예외**: `locales/*.json`(번역 데이터)은 각 언어 문자가 정상. 한글-금지 룰은 **코드 로직·주석(ts/sql/yaml)** 한정, 로케일 데이터 값에는 미적용. (상세 `25` §11)

## 11. 확장성 설계
- **모드 분리**: GameScene을 모드 1로 보고, Phase 2(클리커) · Phase 3(수집)는 별도 씬/시스템으로 추가. 공용은 `services/`(저장 · 서버)로 재사용.
- **데이터 주도**: 캐릭터/단계 추가 = `merge_ladder.ts` 수정만. 코드 변경 최소.
- **39종 자산**: Phase 3 도감을 위해 에셋 키 체계를 처음부터 전체 캐릭터로 확장 가능하게 잡는다.

## 12. 빌드/실행 (요약; 상세 `60`)
- 개발: `npm run dev` (Vite 핫리로드)
- 빌드: `npm run build` → `dist/`
- 배포: `dist/`를 GitHub Pages로 (상세 `60`)

## 13. 미해결
- 합체 사다리 데이터 확정 → `MERGE_LADDER` 채우기
- Phaser 4 마이그레이션 주의: 웹 예제 다수가 v3 기준(API 거의 호환이나 일부 차이 가능)
- 가상 해상도(450×800) 최종 확정 — 실제 일러스트 비율 보고 조정
