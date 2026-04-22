export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

export const validateFile = (file, allowedTypes = ALLOWED_IMAGE_TYPES) => {
  if (!file) return { valid: false, error: 'No file selected' };
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type not allowed. Allowed: ${allowedTypes.join(', ')}` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Max size: ${MAX_FILE_SIZE_MB}MB` };
  }
  return { valid: true, error: null };
};

export const createImagePreview = (file) => URL.createObjectURL(file);

export const toFormData = (obj) => {
  const fd = new FormData();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null) fd.append(k, v);
  });
  return fd;
};
