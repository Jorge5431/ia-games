export const imageLimitMb = 4;
export const imageLimitBytes = imageLimitMb * 1024 * 1024;
export const allowedImageMimeTypes = {'image/png':'png','image/jpeg':'jpg','image/webp':'webp'} as const;
export const imageInputAccept = Object.keys(allowedImageMimeTypes).join(',');
