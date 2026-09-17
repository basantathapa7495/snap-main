'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { 
  User, Calendar, Droplets, MapPin, Phone, Mail, 
  GraduationCap, Hash, Download, Edit3, Shield
} from 'lucide-react';

export default function StudentProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Mock Data (Based exactly on your reference HTML)
  const [profileData] = useState({
    studentId: 'NEPSOM-10021',
    name: 'Ram Thapa',
    grade: 'Grade 10A',
    dob: '12 Jestha 2065',
    gender: 'Male',
    bloodGroup: 'O+',
    address: 'Lakeside, Pokhara',
    phone: '+977-9841234567',
    guardianName: 'Krishna Thapa',
    guardianRelation: 'Father',
    guardianPhone: '+977-9841234567',
    guardianEmail: 'krishna.thapa@email.com',
    academicClass: 'Grade 10',
    section: 'A',
    rollNo: '01',
    admissionYear: '2080'
  });

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) { setLoading(false); return; }

      const { data: profileData } = await supabase.from('profiles').select('school_id').eq('user_id', user.id).single();
      if (profileData?.school_id) {
        const { data: schoolData } = await supabase.from('schools').select('name').eq('id', profileData.school_id).single();
        setSchool(schoolData);
      }
      setLoading(false);
    }
    getData();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div></div>;
  if (!user) return <div className="flex h-screen items-center justify-center bg-gray-50"><p className="text-gray-500">Please log in.</p></div>;

  const InfoItem = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 pt-10 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-24">
          
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">My Profile</h1>
              <p className="mt-1.5 text-sm text-gray-500">Personal and academic information.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                <Edit3 className="h-4 w-4" /> Edit Profile
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
                <Download className="h-4 w-4" /> Download ID Card
              </button>
            </div>
          </div>

          {/* Profile Header Card */}
          <div className="mb-6 rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            <div className="px-6 pb-6 -mt-12 flex flex-col sm:flex-row sm:items-end gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white text-3xl font-bold text-blue-600 shadow-lg border-4 border-white">
                RT
              </div>
              <div className="flex-1 pb-2">
                <h2 className="text-2xl font-bold text-gray-900">{profileData.name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100">
                    <Hash className="h-3 w-3" /> {profileData.studentId}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-100">
                    <GraduationCap className="h-3 w-3" /> {profileData.grade}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 border border-gray-200">
                    <Shield className="h-3 w-3" /> {school?.name || 'Shree Himalayan Secondary School'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Information Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            
            {/* Personal Information */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" /> Personal Information
              </h3>
              <div className="space-y-3">
                <InfoItem icon={Calendar} label="Date of Birth" value={profileData.dob} />
                <InfoItem icon={User} label="Gender" value={profileData.gender} />
                <InfoItem icon={Droplets} label="Blood Group" value={profileData.bloodGroup} />
                <InfoItem icon={MapPin} label="Address" value={profileData.address} />
                <InfoItem icon={Phone} label="Phone" value={profileData.phone} />
              </div>
            </div>

            {/* Parent / Guardian Information */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-600" /> Parent / Guardian
              </h3>
              <div className="space-y-3">
                <InfoItem icon={User} label="Name" value={profileData.guardianName} />
                <InfoItem icon={User} label="Relation" value={profileData.guardianRelation} />
                <InfoItem icon={Phone} label="Phone" value={profileData.guardianPhone} />
                <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Email</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{profileData.guardianEmail}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-600" /> Academic Information
              </h3>
              <div className="space-y-3">
                <InfoItem icon={GraduationCap} label="Class" value={profileData.academicClass} />
                <InfoItem icon={Hash} label="Section" value={profileData.section} />
                <InfoItem icon={Hash} label="Roll No" value={profileData.rollNo} />
                <InfoItem icon={Calendar} label="Admission Year" value={profileData.admissionYear} />
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}