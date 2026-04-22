import { resolveMaterialAssetUrl } from './assetUrl';

/** Fallback images by material type (Unsplash) */
export const materialPlaceholders = {
  Metal: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop',
  Textile: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&auto=format&fit=crop',
  Electronics: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop',
  Plastic: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=400&auto=format&fit=crop',
  Paper: 'https://images.unsplash.com/photo-1589716404776-2aedce29b24d?w=400&auto=format&fit=crop',
  Glass: 'https://images.unsplash.com/photo-1548516173-3cabfa4607e9?w=400&auto=format&fit=crop',
  Other: 'https://images.unsplash.com/photo-1565688527312-9aa6f8ab3d80?w=400&auto=format&fit=crop',
};

export function getMaterialImageUrl(material) {
  const resolved = material?.primaryImageUrl ? resolveMaterialAssetUrl(material.primaryImageUrl) : null;
  if (resolved) return resolved;
  const t = material?.materialType || 'Other';
  return materialPlaceholders[t] || materialPlaceholders.Other;
}
