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

const SUBJECT_COVERS = [
  'from-rose-700 via-red-500 to-orange-300',
  'from-blue-900 via-blue-600 to-sky-300',
  'from-emerald-950 via-emerald-800 to-teal-500',
  'from-slate-950 via-blue-950 to-blue-500',
  'from-amber-800 via-orange-600 to-yellow-300',
  'from-violet-900 via-indigo-700 to-blue-400',
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
      <div className="pt-[55px] lg:ml-64 lg:pt-10">
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
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5" aria-label="Loading subjects">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="aspect-[0.84] animate-pulse rounded-2xl border border-slate-200 bg-white" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5">
                {subjects.map((subject, index) => (
                  <article
                    key={subject.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-2.5 shadow-[0_5px_18px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(15,23,42,0.10)] sm:p-4"
                  >
                    <div className={`relative aspect-[1.18] overflow-hidden rounded-xl bg-gradient-to-br ${SUBJECT_COVERS[index % SUBJECT_COVERS.length]}`}>
                      <div className="absolute -right-[12%] -top-[8%] h-[116%] w-[78%] rotate-[-7deg] rounded-md border-l-[7px] border-white/30 bg-black/10 shadow-[-10px_12px_22px_rgba(15,23,42,0.28)]" />
                      <BookOpen className="absolute bottom-3 right-3 h-10 w-10 text-white/20 sm:h-14 sm:w-14" strokeWidth={1.4} aria-hidden="true" />
                      <span className="absolute left-3 right-2 top-3 line-clamp-2 text-[15px] font-black leading-tight tracking-[-0.03em] text-white drop-shadow-sm sm:left-5 sm:top-5 sm:text-2xl">
                        {subject.name}
                      </span>
                    </div>

                    <div className="flex min-w-0 items-center gap-2 px-1 pb-0.5 pt-3 sm:pt-4">
                      <h3 className="min-w-0 flex-1 truncate text-[15px] font-extrabold tracking-[-0.02em] text-slate-950 sm:text-xl">
                        {subject.name}
                      </h3>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition group-hover:bg-blue-50 group-hover:text-blue-700 sm:h-10 sm:w-10">
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </div>
                  </article>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setAdding(true);
                  }}
                  className="flex aspect-[0.84] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white/50 p-4 text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-current sm:h-16 sm:w-16">
                    <Plus className="h-7 w-7 sm:h-9 sm:w-9" aria-hidden="true" />
                  </span>
                  <span className="text-base font-extrabold sm:text-xl">Add Subject</span>
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
