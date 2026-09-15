'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  School,
  ClipboardList,
  Wallet,
  FileText,
  BookOpen,
  Bell,
  UserCog,
  Calendar,
  TrendingUp,
  Folder,
  Settings,
  HelpCircle,
  Menu,
  X,
  PenLine,
  Clock,
  MessageSquare,
  BarChart3,
  User,
  DollarSign,
  CheckSquare,
  Award,
} from 'lucide-react';

type MenuItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

type MenuSection = MenuItem[];

type SchoolInfo = {
  name: string;
  slug: string | null;
};

function formatSchoolName(name?: string | null) {
  const shortenedName = name
    ?.replace(/\b(?:primary|secondary)\s+school\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!shortenedName) return 'My School';

  return shortenedName.charAt(0).toUpperCase() + shortenedName.slice(1);
}

// =========================================================
// PRINCIPAL MENU
// =========================================================

const principalMenu: MenuSection[] = [
  [
    { href: '/principal', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/principal/teachers', label: 'Teachers', icon: GraduationCap },
    { href: '/principal/students', label: 'Students', icon: Users },
    { href: '/principal/classes', label: 'Classes', icon: School },
    { href: '/principal/attendance', label: 'Attendance', icon: ClipboardList },
    { href: '/principal/fees', label: 'Fees', icon: Wallet },
    { href: '/principal/admission', label: 'Admission', icon: UserCog },
    { href: '/principal/results', label: 'Exams & Results', icon: FileText },
    { href: '/principal/communication', label: 'Communication', icon: Bell },
    { href: '/principal/calendar', label: 'Calendar', icon: Calendar },
  ],
  [
    { href: '/principal/reports', label: 'Reports', icon: BarChart3 },
    { href: '/principal/documents', label: 'Documents', icon: Folder },
  ],
  [
    { href: '/principal/edit_website', label: 'Edit Website', icon: TrendingUp },
  ],
];

// =========================================================
// TEACHER MENU
// =========================================================

const teacherMenu: MenuSection[] = [
  [
    { href: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/teacher/classes', label: 'My Classes', icon: School },
    { href: '/teacher/attendance', label: 'Attendance', icon: ClipboardList },
    { href: '/teacher/marks', label: 'Marks Entry', icon: PenLine },
    { href: '/teacher/timetable', label: 'Timetable', icon: Calendar },
    { href: '/teacher/assignments', label: 'Assignments', icon: FileText },
    { href: '/teacher/students', label: 'My Students', icon: Users },
  ],
  [
    { href: '/teacher/communication', label: 'Communication', icon: MessageSquare },
    { href: '/teacher/leave', label: 'Leave', icon: Clock },
    { href: '/teacher/reports', label: 'Reports', icon: BarChart3 },
  ],
  [
    { href: '/teacher/profile', label: 'My Profile', icon: User },
    { href: '/teacher/help', label: 'Help', icon: HelpCircle },
  ],
];

// =========================================================
// STUDENT MENU
// =========================================================

const studentMenu: MenuSection[] = [
  [
    { href: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/subjects', label: 'My Subjects', icon: BookOpen },
    { href: '/student/attendance', label: 'Attendance', icon: ClipboardList },
    { href: '/student/grades', label: 'Grades & Results', icon: Award },
    { href: '/student/timetable', label: 'Timetable', icon: Calendar },
    { href: '/student/assignments', label: 'Assignments', icon: FileText },
    { href: '/student/exams', label: 'Exams', icon: CheckSquare },
  ],
  [
    { href: '/student/fees', label: 'Fees', icon: DollarSign },
    { href: '/student/notices', label: 'Notices', icon: MessageSquare },
    { href: '/student/calendar', label: 'Calendar', icon: Calendar },
  ],
  [
    { href: '/student/profile', label: 'My Profile', icon: User },
    { href: '/student/help', label: 'Help', icon: HelpCircle },
  ],
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [school, setSchool] = useState<SchoolInfo | null>(null);

  // =========================================================
  // DETECT WHICH PORTAL WE ARE CURRENTLY INSIDE
  // =========================================================

  const isPrincipalPath =
    pathname === '/principal' || pathname.startsWith('/principal/');

  const isTeacherPath =
    pathname === '/teacher' || pathname.startsWith('/teacher/');

  const isStudentPath =
    pathname === '/student' || pathname.startsWith('/student/');

  // =========================================================
  // CHOOSE SIDEBAR MENU FROM CURRENT URL
  // =========================================================

  let activeMenu: MenuSection[] = principalMenu;

  if (isTeacherPath) {
    activeMenu = teacherMenu;
  } else if (isStudentPath) {
    activeMenu = studentMenu;
  } else if (isPrincipalPath) {
    activeMenu = principalMenu;
  }

  // =========================================================
  // FETCH SCHOOL NAME + SLUG
  // =========================================================

  useEffect(() => {
    let mounted = true;

    async function getSchool() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error('Error getting user:', userError);
          return;
        }

        if (!user) return;

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('Error getting profile:', profileError);
          return;
        }

        if (!profile?.school_id) return;

        const { data: schoolData, error: schoolError } = await supabase
          .from('schools')
          .select('name, slug')
          .eq('id', profile.school_id)
          .single();

        if (schoolError) {
          console.error('Error getting school:', schoolError);
          return;
        }

        if (mounted && schoolData) {
          setSchool({
            name: schoolData.name,
            slug: schoolData.slug,
          });
        }
      } catch (error) {
        console.error('Sidebar error:', error);
      }
    }

    getSchool();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // ACTIVE MENU ITEM
  // =========================================================

  function isMenuItemActive(href: string) {
    const isDashboardRoot =
      href === '/principal' || href === '/teacher' || href === '/student';

    if (isDashboardRoot) {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const principalSettingsActive = pathname.startsWith('/principal/settings');

  return (
    <>
      {/* =====================================================
          MOBILE TOP BAR
      ===================================================== */}
      <div className="fixed left-0 right-0 top-0 z-40 grid h-14 grid-cols-[44px_1fr_44px] items-center border-b border-gray-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>

        <Link
          href="/principal"
          className="justify-self-center"
          aria-label="Go to SNAP dashboard"
        >
          <Image
            src="/logo2.png"
            alt="SNAP"
            width={40}
            height={40}
            priority
            className="h-10 w-10 object-contain"
          />
        </Link>

        <span aria-hidden="true" />
      </div>

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-gray-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* LOGO HEADER */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 pb-4 pt-5">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo1.png"
              alt="SNAP Logo"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
            />

            <div className="flex flex-col justify-center">
              <span className="text-lg font-bold leading-tight text-gray-900">
                SNAP
              </span>
              <span className="text-[12px] font-medium leading-tight tracking-wide text-gray-400">
                School Nepal Platform
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ===================================================
            NAVIGATION MENU
        =================================================== */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {activeMenu.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-2">
              <ul className="space-y-[2px]">
                {section.map((item) => {
                  const Icon = item.icon;
                  const isActive = isMenuItemActive(item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[0.85rem] transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      >
                        <Icon
                          className={`h-[16px] w-[16px] flex-shrink-0 ${
                            isActive ? 'text-white' : 'text-gray-500'
                          }`}
                        />

                        <span className="font-medium">{item.label}</span>

                        {isActive && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {sectionIndex < activeMenu.length - 1 && (
                <hr className="mx-3 my-3 border-t border-gray-200" />
              )}
            </div>
          ))}
        </nav>


        {/* ===================================================
            BOTTOM ACTIONS
        =================================================== */}
        <div className="border-t border-gray-100 p-3">
          {isPrincipalPath && (
            <Link
              href="/principal/settings"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[0.85rem] transition ${
                principalSettingsActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Settings
                className={`h-[16px] w-[16px] ${
                  principalSettingsActive ? 'text-white' : 'text-gray-500'
                }`}
              />
              <span className="font-medium">Settings</span>
            </Link>
          )}

        </div>
      </aside>
    </>
  );
}
