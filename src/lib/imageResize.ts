// Resize an image File to a max width (preserving aspect ratio) and re-encode as JPEG.
// Returns a data URL. Keeps payload small enough for edge function (typical: 150–400 KB).
export async function resizeImageToDataUrl(file: File, maxWidth = 1600, quality = 0.85): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = bitmap.width > maxWidth ? maxWidth / bitmap.width : 1;
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}
