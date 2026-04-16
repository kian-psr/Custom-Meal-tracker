import "server-only";

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const IMAGE_EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MEAL_PHOTO_STORAGE_DIR = path.join(process.cwd(), ".data", "meal-photos");
export const RUNTIME_MEAL_PHOTO_STORAGE_DIR =
  process.env.MEAL_PHOTO_STORAGE_DIR?.trim() ||
  (process.env.RAILWAY_VOLUME_MOUNT_PATH
    ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, "meal-photos")
    : MEAL_PHOTO_STORAGE_DIR);

function getExtension(file: File) {
  if (file.type in IMAGE_EXTENSION_BY_MIME) {
    return IMAGE_EXTENSION_BY_MIME[file.type];
  }

  const nameParts = file.name.split(".");
  return nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : "bin";
}

export async function saveMealPhoto(file: File) {
  await mkdir(RUNTIME_MEAL_PHOTO_STORAGE_DIR, { recursive: true });

  const extension = getExtension(file);
  const fileName = `${randomUUID()}.${extension}`;
  const targetPath = path.join(RUNTIME_MEAL_PHOTO_STORAGE_DIR, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await writeFile(targetPath, buffer);

  return {
    photoUrl: `/api/photos/${fileName}`,
    sourceImageName: file.name || null,
  };
}

export async function deleteMealPhoto(photoUrl?: string | null) {
  if (!photoUrl) {
    return;
  }

  if (photoUrl.startsWith("/api/photos/")) {
    const fileName = photoUrl.replace("/api/photos/", "");
    const targetPath = path.join(RUNTIME_MEAL_PHOTO_STORAGE_DIR, fileName);
    await rm(targetPath, { force: true });
    return;
  }

  if (photoUrl.startsWith("/uploads/meals/")) {
    const targetPath = path.join(process.cwd(), "public", photoUrl);
    await rm(targetPath, { force: true });
  }
}
