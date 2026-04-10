/**
 * Material Type Color Mapping
 * Associates each material type with a distinct color for visual identification
 */

export const MATERIAL_COLORS: Record<string, string> = {
  PU: '#D4A574',           // Warm tan/brown - Polyurea
  PVC: '#4A90E2',          // Blue - Polyvinyl Chloride
  CAOUTCHOUC: '#2C3E50',   // Dark charcoal - Natural Rubber
};

export const MATERIAL_NAMES: Record<string, string> = {
  PU: 'Polyurea',
  PVC: 'Polyvinyl Chloride',
  CAOUTCHOUC: 'Natural Rubber',
};

/**
 * Get color for a material type
 * @param materialType Material type code (PU, PVC, CAOUTCHOUC)
 * @returns Hex color code or default gray if not found
 */
export function getMaterialColor(materialType: string, colorHexCode?: string | null): string {
  if (colorHexCode) return colorHexCode;
  return MATERIAL_COLORS[materialType] || '#95A5A6';
}

/**
 * Get display name for a material type
 * @param materialType Material type code
 * @returns Display name or the code itself if not found
 */
export function getMaterialDisplayName(materialType: string): string {
  return MATERIAL_NAMES[materialType] || materialType;
}
