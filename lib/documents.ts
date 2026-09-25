export const DOCUMENT_BUCKET = 'school-documents';
export const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024;

export const DOCUMENT_FILE_TYPES = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  zip: 'application/zip',
} as const;

export type DocumentAccessMode = 'preview_download' | 'preview_only';
export type DocumentTargetMode = 'all' | 'specific' | null;

export type DocumentCategory = {
  id: string;
  name: string;
  school_id?: string;
};

export type SchoolDocument = {
  id: string;
  school_id: string;
  title: string;
  category_id: string | null;
  storage_path: string;
  original_file_name: string;
  mime_type: string;
  file_size: number;
  visible_public: boolean;
  visible_teachers: boolean;
  visible_students: boolean;
  principal_only: boolean;
  teacher_target_mode: DocumentTargetMode;
  student_target_mode: DocumentTargetMode;
  publish_at: string;
  expires_at: string | null;
  is_pinned: boolean;
  access_mode: DocumentAccessMode;
  is_archived: boolean;
  uploaded_by: string;
  uploader_name: string;
  created_at: string;
  updated_at: string;
  document_categories?: DocumentCategory | DocumentCategory[] | null;
  document_target_classes?: { class_id: string }[];
  document_target_teachers?: { teacher_id: string }[];
};

export type DocumentStatus = 'Published' | 'Scheduled' | 'Expired' | 'Private' | 'Archived';

export function fileExtension(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

export function canonicalMimeType(file: File) {
  return DOCUMENT_FILE_TYPES[fileExtension(file.name) as keyof typeof DOCUMENT_FILE_TYPES] ?? '';
}

export function validateDocumentFile(file: File) {
  const extension = fileExtension(file.name);
  const mimeType = DOCUMENT_FILE_TYPES[extension as keyof typeof DOCUMENT_FILE_TYPES];
  if (!mimeType) return 'Choose a PDF, Word, Excel, image, or ZIP file.';
  if (file.size <= 0) return 'The selected file is empty.';
  if (file.size > MAX_DOCUMENT_SIZE) return 'The file must be 25 MB or smaller.';
  return '';
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function documentTypeLabel(document: Pick<SchoolDocument, 'original_file_name' | 'mime_type'>) {
  const extension = fileExtension(document.original_file_name);
  if (extension) return extension.toUpperCase();
  return document.mime_type.split('/').pop()?.toUpperCase() ?? 'FILE';
}

export function canInlinePreview(document: Pick<SchoolDocument, 'mime_type'>) {
  return document.mime_type === 'application/pdf' || document.mime_type.startsWith('image/');
}

export function getDocumentStatus(document: SchoolDocument, now = new Date()): DocumentStatus {
  if (document.is_archived) return 'Archived';
  if (document.principal_only) return 'Private';
  const publishAt = new Date(document.publish_at);
  if (publishAt > now) return 'Scheduled';
  if (document.expires_at && new Date(document.expires_at) <= now) return 'Expired';
  return 'Published';
}

export function getCategoryName(document: SchoolDocument) {
  const category = Array.isArray(document.document_categories)
    ? document.document_categories[0]
    : document.document_categories;
  return category?.name || 'Uncategorized';
}

export function audienceLabels(document: SchoolDocument) {
  if (document.principal_only) return ['Principal only'];
  return [
    document.visible_public ? 'Public website' : '',
    document.visible_teachers ? 'Teachers' : '',
    document.visible_students ? 'Students' : '',
  ].filter(Boolean);
}

export function formatDocumentDate(value: string | null, includeTime = false) {
  if (!value) return 'No expiry';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-NP', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(date);
}

export function toDateTimeLocal(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
