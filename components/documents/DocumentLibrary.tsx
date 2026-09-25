'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  CalendarClock,
  Download,
  Eye,
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Loader2,
  LockKeyhole,
  Pin,
  Search,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  DOCUMENT_BUCKET,
  SchoolDocument,
  canInlinePreview,
  documentTypeLabel,
  formatDocumentDate,
  formatFileSize,
  getCategoryName,
} from '@/lib/documents';

type Audience = 'public' | 'teachers' | 'students';

type DocumentLibraryProps = {
  audience: Audience;
  schoolId?: string;
  title?: string;
  description?: string;
  embedded?: boolean;
};

function iconFor(document: SchoolDocument) {
  if (document.mime_type.startsWith('image/')) return FileImage;
  if (document.mime_type.includes('spreadsheet') || document.mime_type.includes('excel')) return FileSpreadsheet;
  if (document.mime_type.includes('zip')) return FileArchive;
  return FileText;
}

export default function DocumentLibrary({
  audience,
  schoolId,
  title = audience === 'students' ? 'Resources' : 'Shared documents',
  description = 'Files shared with you by the school.',
  embedded = false,
}: DocumentLibraryProps) {
  const [documents, setDocuments] = useState<SchoolDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<{ document: SchoolDocument; url: string } | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError('');
    let resolvedSchoolId = schoolId;
    let teacherId = '';
    let studentClassIds: string[] = [];

    if (audience !== 'public') {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to view school documents.');
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('school_id').eq('user_id', user.id).single();
      resolvedSchoolId = profile?.school_id;
      if (!resolvedSchoolId) {
        setError('Your account is not connected to a school.');
        setLoading(false);
        return;
      }
      if (audience === 'teachers') {
        const { data: teacher } = await supabase.from('teachers').select('id').eq('school_id', resolvedSchoolId).eq('user_id', user.id).maybeSingle();
        teacherId = teacher?.id || '';
      } else {
        const [{ data: student }, { data: classRows }] = await Promise.all([
          supabase.from('students').select('class,section').eq('school_id', resolvedSchoolId).eq('user_id', user.id).maybeSingle(),
          supabase.from('classes').select('id,class_name,class,name,class_number,section,section_name').eq('school_id', resolvedSchoolId),
        ]);
        const studentClass = String(student?.class || '').trim().toLowerCase();
        const studentSection = String(student?.section || '').trim().toLowerCase();
        studentClassIds = (classRows ?? []).filter((item) => {
          const names = [item.class_name, item.class, item.name, item.class_number, item.class_number ? `Class ${item.class_number}` : ''].map((value) => String(value || '').trim().toLowerCase());
          const targetSection = String(item.section_name || item.section || '').trim().toLowerCase();
          return names.includes(studentClass) && (!targetSection || targetSection === studentSection);
        }).map((item) => item.id);
      }
    }
    const selection = audience === 'public'
      ? '*, document_categories(id,name)'
      : '*, document_categories(id,name), document_target_classes(class_id), document_target_teachers(teacher_id)';
    let request = supabase
      .from('documents')
      .select(selection)
      .eq(audience === 'public' ? 'visible_public' : audience === 'teachers' ? 'visible_teachers' : 'visible_students', true)
      .eq('is_archived', false)
      .order('is_pinned', { ascending: false })
      .order('publish_at', { ascending: false });

    if (resolvedSchoolId) request = request.eq('school_id', resolvedSchoolId);
    const { data, error: loadError } = await request;
    if (loadError) setError(loadError.message);
    else {
      const rows = (data ?? []) as unknown as SchoolDocument[];
      setDocuments(rows.filter((document) => {
        if (audience === 'teachers') return document.teacher_target_mode === 'all' || document.document_target_teachers?.some((target) => target.teacher_id === teacherId);
        if (audience === 'students') return document.student_target_mode === 'all' || document.document_target_classes?.some((target) => studentClassIds.includes(target.class_id));
        return true;
      }));
    }
    setLoading(false);
  }, [audience, schoolId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return documents;
    return documents.filter((document) =>
      `${document.title} ${document.original_file_name} ${getCategoryName(document)}`.toLowerCase().includes(needle),
    );
  }, [documents, query]);

  async function openPreview(document: SchoolDocument) {
    setOpeningId(document.id);
    setError('');
    if (!canInlinePreview(document)) {
      setPreview({ document, url: '' });
      setOpeningId(null);
      return;
    }
    const { data, error: signError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .createSignedUrl(document.storage_path, 600);
    if (signError || !data?.signedUrl) setError(signError?.message || 'Could not open this file.');
    else setPreview({ document, url: data.signedUrl });
    setOpeningId(null);
  }

  async function downloadDocument(document: SchoolDocument) {
    setOpeningId(document.id);
    setError('');
    const { data, error: signError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .createSignedUrl(document.storage_path, 90, { download: document.original_file_name });
    if (signError || !data?.signedUrl) setError(signError?.message || 'Could not prepare the download.');
    else window.location.assign(data.signedUrl);
    setOpeningId(null);
  }

  return (
    <section className={embedded ? '' : 'rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6'}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Documents</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <label className="relative block w-full sm:max-w-xs">
          <span className="sr-only">Search documents</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search documents"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </label>
      </div>

      {error && <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      {loading ? (
        <div className="flex min-h-48 items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading documents…</div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center">
          <FolderOpen className="h-9 w-9 text-slate-300" />
          <h3 className="mt-3 font-bold text-slate-800">No documents available</h3>
          <p className="mt-1 text-sm text-slate-500">Published files will appear here.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((document) => {
            const Icon = iconFor(document);
            const isOpening = openingId === document.id;
            return (
              <article key={document.id} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><Icon className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <h3 className="min-w-0 flex-1 break-words font-bold leading-5 text-slate-900">{document.title}</h3>
                      {document.is_pinned && <Pin className="h-4 w-4 shrink-0 fill-amber-400 text-amber-500" aria-label="Pinned" />}
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{getCategoryName(document)} · {documentTypeLabel(document)} · {formatFileSize(document.file_size)}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1"><CalendarClock className="h-3.5 w-3.5" /> {formatDocumentDate(document.publish_at)}</span>
                  {document.access_mode === 'preview_only' && <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2 py-1 font-semibold text-violet-700"><LockKeyhole className="h-3.5 w-3.5" /> Preview only</span>}
                </div>
                <div className="mt-auto flex gap-2 pt-4">
                  <button type="button" onClick={() => void openPreview(document)} disabled={isOpening} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60">
                    {isOpening ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />} Preview
                  </button>
                  {document.access_mode === 'preview_download' && (
                    <button type="button" onClick={() => void downloadDocument(document)} disabled={isOpening} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60">
                      <Download className="h-4 w-4" /> Download
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-label={`Preview ${preview.document.title}`} onMouseDown={(event) => event.target === event.currentTarget && setPreview(null)}>
          <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
              <div className="min-w-0"><h3 className="truncate font-bold text-slate-900">{preview.document.title}</h3><p className="text-xs text-slate-500">{documentTypeLabel(preview.document)} · {formatFileSize(preview.document.file_size)}</p></div>
              <button type="button" onClick={() => setPreview(null)} className="ml-3 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Close preview"><X className="h-5 w-5" /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-3 sm:p-5">
              {preview.url && preview.document.mime_type === 'application/pdf' ? (
                <iframe src={preview.url} title={preview.document.title} className="h-[72vh] w-full rounded-xl bg-white" />
              ) : preview.url && preview.document.mime_type.startsWith('image/') ? (
                <div className="relative mx-auto min-h-[60vh] max-w-4xl"><Image src={preview.url} alt={preview.document.title} fill unoptimized className="object-contain" /></div>
              ) : (
                <div className="mx-auto flex min-h-64 max-w-lg flex-col items-center justify-center rounded-2xl bg-white p-8 text-center shadow-sm">
                  <FileText className="h-12 w-12 text-slate-300" />
                  <h4 className="mt-4 font-bold text-slate-900">Browser preview is not available</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{preview.document.original_file_name}<br />{documentTypeLabel(preview.document)} · {formatFileSize(preview.document.file_size)}</p>
                  {preview.document.access_mode === 'preview_download' ? (
                    <button type="button" onClick={() => void downloadDocument(preview.document)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"><Download className="h-4 w-4" /> Download file</button>
                  ) : (
                    <p className="mt-5 rounded-xl bg-violet-50 px-4 py-3 text-xs leading-5 text-violet-700">This file is set to preview only. Its format cannot be previewed safely in this browser, so no file link is shown.</p>
                  )}
                </div>
              )}
            </div>
            {preview.document.access_mode === 'preview_only' && canInlinePreview(preview.document) && <p className="border-t border-slate-200 px-4 py-2 text-center text-xs text-slate-500">Download controls are hidden. As with any browser preview, determined viewers may still be able to save displayed content.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
