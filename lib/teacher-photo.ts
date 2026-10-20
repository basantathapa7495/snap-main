export function validateTeacherPhoto(file: Pick<File, "type" | "size">) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "Choose a JPG, PNG or WebP image.";
  if (file.size > 2 * 1024 * 1024) return "Profile picture must be 2 MB or smaller.";
  return "";
}

export function avatarDimensions(width: number, height: number) {
  const ratio = Math.min(1, 256 / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * ratio)), height: Math.max(1, Math.round(height * ratio)) };
}

// Resize before uploading, without paid transformations or an additional dependency.
// Keep the aspect ratio; object-fit crops only the display, never the saved portrait.
export async function prepareTeacherPhoto(file: File): Promise<File> {
  const issue = validateTeacherPhoto(file);
  if (issue) throw new Error(issue);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const size = avatarDimensions(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not prepare profile picture. Please try another image.");
    context.drawImage(image, 0, 0, size.width, size.height);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      (result) => result ? resolve(result) : reject(new Error("Could not prepare profile picture.")), "image/webp", 0.82,
    ));
    const extension = blob.type === "image/webp" ? "webp" : "png";
    return new File([blob], `profile.${extension}`, { type: blob.type });
  } catch (cause) {
    throw new Error(cause instanceof Error ? cause.message : "This image could not be opened. Please choose another picture.");
  } finally { URL.revokeObjectURL(url); }
}
