'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { BookOpen, ChevronRight, Loader2, Plus, X } from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { supabase } from '@/lib/supabase';

type Subject = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

const DEFAULT_SUBJECTS = [
  'Nepali',
  'English',
  'Mathematics',
  'Science',
  'Social Studies',
  'Computer',
];

const SUBJECT_TONES = [
  'bg-rose-50 text-rose-700',
  'bg-blue-50 text-blue-700',
  'bg-emerald-50 text-emerald-700',
  'bg-indigo-50 text-indigo-700',
  'bg-amber-50 text-amber-700',
  'bg-violet-50 text-violet-700',
];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [error, setError] = useState('');

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Please sign in again.');

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('school_id, role')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile?.school_id || profile.role !== 'admin') {
        throw new Error('A principal school account is required.');
      }

      setSchoolId(profile.school_id);
      setUserId(user.id);

      const { data: existing, error: subjectsError } = await supabase
        .from('school_subjects')
        .select('id, name, sort_order, created_at')
        .eq('school_id', profile.school_id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (subjectsError) throw subjectsError;

      if ((existing || []).length > 0) {
        setSubjects(existing as Subject[]);
        return;
      }

      const defaults = DEFAULT_SUBJECTS.map((name, index) => ({
        school_id: profile.school_id,
        name,
        sort_order: index,
        created_by: user.id,
      }));

      const { data: created, error: defaultsError } = await supabase
        .from('school_subjects')
        .insert(defaults)
        .select('id, name, sort_order, created_at');

      if (defaultsError && defaultsError.code !== '23505') throw defaultsError;

      if (created?.length) {
        setSubjects((created as Subject[]).sort((a, b) => a.sort_order - b.sort_order));
      } else {
        const { data: refreshed, error: refreshError } = await supabase
          .from('school_subjects')
          .select('id, name, sort_order, created_at')
          .eq('school_id', profile.school_id)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true });
        if (refreshError) throw refreshError;
        setSubjects((refreshed || []) as Subject[]);
      }
    } catch (loadError) {
      console.error('Subjects page load error', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Subjects could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  const normalizedNames = useMemo(
    () => new Set(subjects.map((subject) => subject.name.trim().toLowerCase())),
    [subjects],
  );

  async function addSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = subjectName.replace(/\s+/g, ' ').trim();
    if (!schoolId || !userId || !name || saving) return;

    if (normalizedNames.has(name.toLowerCase())) {
      setError('This subject already exists.');
      return;
    }

    setSaving(true);
    setError('');

    const { data, error: insertError } = await supabase
      .from('school_subjects')
      .insert({
        school_id: schoolId,
        name,
        sort_order: subjects.length,
        created_by: userId,
      })
      .select('id, name, sort_order, created_at')
      .single();

    setSaving(false);

    if (insertError) {
      setError(insertError.code === '23505' ? 'This subject already exists.' : insertError.message);
      return;
    }

    setSubjects((current) => [...current, data as Subject]);
    setSubjectName('');
    setAdding(false);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="pt-14 lg:ml-64 lg:pt-10">
        <div className="hidden lg:block">
          <TopBar />
        </div>

        <main className="px-3 pb-24 pt-0 sm:px-6 lg:px-8 lg:pt-24">
          <div className="mx-auto max-w-[1180px]">
            <section className="relative -mx-3 aspect-[1672/650] w-[calc(100%+1.5rem)] overflow-hidden bg-[#edf7ff] sm:mx-0 sm:w-full sm:rounded-2xl sm:border sm:border-blue-100 sm:shadow-sm">
              <Image
                src="/subject.png"
                alt="Subjects — manage school subjects, grades and teacher mapping"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 1180px"
                className="object-cover object-center"
              />
            </section>

            <div className="mb-3 mt-6">
              <h2 className="text-xl font-extrabold tracking-[-0.02em] text-slate-950 sm:text-2xl">Subject List</h2>
              <p className="mt-1 text-sm text-slate-500">These subjects are used in classes and exams.</p>
            </div>

            {error && (
              <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            {loading ? (
              <div className="space-y-2.5" aria-label="Loading subjects">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="h-[68px] animate-pulse rounded-2xl border border-slate-200 bg-white" />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5">
                {subjects.map((subject, index) => (
                  <article
                    key={subject.id}
                    className="flex min-h-[68px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-[0_2px_8px_rgba(15,23,42,0.035)] sm:min-h-[76px] sm:px-4"
                  >
                    <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${SUBJECT_TONES[index % SUBJECT_TONES.length]}`}>
                      <BookOpen className="h-6 w-6" strokeWidth={1.9} aria-hidden="true" />
                    </span>
                    <h3 className="min-w-0 flex-1 truncate text-[17px] font-bold tracking-[-0.02em] text-slate-950 sm:text-lg">
                      {subject.name}
                    </h3>
                    <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                  </article>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setAdding(true);
                  }}
                  className="flex min-h-[68px] w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/60 px-4 text-base font-bold text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <Plus className="h-6 w-6" aria-hidden="true" />
                  Add Subject
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {adding && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) setAdding(false);
          }}
        >
          <form
            onSubmit={addSubject}
            className="w-full rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-subject-title"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="add-subject-title" className="text-xl font-extrabold text-slate-950">Add Subject</h2>
                <p className="mt-1 text-sm text-slate-500">Add another subject to your school.</p>
              </div>
              <button
                type="button"
                onClick={() => setAdding(false)}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 disabled:opacity-50"
                aria-label="Close add subject"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <label className="mt-5 block">
              <span className="mb-1.5 block text-sm font-bold text-slate-800">Subject name</span>
              <input
                autoFocus
                required
                maxLength={80}
                value={subjectName}
                onChange={(event) => setSubjectName(event.target.value)}
                placeholder="For example: Health Education"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <button
              type="submit"
              disabled={saving || !subjectName.trim()}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
              {saving ? 'Adding...' : 'Add Subject'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
