import { describe, expect, it } from 'vitest';
import { applyOps } from '../../../src/domain/apply.js';
import { matchingSizePreset, SIZE_PRESETS } from '../../../src/domain/sizePresets.js';
import { sizePresetOps } from '../../../src/editor/opsFromForm.js';
import { loadCatalog, loadDesign } from '../domain/helpers.js';

const catalog = loadCatalog();
const basic = loadDesign('basic');

const itemY = (design, id) => design.compartments
  .flatMap((c) => [...c.shelves, ...c.drawers, ...c.rails])
  .find((item) => item.id === id).y;

describe('SIZE_PRESETS', () => {
  it('offers 160×200, 180×200 and 200×200 cm', () => {
    expect(SIZE_PRESETS.map(({ width, height }) => [width, height])).toEqual([[1600, 2000], [1800, 2000], [2000, 2000]]);
  });

  it('matches the design only when width and height both match', () => {
    expect(matchingSizePreset(basic)).toBeUndefined(); // 200 × 240
    const resized = applyOps(basic, sizePresetOps(basic, SIZE_PRESETS[2]).ops, catalog);
    expect(matchingSizePreset(resized).id).toBe('200x200');
  });
});

describe('sizePresetOps', () => {
  it('every preset applies to the basic wardrobe and keeps depth and compartments', () => {
    SIZE_PRESETS.forEach((preset) => {
      const result = applyOps(basic, sizePresetOps(basic, preset).ops, catalog);
      expect(result.dimensions).toEqual({ width: preset.width, height: preset.height, depth: basic.dimensions.depth });
      expect(result.compartments.map((c) => c.id)).toEqual(basic.compartments.map((c) => c.id));
    });
  });

  it('moves only what no longer fits, to the highest spot that fits', () => {
    const { ops, moved } = sizePresetOps(basic, SIZE_PRESETS[0]);
    expect(moved).toEqual(['shf_m1']);
    const result = applyOps(basic, ops, catalog);
    const top = 2000 - 2 * basic.carcass.panelThickness;
    expect(itemY(result, 'shf_m1')).toBe(top - 18);
    expect(itemY(result, 'rail_m1')).toBe(1900);
    expect(itemY(result, 'shf_l4')).toBe(1600);
  });

  it('pushes lower items down when a moved item would land on them', () => {
    const tall = applyOps(basic, [
      { op: 'modify_shelf', id: 'shf_m1', y: 2300 },
      { op: 'modify_rail', id: 'rail_m1', y: 2250 },
    ], catalog);
    const { ops, moved } = sizePresetOps(tall, SIZE_PRESETS[1]);
    expect(moved).toEqual(['rail_m1', 'shf_m1']);
    const result = applyOps(tall, ops, catalog);
    const top = 2000 - 2 * tall.carcass.panelThickness;
    expect(itemY(result, 'shf_m1')).toBe(top - 18);
    expect(itemY(result, 'rail_m1')).toBe(top - 18);
  });

  it('a taller or equal size moves nothing', () => {
    const short = applyOps(basic, sizePresetOps(basic, SIZE_PRESETS[0]).ops, catalog);
    const { ops, moved } = sizePresetOps(short, SIZE_PRESETS[2]);
    expect(moved).toEqual([]);
    expect(ops).toEqual([{ op: 'update_dimensions', width: 2000, height: 2000 }]);
  });
});
