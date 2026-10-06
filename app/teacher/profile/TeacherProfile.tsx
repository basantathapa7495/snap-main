"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  BriefcaseBusiness,
  Camera,
  Check,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  MonitorCog,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/TopBar";
import { supabase } from "@/lib/supabase";
import {
  classLabel,
  matchesStudent,
  type Assignment,
  type ClassRow,
} from "@/lib/teacher-classes";

type Section =
  "home" | "personal" | "professional" | "security" | "preferences";
type Teacher = {
  id: string;
  school_id: string;
  name: string;
  subject: string | null;
  phone: string | null;
  email: string | null;
  qualification: string | null;
  address: string | null;
  user_id: string;
  department: string | null;
  joining_date: string | null;
  date_of_birth: string | null;
  gender: string | null;
  employment_status: string;
  employee_id: string | null;
  left_at: string | null;
};
type Profile = {
  user_id: string;
  school_id: string;
  role: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_path: string | null;
};
type Student = {
  id: string;
  name: string;
  roll_no: string | null;
  class: string;
  section: string | null;
};
type Attendance = { status: string };
type Data = {
  teacher: Teacher;
  profile: Profile;
  email: string;
  lastSignIn: string | null;
  school: string;
  assignments: Assignment[];
  classes: ClassRow[];
  students: Student[];
  attendance: Attendance[];
  avatar: string;
};
const panel =
  "rounded-[18px] border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,.04)] dark:border-slate-800 dark:bg-slate-900";
const field =
  "h-12 w-full rounded-[13px] border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-slate-700 dark:bg-slate-900";
const muted = "text-slate-500 dark:text-slate-400";
const types = new Set(["image/jpeg", "image/png", "image/webp"]);
async function allRows<T>(
  request: (
    from: number,
    to: number,
  ) => PromiseLike<{
    data: unknown[] | null;
    error: { message: string } | null;
  }>,
): Promise<T[]> {
  const result: T[] = [];
  for (let from = 0; ; from += 500) {
    const page = await request(from, from + 499);
    if (page.error) throw new Error(page.error.message);
    result.push(...((page.data || []) as T[]));
    if ((page.data || []).length < 500) return result;
  }
}
function Initials({ name, avatar }: { name: string; avatar: string }) {
  return (
    <span
      aria-label={`${name} profile photo`}
      style={avatar ? { backgroundImage: `url(${avatar})` } : undefined}
      className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-blue-200 bg-cover bg-center text-2xl font-extrabold text-blue-700 dark:from-blue-950 dark:to-indigo-900 dark:text-blue-200`}
    >
      {avatar
        ? null
        : name
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase()}
    </span>
  );
}
function Metric({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: typeof Users;
  value: string | number;
  label: string;
  tone: string;
}) {
  return (
    <div className={`rounded-[15px] p-2.5 text-center sm:p-4 ${tone}`}>
      <Icon className="mx-auto mb-1 h-5 w-5" />
      <p className="text-xl font-extrabold sm:text-2xl">{value}</p>
      <p className="truncate text-[10px] font-medium text-slate-600 dark:text-slate-300 sm:text-xs">
        {label}
      </p>
    </div>
  );
}
function Flash({ error, children }: { error: boolean; children: ReactNode }) {
  return (
    <p
      role={error ? "alert" : "status"}
      className={`rounded-xl border p-3 text-xs ${error ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"}`}
    >
      {children}
    </p>
  );
}

export default function TeacherProfile({ section }: { section: Section }) {
  const router = useRouter();
  const [data, setData] = useState<Data | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [retry, setRetry] = useState(0),
    [saving, setSaving] = useState(false),
    [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [email, setEmail] = useState(""),
    [address, setAddress] = useState(""),
    [dob, setDob] = useState(""),
    [gender, setGender] = useState(""),
    [photo, setPhoto] = useState<File | null>(null),
    [preview, setPreview] = useState(""),
    [currentPassword, setCurrentPassword] = useState(""),
    [newPassword, setNewPassword] = useState(""),
    [confirmPassword, setConfirmPassword] = useState(""),
    [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError || !auth.user)
          throw new Error("Please sign in with your teacher account.");
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("user_id,school_id,role,full_name,phone,address,avatar_path")
          .eq("user_id", auth.user.id)
          .single();
        if (profileError || profile?.role !== "teacher" || !profile.school_id)
          throw new Error("Teacher profile access unavailable.");
        const { data: teacher, error: teacherError } = await supabase
          .from("teachers")
          .select(
            "id,school_id,name,subject,phone,email,qualification,address,user_id,department,joining_date,date_of_birth,gender,employment_status,employee_id,left_at",
          )
          .eq("user_id", auth.user.id)
          .eq("school_id", profile.school_id)
          .is("left_at", null)
          .single();
        if (teacherError || !teacher)
          throw new Error("Active teacher record unavailable.");
        const [assignments, classes, students, attendance, school] =
          await Promise.all([
            allRows<Assignment>((a, b) =>
              supabase
                .from("teacher_assignments")
                .select(
                  "id,class_id,class_name,subject,period_id,weekday,periods_per_week,academic_year",
                )
                .eq("school_id", profile.school_id)
                .eq("teacher_id", teacher.id)
                .eq("active", true)
                .range(a, b),
            ),
            allRows<ClassRow>((a, b) =>
              supabase
                .from("classes")
                .select(
                  "id,school_id,class_name,class,name,class_number,section_name,section,academic_year,archived_at",
                )
                .eq("school_id", profile.school_id)
                .is("archived_at", null)
                .range(a, b),
            ),
            allRows<Student>((a, b) =>
              supabase
                .from("students")
                .select("id,name,roll_no,class,section")
                .eq("school_id", profile.school_id)
                .range(a, b),
            ),
            allRows<Attendance>((a, b) =>
              supabase
                .from("teacher_attendance")
                .select("status")
                .eq("school_id", profile.school_id)
                .eq("teacher_id", teacher.id)
                .range(a, b),
            ),
            supabase
              .from("schools")
              .select("name")
              .eq("id", profile.school_id)
              .single(),
          ]);
        let avatar = "";
        if (profile.avatar_path) {
          const signed = await supabase.storage
            .from("teacher-avatars")
            .createSignedUrl(profile.avatar_path, 3600);
          if (signed.data) avatar = signed.data.signedUrl;
        }
        const next = {
          teacher: teacher as Teacher,
          profile: profile as Profile,
          email: auth.user.email || teacher.email || "",
          lastSignIn: auth.user.last_sign_in_at || null,
          school: school.data?.name || "School",
          assignments,
          classes,
          students,
          attendance,
          avatar,
        };
        if (active) {
          setData(next);
          setName(teacher.name);
          setPhone(teacher.phone || profile.phone || "");
          setEmail(next.email);
          setAddress(teacher.address || profile.address || "");
          setDob(teacher.date_of_birth || "");
          setGender(teacher.gender || "");
        }
      } catch (cause) {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Profile could not be loaded.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [retry]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  if (loading)
    return (
      <Shell>
        <div className="flex justify-center gap-2 py-20">
          <Loader2 className="animate-spin text-blue-600" />
          Loading profile…
        </div>
      </Shell>
    );
  if (!data)
    return (
      <Shell>
        <div className={`${panel} p-5`}>
          <p>{error}</p>
          <button
            onClick={() => setRetry((v) => v + 1)}
            className="mt-3 font-bold text-blue-600"
          >
            Retry
          </button>
        </div>
      </Shell>
    );
  const currentData = data;
  const assigned = currentData.classes.filter((row) =>
      currentData.assignments.some(
        (assignment) => assignment.class_id === row.id,
      ),
    ),
    studentIds = new Set(
      currentData.students
        .filter((student) =>
          assigned.some((row) => matchesStudent(student, row)),
        )
        .map((student) => student.id),
    ),
    statuses = currentData.attendance
      .map((row) => row.status.toLowerCase())
      .filter((value) =>
        ["present", "late", "absent", "leave"].includes(value),
      ),
    attendanceRate = statuses.length
      ? Math.round(
          (statuses.filter((value) => value === "present" || value === "late")
            .length /
            statuses.length) *
            100,
        )
      : null,
    subjects = [
      ...new Set(
        currentData.assignments
          .map((assignment) => assignment.subject.trim())
          .filter(Boolean),
      ),
    ];
  function choosePhoto(file: File | null) {
    setError("");
    if (!file) {
      setPhoto(null);
      setPreview("");
      return;
    }
    if (!types.has(file.type)) {
      setError("Choose a JPG, JPEG, PNG or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Profile photo must be 2 MB or smaller.");
      return;
    }
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }
  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (name.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    setSaving(true);
    let uploaded = "";
    try {
      let path = currentData.profile.avatar_path || "";
      if (photo) {
        const extension =
          photo.type === "image/png"
            ? "png"
            : photo.type === "image/webp"
              ? "webp"
              : "jpg";
        uploaded = `${currentData.teacher.user_id}/${crypto.randomUUID()}.${extension}`;
        const result = await supabase.storage
          .from("teacher-avatars")
          .upload(uploaded, photo, { contentType: photo.type, upsert: false });
        if (result.error) throw result.error;
        path = uploaded;
      }
      const updated = await supabase.rpc("update_my_teacher_profile", {
        p_name: name.trim(),
        p_phone: phone.trim(),
        p_address: address.trim(),
        p_date_of_birth: dob || null,
        p_gender: gender,
        p_avatar_path: path,
      });
      if (updated.error) throw updated.error;
      if (email.trim().toLowerCase() !== currentData.email.toLowerCase()) {
        const changed = await supabase.auth.updateUser({
          email: email.trim().toLowerCase(),
        });
        if (changed.error) throw changed.error;
      }
      if (uploaded && currentData.profile.avatar_path)
        await supabase.storage
          .from("teacher-avatars")
          .remove([currentData.profile.avatar_path]);
      setPhoto(null);
      setPreview("");
      setSuccess(
        email.trim().toLowerCase() !== currentData.email.toLowerCase()
          ? "Profile saved. Confirm the new email from your inbox."
          : "Profile saved successfully.",
      );
      setRetry((value) => value + 1);
    } catch (cause) {
      if (uploaded)
        await supabase.storage.from("teacher-avatars").remove([uploaded]);
      setError(
        cause instanceof Error ? cause.message : "Profile could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (
      newPassword.length < 8 ||
      !/[A-Za-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword)
    ) {
      setError("Use at least 8 characters with letters and numbers.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const verified = await supabase.auth.signInWithPassword({
        email: currentData.email,
        password: currentPassword,
      });
      if (verified.error) throw new Error("Current password is incorrect.");
      const changed = await supabase.auth.updateUser({ password: newPassword });
      if (changed.error) throw changed.error;
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password updated successfully.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Password could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function logout() {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }
  const avatar = preview || currentData.avatar;
  return (
    <Shell>
      {section !== "home" && (
        <Link
          href="/teacher/profile"
          className={`inline-flex items-center gap-2 text-sm font-semibold ${muted}`}
        >
          ← My Profile
        </Link>
      )}
      {(error || success) && (
        <Flash error={Boolean(error)}>{error || success}</Flash>
      )}
      {section === "home" ? (
        <>
          <header>
            <h1 className="text-[28px] font-extrabold tracking-[-.035em]">
              My Profile
            </h1>
            <p className={`mt-1 text-sm ${muted}`}>
              View and manage your profile, account and preferences.
            </p>
          </header>
          <ProfileCard data={data} avatar={avatar} assigned={assigned} />
          <div className="grid grid-cols-4 gap-2">
            <Metric
              icon={BookOpen}
              value={assigned.length}
              label="Classes"
              tone="bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-300"
            />
            <Metric
              icon={Users}
              value={studentIds.size}
              label="Students"
              tone="bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
            />
            <Metric
              icon={Check}
              value={attendanceRate === null ? "—" : `${attendanceRate}%`}
              label="Attendance"
              tone="bg-indigo-50 text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300"
            />
            <Metric
              icon={GraduationCap}
              value={subjects.length}
              label="Subjects"
              tone="bg-rose-50 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"
            />
          </div>
          <div
            className={`${panel} divide-y divide-slate-100 overflow-hidden dark:divide-slate-800`}
          >
            <Menu
              href="personal"
              icon={UserRound}
              tone="bg-blue-50 text-blue-600"
              title="Personal Information"
              detail="View and update your personal details."
            />
            <Menu
              href="professional"
              icon={BriefcaseBusiness}
              tone="bg-emerald-50 text-emerald-600"
              title="Professional Information"
              detail="Subject, classes, qualifications and employment."
            />
            <Menu
              href="security"
              icon={ShieldCheck}
              tone="bg-rose-50 text-rose-600"
              title="Account & Security"
              detail="Password and supported account settings."
            />
            <Menu
              href="preferences"
              icon={MonitorCog}
              tone="bg-amber-50 text-amber-600"
              title="Preferences"
              detail="Appearance and timezone settings."
            />
          </div>
        </>
      ) : section === "personal" ? (
        <Personal
          data={data}
          avatar={avatar}
          name={name}
          setName={setName}
          phone={phone}
          setPhone={setPhone}
          email={email}
          setEmail={setEmail}
          address={address}
          setAddress={setAddress}
          dob={dob}
          setDob={setDob}
          gender={gender}
          setGender={setGender}
          choosePhoto={choosePhoto}
          save={saveProfile}
          saving={saving}
        />
      ) : section === "professional" ? (
        <Professional data={data} assigned={assigned} subjects={subjects} />
      ) : section === "security" ? (
        <Security
          data={data}
          current={currentPassword}
          setCurrent={setCurrentPassword}
          password={newPassword}
          setPassword={setNewPassword}
          confirm={confirmPassword}
          setConfirm={setConfirmPassword}
          visible={showPassword}
          setVisible={setShowPassword}
          save={changePassword}
          saving={saving}
          logout={logout}
        />
      ) : (
        <Preferences />
      )}
    </Shell>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
        <TopBar />
        <main className="flex-1 px-3.5 pb-28 pt-20 sm:px-6 sm:pt-24 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
function ProfileCard({
  data,
  avatar,
  assigned,
}: {
  data: Data;
  avatar: string;
  assigned: ClassRow[];
}) {
  return (
    <section className="relative overflow-hidden rounded-[20px] border border-blue-100 bg-gradient-to-br from-sky-50 to-blue-100 p-5 dark:border-blue-900/50 dark:from-blue-950/60 dark:to-slate-900">
      <div className="flex items-center gap-4">
        <Initials name={data.teacher.name} avatar={avatar} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-extrabold text-[#10245f] dark:text-blue-100">
              {data.teacher.name}
            </h2>
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold capitalize text-emerald-700">
              {data.teacher.employment_status}
            </span>
          </div>
          <p className={`mt-1 text-sm ${muted}`}>
            {data.teacher.subject
              ? `${data.teacher.subject} Teacher`
              : "Teacher"}
          </p>
          <p className={`mt-2 text-xs ${muted}`}>
            {assigned.map(classLabel).join(", ") || "No assigned classes"}
          </p>
          <p className={`mt-1 text-xs ${muted}`}>
            {data.teacher.joining_date
              ? `Joined ${data.teacher.joining_date}`
              : "Joining date not recorded"}
          </p>
          {data.teacher.employee_id && (
            <p className={`mt-1 text-xs ${muted}`}>
              Employee ID: {data.teacher.employee_id}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
function Menu({
  href,
  icon: Icon,
  tone,
  title,
  detail,
}: {
  href: string;
  icon: typeof Users;
  tone: string;
  title: string;
  detail: string;
}) {
  return (
    <Link
      href={`/teacher/profile/${href}`}
      className="flex min-h-[72px] items-center gap-3 p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800"
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tone}`}
      >
        <Icon size={21} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold">{title}</p>
        <p className={`mt-1 text-xs ${muted}`}>{detail}</p>
      </div>
      <ChevronRight size={18} className={muted} />
    </Link>
  );
}
function Personal({
  data,
  avatar,
  name,
  setName,
  phone,
  setPhone,
  email,
  setEmail,
  address,
  setAddress,
  dob,
  setDob,
  gender,
  setGender,
  choosePhoto,
  save,
  saving,
}: {
  data: Data;
  avatar: string;
  name: string;
  setName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  dob: string;
  setDob: (v: string) => void;
  gender: string;
  setGender: (v: string) => void;
  choosePhoto: (v: File | null) => void;
  save: (e: FormEvent) => void;
  saving: boolean;
}) {
  return (
    <form onSubmit={save} className="space-y-4">
      <div className="rounded-[20px] border border-blue-100 bg-gradient-to-br from-sky-50 to-blue-100 p-5 dark:border-blue-900/50 dark:from-blue-950/60 dark:to-slate-900">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Initials name={name || data.teacher.name} avatar={avatar} />
            <label className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow">
              <Camera size={17} />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => choosePhoto(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          <div>
            <h1 className="text-xl font-extrabold">Edit Profile</h1>
            <p className={`mt-1 text-xs ${muted}`}>
              JPG, PNG or WebP · maximum 2 MB
            </p>
          </div>
        </div>
      </div>
      <section className={`${panel} space-y-3 p-4`}>
        <h2 className="font-extrabold">Personal Information</h2>
        <Field label="Full name">
          <input
            required
            maxLength={120}
            className={field}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Date of birth">
            <input
              type="date"
              className={field}
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </Field>
          <Field label="Gender">
            <select
              className={field}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="">Not recorded</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </Field>
        </div>
        <Field label="Phone">
          <input
            maxLength={30}
            className={field}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        <Field label="Login email">
          <input
            required
            type="email"
            className={field}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className={`mt-1 text-[10px] ${muted}`}>
            A changed email requires confirmation.
          </p>
        </Field>
        <Field label="Address">
          <input
            maxLength={240}
            className={field}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </Field>
      </section>
      <section className={`${panel} p-4`}>
        <h2 className="font-extrabold">School-managed information</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ReadOnly label="Employee ID" value={data.teacher.employee_id} />
          <ReadOnly label="School" value={data.school} />
          <ReadOnly label="Joining date" value={data.teacher.joining_date} />
          <ReadOnly
            label="Employment status"
            value={data.teacher.employment_status}
          />
        </div>
      </section>
      <div className="grid grid-cols-2 gap-2">
        <Link
          href="/teacher/profile"
          className="flex h-12 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold dark:bg-slate-800"
        >
          Cancel
        </Link>
        <button
          disabled={saving}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
function Professional({
  data,
  assigned,
  subjects,
}: {
  data: Data;
  assigned: ClassRow[];
  subjects: string[];
}) {
  return (
    <>
      <header>
        <h1 className="text-2xl font-extrabold">Professional Information</h1>
        <p className={`mt-1 text-sm ${muted}`}>
          School-managed employment and teaching details.
        </p>
      </header>
      <section className={`${panel} p-4`}>
        <div className="grid grid-cols-2 gap-2">
          <ReadOnly label="Employee ID" value={data.teacher.employee_id} />
          <ReadOnly label="Status" value={data.teacher.employment_status} />
          <ReadOnly label="Department" value={data.teacher.department} />
          <ReadOnly label="Subject" value={data.teacher.subject} />
          <ReadOnly label="Qualification" value={data.teacher.qualification} />
          <ReadOnly label="Joining date" value={data.teacher.joining_date} />
        </div>
        <p className={`mt-3 text-[11px] ${muted}`}>
          These details are controlled by your school. Contact the principal if
          they need correction.
        </p>
      </section>
      <section className={`${panel} p-4`}>
        <h2 className="font-extrabold">Assigned classes</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {assigned.map((row) => (
            <span
              key={row.id}
              className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 dark:bg-blue-400/10 dark:text-blue-300"
            >
              {classLabel(row)}
            </span>
          ))}
        </div>
        {!assigned.length && (
          <p className={`mt-2 text-sm ${muted}`}>No active classes assigned.</p>
        )}
        <p className={`mt-4 text-xs ${muted}`}>
          Subjects: {subjects.join(", ") || "Not assigned"}
        </p>
      </section>
    </>
  );
}
function Security({
  data,
  current,
  setCurrent,
  password,
  setPassword,
  confirm,
  setConfirm,
  visible,
  setVisible,
  save,
  saving,
  logout,
}: {
  data: Data;
  current: string;
  setCurrent: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirm: string;
  setConfirm: (v: string) => void;
  visible: boolean;
  setVisible: (v: boolean) => void;
  save: (e: FormEvent) => void;
  saving: boolean;
  logout: () => void;
}) {
  return (
    <>
      <header>
        <h1 className="text-2xl font-extrabold">Account & Security</h1>
        <p className={`mt-1 text-sm ${muted}`}>
          Manage supported account security settings.
        </p>
      </header>
      <section className={`${panel} p-4`}>
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Mail size={20} />
          </span>
          <div>
            <p className="text-sm font-bold">Login email</p>
            <p className={`text-xs ${muted}`}>{data.email}</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <span className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
            <Clock3 size={20} />
          </span>
          <div>
            <p className="text-sm font-bold">Last sign in</p>
            <p className={`text-xs ${muted}`}>
              {data.lastSignIn
                ? new Date(data.lastSignIn).toLocaleString()
                : "Not available"}
            </p>
          </div>
        </div>
      </section>
      <form onSubmit={save} className={`${panel} space-y-3 p-4`}>
        <h2 className="flex items-center gap-2 font-extrabold">
          <LockKeyhole size={18} />
          Change Password
        </h2>
        <Password
          label="Current password"
          value={current}
          setValue={setCurrent}
          visible={visible}
        />
        <Password
          label="New password"
          value={password}
          setValue={setPassword}
          visible={visible}
        />
        <Password
          label="Confirm new password"
          value={confirm}
          setValue={setConfirm}
          visible={visible}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className={`flex items-center gap-2 text-xs font-semibold ${muted}`}
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}{" "}
          {visible ? "Hide passwords" : "Show passwords"}
        </button>
        <button
          disabled={saving}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white disabled:opacity-50"
        >
          <KeyRound size={17} />
          {saving ? "Updating…" : "Update Password"}
        </button>
      </form>
      <button
        onClick={logout}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 text-sm font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
      >
        <LogOut size={17} />
        Log out of this device
      </button>
    </>
  );
}
function Preferences() {
  return (
    <>
      <header>
        <h1 className="text-2xl font-extrabold">Preferences</h1>
        <p className={`mt-1 text-sm ${muted}`}>
          Settings currently supported by NEPSOM.
        </p>
      </header>
      <section
        className={`${panel} divide-y divide-slate-100 dark:divide-slate-800`}
      >
        <div className="flex items-center gap-3 p-4">
          <span className="rounded-xl bg-violet-50 p-3 text-violet-600">
            <MonitorCog size={20} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold">Appearance</p>
            <p className={`text-xs ${muted}`}>
              Follows your device light or dark setting.
            </p>
          </div>
          <span className="text-xs font-bold">System</span>
        </div>
        <div className="flex items-center gap-3 p-4">
          <span className="rounded-xl bg-blue-50 p-3 text-blue-600">
            <Clock3 size={20} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold">Timezone</p>
            <p className={`text-xs ${muted}`}>
              Dates and schedules use Nepal time.
            </p>
          </div>
          <span className="text-xs font-bold">Asia/Kathmandu</span>
        </div>
      </section>
      <p className={`text-xs leading-5 ${muted}`}>
        Notification controls are not shown because NEPSOM does not yet have a
        general email or in-app notification delivery pipeline.
      </p>
    </>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={`mb-1 block text-xs font-semibold ${muted}`}>
        {label}
      </span>
      {children}
    </label>
  );
}
function ReadOnly({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
      <p className={`text-[10px] font-semibold ${muted}`}>{label}</p>
      <p className="mt-1 truncate text-sm font-bold capitalize">
        {value || "Not recorded"}
      </p>
    </div>
  );
}
function Password({
  label,
  value,
  setValue,
  visible,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  visible: boolean;
}) {
  return (
    <Field label={label}>
      <input
        required
        minLength={8}
        type={visible ? "text" : "password"}
        className={field}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </Field>
  );
}
