'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  GraduationCap, BookOpen, Users, MapPin, Phone, Mail, Clock,
  Award, Star, Quote, ArrowRight, Menu, X, ChevronDown, ChevronUp,
  ArrowUp, Globe, Calendar,
  Building, Lightbulb, Shield, Heart, Trophy, Newspaper,
  CheckCircle, User, MailOpen
} from 'lucide-react';

// --- Mock Data (Replace with Supabase fetch later) ---
const schoolData = {
  name: 'Sunrise Valley Secondary School',
  motto: 'Knowledge is Light, Character is Strength',
  slug: 'sunrise-valley',
  themeColor: 'blue', // blue, green, purple, red, orange, teal
  about: 'Founded in 2050 B.S., Sunrise Valley Secondary School has been a beacon of academic excellence in the Gandaki Province. We are dedicated to nurturing young minds through a holistic approach that balances rigorous academics with moral and physical development.',
  principalMessage: 'Welcome to Sunrise Valley. We believe that every child is unique and possesses immense potential. Our mission is to provide a safe, stimulating, and supportive environment where students can discover their passions and achieve their dreams.',
  principalName: 'Mr. Basanta Adhikari',
  stats: { students: 450, teachers: 32, classes: 24 },
  programs: [
    { title: 'Primary Level (1-5)', desc: 'Foundation building with activity-based learning.', icon: BookOpen },
    { title: 'Secondary Level (6-10)', desc: 'Rigorous academics preparing for SEE examinations.', icon: GraduationCap },
    { title: 'Science Stream (11-12)', desc: 'Advanced physics, chemistry, and biology for future innovators.', icon: Lightbulb },
  ],
  whyChooseUs: [
    { title: 'Experienced Faculty', desc: 'Highly qualified and dedicated teaching staff.', icon: User },
    { title: 'Modern Facilities', desc: 'Smart classrooms, science labs, and computer centers.', icon: Building },
    { title: 'Holistic Development', desc: 'Focus on sports, arts, and moral education.', icon: Heart },
    { title: 'Safe Environment', desc: 'Secure campus with CCTV surveillance and caring staff.', icon: Shield },
  ],
  teachers: [
    { name: 'Ram K. Shrestha', subject: 'Mathematics', qualification: 'M.Ed' },
    { name: 'Sita Poudel', subject: 'Science', qualification: 'M.Sc' },
    { name: 'Hari Thapa', subject: 'English', qualification: 'M.A' },
    { name: 'Gita Rai', subject: 'Social Studies', qualification: 'M.A' },
  ],
  events: [
    { title: 'Annual Sports Day', date: 'Dec 15, 2081', location: 'School Ground', category: 'Sports' },
    { title: 'Parent-Teacher Meeting', date: 'Nov 28, 2081', location: 'Main Hall', category: 'Meeting' },
    { title: 'Science Exhibition', date: 'Nov 10, 2081', location: 'Science Block', category: 'Academic' },
  ],
  news: [
    { title: '100% Pass Rate in SEE 2081', date: 'Oct 20, 2081', category: 'Result', featured: true },
    { title: 'New Computer Lab Inaugurated', date: 'Oct 15, 2081', category: 'News', featured: false },
    { title: 'Winter Vacation Notice', date: 'Oct 10, 2081', category: 'Notice', featured: false },
  ],
  testimonials: [
    { name: 'Rajesh Sharma', role: 'Parent of Class 10 Student', text: 'The teachers here are incredibly dedicated. My son has shown remarkable improvement in both academics and confidence.' },
    { name: 'Sunita Gurung', role: 'Parent of Class 8 Student', text: 'The holistic approach to education at Sunrise Valley is exactly what we were looking for. Highly recommended!' },
  ],
  awards: [
    { title: 'Best School Award 2080', org: 'District Education Office' },
    { title: 'Excellence in Sports', org: 'Regional Sports Council' },
    { title: 'Green School Certification', org: 'Ministry of Environment' },
  ],
  contact: {
    phones: ['9841234567', '063-520123'],
    emails: ['info@sunrisevalley.edu.np', 'admission@sunrisevalley.edu.np'],
    address: 'Ward No. 5, Harinas, Syangja, Gandaki Province, Nepal',
    hours: 'Sun - Fri: 10:00 AM - 4:00 PM',
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3532.123456789!2d83.628123!3d28.123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDA3JzI0LjQiTiA4M8KwMzcnNDEuMiJF!5e0!3m2!1sen!2snp!4v1234567890'
  }
};

// Theme color mapping
const themeColors: Record<string, { primary: string; hover: string; light: string; text: string; border: string }> = {
  blue: { primary: 'bg-blue-600', hover: 'hover:bg-blue-700', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  green: { primary: 'bg-emerald-600', hover: 'hover:bg-emerald-700', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
  purple: { primary: 'bg-purple-600', hover: 'hover:bg-purple-700', light: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  red: { primary: 'bg-red-600', hover: 'hover:bg-red-700', light: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  orange: { primary: 'bg-orange-600', hover: 'hover:bg-orange-700', light: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  teal: { primary: 'bg-teal-600', hover: 'hover:bg-teal-700', light: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-200' },
};

export default function PublicSchoolPage() {
  const params = useParams();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  const theme = themeColors[schoolData.themeColor] || themeColors.blue;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'About', href: '#about' },
    { name: 'Programs', href: '#programs' },
    { name: 'Faculty', href: '#faculty' },
    { name: 'News & Events', href: '#news' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased">
      
      {/* ✅ Sticky Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${theme.primary} flex items-center justify-center text-white font-bold text-xl`}>
              S
            </div>
            <div>
              <h1 className={`font-bold text-lg leading-tight ${isScrolled ? 'text-gray-900' : 'text-white'}`}>
                {schoolData.name}
              </h1>
              <p className={`text-xs ${isScrolled ? 'text-gray-500' : 'text-blue-100'}`}>
                Est. 2050 B.S.
              </p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  isScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white/90 hover:text-white'
                }`}
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link 
              href={`/s/${schoolData.slug}/login`}
              className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}
            >
              Portal Login
            </Link>
            <Link 
              href={`/s/${schoolData.slug}/admission`}
              className={`text-sm font-semibold px-5 py-2.5 rounded-lg text-white shadow-sm transition-all ${theme.primary} ${theme.hover}`}
            >
              Apply Now
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`lg:hidden p-2 rounded-lg ${isScrolled ? 'text-gray-700' : 'text-white'}`}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-lg py-4 px-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-base font-medium text-gray-700 hover:text-blue-600 py-2"
              >
                {link.name}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-gray-100">
              <Link href={`/s/${schoolData.slug}/login`} className="text-center py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium">
                Portal Login
              </Link>
              <Link href={`/s/${schoolData.slug}/admission`} className={`text-center py-2.5 rounded-lg text-white font-semibold ${theme.primary}`}>
                Apply Now
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ✅ Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center text-white">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 text-sm font-medium mb-6">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            Admissions Open for 2082 B.S.
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            {schoolData.name}
          </h1>
          <p className="text-xl sm:text-2xl text-blue-100 font-light italic mb-8 max-w-3xl mx-auto">
            "{schoolData.motto}"
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href={`/s/${schoolData.slug}/admission`}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg text-white font-semibold shadow-lg transition-all ${theme.primary} ${theme.hover}`}
            >
              Start Admission <ArrowRight className="h-5 w-5" />
            </Link>
            <a 
              href="#about"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold hover:bg-white/20 transition-all"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* ✅ Floating Stats Bar */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 -mt-16">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl ${theme.light} ${theme.text} flex items-center justify-center`}>
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{schoolData.stats.students}+</p>
              <p className="text-sm text-gray-500">Happy Students</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl ${theme.light} ${theme.text} flex items-center justify-center`}>
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{schoolData.stats.teachers}+</p>
              <p className="text-sm text-gray-500">Expert Teachers</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl ${theme.light} ${theme.text} flex items-center justify-center`}>
              <Building className="h-6 w-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{schoolData.stats.classes}</p>
              <p className="text-sm text-gray-500">Modern Classrooms</p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className={`inline-block text-sm font-bold uppercase tracking-wider ${theme.text} mb-3`}>About Our School</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Nurturing Minds, Building Futures Since 2050 B.S.
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                {schoolData.about}
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <CheckCircle className={`h-6 w-6 ${theme.text} flex-shrink-0 mt-1`} />
                  <div>
                    <h4 className="font-semibold text-gray-900">Academic Excellence</h4>
                    <p className="text-sm text-gray-500">Consistently high SEE results</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className={`h-6 w-6 ${theme.text} flex-shrink-0 mt-1`} />
                  <div>
                    <h4 className="font-semibold text-gray-900">Moral Education</h4>
                    <p className="text-sm text-gray-500">Focus on character building</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Principal's Message */}
            <div className={`rounded-2xl ${theme.light} p-8 sm:p-10 border ${theme.border} relative`}>
              <Quote className={`absolute top-6 right-6 h-12 w-12 ${theme.text} opacity-20`} />
              <div className="flex items-center gap-4 mb-6">
                <div className={`h-14 w-14 rounded-full ${theme.primary} flex items-center justify-center text-white text-xl font-bold`}>
                  {schoolData.principalName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Principal's Message</h3>
                  <p className={`text-sm font-medium ${theme.text}`}>{schoolData.principalName}</p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed italic">
                "{schoolData.principalMessage}"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ Academic Programs */}
      <section id="programs" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className={`inline-block text-sm font-bold uppercase tracking-wider ${theme.text} mb-3`}>Our Programs</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Academic Levels We Offer</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {schoolData.programs.map((program, idx) => {
              const Icon = program.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow group">
                  <div className={`h-14 w-14 rounded-xl ${theme.light} ${theme.text} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{program.title}</h3>
                  <p className="text-gray-600">{program.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ✅ Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className={`inline-block text-sm font-bold uppercase tracking-wider ${theme.text} mb-3`}>Why Choose Us</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">What Makes Us Different</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {schoolData.whyChooseUs.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div className={`h-16 w-16 mx-auto rounded-full ${theme.light} ${theme.text} flex items-center justify-center mb-5`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ✅ Faculty Section */}
      <section id="faculty" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className={`inline-block text-sm font-bold uppercase tracking-wider ${theme.text} mb-3`}>Our Team</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Meet Our Expert Faculty</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {schoolData.teachers.map((teacher, idx) => (
              <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`h-32 ${theme.primary} relative`}>
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 h-20 w-20 rounded-full bg-white p-1">
                    <div className={`h-full w-full rounded-full ${theme.light} ${theme.text} flex items-center justify-center text-2xl font-bold`}>
                      {teacher.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  </div>
                </div>
                <div className="pt-12 pb-6 px-6 text-center">
                  <h3 className="text-lg font-bold text-gray-900">{teacher.name}</h3>
                  <p className={`text-sm font-medium ${theme.text} mb-1`}>{teacher.subject}</p>
                  <p className="text-xs text-gray-500">{teacher.qualification}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ✅ News & Events */}
      <section id="news" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Upcoming Events */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <Calendar className={`h-6 w-6 ${theme.text}`} />
                <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
              </div>
              <div className="space-y-4">
                {schoolData.events.map((event, idx) => (
                  <div key={idx} className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                    <div className={`flex-shrink-0 h-14 w-14 rounded-lg ${theme.light} ${theme.text} flex flex-col items-center justify-center`}>
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900">{event.title}</h3>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${theme.light} ${theme.text}`}>
                          {event.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        <Clock className="h-3 w-3" /> {event.date}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" /> {event.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Latest News */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <Newspaper className={`h-6 w-6 ${theme.text}`} />
                <h2 className="text-2xl font-bold text-gray-900">Latest News</h2>
              </div>
              <div className="space-y-4">
                {schoolData.news.map((news, idx) => (
                  <div key={idx} className={`p-5 rounded-xl border ${news.featured ? `${theme.border} ${theme.light}` : 'border-gray-100'} hover:shadow-sm transition-all`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${news.featured ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'}`}>
                        {news.category}
                      </span>
                      <span className="text-xs text-gray-500">{news.date}</span>
                    </div>
                    <h3 className={`font-bold ${news.featured ? theme.text : 'text-gray-900'}`}>
                      {news.title}
                    </h3>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ✅ Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className={`inline-block text-sm font-bold uppercase tracking-wider ${theme.text} mb-3`}>Testimonials</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">What Parents Say About Us</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {schoolData.testimonials.map((t, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative">
                <Quote className={`absolute top-6 right-6 h-8 w-8 ${theme.text} opacity-20`} />
                <p className="text-gray-700 italic mb-6 relative z-10">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${theme.primary} flex items-center justify-center text-white font-bold`}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ✅ Awards & Achievements */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className={`inline-block text-sm font-bold uppercase tracking-wider ${theme.text} mb-3`}>Our Pride</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Awards & Achievements</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {schoolData.awards.map((award, idx) => (
              <div key={idx} className="flex items-center gap-4 p-6 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors">
                <div className={`h-12 w-12 rounded-xl ${theme.light} ${theme.text} flex items-center justify-center flex-shrink-0`}>
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{award.title}</h3>
                  <p className="text-sm text-gray-500">{award.org}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ✅ Admissions CTA Banner */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`rounded-3xl ${theme.primary} p-10 sm:p-16 text-center text-white relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '30px 30px' }}></div>
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">Admissions Open for 2082 B.S.</h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Give your child the gift of quality education. Join the Sunrise Valley family today and watch them thrive.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link 
                  href={`/s/${schoolData.slug}/admission`}
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-white text-gray-900 font-semibold shadow-lg hover:bg-gray-100 transition-all"
                >
                  Apply Online <ArrowRight className="h-5 w-5" />
                </Link>
                <a 
                  href="#contact"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold hover:bg-white/20 transition-all"
                >
                  <Phone className="h-5 w-5" /> Contact Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ Contact Section */}
      <section id="contact" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className={`inline-block text-sm font-bold uppercase tracking-wider ${theme.text} mb-3`}>Get in Touch</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Contact Information</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
                <div className={`h-12 w-12 rounded-xl ${theme.light} ${theme.text} flex items-center justify-center flex-shrink-0`}>
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Our Address</h3>
                  <p className="text-gray-600">{schoolData.contact.address}</p>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
                <div className={`h-12 w-12 rounded-xl ${theme.light} ${theme.text} flex items-center justify-center flex-shrink-0`}>
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Phone Numbers</h3>
                  {schoolData.contact.phones.map((phone, idx) => (
                    <p key={idx} className="text-gray-600">{phone}</p>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
                <div className={`h-12 w-12 rounded-xl ${theme.light} ${theme.text} flex items-center justify-center flex-shrink-0`}>
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Email Addresses</h3>
                  {schoolData.contact.emails.map((email, idx) => (
                    <p key={idx} className="text-gray-600">{email}</p>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4">
                <div className={`h-12 w-12 rounded-xl ${theme.light} ${theme.text} flex items-center justify-center flex-shrink-0`}>
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">Office Hours</h3>
                  <p className="text-gray-600">{schoolData.contact.hours}</p>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full min-h-[400px] flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Google Maps Integration</p>
                  <p className="text-xs text-gray-400 mt-1">Connect your Google Maps API key</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ✅ Rich Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className={`h-10 w-10 rounded-lg ${theme.primary} flex items-center justify-center text-white font-bold text-xl`}>
                  S
                </div>
                <h3 className="font-bold text-lg">{schoolData.name}</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {schoolData.motto}
              </p>
                            <div className="flex items-center gap-3">
                {/* Facebook */}
                <a href="#" className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                {/* Instagram */}
                <a href="#" className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                {/* YouTube */}
                <a href="#" className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-lg mb-6">Quick Links</h4>
              <ul className="space-y-3">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Academics */}
            <div>
              <h4 className="font-bold text-lg mb-6">Academics</h4>
              <ul className="space-y-3">
                {schoolData.programs.map((p) => (
                  <li key={p.title}>
                    <a href="#programs" className="text-gray-400 hover:text-white transition-colors text-sm">
                      {p.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-lg mb-6">Contact Us</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{schoolData.contact.address}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 flex-shrink-0" />
                  <span>{schoolData.contact.phones[0]}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 flex-shrink-0" />
                  <span>{schoolData.contact.emails[0]}</span>
                </li>
              </ul>
            </div>

          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              © 2024 {schoolData.name}. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              Powered by <Globe className="h-4 w-4" /> SNAP
            </p>
          </div>
        </div>
      </footer>

      {/* ✅ Back to Top Button */}
      {showBackToTop && (
        <button 
          onClick={scrollToTop}
          className={`fixed bottom-8 right-8 z-50 h-12 w-12 rounded-full ${theme.primary} text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform`}
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

    </div>
  );
}