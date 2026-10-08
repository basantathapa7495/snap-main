'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PrincipalSearch from './PrincipalSearch';
import TeacherSearch from './TeacherSearch';
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
  Search,
  X,
  PenLine,
  Clock,
  MessageSquare,
  BarChart3,
  User,
  DollarSign,
  CheckSquare,
  Award,
  ChevronRight,
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
    { href: '/principal/settings', label: 'Settings & Preferences', icon: Settings },
  ],
];

// =========================================================
// TEACHER MENU
// =========================================================

const teacherMenu: MenuSection[] = [
  [
    { href: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/teacher/marks', label: 'Marks Entry', icon: PenLine },
    { href: '/teacher/timetable', label: 'Timetable', icon: Calendar },
    { href: '/teacher/assignments', label: 'Assignments', icon: FileText },
  ],
  [
    { href: '/teacher/communication', label: 'Communication', icon: MessageSquare },
    { href: '/teacher/leave', label: 'Leave', icon: Clock },
    { href: '/teacher/reports', label: 'Reports', icon: BarChart3 },
    { href: '/teacher/documents', label: 'Shared Documents', icon: Folder },
  ],
];

// =========================================================
// STUDENT MENU
// =========================================================

const studentMenu: MenuSection[] = [
  [
    { href: '/student/subjects', label: 'My Subjects', icon: BookOpen },
    { href: '/student/attendance', label: 'Attendance', icon: ClipboardList },
    { href: '/student/grades', label: 'Grades & Results', icon: Award },
    { href: '/student/assignments', label: 'Assignments', icon: FileText },
    { href: '/student/exams', label: 'Exams', icon: CheckSquare },
  ],
  [
    { href: '/student/fees', label: 'Fees', icon: DollarSign },
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
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const [school, setSchool] = useState<SchoolInfo | null>(null);

  // =========================================================
  // DETECT WHICH PORTAL WE ARE CURRENTLY INSIDE
  // =========================================================

  const isPrincipalPath =
    pathname === '/principal' || pathname.startsWith('/principal/');

  useEffect(() => {
    const openSearch = () => setSearchOpen(true);
    const openStudentSidebar = () => setMobileOpen(true);
    window.addEventListener('principal-search:open', openSearch);
    window.addEventListener('teacher-search:open', openSearch);
    window.addEventListener('student-sidebar:open', openStudentSidebar);
    return () => {
      window.removeEventListener('principal-search:open', openSearch);
      window.removeEventListener('teacher-search:open', openSearch);
      window.removeEventListener('student-sidebar:open', openStudentSidebar);
    };
  }, []);

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

  return (
    <>
      {/* =====================================================
          MOBILE TOP BAR
      ===================================================== */}
      {!isStudentPath && <div className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center border-b border-gray-200 bg-white px-4 lg:hidden">
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
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
          aria-label="Go to NEPSOM dashboard"
        >
          <Image
            src="/logo2.png"
            alt="NEPSOM"
            width={148}
            height={64}
            priority
            className="h-12 w-[148px] object-contain"
          />
        </Link>

        {(isPrincipalPath || isTeacherPath) && (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label={isTeacherPath ? 'Search students and classes' : 'Search school records'}
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>}

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {isStudentPath && (
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[min(288px,70vw)] flex-col overflow-hidden bg-white shadow-2xl transition-transform duration-300 lg:hidden ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          aria-label="Student navigation"
        >
          <div className="flex items-center justify-between px-4 pb-3 pt-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <Image
                src="/logo1.png"
                alt="NEPSOM logo"
                width={58}
                height={58}
                priority
                className="h-[58px] w-[58px] shrink-0 object-contain"
              />
              <div className="min-w-0">
                <p className="text-[22px] font-extrabold leading-none tracking-[-0.04em] text-[#0A1D59]">NEPSOM -</p>
                <p className="mt-1 whitespace-nowrap text-[10px] font-semibold leading-none text-slate-500">School Nepal Platform</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-800 shadow-[0_5px_12px_rgba(15,23,42,0.10)] transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Close navigation menu"
            >
              <X className="h-6 w-6 stroke-[2.25]" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3.5 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {studentMenu.slice(0, 2).map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <ul className="space-y-1">
                  {section.map((item) => {
                    const Icon = item.icon;
                    const isActive = isMenuItemActive(item.href);

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`flex min-h-[54px] items-center gap-3 rounded-[18px] px-3 py-1.5 transition-colors ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-600 to-sky-400 text-white shadow-[0_7px_16px_rgba(37,99,235,0.22)]'
                              : 'text-[#0A1D59] hover:bg-slate-50'
                          }`}
                        >
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            isActive ? 'bg-white/10' : 'bg-blue-50'
                          }`}>
                            <Icon className={`h-[19px] w-[19px] stroke-[2.25] ${isActive ? 'text-white' : 'text-blue-700'}`} />
                          </span>
                          <span className="min-w-0 flex-1 text-[15px] font-bold tracking-[-0.02em]">
                            {item.label}
                          </span>
                          <ChevronRight className={`h-5 w-5 shrink-0 stroke-[2.5] ${isActive ? 'text-white' : 'text-[#7C8FB8]'}`} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                {sectionIndex === 0 && <div className="my-2.5 h-px bg-blue-100" />}
              </div>
            ))}
          </nav>
        </aside>
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-[min(300px,86vw)] flex-col border-r border-slate-200 bg-[#F8FAFC] shadow-2xl transition-transform duration-300 dark:border-slate-700 dark:bg-[#111B2B] lg:w-[260px] lg:border-gray-200 lg:bg-white lg:shadow-none lg:dark:border-gray-200 lg:dark:bg-white lg:translate-x-0 ${isStudentPath ? 'hidden lg:flex' : ''} ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* LOGO HEADER */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 pb-4 pt-5 dark:border-slate-700 lg:border-gray-100 lg:pb-4 lg:pt-5 lg:dark:border-gray-100">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo1.png"
              alt="NEPSOM Logo"
              width={48}
              height={48}
              className="h-12 w-12 object-contain"
            />

            <div className="flex flex-col justify-center">
              <span className="text-lg font-bold leading-tight text-slate-900 dark:text-white lg:dark:text-gray-900">
                NEPSOM
              </span>
              <span className="text-[12px] font-medium leading-tight tracking-wide text-slate-500 dark:text-slate-400 lg:dark:text-gray-400">
                School Nepal Platform
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-xl bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ===================================================
            NAVIGATION MENU
        =================================================== */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 lg:px-3 lg:py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {activeMenu.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-2 lg:mb-2">
              <ul className="space-y-1 lg:space-y-[2px]">
                {section.map((item) => {
                  const Icon = item.icon;
                  const isActive = isMenuItemActive(item.href);
                  const hideOnPrincipalMobile = isPrincipalPath && [
                    '/principal/teachers',
                    '/principal/students',
                    '/principal/communication',
                  ].includes(item.href);

                  return (
                    <li key={item.href} className={hideOnPrincipalMobile ? 'hidden lg:block' : undefined}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`flex min-h-11 items-center gap-3.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 lg:min-h-0 lg:gap-3 lg:rounded-lg lg:px-3 lg:py-2 lg:text-[0.85rem] ${
                          isActive
                            ? 'bg-teal-700 text-white shadow-sm shadow-teal-900/20 dark:bg-teal-500/20 dark:text-teal-100 lg:bg-blue-600 lg:text-white lg:shadow-md lg:shadow-blue-200 lg:dark:bg-blue-600 lg:dark:text-white'
                            : 'text-slate-700 hover:bg-white hover:text-teal-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-teal-200 lg:text-gray-700 lg:hover:bg-gray-100 lg:hover:text-gray-900 lg:dark:text-gray-700 lg:dark:hover:bg-gray-100 lg:dark:hover:text-gray-900'
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 flex-shrink-0 lg:h-[16px] lg:w-[16px] ${
                            isActive ? 'text-white dark:text-teal-100 lg:dark:text-white' : 'text-slate-500 dark:text-slate-400 lg:text-gray-500 lg:dark:text-gray-500'
                          }`}
                        />

                        <span className="font-medium">{item.label}</span>

                        {isActive && (
                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white dark:bg-teal-200 lg:dark:bg-white" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {sectionIndex < activeMenu.length - 1 && (
                <hr className="mx-3 my-3 border-t border-slate-200 dark:border-slate-700 lg:my-3 lg:border-gray-200 lg:dark:border-gray-200" />
              )}
            </div>
          ))}
        </nav>


      </aside>
      {isPrincipalPath && <PrincipalSearch open={searchOpen} onClose={closeSearch} />}
      {isTeacherPath && <TeacherSearch open={searchOpen} onClose={closeSearch} />}
    </>
  );
}
