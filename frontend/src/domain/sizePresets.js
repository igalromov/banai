// Common wardrobe sizes offered as one-click buttons in the editor (width × height, mm).
// ASSUMPTION: configurable defaults (the most common straight-wardrobe sizes), not business
// rules; documented in Obsidian `04 - Decisions & Assumptions`. Depth is never changed.
import { deepFreeze } from './util.js';

export const SIZE_PRESETS = deepFreeze([
  { id: '160x200', width: 1600, height: 2000 },
  { id: '180x200', width: 1800, height: 2000 },
  { id: '200x200', width: 2000, height: 2000 },
]);

/** The preset matching the design's current width and height, or undefined. */
export const matchingSizePreset = (design) => SIZE_PRESETS.find(
  (preset) => preset.width === design.dimensions.width && preset.height === design.dimensions.height,
);
