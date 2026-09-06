'use client';

import { useState, useEffect, useRef } from 'react';
import HelpModal from './HelpModal';
import { useRouter } from 'next/navigation';
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

export default function TopBar() {
  const router = useRouter();
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

  const userInitial = profile?.full_name?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      
      {/* Left: School Info */}
      <div className="flex flex-col shrink-0 max-w-[250px]">
        <h2 className="text-lg font-bold text-gray-900 leading-tight truncate">
          {isLoading ? 'Loading...' : (school?.name || 'School Name')}
        </h2>
        <p className="text-xs text-gray-500 leading-tight truncate">
          {isLoading ? '' : (`${school?.municipality || 'City'}, ${school?.district || 'District'}`)}
        </p>
      </div>

      {/* Center: Search Bar */}
      <div className="relative hidden flex-1 max-w-md mx-8 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search students, teachers..."
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
      </div>

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
                {userInitial}
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
                href="/principal/profile"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="h-4 w-4 text-gray-500" />
                My Profile
              </Link>
              
              <Link
                href="/principal/settings"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4 text-gray-500" />
                Account Settings
              </Link>
              
              <Link
                href="/principal/security"
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
    
  );
}