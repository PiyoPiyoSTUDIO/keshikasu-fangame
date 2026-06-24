import type { MergeTier } from '../types';

// 合体ラダー（オールどうぶつ11段）。radius・scoreは初期値、プレイ後に調整する
export const MERGE_LADDER: MergeTier[] = [
  { id: 1,  key: 'bee',        nameKey: 'char.bee.name',        radius: 24,  score: 1,  spawnable: true,  asset: 'char_bee' },
  { id: 2,  key: 'shrimp',     nameKey: 'char.shrimp.name',     radius: 30,  score: 3,  spawnable: true,  asset: 'char_shrimp' },
  { id: 3,  key: 'jellyfish',  nameKey: 'char.jellyfish.name',  radius: 37,  score: 6,  spawnable: true,  asset: 'char_jellyfish' },
  { id: 4,  key: 'seaslug',    nameKey: 'char.seaslug.name',    radius: 45,  score: 10, spawnable: false, asset: 'char_seaslug' },
  { id: 5,  key: 'rabbit',     nameKey: 'char.rabbit.name',     radius: 54,  score: 15, spawnable: false, asset: 'char_rabbit' },
  { id: 6,  key: 'pig',        nameKey: 'char.pig.name',        radius: 64,  score: 21, spawnable: false, asset: 'char_pig' },
  { id: 7,  key: 'turtle',     nameKey: 'char.turtle.name',     radius: 75,  score: 28, spawnable: false, asset: 'char_turtle' },
  { id: 8,  key: 'unicorn',    nameKey: 'char.unicorn.name',    radius: 87,  score: 36, spawnable: false, asset: 'char_unicorn' },
  { id: 9,  key: 'bear',       nameKey: 'char.bear.name',       radius: 100, score: 45, spawnable: false, asset: 'char_bear' },
  { id: 10, key: 'whaleshark', nameKey: 'char.whaleshark.name', radius: 114, score: 55, spawnable: false, asset: 'char_whaleshark' },
  { id: 11, key: 'mammoth',    nameKey: 'char.mammoth.name',    radius: 130, score: 66, spawnable: false, asset: 'char_mammoth' },
];

// idで段階を引く（合体時に「次の段階」を取得する用）
export function tierById(id: number): MergeTier | undefined {
  return MERGE_LADDER.find((t) => t.id === id);
}

// ドロップ可能な段階だけを返す（抽選用）
export function spawnableTiers(): MergeTier[] {
  return MERGE_LADDER.filter((t) => t.spawnable);
}
