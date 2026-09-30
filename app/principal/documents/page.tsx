'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Archive, Check, ChevronDown, Download, Edit3, Eye, FileArchive, FileImage,
  FileSpreadsheet, FileText, Filter, FolderOpen, Globe2, GraduationCap,
  Loader2, LockKeyhole, MoreVertical, Pin, PinOff, Plus, Search, ShieldCheck, Trash2,
  Upload, Users, X,
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { supabase } from '@/lib/supabase';
import {
  DOCUMENT_BUCKET, DocumentAccessMode, DocumentCategory, SchoolDocument,
  audienceLabels, canInlinePreview, canonicalMimeType, documentTypeLabel,
  fileExtension, formatDocumentDate, formatFileSize, getCategoryName,
  getDocumentStatus, toDateTimeLocal, validateDocumentFile,
} from '@/lib/documents';

type ClassOption = { id: string; class_name: string | null; class: string | null; name: string | null; class_number: string | null; section: string | null; section_name: string | null };
type TeacherOption = { id: string; name: string; subject: string | null; department: string | null };
type Profile = { school_id: string; full_name: string | null; role: string | null; user_id: string };
type StatusFilter = 'all' | 'Published' | 'Scheduled' | 'Expired' | 'Private' | 'Archived';
type Form = {
  title: string; categoryId: string; public: boolean; teachers: boolean; students: boolean; principalOnly: boolean;
  teacherMode: 'all' | 'specific'; studentMode: 'all' | 'specific'; teacherIds: string[]; classIds: string[];
  publishNow: boolean; publishAt: string; expiresAt: string; accessMode: DocumentAccessMode; pinned: boolean;
};

const blankForm = (): Form => ({
  title: '', categoryId: '', public: false, teachers: false, students: false, principalOnly: true,
  teacherMode: 'all', studentMode: 'all', teacherIds: [], classIds: [], publishNow: true,
  publishAt: toDateTimeLocal(new Date().toISOString()), expiresAt: '', accessMode: 'preview_download', pinned: false,
});

function classLabel(item: ClassOption) {
  const name = item.class_name || item.class || item.name || (item.class_number ? `Class ${item.class_number}` : 'Class');
  const section = item.section_name || item.section;
  return section ? `${name} – ${section}` : name;
}
function iconFor(document: SchoolDocument) {
  if (document.mime_type.startsWith('image/')) return FileImage;
  if (document.mime_type.includes('spreadsheet') || document.mime_type.includes('excel')) return FileSpreadsheet;
  if (document.mime_type.includes('zip')) return FileArchive;
  return FileText;
}
const statusTone: Record<string, string> = {
  Published: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Scheduled: 'bg-amber-50 text-amber-700 ring-amber-200',
  Expired: 'bg-rose-50 text-rose-700 ring-rose-200', Private: 'bg-violet-50 text-violet-700 ring-violet-200',
  Archived: 'bg-slate-100 text-slate-600 ring-slate-200',
};

function messageFromError(reason: unknown, fallback: string) {
  if (reason instanceof Error && reason.message) return reason.message;
  if (reason && typeof reason === 'object' && 'message' in reason && typeof reason.message === 'string') {
    return reason.message;
  }
  return fallback;
}

export default function DocumentsPage() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [documents, setDocuments] = useState<SchoolDocument[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolDocument | null>(null);
  const [form, setForm] = useState<Form>(blankForm);
  const [file, setFile] = useState<File | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const [preview, setPreview] = useState<{ document: SchoolDocument; url: string } | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError('');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { setError('Please sign in to manage documents.'); setLoading(false); return; }
    const { data: row, error: profileError } = await supabase.from('profiles').select('school_id,full_name,role,user_id').eq('user_id', user.id).single();
    if (profileError || !row?.school_id || !['admin', 'principal'].includes(row.role || '')) {
      setError('Your principal account is not connected to a school.'); setLoading(false); return;
    }
    const current = row as Profile; setProfile(current);
    const [docs, cats, classRows, teacherRows] = await Promise.all([
      supabase.from('documents').select('*, document_categories(id,name), document_target_classes(class_id), document_target_teachers(teacher_id)').eq('school_id', current.school_id).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('document_categories').select('id,name,school_id').eq('school_id', current.school_id).order('name'),
      supabase.from('classes').select('id,class_name,class,name,class_number,section,section_name').eq('school_id', current.school_id).order('class_number'),
      supabase.from('teachers').select('id,name,subject,department').eq('school_id', current.school_id).order('name'),
    ]);
    const failed = [docs.error, cats.error, classRows.error, teacherRows.error].find(Boolean);
    if (failed) setError(failed.message);
    else {
      setDocuments((docs.data ?? []) as SchoolDocument[]); setCategories((cats.data ?? []) as DocumentCategory[]);
      setPreview(current => { const updated = (docs.data ?? []).find(item => item.id === current?.document.id); return current && updated ? {...current, document:updated as SchoolDocument} : null; });
      setClasses((classRows.data ?? []) as ClassOption[]); setTeachers((teacherRows.data ?? []) as TeacherOption[]);
      const params = new URLSearchParams(window.location.search);
      const selectedDoc = (docs.data ?? []).find((document) => document.id === params.get('document')) as SchoolDocument | undefined;
      if (selectedDoc) {
        if (canInlinePreview(selectedDoc)) {
          const signed = await supabase.storage.from(DOCUMENT_BUCKET).createSignedUrl(selectedDoc.storage_path, 600);
          if (signed.error) setError(signed.error.message);
          else setPreview({ document: selectedDoc, url: signed.data.signedUrl });
        } else setPreview({ document: selectedDoc, url: '' });
        window.history.replaceState(window.history.state, '', window.location.pathname);
      } else if (params.get('action') === 'upload') {
        setEditing(null); setForm(blankForm()); setFile(null); setModalOpen(true);
        window.history.replaceState(window.history.state, '', window.location.pathname);
      }
    }
    setLoading(false);
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => void loadData(), 0); return () => window.clearTimeout(timer); }, [loadData]);

  const filtered = useMemo(() => documents.filter((document) => {
    const needle = query.trim().toLowerCase();
    return (!needle || `${document.title} ${document.original_file_name} ${getCategoryName(document)} ${document.uploader_name}`.toLowerCase().includes(needle))
      && (categoryFilter === 'all' || (categoryFilter === 'uncategorized' ? !document.category_id : document.category_id === categoryFilter))
      && (statusFilter === 'all' ? !document.is_archived : getDocumentStatus(document) === statusFilter)
      && (typeFilter === 'all' || fileExtension(document.original_file_name) === typeFilter)
      && (audienceFilter === 'all' || (audienceFilter === 'principal' ? document.principal_only : audienceFilter === 'public' ? document.visible_public : audienceFilter === 'teachers' ? document.visible_teachers : document.visible_students));
  }), [audienceFilter, categoryFilter, documents, query, statusFilter, typeFilter]);

  function create() { setEditing(null); setForm(blankForm()); setFile(null); setError(''); setModalOpen(true); }
  function edit(document: SchoolDocument) {
    setEditing(document); setFile(null); setError('');
    setForm({
      title: document.title, categoryId: document.category_id || '', public: document.visible_public,
      teachers: document.visible_teachers, students: document.visible_students, principalOnly: document.principal_only,
      teacherMode: document.teacher_target_mode === 'specific' ? 'specific' : 'all',
      studentMode: document.student_target_mode === 'specific' ? 'specific' : 'all',
      teacherIds: document.document_target_teachers?.map((target) => target.teacher_id) ?? [],
      classIds: document.document_target_classes?.map((target) => target.class_id) ?? [],
      publishNow: new Date(document.publish_at) <= new Date(), publishAt: toDateTimeLocal(document.publish_at),
      expiresAt: toDateTimeLocal(document.expires_at), accessMode: document.access_mode, pinned: document.is_pinned,
    });
    setModalOpen(true);
  }
  function audience(key: 'public' | 'teachers' | 'students' | 'principalOnly') {
    setForm((current) => {
      if (key === 'principalOnly') return { ...current, principalOnly: true, public: false, teachers: false, students: false };
      const next = { ...current, [key]: !current[key], principalOnly: false };
      if (!next.public && !next.teachers && !next.students) next.principalOnly = true;
      return next;
    });
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!profile || saving) return;
    setError(''); setNotice('');
    if (!form.title.trim()) { setError('Document title is required.'); return; }
    if (!editing && !file) { setError('Choose a file to upload.'); return; }
    if (file) { const problem = validateDocumentFile(file); if (problem) { setError(problem); return; } }
    if (form.teachers && form.teacherMode === 'specific' && !form.teacherIds.length) { setError('Choose at least one teacher, or select All Teachers.'); return; }
    if (form.students && form.studentMode === 'specific' && !form.classIds.length) { setError('Choose at least one class, or select All Students.'); return; }
    const publishDate = form.publishNow ? (editing && new Date(editing.publish_at) <= new Date() ? new Date(editing.publish_at) : new Date()) : new Date(form.publishAt);
    const expiryDate = form.expiresAt ? new Date(form.expiresAt) : null;
    if (Number.isNaN(publishDate.getTime())) { setError('Choose a valid publish date and time.'); return; }
    if (expiryDate && Number.isNaN(expiryDate.getTime())) { setError('Choose a valid expiry date and time.'); return; }
    const publishAt = publishDate.toISOString();
    const expiresAt = expiryDate?.toISOString() ?? null;
    if (expiresAt && new Date(expiresAt) <= new Date(publishAt)) { setError('Expiry must be after the publish date.'); return; }
    setSaving(true);
    let uploadedPath = ''; let savedId = editing?.id || '';
    try {
      let storagePath = editing?.storage_path || '', originalName = editing?.original_file_name || '';
      let mimeType = editing?.mime_type || '', fileSize = editing?.file_size || 0;
      if (file) {
        storagePath = `${profile.school_id}/${crypto.randomUUID()}.${fileExtension(file.name)}`;
        const contentType = canonicalMimeType(file);
        const uploaded = await supabase.storage.from(DOCUMENT_BUCKET).upload(storagePath, file, { contentType, upsert: false });
        if (uploaded.error) throw uploaded.error;
        uploadedPath = storagePath; originalName = file.name; mimeType = contentType; fileSize = file.size;
      }
      const payload = {
        school_id: profile.school_id, title: form.title.trim(), category_id: form.categoryId || null, storage_path: storagePath,
        original_file_name: originalName, mime_type: mimeType, file_size: fileSize, visible_public: form.public,
        visible_teachers: form.teachers, visible_students: form.students, principal_only: form.principalOnly,
        teacher_target_mode: form.teachers ? form.teacherMode : null, student_target_mode: form.students ? form.studentMode : null,
        publish_at: publishAt, expires_at: expiresAt, access_mode: form.accessMode, is_pinned: form.pinned,
        uploaded_by: profile.user_id, uploader_name: profile.full_name?.trim() || 'School Principal',
      };
      const result = editing
        ? await supabase.from('documents').update(payload).eq('id', editing.id).eq('school_id', profile.school_id).select('id').single()
        : await supabase.from('documents').insert(payload).select('id').single();
      if (result.error || !result.data) throw result.error || new Error('Could not save the document.');
      savedId = result.data.id;
      const [clearClasses, clearTeachers] = await Promise.all([
        supabase.from('document_target_classes').delete().eq('document_id', savedId),
        supabase.from('document_target_teachers').delete().eq('document_id', savedId),
      ]);
      if (clearClasses.error || clearTeachers.error) throw clearClasses.error || clearTeachers.error;
      if (form.students && form.studentMode === 'specific') {
        const inserted = await supabase.from('document_target_classes').insert(form.classIds.map((classId) => ({ document_id: savedId, class_id: classId })));
        if (inserted.error) throw inserted.error;
      }
      if (form.teachers && form.teacherMode === 'specific') {
        const inserted = await supabase.from('document_target_teachers').insert(form.teacherIds.map((teacherId) => ({ document_id: savedId, teacher_id: teacherId })));
        if (inserted.error) throw inserted.error;
      }
      if (editing && uploadedPath && uploadedPath !== editing.storage_path) await supabase.storage.from(DOCUMENT_BUCKET).remove([editing.storage_path]);
      setModalOpen(false); setNotice(editing ? 'Document updated.' : 'Document uploaded.'); await loadData();
    } catch (reason) {
      if (!editing && savedId) await supabase.from('documents').delete().eq('id', savedId);
      if (uploadedPath) await supabase.storage.from(DOCUMENT_BUCKET).remove([uploadedPath]);
      setError(messageFromError(reason, 'Could not save the document. Please try again.'));
    } finally { setSaving(false); }
  }

  async function addCategory() {
    if (!profile || !newCategory.trim()) return;
    const result = await supabase.from('document_categories').insert({ school_id: profile.school_id, name: newCategory.trim(), created_by: profile.user_id });
    if (result.error) setError(result.error.code === '23505' ? 'That category already exists.' : result.error.message);
    else { setNewCategory(''); await loadData(); }
  }
  async function removeCategory(category: DocumentCategory) {
    if (!profile || !window.confirm(`Delete “${category.name}”? Its documents will move to Uncategorized.`)) return;
    const moved = await supabase.from('documents').update({ category_id: null }).eq('school_id', profile.school_id).eq('category_id', category.id);
    if (moved.error) { setError(moved.error.message); return; }
    const removed = await supabase.from('document_categories').delete().eq('id', category.id).eq('school_id', profile.school_id);
    if (removed.error) setError(removed.error.message); else await loadData();
  }
  async function patch(document: SchoolDocument, changes: Partial<SchoolDocument>, message: string) {
    const result = await supabase.from('documents').update(changes).eq('id', document.id).eq('school_id', document.school_id);
    if (result.error) setError(result.error.message); else { setError(''); setNotice(message); await loadData(); }
  }
  async function remove(document: SchoolDocument) {
    if (!window.confirm(`Permanently delete “${document.title}”? This cannot be undone.`)) return;
    const result = await supabase.from('documents').delete().eq('id', document.id).eq('school_id', document.school_id);
    if (result.error) { setError(result.error.message); return; }
    const storage = await supabase.storage.from(DOCUMENT_BUCKET).remove([document.storage_path]);
    if (storage.error) { setError(`Document record deleted, but the file could not be removed: ${storage.error.message}`); return; }
    setNotice('Document deleted.'); await loadData();
  }
  async function open(document: SchoolDocument) {
    if (!canInlinePreview(document)) { setPreview({ document, url: '' }); return; }
    const result = await supabase.storage.from(DOCUMENT_BUCKET).createSignedUrl(document.storage_path, 600);
    if (result.error || !result.data?.signedUrl) setError(result.error?.message || 'Could not preview this file.');
    setPreview({ document, url: result.data?.signedUrl || '' });
  }
  async function download(document: SchoolDocument) {
    const result = await supabase.storage.from(DOCUMENT_BUCKET).createSignedUrl(document.storage_path, 90, { download: document.original_file_name });
    if (result.error || !result.data?.signedUrl) setError(result.error?.message || 'Could not prepare the download.');
    else window.location.assign(result.data.signedUrl);
  }

  const total = documents.length;
  const publicCount = documents.filter((item) => !item.is_archived && item.visible_public).length;
  const restrictedCount = documents.filter((item) => !item.is_archived && !item.visible_public).length;
  const archivedCount = documents.filter((item) => item.is_archived).length;
  const detail = preview?.document;
  return <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
    <Sidebar />
    <div className="flex min-h-screen flex-col pt-10 lg:ml-64"><TopBar />
      <main className="flex-1 px-3 pb-24 pt-7 sm:px-6 lg:px-8 lg:pt-24"><div className="mx-auto max-w-5xl">
        {detail ? <div className="space-y-2">
          <header className="flex items-center gap-2"><button type="button" aria-label="Back to documents" onClick={() => setPreview(null)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronDown className="h-5 w-5 rotate-90" /></button><h1 className="text-lg font-bold">Document Details</h1></header>
          <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start gap-3"><span className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950"><FileText className="h-6 w-6" /></span><div className="min-w-0 flex-1"><h2 className="break-words text-sm font-bold">{detail.title}</h2><p className="mt-0.5 text-xs text-slate-500">{documentTypeLabel(detail)} · {formatFileSize(detail.file_size)}</p><p className="text-xs text-slate-500">Uploaded {formatDocumentDate(detail.created_at, true)} by {detail.uploader_name}</p><div className="mt-2 flex flex-wrap gap-1">{audienceLabels(detail).map(label => <span key={label} className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{label}</span>)}<span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] dark:bg-slate-800">{getCategoryName(detail)}</span></div></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ring-1 ${statusTone[getDocumentStatus(detail)]}`}>{getDocumentStatus(detail)}</span></div></section>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900 dark:border-slate-800">{preview.url && detail.mime_type === 'application/pdf' ? <iframe src={preview.url} title={detail.title} className="h-[52vh] min-h-72 w-full bg-white" /> : preview.url && detail.mime_type.startsWith('image/') ? <div className="relative h-[52vh] min-h-72"><Image src={preview.url} alt={detail.title} fill unoptimized className="object-contain" /></div> : <div className="flex min-h-48 flex-col items-center justify-center p-6 text-center text-white"><FileText className="h-9 w-9 text-slate-400" /><p className="mt-2 text-sm font-semibold">Browser preview unavailable for {documentTypeLabel(detail)}</p><p className="mt-1 text-xs text-slate-400">{detail.access_mode === 'preview_download' ? 'Download to open this file.' : 'This file is set to preview only.'}</p></div>}</div>
          <section className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900"><Meta label="Published" value={formatDocumentDate(detail.publish_at, true)} /><Meta label="Expires" value={formatDocumentDate(detail.expires_at, true)} /><Meta label="Category" value={getCategoryName(detail)} /><Meta label="Access" value={detail.access_mode === 'preview_only' ? 'Preview only' : 'Preview and download'} /><Meta label="Pinned" value={detail.is_pinned ? 'Yes' : 'No'} /><Meta label="Status" value={getDocumentStatus(detail)} />{detail.document_target_classes?.length ? <Meta label="Target classes" value={detail.document_target_classes.map(target => classes.find(item => item.id === target.class_id)).filter(Boolean).map(item => classLabel(item as ClassOption)).join(', ')} /> : null}{detail.document_target_teachers?.length ? <Meta label="Target teachers" value={detail.document_target_teachers.map(target => teachers.find(item => item.id === target.teacher_id)?.name).filter(Boolean).join(', ')} /> : null}</section>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3"><Action icon={Edit3} label="Edit / audience" onClick={() => edit(detail)} /><Action icon={detail.is_pinned ? PinOff : Pin} label={detail.is_pinned ? 'Unpin' : 'Pin'} onClick={() => void patch(detail, { is_pinned: !detail.is_pinned }, 'Pin updated.')} />{detail.access_mode === 'preview_download' && <Action icon={Download} label="Download" onClick={() => void download(detail)} />}<Action icon={Archive} label={detail.is_archived ? 'Restore' : 'Archive'} onClick={() => void patch(detail, { is_archived: !detail.is_archived }, detail.is_archived ? 'Document restored.' : 'Document archived.')} /><Action icon={Trash2} label="Delete" onClick={() => void remove(detail)} danger /></div>
        </div> : <>
          <header className="relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-sky-100 px-3 py-3 dark:border-blue-900 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950"><FolderOpen className="absolute -right-2 -bottom-4 h-24 w-24 text-blue-200/60 dark:text-blue-900/40" /><div className="relative"><p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">School files</p><h1 className="text-xl font-extrabold sm:text-2xl">Documents</h1><p className="max-w-xs text-xs text-slate-600 dark:text-slate-300">Upload once, then choose exactly who can see each file.</p></div></header>
          <button type="button" onClick={create} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700"><Upload className="h-4 w-4" />Upload document</button>
          <div className="mt-2 grid grid-cols-4 gap-1.5 sm:gap-3">{[{label:'Total Files',value:total,icon:FileText,tone:'text-blue-600 bg-blue-50'}, {label:'Public',value:publicCount,icon:Globe2,tone:'text-emerald-600 bg-emerald-50'}, {label:'Restricted',value:restrictedCount,icon:LockKeyhole,tone:'text-amber-600 bg-amber-50'}, {label:'Archived',value:archivedCount,icon:Archive,tone:'text-slate-600 bg-slate-100'}].map(item => <div key={item.label} className="min-w-0 rounded-xl border border-slate-200 bg-white p-2 text-center dark:border-slate-800 dark:bg-slate-900"><span className={`mx-auto flex h-6 w-6 items-center justify-center rounded-md ${item.tone}`}><item.icon className="h-3.5 w-3.5" /></span><strong className="mt-1 block text-sm leading-none">{item.value}</strong><span className="mt-1 block text-[10px] leading-tight text-slate-500">{item.label}</span></div>)}</div>
          <section className="mt-3 space-y-2"><label className="relative block"><span className="sr-only">Search documents</span><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search documents…" className="control pl-9 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label><div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><Select value={categoryFilter} onChange={setCategoryFilter}><option value="all">All categories</option><option value="uncategorized">Uncategorized</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select><Select value={audienceFilter} onChange={setAudienceFilter}><option value="all">All audiences</option><option value="public">Public</option><option value="teachers">Teachers</option><option value="students">Students</option><option value="principal">Principal only</option></Select><Select value={statusFilter} onChange={value => setStatusFilter(value as StatusFilter)}><option value="all">Active statuses</option>{['Published','Scheduled','Expired','Private','Archived'].map(value => <option key={value}>{value}</option>)}</Select><Select value={typeFilter} onChange={setTypeFilter}><option value="all">All file types</option>{['pdf','doc','docx','xls','xlsx','jpg','jpeg','png','webp','zip'].map(value => <option key={value}>{value.toUpperCase()}</option>)}</Select></div><button type="button" onClick={() => setShowCategories(!showCategories)} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600">Manage categories <ChevronDown className={`h-4 w-4 ${showCategories ? 'rotate-180' : ''}`} /></button>{showCategories && <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"><div className="flex gap-2"><input value={newCategory} onChange={event => setNewCategory(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void addCategory(); } }} placeholder="New category" maxLength={80} className="control dark:border-slate-700 dark:bg-slate-800 dark:text-white" /><button type="button" onClick={() => void addCategory()} className="rounded-lg bg-blue-600 px-3 text-white"><Plus className="h-4 w-4" /></button></div><div className="mt-2 flex flex-wrap gap-2">{categories.map(item => <span key={item.id} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800">{item.name}<button type="button" onClick={() => void removeCategory(item)} aria-label={`Delete ${item.name}`}><X className="h-3 w-3" /></button></span>)}</div></div>}</section>
          {loading ? <p className="mt-4 text-center text-sm text-slate-500">Loading documents…</p> : error && !documents.length ? null : !filtered.length ? <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900">No documents match these filters.</div> : <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">{filtered.map(document => { const Icon = iconFor(document); const status = getDocumentStatus(document); return <article key={document.id} className="relative flex items-center gap-2 border-b border-slate-100 p-2 last:border-0 dark:border-slate-800"><button type="button" onClick={() => void open(document)} className="flex min-w-0 flex-1 items-center gap-2 text-left"><span className="shrink-0 rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-xs sm:text-sm">{document.title}</strong><span className="mt-0.5 flex flex-wrap gap-1">{audienceLabels(document).map(label => <span key={label} className="rounded bg-blue-50 px-1 text-[10px] text-blue-700 dark:bg-blue-950 dark:text-blue-300">{label}</span>)}<span className="rounded bg-slate-100 px-1 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{getCategoryName(document)}</span>{status !== 'Published' && <span className="text-[10px] text-amber-600">{status}</span>}{document.is_pinned && <Pin className="h-3 w-3 text-amber-500" />}</span><small className="mt-0.5 block text-[10px] text-slate-500">{documentTypeLabel(document)} · {formatFileSize(document.file_size)} · {formatDocumentDate(document.created_at)}</small></span></button><button type="button" aria-label={`Actions for ${document.title}`} onClick={() => setMenuId(menuId === document.id ? null : document.id)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><MoreVertical className="h-4 w-4" /></button>{menuId === document.id && <div className="absolute right-2 top-9 z-10 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">{[{label:'View details',action:() => void open(document)}, {label:'Edit / audience',action:() => edit(document)}, {label:document.is_pinned ? 'Unpin' : 'Pin',action:() => void patch(document,{is_pinned:!document.is_pinned},'Pin updated.')}, ...(document.access_mode === 'preview_download' ? [{label:'Download',action:() => void download(document)}] : []), {label:document.is_archived ? 'Restore' : 'Archive',action:() => void patch(document,{is_archived:!document.is_archived},document.is_archived?'Document restored.':'Document archived.')}, {label:'Delete permanently',action:() => void remove(document)}].map(action => <button type="button" key={action.label} onClick={() => { setMenuId(null); action.action(); }} className="block w-full rounded-lg px-2 py-1.5 text-left text-xs hover:bg-slate-100 dark:hover:bg-slate-700">{action.label}</button>)}</div>}</article>; })}</div>}
        </>}
        {(error || notice) && <div role={error ? 'alert' : 'status'} className={`mt-3 rounded-lg p-2 text-xs ${error ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}`}>{error || notice}</div>}
      </div></main>
    </div>
    {modalOpen && <Modal form={form} setForm={setForm} editing={editing} file={file} setFile={setFile} fileInput={fileInput} categories={categories} classes={classes} teachers={teachers} saving={saving} error={error} close={() => { if (!saving) { setModalOpen(false); setError(''); } }} save={save} audience={audience} createCategory={async name => { if (!profile) return; const result = await supabase.from('document_categories').insert({school_id:profile.school_id,name,created_by:profile.user_id}).select('id,name,school_id').single(); if (result.error) setError(result.error.message); else { setCategories(current => [...current,result.data as DocumentCategory].sort((a,b) => a.name.localeCompare(b.name))); setForm(current => ({...current,categoryId:result.data.id})); } }} />}
  </div>;
}

function Select({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="relative"><Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><select value={value} onChange={(e) => onChange(e.target.value)} className="control appearance-none pl-9 pr-8">{children}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /></label>;
}
function Meta({ label, value }: { label: string; value: string }) { return <div><dt className="text-slate-400">{label}</dt><dd className="mt-1 font-semibold text-slate-700">{value}</dd></div>; }
function Action({ icon: Icon, label, onClick, danger, spin }: { icon: React.ElementType; label: string; onClick: () => void; danger?: boolean; spin?: boolean }) { return <button type="button" onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-bold ${danger ? 'border-red-100 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950' : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'}`}><Icon className={`h-3.5 w-3.5 ${spin ? 'animate-spin' : ''}`} />{label}</button>; }

function Modal({ form, setForm, editing, file, setFile, fileInput, categories, classes, teachers, saving, error, close, save, audience, createCategory }: { form: Form; setForm: React.Dispatch<React.SetStateAction<Form>>; editing: SchoolDocument | null; file: File | null; setFile: (file: File | null) => void; fileInput: React.RefObject<HTMLInputElement | null>; categories: DocumentCategory[]; classes: ClassOption[]; teachers: TeacherOption[]; saving: boolean; error: string; close: () => void; save: (event: FormEvent) => void; audience: (key: 'public' | 'teachers' | 'students' | 'principalOnly') => void; createCategory: (name: string) => Promise<void> }) {
  const [categoryName, setCategoryName] = useState('');
  return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true"><form onSubmit={save} className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white text-slate-900 shadow-2xl dark:bg-slate-900 dark:text-slate-100 sm:rounded-2xl">
    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700"><div><h2 className="text-lg font-extrabold text-slate-950 dark:text-white">{editing ? 'Edit document' : 'Upload document'}</h2><p className="text-xs text-slate-500">Title is the only required document information.</p></div><button type="button" onClick={close} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></div>
    <div className="overflow-y-auto p-4"><div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-3"><Field label="Document title *"><input required maxLength={180} value={form.title} onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))} placeholder="e.g. School calendar 2083" className="control dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></Field>
        <Field label={editing ? 'Replace file (optional)' : 'File *'}><input ref={fileInput} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.zip" onChange={(e) => setFile(e.target.files?.[0] || null)} /><button type="button" onClick={() => fileInput.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); setFile(event.dataTransfer.files?.[0] || null); }} className="flex w-full items-center gap-3 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 p-4 text-left hover:border-blue-400 dark:border-blue-800 dark:bg-slate-800"><Upload className="h-6 w-6 shrink-0 text-blue-600" /><span className="min-w-0"><span className="block truncate text-sm font-bold">{file?.name || editing?.original_file_name || 'Drag a file here or tap to browse'}</span><span className="text-xs text-slate-500">PDF, Word, Excel, images, ZIP · 25 MB max</span></span></button></Field>
        <Field label="Category"><select value={form.categoryId} onChange={(e) => setForm((v) => ({ ...v, categoryId: e.target.value }))} className="control dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="">Uncategorized</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><div className="mt-1.5 flex gap-2"><input value={categoryName} onChange={event => setCategoryName(event.target.value)} placeholder="New category (optional)" maxLength={80} className="control dark:border-slate-700 dark:bg-slate-800 dark:text-white" /><button type="button" onClick={async () => { if (categoryName.trim()) { await createCategory(categoryName.trim()); setCategoryName(''); } }} className="rounded-lg border border-slate-200 px-2 text-xs font-semibold dark:border-slate-700">Create</button></div></Field>
        <Field label="Access mode"><div className="grid grid-cols-2 gap-2"><Choice selected={form.accessMode === 'preview_download'} onClick={() => setForm((v) => ({ ...v, accessMode: 'preview_download' }))} icon={Download} title="Preview + Download" /><Choice selected={form.accessMode === 'preview_only'} onClick={() => setForm((v) => ({ ...v, accessMode: 'preview_only' }))} icon={Eye} title="Preview only" /></div><p className="mt-2 text-xs leading-5 text-slate-500">Preview-only hides download controls, but browsers cannot completely prevent copying displayed content.</p></Field>
      </div>
      <div className="space-y-3"><Field label="Who can access it?"><div className="grid grid-cols-2 gap-2"><Choice selected={form.public} onClick={() => audience('public')} icon={Globe2} title="Public website" /><Choice selected={form.teachers} onClick={() => audience('teachers')} icon={Users} title="Teachers" /><Choice selected={form.students} onClick={() => audience('students')} icon={GraduationCap} title="Students" /><Choice selected={form.principalOnly} onClick={() => audience('principalOnly')} icon={ShieldCheck} title="Principal only" /></div></Field>
        {form.teachers && <Targets title="Teacher access" mode={form.teacherMode} all="All teachers" change={(mode) => setForm((v) => ({ ...v, teacherMode: mode }))}>{form.teacherMode === 'specific' && <Options>{teachers.map((item) => <CheckRow key={item.id} checked={form.teacherIds.includes(item.id)} label={`${item.name}${item.subject ? ` · ${item.subject}` : ''}`} change={() => setForm((v) => ({ ...v, teacherIds: toggle(v.teacherIds, item.id) }))} />)}</Options>}</Targets>}
        {form.students && <Targets title="Student access" mode={form.studentMode} all="All students" change={(mode) => setForm((v) => ({ ...v, studentMode: mode }))}>{form.studentMode === 'specific' && <Options>{classes.map((item) => <CheckRow key={item.id} checked={form.classIds.includes(item.id)} label={classLabel(item)} change={() => setForm((v) => ({ ...v, classIds: toggle(v.classIds, item.id) }))} />)}</Options>}</Targets>}
        <Field label="Publish"><label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.publishNow} onChange={(e) => setForm((v) => ({ ...v, publishNow: e.target.checked }))} className="h-4 w-4 rounded" />Publish now</label>{!form.publishNow && <input type="datetime-local" required value={form.publishAt} onChange={(e) => setForm((v) => ({ ...v, publishAt: e.target.value }))} className="control mt-2" />}</Field>
        <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={form.pinned} onChange={event => setForm(value => ({...value,pinned:event.target.checked}))} />Pin document</label>
        <Field label="Expiry (optional)"><input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm((v) => ({ ...v, expiresAt: e.target.value }))} className="control dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></Field>
      </div>
    </div>{error && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}</div>
    <div className="flex gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800"><button type="button" onClick={close} disabled={saving} className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold dark:border-slate-600 dark:bg-slate-900 dark:text-white">Cancel</button><button type="submit" disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{editing ? 'Save changes' : 'Upload document'}</button></div>
  </form></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>{children}</label>; }
function Choice({ selected, onClick, icon: Icon, title }: { selected: boolean; onClick: () => void; icon: React.ElementType; title: string }) { return <button type="button" onClick={onClick} className={`flex min-h-16 items-center gap-2 rounded-xl border p-3 text-left text-xs font-bold ${selected ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-100 dark:bg-blue-950 dark:text-blue-200 dark:ring-blue-900' : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${selected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}><Icon className="h-4 w-4" /></span><span className="flex-1">{title}</span>{selected && <Check className="h-4 w-4" />}</button>; }
function Targets({ title, mode, all, change, children }: { title: string; mode: 'all' | 'specific'; all: string; change: (mode: 'all' | 'specific') => void; children: React.ReactNode }) { return <Field label={title}><div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800"><button type="button" onClick={() => change('all')} className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold ${mode === 'all' ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-700 dark:text-blue-300' : 'text-slate-500'}`}>{all}</button><button type="button" onClick={() => change('specific')} className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold ${mode === 'specific' ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-700 dark:text-blue-300' : 'text-slate-500'}`}>Choose specific</button></div>{children}</Field>; }
function Options({ children }: { children: React.ReactNode }) { return <div className="mt-2 max-h-36 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-slate-700">{children}</div>; }
function CheckRow({ checked, label, change }: { checked: boolean; label: string; change: () => void }) { return <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-slate-50"><input type="checkbox" checked={checked} onChange={change} className="h-4 w-4 rounded" /><span className="truncate">{label}</span></label>; }
function toggle(values: string[], id: string) { return values.includes(id) ? values.filter((value) => value !== id) : [...values, id]; }
