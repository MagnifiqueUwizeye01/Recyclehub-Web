/**
 * Maps RecycleHub.ApiResponse<T> and AuthResponseDto to the shape the SPA expects.
 */
export function unwrapApiPayload(res) {
  const body = res?.data;
  if (!body) return null;
  if (typeof body.success === 'boolean' && body.data !== undefined) {
    if (!body.success) {
      const msg =
        body.message ||
        (Array.isArray(body.errors) && body.errors.length ? body.errors.join(', ') : '') ||
        'Request failed';
      const err = new Error(msg);
      err.apiBody = body;
      throw err;
    }
    return body.data;
  }
  return body;
}

function mapUserFromAuthDto(dto) {
  const full = dto.fullName || '';
  const parts = full.trim().split(/\s+/);
  const firstName = dto.firstName ?? parts[0] ?? '';
  const lastName = dto.lastName ?? parts.slice(1).join(' ') ?? '';
  return {
    id: dto.userId,
    userId: dto.userId,
    username: dto.username,
    email: dto.email,
    firstName,
    lastName,
    fullName: full || `${firstName} ${lastName}`.trim(),
    phoneNumber: dto.phoneNumber,
    role: dto.role,
    profileImageUrl: dto.profileImageUrl,
    buyerProfileId: dto.buyerProfileId,
    sellerProfileId: dto.sellerProfileId,
  };
}

/**
 * @returns {{ token: string, refreshToken: string, user: object } | { requiresTwoFactor: true, twoFactorChallengeToken: string, user: object } | null}
 */
export function mapAuthResponseDto(dto) {
  if (!dto) return null;
  if (dto.requiresTwoFactor) {
    return {
      requiresTwoFactor: true,
      twoFactorChallengeToken: dto.twoFactorChallengeToken,
      user: mapUserFromAuthDto(dto),
    };
  }
  if (!dto.accessToken) return null;
  return {
    token: dto.accessToken,
    refreshToken: dto.refreshToken,
    user: mapUserFromAuthDto(dto),
  };
}

export function mapCurrentUserDto(dto) {
  if (!dto) return null;
  return {
    id: dto.userId,
    userId: dto.userId,
    username: dto.username,
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    fullName: `${dto.firstName || ''} ${dto.lastName || ''}`.trim(),
    phoneNumber: dto.phoneNumber,
    gender: dto.gender,
    role: dto.role,
    profileImageUrl: dto.profileImageUrl,
    buyerProfileId: dto.buyerProfileId,
    sellerProfileId: dto.sellerProfileId,
    twoFactorEnabled: !!dto.twoFactorEnabled,
  };
}

export function getApiErrorMessage(err) {
  const d = err?.response?.data;
  if (typeof d?.message === 'string' && d.message.trim()) return d.message;
  // ApiResponse<T>.Errors
  if (Array.isArray(d?.errors) && d.errors.length) return d.errors.join(', ');
  // ASP.NET ValidationProblemDetails (400 model validation)
  if (d?.errors && typeof d.errors === 'object' && !Array.isArray(d.errors)) {
    const msgs = Object.values(d.errors)
      .flat()
      .filter((x) => typeof x === 'string' && x.trim());
    if (msgs.length) return msgs.join(' ');
  }
  if (typeof d?.title === 'string' && d.title.trim()) return d.title;
  if (err?.message) return err.message;
  return 'Something went wrong';
}
