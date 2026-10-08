'use client';

import { useState, useEffect, useRef } from 'react';
import HelpModal from './HelpModal';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  Search,
  Bell, 
  HelpCircle, 
  ChevronDown, 
  User, 
  Settings, 
  Shield, 
  LogOut,
  Loader2
} from 'lucide-react';

// --- Types ---
interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  role: string | null;
  school_id: string | null;
  avatar_url?: string | null;
}

interface School {
  id: string;
  name: string | null;
  municipality: string | null;
  district: string | null;
}

function formatSchoolName(name?: string | null) {
  const shortenedName = name
    ?.replace(/\b(?:primary|secondary)\s+school\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!shortenedName) return 'School Name';

  return shortenedName.charAt(0).toUpperCase() + shortenedName.slice(1);
}

export default function TopBar() {
  const router = useRouter();
  const pathname = usePathname();
  const isTeacherArea = pathname.startsWith('/teacher');
  const isStudentArea = pathname.startsWith('/student');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch Data
  useEffect(() => {
    async function fetchTopBarData() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setIsLoading(false);
          return;
        }

        setAvatarUrl(
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          null
        );

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, role, school_id')
          .eq('user_id', user.id)
          .single();
        
        if (profileError) console.error('Profile fetch error', profileError);
        else {
          setProfile(profileData);

          if (profileData?.school_id) {
            const { data: schoolData, error: schoolError } = await supabase
              .from('schools')
              .select('id, name, municipality, district')
              .eq('id', profileData.school_id)
              .single();
            
            if (schoolError) console.error('School fetch error', schoolError);
            else setSchool(schoolData);
          }
        }
      } catch (error) {
        console.error('TopBar: Unexpected error', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchTopBarData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    setIsDropdownOpen(false);
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  }

  const nameParts = profile?.full_name?.trim().split(/\s+/).filter(Boolean) || [];
  const userInitials = nameParts.length > 1
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : nameParts[0]?.slice(0, 2).toUpperCase() || 'ST';
  const compactSchoolName = formatSchoolName(school?.name)
    .split(/\s+/)
    .slice(0, 2)
    .join(' ');

  return (
    <>
      {isStudentArea && (
        <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 border-b border-slate-100 bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('student-sidebar:open'))}
            className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Open navigation menu"
          >
            <span className="flex w-5 flex-col gap-1" aria-hidden="true">
              <span className="h-0.5 w-5 rounded-full bg-current" />
              <span className="h-0.5 w-5 rounded-full bg-current" />
              <span className="h-0.5 w-5 rounded-full bg-current" />
            </span>
          </button>

          <Link
            href="/student"
            className="min-w-0 max-w-[108px] shrink-0 text-[15px] font-bold leading-[1.15] tracking-[-0.01em] text-slate-900"
            aria-label="Go to student home"
          >
            <span className="line-clamp-2">
              {isLoading ? 'School' : compactSchoolName}
            </span>
          </Link>

          <button
            type="button"
            aria-label="Search the student portal"
            className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-left text-sm text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">Search</span>
          </button>

          <Link
            href="/student/profile"
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xs font-bold tracking-wide text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            aria-label="Open my profile"
          >
            {avatarUrl ? (
              <span
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url("${avatarUrl.replace(/"/g, '%22')}")` }}
                aria-hidden="true"
              />
            ) : (
              userInitials
            )}
          </Link>
        </header>
      )}

      <header className={`fixed top-0 left-0 right-0 lg:left-64 z-30 h-16 items-center justify-between border-b border-gray-200 bg-white px-6 ${isStudentArea ? 'hidden lg:flex' : 'flex'}`}>
      
      {/* Left: School Info */}
      <div className="flex flex-col shrink-0 max-w-[250px]">
        <h2 className="text-lg font-bold text-gray-900 leading-tight truncate">
          {isLoading ? 'Loading...' : formatSchoolName(school?.name)}
        </h2>
        <p className="text-xs text-gray-500 leading-tight truncate">
          {isLoading ? '' : (`${school?.municipality || 'City'}, ${school?.district || 'District'}`)}
        </p>
      </div>

      {/* Center: Search Bar */}
      {(pathname.startsWith('/principal') || pathname.startsWith('/teacher')) && (
        <div className="hidden min-w-0 max-w-md flex-1 px-4 md:block">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(pathname.startsWith('/teacher') ? 'teacher-search:open' : 'principal-search:open'))}
            aria-label={pathname.startsWith('/teacher') ? 'Search students and classes' : 'Search school records'}
            className="flex h-10 w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left text-sm text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {pathname.startsWith('/teacher') ? 'Search students and classes...' : 'Search students, teachers, fees...'}
            </span>
          </button>
        </div>
      )}

      {/* Right: Badge, Actions & Profile */}
      <div className="flex items-center gap-4 shrink-0">
        
        {/* Academic Year Badge */}
        <span className="hidden sm:inline-flex rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-100 whitespace-nowrap">
          Academic Year 2083
        </span>

        {/* Action Icons */}
        <div className="flex items-center gap-1">
          <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors" aria-label="Notifications">
            <Bell className="h-5 w-5" />
          </button>
          <button 
            onClick={() => setIsHelpModalOpen(true)}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          aria-label="Help"
          >
        <HelpCircle className="h-5 w-5" />
      </button>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200" />

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-gray-100 transition-colors"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
          >
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white shadow-sm">
                {userInitials}
              </div>
            )}
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium text-gray-900 leading-tight">
                {isLoading ? 'Loading...' : (profile?.full_name || 'User')}
              </p>
              <p className="text-[11px] text-gray-500 capitalize leading-tight">
                {isLoading ? '' : (profile?.role || 'Admin')}
              </p>
            </div>
            <ChevronDown 
              className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
            />
          </button>

          {/* ✅ THE DROPDOWN MENU */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white py-1 shadow-xl z-50">
              
              <Link
                href={isStudentArea ? "/student/profile" : isTeacherArea ? "/teacher/profile" : "/principal/account/profile"}
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="h-4 w-4 text-gray-500" />
                My Profile
              </Link>
              
              <Link
                href={isStudentArea ? "/student/profile" : isTeacherArea ? "/teacher/profile/preferences" : "/principal/settings"}
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4 text-gray-500" />
                Account Settings
              </Link>
              
              <Link
                href={isStudentArea ? "/student/profile" : isTeacherArea ? "/teacher/profile/security" : "/principal/account/security"}
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Shield className="h-4 w-4 text-gray-500" />
                Security
              </Link>

              {/* Horizontal Rule */}
              <hr className="my-1 border-gray-200" />

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          )}
        </div>
      </div>
      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
      </header>
    </>
  );
}
