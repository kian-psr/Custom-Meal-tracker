import { readFile } from "node:fs/promises";
import path from "node:path";

import { RUNTIME_MEAL_PHOTO_STORAGE_DIR } from "@/lib/file-storage";

type RouteContext = {
  params: Promise<{
    fileName: string;
  }>;
};

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { fileName } = await context.params;

    if (!/^[a-zA-Z0-9-]+\.(jpg|jpeg|png|webp)$/.test(fileName)) {
      return new Response("Not found", { status: 404 });
    }

    const targetPath = path.join(RUNTIME_MEAL_PHOTO_STORAGE_DIR, fileName);
    const fileBuffer = await readFile(targetPath);
    const extension = fileName.split(".").pop()?.toLowerCase() ?? "png";

    return new Response(fileBuffer, {
      headers: {
        "Content-Type": MIME_BY_EXTENSION[extension] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
