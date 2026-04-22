import { resolveMaterialAssetUrl } from './assetUrl';

/** Map RecycleHub MaterialResponseDto to fields the UI components expect. */
export function normalizeMaterial(dto) {
  if (!dto) return null;
  const id = dto.materialId ?? dto.id;
  const primary = resolveMaterialAssetUrl(dto.primaryImageUrl);
  const urls = Array.isArray(dto.imageUrls)
    ? dto.imageUrls.map((u) => resolveMaterialAssetUrl(u)).filter(Boolean)
    : [];
  return {
    ...dto,
    id,
    materialType: dto.materialType,
    primaryImageUrl: primary,
    imageUrls: urls.length ? urls : dto.imageUrls,
    sellerCompanyName: dto.sellerCompanyName,
    sellerRating: dto.sellerRating,
    sellerVerified: dto.sellerIsVerified === true || dto.SellerIsVerified === true,
    isSmartSwap: dto.isSmartSwap === true,
    smartSwapDescription: dto.smartSwapDescription,
    sellerUserId: dto.sellerUserId,
    viewCount: dto.viewCount,
    createdAt: dto.createdAt,
  };
}
