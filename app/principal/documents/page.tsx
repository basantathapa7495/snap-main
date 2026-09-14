'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, Check, Download, Eye, File, FileImage, FileSpreadsheet,
  FileText, FolderOpen, Loader2, RefreshCw, Search, Trash2, Upload, X,
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { supabase } from '@/lib/supabase';

const bucket = 'school-documents';
const maxFileSize = 10 * 1024 * 1024;
const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'png', 'jpg', 'jpeg', 'webp', 'txt'];

type StorageFile = {
  id: string | null;
  name: string;
  created_at: string | null;
  updated_at: string | null;
  metadata: { size?: number; mimetype?: string } | null;
};

function extension(name: string) { return name.split('.').pop()?.toLowerCase() || ''; }
function safeFileName(name: string) {
  const ext = extension(name);
  const base = name.slice(0, Math.max(0, name.length - (ext ? ext.length + 1 : 0)))
    .normalize('NFKD').replace(/[^a-zA-Z0-9-_ ]/g, '').trim().replace(/\s+/g, '-').slice(0, 80) || 'document';
  return ext ? `${base}.${ext}` : base;
}
function readableName(name: string) {
  return name.replace(/^[0-9a-f-]{36}-/, '');
}
function formatSize(bytes = 0) {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
function formatDate(value: string | null) {
  if (!value) return 'Unknown date';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fileKind(file: StorageFile) {
  const ext = extension(file.name);
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return 'Image';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'Spreadsheet';
  if (ext === 'pdf') return 'PDF';
  if (['doc', 'docx', 'txt'].includes(ext)) return 'Document';
  return 'Other';
}

export default function DocumentsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('All');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [chosenFile, setChosenFile] = useState<globalThis.File | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [authenticated, setAuthenticated] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setRefreshing(true); setError('');
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) {
          if (!cancelled) setAuthenticated(false);
          return;
        }
        const { data: profile, error: profileError } = await supabase.from('profiles').select('school_id').eq('user_id', user.id).single();
        if (profileError || !profile?.school_id) throw new Error('Your school profile could not be loaded.');

        const { data, error: listError } = await supabase.storage.from(bucket).list(profile.school_id, {
          limit: 500, sortBy: { column: 'created_at', order: 'desc' },
        });
        if (listError) {
          if (/bucket|not found/i.test(listError.message)) throw new Error('Document storage is not configured yet. Run supabase/documents-setup.sql in the Supabase SQL Editor.');
          throw listError;
        }
        if (!cancelled) {
          setSchoolId(profile.school_id);
          setFiles((data || []).filter((item) => item.name !== '.emptyFolderPlaceholder') as StorageFile[]);
        }
      } catch (loadError) {
        console.error('Documents load error', loadError);
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Documents could not be loaded.');
      } finally {
        if (!cancelled) { setLoading(false); setRefreshing(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return files.filter((file) => (!query || readableName(file.name).toLowerCase().includes(query)) && (kind === 'All' || fileKind(file) === kind));
  }, [files, kind, search]);

  function chooseFile(file: globalThis.File | null) {
    setError(''); setNotice('');
    if (!file) { setChosenFile(null); return; }
    if (file.size > maxFileSize) { setError('The file is larger than 10 MB.'); return; }
    if (!allowedExtensions.includes(extension(file.name))) { setError('Unsupported file type. Upload PDF, Word, Excel, CSV, image or text files.'); return; }
    setChosenFile(file);
  }

  async function uploadFile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!schoolId || !chosenFile) return;
    setUploading(true); setError(''); setNotice('');
    const objectName = `${crypto.randomUUID()}-${safeFileName(chosenFile.name)}`;
    const objectPath = `${schoolId}/${objectName}`;
    try {
      const { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, chosenFile, {
        cacheControl: '3600', upsert: false, contentType: chosenFile.type || undefined,
      });
      if (uploadError) throw uploadError;
      setUploadOpen(false); setChosenFile(null);
      if (inputRef.current) inputRef.current.value = '';
      setNotice('Document uploaded successfully.');
      setRefreshKey((value) => value + 1);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Document could not be uploaded.');
    } finally { setUploading(false); }
  }

  async function previewFile(file: StorageFile) {
    if (!schoolId) return;
    setError('');
    const { data, error: signedError } = await supabase.storage.from(bucket).createSignedUrl(`${schoolId}/${file.name}`, 60);
    if (signedError || !data?.signedUrl) {
      setError(signedError?.message || 'Preview link could not be created.');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  async function downloadFile(file: StorageFile) {
    if (!schoolId) return;
    setError('');
    const { data, error: downloadError } = await supabase.storage.from(bucket).download(`${schoolId}/${file.name}`);
    if (downloadError || !data) {
      setError(downloadError?.message || 'Document could not be downloaded.');
      return;
    }
    const url = URL.createObjectURL(data);
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = readableName(file.name); anchor.click();
    URL.revokeObjectURL(url);
  }

  async function deleteFile(file: StorageFile) {
    if (!schoolId || !window.confirm(`Delete "${readableName(file.name)}"? This cannot be undone.`)) return;
    setError(''); setNotice('');
    const { error: removeError } = await supabase.storage.from(bucket).remove([`${schoolId}/${file.name}`]);
    if (removeError) { setError(removeError.message); return; }
    setFiles((current) => current.filter((item) => item.name !== file.name));
    setNotice('Document deleted.');
  }

  if (loading) return <PageSkeleton />;
  if (!authenticated) return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><div className="max-w-sm rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm"><h1 className="text-xl font-bold text-slate-950">Please sign in</h1><p className="mt-2 text-sm text-slate-500">Sign in as principal to manage school documents.</p><Link href="/auth/login?role=principal" className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Go to login</Link></div></main>;

  const totalBytes = files.reduce((sum, file) => sum + Number(file.metadata?.size || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
        <TopBar />
        <main className="flex-1 px-4 pb-24 pt-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1500px]">
            <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-blue-600">Secure file storage</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Documents</h1><p className="mt-2 text-sm text-slate-500">Store and manage official files for your school.</p></div><div className="flex gap-2"><button type="button" onClick={() => setRefreshKey((value) => value + 1)} disabled={refreshing} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />Refresh</button><button type="button" onClick={() => { setUploadOpen(true); setError(''); setNotice(''); }} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"><Upload className="h-4 w-4" />Upload document</button></div></header>

            {(error || notice) && <div role={error ? 'alert' : 'status'} className={`mt-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0" />}{error || notice}</div>}

            <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3"><Stat label="Files" value={files.length} /><Stat label="Storage used" value={formatSize(totalBytes)} /><Stat label="Maximum file size" value="10 MB" /></section>

            <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center"><label className="relative mr-auto w-full sm:max-w-sm"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-blue-500" /></label><select value={kind} onChange={(event) => setKind(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500"><option>All</option><option>PDF</option><option>Document</option><option>Spreadsheet</option><option>Image</option><option>Other</option></select></div>
              {!filtered.length ? <Empty filtered={Boolean(search || kind !== 'All')} onUpload={() => setUploadOpen(true)} /> : <div className="divide-y divide-slate-100">{filtered.map((file) => <DocumentRow key={file.name} file={file} onPreview={() => previewFile(file)} onDownload={() => downloadFile(file)} onDelete={() => deleteFile(file)} />)}</div>}
            </section>
            <p className="mt-4 text-xs text-slate-400">Files are private and stored inside your school’s folder. Download and preview links expire automatically.</p>
          </div>
        </main>
      </div>

      {uploadOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !uploading) setUploadOpen(false); }}><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-100 p-6"><div><h2 className="text-xl font-bold text-slate-950">Upload document</h2><p className="mt-1 text-sm text-slate-500">PDF, Word, Excel, CSV, images or text up to 10 MB.</p></div><button type="button" onClick={() => setUploadOpen(false)} disabled={uploading} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button></div><form onSubmit={uploadFile}><div className="p-6"><button type="button" onClick={() => inputRef.current?.click()} className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center hover:border-blue-400 hover:bg-blue-50"><Upload className="h-9 w-9 text-slate-400" /><span className="mt-3 text-sm font-semibold text-slate-800">{chosenFile ? chosenFile.name : 'Choose a file'}</span><span className="mt-1 text-xs text-slate-500">{chosenFile ? formatSize(chosenFile.size) : 'Click here to browse your device'}</span></button><input ref={inputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.txt" onChange={(event) => chooseFile(event.target.files?.[0] || null)} /></div><div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4"><button type="button" onClick={() => setUploadOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button disabled={uploading || !chosenFile} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{uploading ? 'Uploading…' : 'Upload file'}</button></div></form></div></div>}
    </div>
  );
}

function fileVisual(file: StorageFile) {
  const kind = fileKind(file);
  if (kind === 'PDF') return { Icon: FileText, style: 'bg-red-50 text-red-600' };
  if (kind === 'Spreadsheet') return { Icon: FileSpreadsheet, style: 'bg-emerald-50 text-emerald-600' };
  if (kind === 'Image') return { Icon: FileImage, style: 'bg-violet-50 text-violet-600' };
  if (kind === 'Document') return { Icon: FileText, style: 'bg-blue-50 text-blue-600' };
  return { Icon: File, style: 'bg-slate-100 text-slate-600' };
}
function DocumentRow({ file, onPreview, onDownload, onDelete }: { file: StorageFile; onPreview: () => void; onDownload: () => void; onDelete: () => void }) {
  const { Icon, style } = fileVisual(file);
  return <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:px-5"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style}`}><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{readableName(file.name)}</p><p className="mt-1 text-xs text-slate-500">{fileKind(file)} · {formatSize(file.metadata?.size)} · {formatDate(file.created_at || file.updated_at)}</p></div><div className="flex gap-1"><button type="button" onClick={onPreview} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"><Eye className="h-3.5 w-3.5" />Preview</button><button type="button" onClick={onDownload} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"><Download className="h-3.5 w-3.5" />Download</button><button type="button" onClick={onDelete} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label={`Delete ${readableName(file.name)}`}><Trash2 className="h-4 w-4" /></button></div></div>;
}
function Stat({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-950">{value}</p></div>;
}
function Empty({ filtered, onUpload }: { filtered: boolean; onUpload: () => void }) {
  return <div className="px-6 py-16 text-center"><FolderOpen className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 font-bold text-slate-900">{filtered ? 'No matching documents' : 'No documents uploaded yet'}</h2><p className="mt-1 text-sm text-slate-500">{filtered ? 'Try changing the search or file type.' : 'Upload your first official school file.'}</p>{!filtered && <button type="button" onClick={onUpload} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"><Upload className="h-4 w-4" />Upload document</button>}</div>;
}
function PageSkeleton() {
  return <div className="min-h-screen bg-slate-50"><Sidebar /><div className="pt-10 lg:ml-64"><TopBar /><main className="px-4 pb-24 pt-24 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1500px] animate-pulse"><div className="h-24 border-b border-slate-200" /><div className="mt-6 grid grid-cols-3 gap-3"><div className="h-20 rounded-2xl bg-white" /><div className="h-20 rounded-2xl bg-white" /><div className="h-20 rounded-2xl bg-white" /></div><div className="mt-6 h-96 rounded-2xl bg-white" /></div></main></div></div>;
}
