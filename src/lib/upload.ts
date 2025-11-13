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

export type DocumentMetadata = {
  name: string;
  description?: string;
  section_id: string;
  version?: string;
  restricted?: boolean;
};

export type DocumentRecord = {
  id: string;
  name: string;
  description: string | null;
  type: string;
  path: string;
  version: string;
  section_id: string;
  restricted: boolean;
  storage_path: string | null;
  created_at: string;
  updated_at: string;
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

/**
 * Загружает PDF файл в storage и сохраняет метаданные в data_room_documents
 */
export async function uploadPdf(
  file: File,
  metadata: DocumentMetadata
): Promise<DocumentRecord> {
  // Валидация типа файла
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Only PDF files are allowed");
  }

  // Загружаем файл в storage
  const uploadResult = await uploadDataRoomFile(file, {
    folder: "pdfs",
    signedUrlSeconds: 3600,
  });

  // Сохраняем метаданные в базу данных
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("User not authenticated");

  const client: any = supabase;
  const { data, error } = await client
    .from("data_room_documents")
    .insert({
      name: metadata.name,
      description: metadata.description || null,
      type: "pdf",
      path: uploadResult.signedUrl || uploadResult.path,
      storage_path: uploadResult.path,
      version: metadata.version || "1.0",
      section_id: metadata.section_id,
      restricted: metadata.restricted || false,
      created_by: user.user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as unknown as DocumentRecord;
}

/**
 * Сохраняет ссылку (URL) в data_room_documents без загрузки файла
 */
export async function uploadLink(
  url: string,
  metadata: DocumentMetadata
): Promise<DocumentRecord> {
  // Валидация URL
  try {
    new URL(url);
  } catch {
    throw new Error("Invalid URL format");
  }

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("User not authenticated");

  const client: any = supabase;
  const { data, error } = await client
    .from("data_room_documents")
    .insert({
      name: metadata.name,
      description: metadata.description || null,
      type: "link",
      path: url,
      storage_path: null, // ссылки не хранятся в storage
      version: metadata.version || "1.0",
      section_id: metadata.section_id,
      restricted: metadata.restricted || false,
      created_by: user.user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as unknown as DocumentRecord;
}
