import { supabase } from "@/integrations/supabase/client";

export type UploadOptions = {
  folder?: string;
  signedUrlSeconds?: number; // опционально: вернуть подписанный URL на N секунд
};

export type UploadResponse = {
  bucket: string;
  path: string; // storage path (key)
  signedUrl?: string; // если запросили подписанный URL
};

/**
 * Простейшая функция загрузки файла в хранилище Data Room.
 * - Загружает файл в bucket "data-room-documents"
 * - Генерирует уникальный путь с датой и UUID
 * - Возвращает storage path и (опционально) подписанный URL
 */
export async function uploadDataRoomFile(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResponse> {
  const bucket = "data-room-documents";

  const date = new Date();
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  const safeName = sanitizeFileName(file.name || "file");
  const key = `${options.folder ?? "uploads"}/${yyyy}/${mm}/${dd}/${crypto.randomUUID()}-${safeName}`;

  const { data, error } = await supabase.storage.from(bucket).upload(key, file, {
    cacheControl: "3600",
    contentType: file.type || "application/octet-stream",
    upsert: true,
  });

  if (error) throw error;

  let signedUrl: string | undefined;
  if (options.signedUrlSeconds && data?.path) {
    const { data: signed, error: signErr } = await supabase.storage
      .from(bucket)
      .createSignedUrl(data.path, options.signedUrlSeconds);
    if (signErr) throw signErr;
    signedUrl = signed?.signedUrl;
  }

  return { bucket, path: data.path, signedUrl };
}

function sanitizeFileName(name: string) {
  return name.trim().replace(/[^a-zA-Z0-9.\-_]/g, "_");
}
