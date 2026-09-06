'use client';

import { useState } from 'react';
import { 
  Settings, Palette, BookOpen, GraduationCap, Building, Newspaper, 
  Bell, Image, MessageSquareQuote, Trophy, UserPlus, Save, Eye, 
  Upload, Plus, Trash2, Check, Info, Layout
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';

// --- Navigation Tabs Configuration ---
const editorTabs = [
  { id: 'basic', label: 'Basic Info', icon: Settings },
  { id: 'theme', label: 'Theme & Branding', icon: Palette },
  { id: 'about', label: 'About & Mission', icon: BookOpen },
  { id: 'programs', label: 'Academic Programs', icon: GraduationCap },
  { id: 'facilities', label: 'Facilities', icon: Building },
  { id: 'news', label: 'News & Updates', icon: Newspaper },
  { id: 'notices', label: 'Notices', icon: Bell },
  { id: 'gallery', label: 'Photo Gallery', icon: Image },
  { id: 'testimonials', label: 'Testimonials', icon: MessageSquareQuote },
  { id: 'awards', label: 'Awards & Achievements', icon: Trophy },
  { id: 'admission', label: 'Admission CTA', icon: UserPlus },
];

export default function WebsiteEditorPage() {
  const [activeTab, setActiveTab] = useState('basic');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64 pt-10 flex flex-col min-h-screen">
        <TopBar />
        
        {/* ✅ Using pt-24 as requested */}
        <main className="flex-1 pt-24 p-4 sm:p-6 lg:p-8 pb-24">
          
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Website Editor</h1>
              <p className="mt-1.5 text-sm text-gray-500">Customize your school's public-facing website and branding.</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                <Eye className="h-4 w-4" /> Preview Website
              </button>
              <button 
                onClick={handleSave}
                className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all ${
                  isSaved ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSaved ? <><Check className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Changes</>}
              </button>
            </div>
          </div>

          {/* Main Editor Layout */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            
            {/* Left: Sticky Navigation Menu */}
            <div className="lg:col-span-1">
              <div className="sticky top-28 rounded-2xl border border-gray-100 bg-white shadow-sm p-2 overflow-hidden">
                <nav className="flex flex-col gap-1">
                  {editorTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all text-left ${
                          isActive 
                            ? 'bg-blue-50 text-blue-700 shadow-sm' 
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Right: Active Form Content */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* ✅ BASIC INFO TAB */}
              {activeTab === 'basic' && (
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 sm:p-8">
                  <div className="mb-6 border-b border-gray-100 pb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Settings className="h-5 w-5 text-blue-600" /> Basic Information
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Core details about your school displayed on the homepage.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">School Name</label>
                      <input type="text" defaultValue="Sunrise Valley Secondary" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">School Type</label>
                      <select className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
                        <option>Community</option>
                        <option>Institutional (Private)</option>
                        <option>Boarding</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">School Level</label>
                      <select className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
                        <option>Secondary (1-10)</option>
                        <option>Higher Secondary (1-12)</option>
                        <option>Basic (1-8)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Established Year (B.S.)</label>
                      <input type="text" defaultValue="2050" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Principal Name</label>
                      <input type="text" defaultValue="Mr. Basanta Adhikari" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">School Motto</label>
                      <input type="text" defaultValue="Knowledge is Light" className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>

                    {/* Upload Areas */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">School Logo</label>
                      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-colors cursor-pointer">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-xs font-semibold text-gray-700">Click to upload logo</p>
                        <p className="text-[10px] text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Hero Banner Image</label>
                      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-colors cursor-pointer">
                        <Image className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-xs font-semibold text-gray-700">Click to upload banner</p>
                        <p className="text-[10px] text-gray-500 mt-1">1920x600 recommended</p>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Short Description</label>
                      <textarea rows={3} defaultValue="A leading educational institution in Syangja dedicated to academic excellence and holistic development." className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Principal's Message</label>
                      <textarea rows={5} defaultValue="Welcome to Sunrise Valley. We believe in nurturing young minds..." className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
                    </div>
                  </div>
                </div>
              )}

              {/* ✅ THEME & BRANDING TAB */}
              {activeTab === 'theme' && (
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 sm:p-8">
                  <div className="mb-6 border-b border-gray-100 pb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Palette className="h-5 w-5 text-purple-600" /> Theme & Branding
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Choose colors and styles for your public website.</p>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Primary Brand Color</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {['bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-red-600', 'bg-amber-600', 'bg-teal-600'].map((color) => (
                          <button key={color} className={`h-12 rounded-xl border-2 border-white ring-2 ring-gray-200 ${color} hover:ring-blue-500 transition-all ${color === 'bg-blue-600' ? 'ring-blue-500 ring-offset-2' : ''}`}></button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Typography Style</label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button className="rounded-xl border-2 border-blue-500 bg-blue-50 p-4 text-left">
                          <p className="font-sans text-lg font-bold text-gray-900">Modern Sans</p>
                          <p className="font-sans text-xs text-gray-500 mt-1">Clean & Professional</p>
                        </button>
                        <button className="rounded-xl border-2 border-gray-200 bg-white p-4 text-left hover:border-gray-300">
                          <p className="font-serif text-lg font-bold text-gray-900">Classic Serif</p>
                          <p className="font-serif text-xs text-gray-500 mt-1">Traditional & Academic</p>
                        </button>
                        <button className="rounded-xl border-2 border-gray-200 bg-white p-4 text-left hover:border-gray-300">
                          <p className="font-mono text-lg font-bold text-gray-900">Tech Mono</p>
                          <p className="font-mono text-xs text-gray-500 mt-1">Modern & Digital</p>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ✅ GENERIC PLACEHOLDER FOR OTHER TABS */}
              {!['basic', 'theme'].includes(activeTab) && (
                <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mx-auto mb-4">
                    {(() => {
                      const Icon = editorTabs.find(t => t.id === activeTab)?.icon || Info;
                      return <Icon className="h-8 w-8 text-gray-400" />;
                    })()}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {editorTabs.find(t => t.id === activeTab)?.label} Settings
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
                    This section allows you to manage {editorTabs.find(t => t.id === activeTab)?.label.toLowerCase()} for your school website. The form fields will be dynamically generated here.
                  </p>
                  <button className="mt-6 inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                    <Plus className="h-4 w-4" /> Add New Item
                  </button>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}