// Always-visible wardrobe settings: overall dimensions, doors and main materials.
// Inputs report their own errors inline; buttons/selects report under their section.
import { matchingSizePreset, SIZE_PRESETS } from '../domain/sizePresets.js';
import { appearanceControls } from './appearanceControls.js';
import { actionResult, cmField, countField, el, section, segmented } from './fields.js';
import { dimensionOps, doorTypeOps, sizePresetOps } from './opsFromForm.js';

const cmLabel = (mm) => String(mm / 10);

/** One-click common sizes (width × height). A success re-renders the panel, so the note
 *  about moved items is attached to the freshly rendered group. */
function sizePresets(design, run, wardrobe) {
  return segmented({
    label: 'Common sizes (W × H, cm)',
    testId: 'size-presets',
    value: matchingSizePreset(design)?.id,
    options: SIZE_PRESETS.map((preset) => ({ value: preset.id, label: `${cmLabel(preset.width)} × ${cmLabel(preset.height)}` })),
    onChange: (id) => {
      const { ops, moved } = sizePresetOps(design, SIZE_PRESETS.find((preset) => preset.id === id));
      const result = actionResult(wardrobe, run(ops));
      if (result.ok && moved.length) {
        const note = `Moved ${moved.length} item${moved.length === 1 ? '' : 's'} down to fit the new height.`;
        document.querySelector('[data-testid="size-presets"]')?.parentElement
          .append(el('p', { className: 'field__note', text: note, attrs: { role: 'status' } }));
      }
    },
  });
}

function dimensionsRow(design, run) {
  const { width, height, depth } = design.dimensions;
  return el('div', { className: 'field-row field-row--3' }, [
    cmField({ label: 'Width', mm: width, testId: 'dim-width', onCommit: (mm) => run(dimensionOps('width', mm)) }),
    cmField({ label: 'Height', mm: height, testId: 'dim-height', onCommit: (mm) => run(dimensionOps('height', mm)) }),
    cmField({ label: 'Depth', mm: depth, testId: 'dim-depth', onCommit: (mm) => run(dimensionOps('depth', mm)) }),
  ]);
}

export function wardrobeSection({ design, catalog, run }) {
  const { doors } = design;
  const wardrobe = section('Wardrobe', []);
  wardrobe.append(sizePresets(design, run, wardrobe), dimensionsRow(design, run));
  const runDoors = (ops) => actionResult(wardrobe, run(ops));
  wardrobe.append(segmented({
    label: 'Doors',
    testId: 'door-type',
    value: doors.type,
    options: [{ value: 'hinged', label: 'Hinged' }, { value: 'sliding', label: 'Sliding' }, { value: 'none', label: 'None' }],
    onChange: (type) => runDoors(doorTypeOps(type)),
  }));
  if (doors.type === 'sliding') {
    wardrobe.append(countField({
      label: 'Sliding panels', value: doors.items.length, testId: 'sliding-count',
      onCommit: (count) => run(doorTypeOps('sliding', count)),
    }));
  }

  const materials = section('Materials', []);
  const runMaterials = (ops) => actionResult(materials, run(ops));
  materials.append(appearanceControls({ catalog, appearance: design.carcass.appearance, target: 'carcass', run: runMaterials, label: 'Carcass & interior' }));
  if (doors.type !== 'none') {
    materials.append(appearanceControls({ catalog, appearance: doors.appearance, target: 'doors', run: runMaterials, label: 'Doors' }));
  }
  return [wardrobe, materials];
}
