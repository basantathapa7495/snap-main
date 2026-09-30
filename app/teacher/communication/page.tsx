'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Bell,
  CalendarClock,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  FileText,
  Loader2,
  MessageSquare,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Send,
  Users,
  X,
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import { supabase } from '@/lib/supabase';

type Tab = 'overview' | 'notices' | 'messages' | 'scheduled';
type NoticeStatus = 'published' | 'scheduled' | 'draft';
type NoticeRow = {
  id: string;
  school_id: string;
  title: string;
  content: string;
  priority: string | null;
  target_audience: string | null;
  target_class: string | null;
  target_section: string | null;
  target_class_id: string | null;
  status: NoticeStatus;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_mime: string | null;
  attachment_size: number | null;
};
type ClassOption = {
  id: string;
  label: string;
  className: string;
  section: string;
};
type StudentOption = {
  id: string;
  userId: string;
  name: string;
  className: string;
  section: string;
  classId: string;
};
type Conversation = {
  id: string;
  source: 'principal' | 'student';
  name: string;
  detail: string;
  latest: string;
  latestAt: string | null;
  unread: number;
  classId: string | null;
  studentId: string | null;
};
type ChatMessage = {
  id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  attachment_path?: string | null;
  attachment_name?: string | null;
  attachment_mime?: string | null;
  attachment_size?: number | null;
};

const allowedTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const maxFileSize = 10 * 1024 * 1024;

function normalized(value?: string | null) {
  return (value || '').trim().replace(/^(class|grade)\s+/i, '').toLowerCase();
}
function formatWhen(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const elapsed = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(elapsed / 60000));
  if (minutes < 60) return minutes < 1 ? 'Now' : minutes + 'm';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + 'h';
  if (hours < 48) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function fullDate(value?: string | null) {
  return value
    ? new Date(value).toLocaleString('en-NP', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Date unavailable';
}
function nepalDate(value: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return get('year') + '-' + get('month') + '-' + get('day');
}
function safeFileName(value: string) {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-');
  return cleaned.slice(-120) || 'attachment';
}
function validateFile(file: File | null) {
  if (!file) return '';
  if (!allowedTypes.has(file.type)) return 'Use PDF, DOC, DOCX, JPG, PNG or WebP.';
  if (file.size > maxFileSize) return 'The attachment must be 10 MB or smaller.';
  return '';
}
function classLabel(row: any) {
  const name = row.class_name || row.class || row.name || row.class_number || 'Class';
  const section = row.section_name || row.section || '';
  return section ? name + ' · ' + section : name;
}

export default function TeacherCommunicationPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [userId, setUserId] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [notices, setNotices] = useState<NoticeRow[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [messageText, setMessageText] = useState('');
  const [messageFile, setMessageFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<NoticeRow | null>(null);
  const [viewNotice, setViewNotice] = useState<NoticeRow | null>(null);
  const [savingNotice, setSavingNotice] = useState(false);
  const [noticeQuery, setNoticeQuery] = useState('');
  const [noticeFilter, setNoticeFilter] = useState('All');
  const [messageQuery, setMessageQuery] = useState('');
  const [messageFilter, setMessageFilter] = useState('All');
  const [form, setForm] = useState({
    title: '',
    classId: '',
    priority: 'normal',
    content: '',
    schedule: false,
    scheduledAt: '',
    file: null as File | null,
  });
  const messageEndRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        setAuthenticated(false);
        return;
      }
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('school_id,role')
        .eq('user_id', user.id)
        .single();
      if (profileError || !profile?.school_id || profile.role !== 'teacher') {
        throw new Error('Teacher access unavailable.');
      }
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('id,school_id')
        .eq('user_id', user.id)
        .eq('school_id', profile.school_id)
        .is('left_at', null)
        .single();
      if (teacherError || !teacher) throw new Error('Teacher membership unavailable.');

      const assignmentResult = await supabase
        .from('teacher_assignments')
        .select('class_id,class_name,classes(id,class_name,class,name,class_number,section,section_name,archived_at)')
        .eq('school_id', profile.school_id)
        .eq('teacher_id', teacher.id)
        .eq('active', true)
        .not('class_id', 'is', null);
      if (assignmentResult.error) throw assignmentResult.error;

      const classMap = new Map<string, ClassOption>();
      for (const assignment of assignmentResult.data || []) {
        const nested = Array.isArray((assignment as any).classes)
          ? (assignment as any).classes[0]
          : (assignment as any).classes;
        if (!nested || nested.archived_at) continue;
        classMap.set(nested.id, {
          id: nested.id,
          label: classLabel(nested),
          className: nested.class_name || nested.class || nested.name || nested.class_number || assignment.class_name,
          section: nested.section_name || nested.section || '',
        });
      }
      const assignedClasses = Array.from(classMap.values()).sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

      const [noticeResult, studentResult, directConversationResult, teacherConversationResult] = await Promise.all([
        supabase
          .from('notices')
          .select('id,school_id,title,content,priority,target_audience,target_class,target_section,target_class_id,status,scheduled_at,published_at,created_at,updated_at,created_by,attachment_path,attachment_name,attachment_mime,attachment_size')
          .eq('school_id', profile.school_id)
          .order('created_at', { ascending: false })
          .limit(300),
        supabase
          .from('students')
          .select('id,user_id,name,class,section')
          .eq('school_id', profile.school_id)
          .not('user_id', 'is', null)
          .order('name')
          .limit(2000),
        supabase
          .from('direct_conversation_inbox')
          .select('id,school_id,principal_id,recipient_id,recipient_role,updated_at,latest_content,latest_at,unread_count')
          .eq('school_id', profile.school_id)
          .eq('recipient_id', user.id)
          .order('updated_at', { ascending: false }),
        supabase
          .from('teacher_student_conversations')
          .select('id,school_id,teacher_id,student_id,class_id,updated_at')
          .eq('school_id', profile.school_id)
          .eq('teacher_id', teacher.id)
          .order('updated_at', { ascending: false }),
      ]);
      if (noticeResult.error) throw noticeResult.error;
      if (studentResult.error) throw studentResult.error;
      if (teacherConversationResult.error) throw teacherConversationResult.error;

      const assignedStudents: StudentOption[] = [];
      for (const student of studentResult.data || []) {
        const matchingClass = assignedClasses.find((item) =>
          normalized(item.className) === normalized(student.class)
          && normalized(item.section) === normalized(student.section)
        );
        if (matchingClass && student.user_id) {
          assignedStudents.push({
            id: student.id,
            userId: student.user_id,
            name: student.name,
            className: student.class || matchingClass.className,
            section: student.section || matchingClass.section,
            classId: matchingClass.id,
          });
        }
      }
      const studentById = new Map(assignedStudents.map((student) => [student.id, student]));

      const teacherConversationIds = (teacherConversationResult.data || []).map((row) => row.id);
      let recentTeacherMessages: any[] = [];
      if (teacherConversationIds.length) {
        const recentResult = await supabase
          .from('teacher_student_messages')
          .select('id,conversation_id,sender_id,content,read_at,created_at')
          .in('conversation_id', teacherConversationIds)
          .order('created_at', { ascending: false })
          .limit(2000);
        if (recentResult.error) throw recentResult.error;
        recentTeacherMessages = recentResult.data || [];
      }

      const unified: Conversation[] = [];
      for (const row of directConversationResult.error ? [] : directConversationResult.data || []) {
        unified.push({
          id: row.id,
          source: 'principal',
          name: 'School Principal',
          detail: 'School administration',
          latest: row.latest_content || 'Start a conversation',
          latestAt: row.latest_at || row.updated_at,
          unread: Number(row.unread_count || 0),
          classId: null,
          studentId: null,
        });
      }
      for (const row of teacherConversationResult.data || []) {
        const student = studentById.get(row.student_id);
        if (!student) continue;
        const related = recentTeacherMessages.filter((message) => message.conversation_id === row.id);
        const latest = related[0];
        unified.push({
          id: row.id,
          source: 'student',
          name: student.name,
          detail: 'Student · ' + student.className + (student.section ? ' ' + student.section : ''),
          latest: latest?.content || 'Start a conversation',
          latestAt: latest?.created_at || row.updated_at,
          unread: related.filter((message) => message.sender_id !== user.id && !message.read_at).length,
          classId: row.class_id,
          studentId: row.student_id,
        });
      }
      unified.sort((a, b) => new Date(b.latestAt || 0).getTime() - new Date(a.latestAt || 0).getTime());

      setUserId(user.id);
      setSchoolId(profile.school_id);
      setTeacherId(teacher.id);
      setClasses(assignedClasses);
      setStudents(assignedStudents);
      setNotices((noticeResult.data || []) as NoticeRow[]);
      setConversations(unified);
      if (selectedConversation) {
        setSelectedConversation(unified.find((item) => item.id === selectedConversation.id && item.source === selectedConversation.source) || null);
      }
    } catch (cause) {
      console.error('Teacher communication load failed', cause);
      setError('Communication could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedConversation]);

  useEffect(() => {
    void loadData();
  }, [refreshKey]);

  useEffect(() => {
    if (loading || !schoolId) return;
    const timer = window.setInterval(() => setRefreshKey((value) => value + 1), 30000);
    return () => window.clearInterval(timer);
  }, [loading, schoolId]);

  const loadMessages = useCallback(async (conversation: Conversation) => {
    setMessagesLoading(true);
    setMessageError('');
    try {
      const table = conversation.source === 'student' ? 'teacher_student_messages' : 'direct_messages';
      const columns = conversation.source === 'student'
        ? 'id,sender_id,content,read_at,created_at,attachment_path,attachment_name,attachment_mime,attachment_size'
        : 'id,sender_id,content,read_at,created_at';
      const result = await supabase
        .from(table)
        .select(columns)
        .eq('school_id', schoolId)
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true })
        .limit(500);
      if (result.error) throw result.error;
      setMessages((result.data || []) as ChatMessage[]);
      const unread = (result.data || []).filter((item: any) => item.sender_id !== userId && !item.read_at).map((item: any) => item.id);
      if (unread.length) {
        await supabase.from(table).update({ read_at: new Date().toISOString() }).in('id', unread);
        setConversations((current) => current.map((item) => item.id === conversation.id && item.source === conversation.source ? { ...item, unread: 0 } : item));
      }
      requestAnimationFrame(() => messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }));
    } catch (cause) {
      console.error('Teacher messages load failed', cause);
      setMessageError('Messages could not be loaded.');
    } finally {
      setMessagesLoading(false);
    }
  }, [schoolId, userId]);

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedConversation);
    const timer = window.setInterval(() => void loadMessages(selectedConversation), 12000);
    return () => window.clearInterval(timer);
  }, [selectedConversation, loadMessages]);

  const ownNotices = useMemo(() => notices.filter((item) => item.created_by === userId), [notices, userId]);
  const publishedNotices = useMemo(() => notices.filter((item) => item.status === 'published'), [notices]);
  const scheduledNotices = useMemo(
    () => ownNotices.filter((item) => item.status === 'scheduled').sort((a, b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime()),
    [ownNotices],
  );
  const filteredNotices = useMemo(() => notices.filter((item) => {
    const query = noticeQuery.trim().toLowerCase();
    const matchesSearch = !query || item.title.toLowerCase().includes(query) || item.content.toLowerCase().includes(query);
    const matchesFilter =
      noticeFilter === 'All'
      || (noticeFilter === 'My Classes' && !!item.target_class_id && classes.some((entry) => entry.id === item.target_class_id))
      || (noticeFilter === 'Students' && ['students', 'class', 'section'].includes(item.target_audience || ''))
      || (noticeFilter === 'Important' && ['high', 'urgent', 'important'].includes((item.priority || '').toLowerCase()));
    return matchesSearch && matchesFilter;
  }), [classes, noticeFilter, noticeQuery, notices]);
  const filteredConversations = useMemo(() => conversations.filter((item) => {
    const query = messageQuery.trim().toLowerCase();
    const matchesSearch = !query || item.name.toLowerCase().includes(query) || item.latest.toLowerCase().includes(query);
    const matchesFilter =
      messageFilter === 'All'
      || (messageFilter === 'Students' && item.source === 'student')
      || (messageFilter === 'My Classes' && item.source === 'student' && classes.some((entry) => entry.id === item.classId));
    return matchesSearch && matchesFilter;
  }), [classes, conversations, messageFilter, messageQuery]);

  function chooseTab(value: Tab) {
    setTab(value);
    setSelectedConversation(null);
    setNotice('');
    window.history.replaceState(window.history.state, '', value === 'overview' ? window.location.pathname : window.location.pathname + '?tab=' + value);
  }

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('tab');
    if (requested && ['overview', 'notices', 'messages', 'scheduled'].includes(requested)) setTab(requested as Tab);
  }, []);

  function openComposer(item?: NoticeRow) {
    setEditingNotice(item || null);
    setForm({
      title: item?.title || '',
      classId: item?.target_class_id || classes[0]?.id || '',
      priority: item?.priority || 'normal',
      content: item?.content || '',
      schedule: item?.status === 'scheduled',
      scheduledAt: item?.scheduled_at ? new Date(new Date(item.scheduled_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '',
      file: null,
    });
    setComposerOpen(true);
  }

  async function saveNotice(event: FormEvent) {
    event.preventDefault();
    setNotice('');
    const selectedClass = classes.find((item) => item.id === form.classId);
    if (!selectedClass) {
      setNotice('Choose one of your assigned classes.');
      return;
    }
    const fileError = validateFile(form.file);
    if (fileError) {
      setNotice(fileError);
      return;
    }
    const scheduledAt = form.schedule ? new Date(form.scheduledAt) : null;
    if (form.schedule && (!form.scheduledAt || !scheduledAt || Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date())) {
      setNotice('Choose a future date and time.');
      return;
    }
    setSavingNotice(true);
    let uploadedPath = '';
    try {
      const id = editingNotice?.id || crypto.randomUUID();
      let attachment = {
        attachment_path: editingNotice?.attachment_path || null,
        attachment_name: editingNotice?.attachment_name || null,
        attachment_mime: editingNotice?.attachment_mime || null,
        attachment_size: editingNotice?.attachment_size || null,
      };
      if (form.file) {
        uploadedPath = schoolId + '/notices/' + id + '/' + userId + '/' + crypto.randomUUID() + '-' + safeFileName(form.file.name);
        const upload = await supabase.storage.from('teacher-communication').upload(uploadedPath, form.file, {
          cacheControl: '3600',
          contentType: form.file.type,
          upsert: false,
        });
        if (upload.error) throw upload.error;
        attachment = {
          attachment_path: uploadedPath,
          attachment_name: form.file.name,
          attachment_mime: form.file.type,
          attachment_size: form.file.size,
        };
      }
      const now = new Date();
      const payload = {
        school_id: schoolId,
        title: form.title.trim(),
        content: form.content.trim(),
        priority: form.priority,
        target_audience: 'class',
        target_class: selectedClass.className,
        target_section: selectedClass.section || null,
        target_class_id: selectedClass.id,
        status: form.schedule ? 'scheduled' : 'published',
        scheduled_at: scheduledAt?.toISOString() || null,
        published_at: form.schedule ? null : now.toISOString(),
        publish_date: form.schedule ? null : nepalDate(now),
        updated_at: now.toISOString(),
        created_by: userId,
        ...attachment,
      };
      const result = editingNotice
        ? await supabase.from('notices').update(payload).eq('id', editingNotice.id).eq('created_by', userId).select('id').single()
        : await supabase.from('notices').insert({ id, created_at: now.toISOString(), ...payload }).select('id').single();
      if (result.error) throw result.error;
      if (form.file && editingNotice?.attachment_path && editingNotice.attachment_path !== uploadedPath) {
        await supabase.storage.from('teacher-communication').remove([editingNotice.attachment_path]);
      }
      setComposerOpen(false);
      setEditingNotice(null);
      setNotice(form.schedule ? 'Notice scheduled.' : 'Notice posted.');
      setRefreshKey((value) => value + 1);
    } catch (cause) {
      console.error('Teacher notice save failed', cause);
      if (uploadedPath) await supabase.storage.from('teacher-communication').remove([uploadedPath]);
      setNotice('The notice could not be saved. Check your assigned class and try again.');
    } finally {
      setSavingNotice(false);
    }
  }

  async function cancelSchedule(item: NoticeRow) {
    const result = await supabase
      .from('notices')
      .update({ status: 'draft', scheduled_at: null, updated_at: new Date().toISOString() })
      .eq('id', item.id)
      .eq('created_by', userId)
      .select('id')
      .single();
    if (result.error) {
      setNotice('The scheduled notice could not be cancelled.');
      return;
    }
    setNotice('Schedule cancelled and moved to draft.');
    setRefreshKey((value) => value + 1);
  }

  async function openAttachment(path: string | null) {
    if (!path) return;
    const { data, error: signedError } = await supabase.storage.from('teacher-communication').createSignedUrl(path, 60);
    if (signedError || !data?.signedUrl) {
      setNotice('The attachment could not be opened.');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  }

  async function startStudentConversation(student: StudentOption) {
    setMessageError('');
    try {
      const existing = await supabase
        .from('teacher_student_conversations')
        .select('id')
        .eq('school_id', schoolId)
        .eq('teacher_id', teacherId)
        .eq('student_id', student.id)
        .eq('class_id', student.classId)
        .maybeSingle();
      if (existing.error) throw existing.error;
      let id = existing.data?.id;
      if (!id) {
        const created = await supabase
          .from('teacher_student_conversations')
          .insert({ school_id: schoolId, teacher_id: teacherId, student_id: student.id, class_id: student.classId })
          .select('id')
          .single();
        if (created.error) {
          const retry = await supabase
            .from('teacher_student_conversations')
            .select('id')
            .eq('school_id', schoolId)
            .eq('teacher_id', teacherId)
            .eq('student_id', student.id)
            .eq('class_id', student.classId)
            .single();
          if (retry.error) throw created.error;
          id = retry.data.id;
        } else id = created.data.id;
      }
      const conversation: Conversation = {
        id,
        source: 'student',
        name: student.name,
        detail: 'Student · ' + student.className + (student.section ? ' ' + student.section : ''),
        latest: 'Start a conversation',
        latestAt: new Date().toISOString(),
        unread: 0,
        classId: student.classId,
        studentId: student.id,
      };
      setNewMessageOpen(false);
      setSelectedConversation(conversation);
      setTab('messages');
      setConversations((current) => current.some((item) => item.id === id && item.source === 'student') ? current : [conversation, ...current]);
    } catch (cause) {
      console.error('Start student conversation failed', cause);
      setMessageError('This conversation could not be started. Only students in your assigned classes are allowed.');
    }
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    if (!selectedConversation || !messageText.trim()) return;
    const fileError = validateFile(messageFile);
    if (fileError) {
      setMessageError(fileError);
      return;
    }
    setSending(true);
    setMessageError('');
    let uploadedPath = '';
    try {
      if (selectedConversation.source === 'principal') {
        if (messageFile) throw new Error('Attachments are not enabled for principal conversations.');
        const result = await supabase
          .from('direct_messages')
          .insert({ conversation_id: selectedConversation.id, school_id: schoolId, sender_id: userId, content: messageText.trim() })
          .select('id,sender_id,content,read_at,created_at')
          .single();
        if (result.error) throw result.error;
        setMessages((current) => [...current, result.data as ChatMessage]);
      } else {
        const id = crypto.randomUUID();
        let attachment = {};
        if (messageFile) {
          uploadedPath = schoolId + '/messages/' + selectedConversation.id + '/' + userId + '/' + crypto.randomUUID() + '-' + safeFileName(messageFile.name);
          const upload = await supabase.storage.from('teacher-communication').upload(uploadedPath, messageFile, {
            cacheControl: '3600',
            contentType: messageFile.type,
            upsert: false,
          });
          if (upload.error) throw upload.error;
          attachment = {
            attachment_path: uploadedPath,
            attachment_name: messageFile.name,
            attachment_mime: messageFile.type,
            attachment_size: messageFile.size,
          };
        }
        const result = await supabase
          .from('teacher_student_messages')
          .insert({
            id,
            conversation_id: selectedConversation.id,
            school_id: schoolId,
            sender_id: userId,
            content: messageText.trim(),
            ...attachment,
          })
          .select('id,sender_id,content,read_at,created_at,attachment_path,attachment_name,attachment_mime,attachment_size')
          .single();
        if (result.error) throw result.error;
        setMessages((current) => [...current, result.data as ChatMessage]);
      }
      const sentText = messageText.trim();
      setMessageText('');
      setMessageFile(null);
      setConversations((current) => current.map((item) => item.id === selectedConversation.id && item.source === selectedConversation.source
        ? { ...item, latest: sentText, latestAt: new Date().toISOString() }
        : item));
      requestAnimationFrame(() => messageEndRef.current?.scrollIntoView({ behavior: 'smooth' }));
    } catch (cause) {
      console.error('Teacher message send failed', cause);
      if (uploadedPath) await supabase.storage.from('teacher-communication').remove([uploadedPath]);
      setMessageError(selectedConversation.source === 'principal' && messageFile
        ? 'Attachments are available only for assigned-student conversations.'
        : 'Message sending failed. Please retry.');
    } finally {
      setSending(false);
    }
  }

  if (loading) return <PageSkeleton />;
  if (!authenticated) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
      <div className="rounded-2xl bg-white p-6 text-center dark:bg-slate-900">
        <h1 className="text-lg font-bold text-slate-950 dark:text-white">Please sign in</h1>
        <Link href="/auth/login?role=teacher" className="mt-3 inline-block text-sm font-semibold text-blue-600">Go to teacher login</Link>
      </div>
    </main>;
  }

  const unreadTotal = conversations.reduce((sum, item) => sum + item.unread, 0);
  const summary = [
    { label: 'Notices', value: publishedNotices.length, icon: Bell, tone: 'bg-blue-50 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300' },
    { label: 'Messages', value: conversations.length, icon: MessageSquare, tone: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300' },
    { label: 'Classes', value: classes.length, icon: Users, tone: 'bg-amber-50 text-amber-600 dark:bg-amber-400/15 dark:text-amber-300' },
    { label: 'Scheduled', value: scheduledNotices.length, icon: CalendarClock, tone: 'bg-violet-50 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300' },
  ];

  return <div className="min-h-screen bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
    <Sidebar />
    <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
      <TopBar />
      <main className="flex-1 px-3.5 pb-28 pt-7 sm:px-6 lg:px-8 lg:pt-24">
        <div className="mx-auto max-w-[1500px]">
          <header className="-mx-3.5 bg-gradient-to-br from-[#e7f2ff] via-[#f7fbff] to-[#b5cef7] px-4 py-5 dark:from-[#132a49] dark:via-[#182d49] dark:to-[#1b365b] sm:mx-0 sm:rounded-2xl sm:border sm:border-blue-100 sm:px-8 sm:py-7 sm:dark:border-blue-900/60">
            <h1 className="text-[1.7rem] font-extrabold leading-tight tracking-tight sm:text-4xl">Communication</h1>
            <p className="mt-1 text-xs text-slate-700 dark:text-blue-100 sm:text-base">Stay connected with your school community.</p>
          </header>

          <nav aria-label="Teacher communication sections" className="mb-3 mt-2 flex gap-5 overflow-x-auto border-b border-slate-200 dark:border-slate-700 [scrollbar-width:none]">
            {(['overview', 'notices', 'messages', 'scheduled'] as const).map((item) => (
              <button key={item} type="button" onClick={() => chooseTab(item)} className={'shrink-0 border-b-2 px-0.5 py-2 text-xs font-semibold capitalize sm:text-sm ' + (tab === item ? 'border-blue-600 text-blue-700 dark:text-blue-300' : 'border-transparent text-slate-500 dark:text-slate-400')}>
                {item}{item === 'messages' && unreadTotal > 0 ? ' (' + unreadTotal + ')' : ''}
              </button>
            ))}
          </nav>

          {error && <div role="alert" className="mb-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"><AlertCircle className="h-4 w-4 shrink-0" /><span className="flex-1">{error}</span><button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="font-bold">Retry</button></div>}
          {notice && <div role="status" className="mb-3 flex items-start justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200"><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss"><X className="h-4 w-4" /></button></div>}

          {tab === 'overview' && <div className="space-y-4 pb-6">
            <section aria-label="Communication summary" className="grid grid-cols-4 gap-1.5 sm:gap-3">
              {summary.map(({ label, value, icon: Icon, tone }) => (
                <button key={label} type="button" onClick={() => chooseTab(label === 'Notices' ? 'notices' : label === 'Messages' ? 'messages' : label === 'Scheduled' ? 'scheduled' : 'overview')} className="min-w-0 rounded-xl border border-slate-200 bg-white px-2 py-2 text-left dark:border-slate-700 dark:bg-slate-900 sm:px-3">
                  <span className={'flex h-6 w-6 items-center justify-center rounded-md ' + tone}><Icon className="h-3.5 w-3.5" /></span>
                  <strong className="mt-1.5 block text-lg leading-none sm:text-xl">{value}</strong>
                  <span className="mt-1 block truncate text-[9px] text-slate-500 dark:text-slate-400 sm:text-xs">{label}</span>
                </button>
              ))}
            </section>

            <section>
              <div className="mb-2 flex items-end justify-between gap-2"><h2 className="text-base font-bold">Recent Notices</h2><button type="button" onClick={() => chooseTab('notices')} className="text-xs font-semibold text-blue-600 dark:text-blue-300">View all →</button></div>
              <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">
                {publishedNotices.slice(0, 3).map((item) => <NoticeRow key={item.id} item={item} onClick={() => setViewNotice(item)} />)}
                {!publishedNotices.length && <Empty compact title="No recent notices" detail="Relevant school and class notices will appear here." />}
              </div>
            </section>

            <section>
              <div className="mb-2 flex items-end justify-between gap-2"><h2 className="text-base font-bold">Recent Messages</h2><button type="button" onClick={() => chooseTab('messages')} className="text-xs font-semibold text-blue-600 dark:text-blue-300">View all →</button></div>
              <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">
                {conversations.slice(0, 3).map((item) => <ConversationRow key={item.source + item.id} item={item} onClick={() => { setSelectedConversation(item); setTab('messages'); }} />)}
                {!conversations.length && <Empty compact title="No conversations yet" detail="Messages from the principal and assigned students will appear here." />}
              </div>
            </section>
          </div>}

          {tab === 'notices' && <div className="space-y-3 pb-6">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="text-base font-bold">Notices</h2><p className="text-[11px] text-slate-500 dark:text-slate-400">School notices and updates for your assigned classes.</p></div>
              {classes.length > 0 && <button type="button" onClick={() => openComposer()} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-4 w-4" /> Create</button>}
            </div>
            <SearchBox value={noticeQuery} onChange={setNoticeQuery} placeholder="Search notices..." />
            <FilterBar items={['All', 'My Classes', 'Students', 'Important']} value={noticeFilter} onChange={setNoticeFilter} />
            <div className="space-y-2">
              {filteredNotices.map((item) => <NoticeCard key={item.id} item={item} mine={item.created_by === userId} onView={() => setViewNotice(item)} onEdit={() => openComposer(item)} />)}
              {!filteredNotices.length && <Empty title="No notices found" detail={noticeQuery ? 'Try another search or filter.' : 'Notices relevant to you will appear here.'} />}
            </div>
          </div>}

          {tab === 'messages' && !selectedConversation && <div className="space-y-3 pb-6">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="text-base font-bold">Messages</h2><p className="text-[11px] text-slate-500 dark:text-slate-400">Private conversations with school administration and assigned students.</p></div>
              {students.length > 0 && <button type="button" onClick={() => setNewMessageOpen(true)} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white"><Plus className="h-4 w-4" /> New</button>}
            </div>
            <SearchBox value={messageQuery} onChange={setMessageQuery} placeholder="Search messages..." />
            <FilterBar items={['All', 'Students', 'My Classes']} value={messageFilter} onChange={setMessageFilter} />
            {messageError && <p role="alert" className="rounded-lg bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-300">{messageError}</p>}
            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">
              {filteredConversations.map((item) => <ConversationRow key={item.source + item.id} item={item} onClick={() => setSelectedConversation(item)} />)}
              {!filteredConversations.length && <Empty title="No messages found" detail={messageQuery ? 'Try another search.' : 'Start a conversation with an authenticated student in your assigned class.'} />}
            </div>
          </div>}

          {tab === 'messages' && selectedConversation && <section className="flex min-h-[60dvh] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-200 p-2.5 dark:border-slate-700">
              <button type="button" onClick={() => setSelectedConversation(null)} aria-label="Back to conversations" className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronLeft className="h-5 w-5" /></button>
              <Avatar name={selectedConversation.name} />
              <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-bold">{selectedConversation.name}</h2><p className="truncate text-[10px] text-slate-500 dark:text-slate-400">{selectedConversation.detail}</p></div>
              <button type="button" onClick={() => void loadMessages(selectedConversation)} aria-label="Refresh messages" className="rounded-lg p-2 text-slate-500"><RefreshCw className="h-4 w-4" /></button>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
              {messagesLoading && !messages.length && <div className="py-12 text-center text-xs text-slate-500"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading messages…</div>}
              {messageError && <div role="alert" className="rounded-lg bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-950 dark:text-rose-300">{messageError}</div>}
              {!messagesLoading && !messages.length && <Empty compact title="No messages yet" detail="Send the first message in this conversation." />}
              {messages.map((item) => {
                const mine = item.sender_id === userId;
                return <div key={item.id} className={'flex ' + (mine ? 'justify-end' : 'justify-start')}>
                  <div className={'max-w-[82%] rounded-2xl px-3 py-2 text-xs ' + (mine ? 'rounded-br-md bg-blue-600 text-white' : 'rounded-bl-md bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white')}>
                    <p className="whitespace-pre-wrap break-words leading-5">{item.content}</p>
                    {item.attachment_path && <button type="button" onClick={() => void openAttachment(item.attachment_path || null)} className={'mt-1.5 flex max-w-full items-center gap-1.5 rounded-lg px-2 py-1 text-left text-[10px] ' + (mine ? 'bg-white/15' : 'bg-white dark:bg-slate-700')}><Paperclip className="h-3 w-3 shrink-0" /><span className="truncate">{item.attachment_name || 'Attachment'}</span></button>}
                    <span className={'mt-1 flex items-center justify-end gap-1 text-[9px] ' + (mine ? 'text-blue-100' : 'text-slate-400')}>{new Date(item.created_at).toLocaleTimeString('en-NP', { hour: 'numeric', minute: '2-digit' })}{mine && item.read_at && <CheckCheck className="h-3 w-3" />}</span>
                  </div>
                </div>;
              })}
              <div ref={messageEndRef} />
            </div>
            <form onSubmit={sendMessage} className="border-t border-slate-200 p-2.5 dark:border-slate-700">
              {messageFile && <div className="mb-2 flex items-center gap-2 rounded-lg bg-slate-100 px-2 py-1.5 text-[10px] dark:bg-slate-800"><Paperclip className="h-3 w-3" /><span className="min-w-0 flex-1 truncate">{messageFile.name}</span><button type="button" onClick={() => setMessageFile(null)}><X className="h-3.5 w-3.5" /></button></div>}
              <div className="flex items-end gap-2">
                {selectedConversation.source === 'student' && <label className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" title="Attach a file"><Paperclip className="h-5 w-5" /><input type="file" className="sr-only" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={(event) => setMessageFile(event.target.files?.[0] || null)} /></label>}
                <textarea required maxLength={5000} rows={1} value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder="Write a message..." className="min-h-10 max-h-28 min-w-0 flex-1 resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                <button disabled={sending || !messageText.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white disabled:opacity-50" aria-label="Send message">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button>
              </div>
            </form>
          </section>}

          {tab === 'scheduled' && <div className="space-y-3 pb-6">
            <div><h2 className="text-base font-bold">Scheduled</h2><p className="text-[11px] text-slate-500 dark:text-slate-400">Notices you created that are waiting to publish.</p></div>
            <div className="space-y-2">
              {scheduledNotices.map((item) => <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-start gap-2"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300"><CalendarClock className="h-4 w-4" /></span><button type="button" onClick={() => setViewNotice(item)} className="min-w-0 flex-1 text-left"><strong className="block truncate text-xs">{item.title}</strong><span className="mt-0.5 block truncate text-[10px] text-slate-500 dark:text-slate-400">{item.target_class}{item.target_section ? ' ' + item.target_section : ''} · {fullDate(item.scheduled_at)}</span></button><span className="rounded-full bg-violet-50 px-2 py-1 text-[9px] font-semibold text-violet-700 dark:bg-violet-400/15 dark:text-violet-300">Scheduled</span></div>
                <div className="mt-2 flex justify-end gap-2 border-t border-slate-100 pt-2 dark:border-slate-800"><button type="button" onClick={() => void cancelSchedule(item)} className="rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-rose-600">Cancel schedule</button><button type="button" onClick={() => openComposer(item)} className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-400/15 dark:text-blue-300">Reschedule</button></div>
              </div>)}
              {!scheduledNotices.length && <Empty title="Nothing scheduled" detail="Notices scheduled for your assigned classes will appear here." />}
            </div>
            {ownNotices.some((item) => item.status === 'published') && <section><h3 className="mb-2 text-sm font-bold">Recently published</h3><div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">{ownNotices.filter((item) => item.status === 'published').slice(0, 5).map((item) => <NoticeRow key={item.id} item={item} onClick={() => setViewNotice(item)} />)}</div></section>}
          </div>}
        </div>
      </main>
    </div>

    {composerOpen && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingNotice) setComposerOpen(false); }}>
      <div role="dialog" aria-modal="true" aria-label={editingNotice ? 'Edit notice' : 'Create notice'} className="max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-slate-900 sm:rounded-2xl">
        <div className="flex items-center justify-between"><div><h2 className="text-base font-bold">{editingNotice ? 'Edit Notice' : 'Create Notice'}</h2><p className="text-[10px] text-slate-500 dark:text-slate-400">Only your assigned classes are available.</p></div><button type="button" onClick={() => setComposerOpen(false)} aria-label="Close"><X className="h-5 w-5" /></button></div>
        <form onSubmit={saveNotice} className="mt-4 space-y-3 text-xs">
          <label className="block font-semibold">Title *<input required maxLength={180} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
          <label className="block font-semibold">Class *<select required value={form.classId} onChange={(event) => setForm({ ...form, classId: event.target.value })} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="">Select an assigned class</option>{classes.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label className="block font-semibold">Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-white"><option value="normal">General</option><option value="high">Important</option><option value="urgent">Urgent</option></select></label>
          <label className="block font-semibold">Message *<textarea required rows={5} maxLength={5000} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 leading-5 text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>
          <label className="block font-semibold">Attachment (optional)<span className="mt-1 flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"><Paperclip className="h-4 w-4" /><span className="min-w-0 flex-1 truncate">{form.file?.name || editingNotice?.attachment_name || 'PDF, DOC, DOCX, JPG, PNG or WebP · max 10 MB'}</span></span><input type="file" className="sr-only" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={(event) => setForm({ ...form, file: event.target.files?.[0] || null })} /></label>
          <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700"><span><strong className="block">Schedule for later</strong><span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">Publish automatically at the chosen time.</span></span><input type="checkbox" checked={form.schedule} onChange={(event) => setForm({ ...form, schedule: event.target.checked })} className="h-5 w-5" /></label>
          {form.schedule && <label className="block font-semibold">Date and time *<input type="datetime-local" required value={form.scheduledAt} onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })} className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-white" /></label>}
          {notice && <p role="alert" className="text-rose-600">{notice}</p>}
          <div className="flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-700"><button type="button" onClick={() => setComposerOpen(false)} className="h-11 flex-1 rounded-xl bg-slate-100 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">Cancel</button><button disabled={savingNotice} className="h-11 flex-1 rounded-xl bg-blue-600 font-semibold text-white disabled:opacity-50">{savingNotice ? 'Saving…' : form.schedule ? 'Schedule Notice' : 'Post Notice'}</button></div>
        </form>
      </div>
    </div>}

    {viewNotice && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setViewNotice(null); }}>
      <div role="dialog" aria-modal="true" aria-label="Notice details" className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-slate-900 sm:rounded-2xl">
        <div className="flex items-start justify-between gap-2"><div><h2 className="text-base font-bold">{viewNotice.title}</h2><p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{viewNotice.target_class || (viewNotice.target_audience === 'teachers' ? 'Teachers' : 'School')} · {viewNotice.status === 'scheduled' ? fullDate(viewNotice.scheduled_at) : fullDate(viewNotice.published_at || viewNotice.created_at)}</p></div><button type="button" onClick={() => setViewNotice(null)}><X className="h-5 w-5" /></button></div>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{viewNotice.content}</p>
        {viewNotice.attachment_path && <button type="button" onClick={() => void openAttachment(viewNotice.attachment_path)} className="mt-4 flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-left text-xs dark:border-slate-700 dark:bg-slate-800"><FileText className="h-5 w-5 text-blue-600" /><span className="min-w-0 flex-1 truncate font-semibold">{viewNotice.attachment_name || 'Attachment'}</span><ChevronRight className="h-4 w-4 text-slate-400" /></button>}
        {viewNotice.created_by === userId && <button type="button" onClick={() => { setViewNotice(null); openComposer(viewNotice); }} className="mt-4 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 dark:bg-blue-400/15 dark:text-blue-300">Edit notice</button>}
      </div>
    </div>}

    {newMessageOpen && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/55 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setNewMessageOpen(false); }}>
      <div role="dialog" aria-modal="true" aria-label="New student conversation" className="max-h-[88dvh] w-full max-w-lg overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700"><div><h2 className="text-base font-bold">New Message</h2><p className="text-[10px] text-slate-500 dark:text-slate-400">Authenticated students in your assigned classes only.</p></div><button type="button" onClick={() => setNewMessageOpen(false)}><X className="h-5 w-5" /></button></div>
        <div className="max-h-[70dvh] divide-y divide-slate-100 overflow-y-auto p-2 dark:divide-slate-800">
          {students.map((student) => <button key={student.id + student.classId} type="button" onClick={() => void startStudentConversation(student)} className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800"><Avatar name={student.name} /><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{student.name}</strong><span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">{student.className}{student.section ? ' ' + student.section : ''}</span></span><ChevronRight className="h-4 w-4 text-slate-400" /></button>)}
          {!students.length && <Empty title="No available students" detail="Students need portal accounts and must belong to one of your assigned classes." />}
        </div>
      </div>
    </div>}
  </div>;
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-900"><Search className="h-4 w-4 shrink-0 text-slate-400" /><input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400 dark:text-white" /></label>;
}
function FilterBar({ items, value, onChange }: { items: string[]; value: string; onChange: (value: string) => void }) {
  return <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">{items.map((item) => <button key={item} type="button" onClick={() => onChange(item)} className={'shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold ' + (value === item ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300')}>{item}</button>)}</div>;
}
function Avatar({ name }: { name: string }) {
  return <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-sm font-bold text-blue-700 dark:from-blue-900 dark:to-indigo-900 dark:text-blue-200">{name.trim().charAt(0).toUpperCase() || <CircleUserRound className="h-5 w-5" />}</span>;
}
function ConversationRow({ item, onClick }: { item: Conversation; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"><Avatar name={item.name} /><span className="min-w-0 flex-1"><span className="flex items-center gap-2"><strong className="min-w-0 flex-1 truncate text-xs">{item.name}</strong><span className="shrink-0 text-[9px] text-slate-400">{formatWhen(item.latestAt)}</span></span><span className="mt-0.5 flex items-center gap-2"><span className="min-w-0 flex-1 truncate text-[10px] text-slate-500 dark:text-slate-400">{item.latest}</span>{item.unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">{item.unread}</span>}</span></span></button>;
}
function NoticeRow({ item, onClick }: { item: NoticeRow; onClick: () => void }) {
  const important = ['high', 'urgent', 'important'].includes((item.priority || '').toLowerCase());
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"><span className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ' + (important ? 'bg-rose-50 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300' : 'bg-blue-50 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300')}><Bell className="h-4 w-4" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-xs">{item.title}</strong><span className="mt-0.5 block truncate text-[10px] text-slate-500 dark:text-slate-400">{item.target_class || (item.target_audience === 'teachers' ? 'Teachers' : 'School')} · {formatWhen(item.published_at || item.created_at)}</span></span>{important && <span className="rounded-full bg-rose-50 px-1.5 py-1 text-[9px] font-semibold text-rose-700 dark:bg-rose-400/15 dark:text-rose-300">Important</span>}<ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" /></button>;
}
function NoticeCard({ item, mine, onView, onEdit }: { item: NoticeRow; mine: boolean; onView: () => void; onEdit: () => void }) {
  const important = ['high', 'urgent', 'important'].includes((item.priority || '').toLowerCase());
  return <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"><button type="button" onClick={onView} className="flex w-full items-start gap-2 text-left"><span className={'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ' + (important ? 'bg-rose-50 text-rose-600 dark:bg-rose-400/15 dark:text-rose-300' : 'bg-blue-50 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300')}><Bell className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="flex items-start gap-2"><strong className="min-w-0 flex-1 text-xs">{item.title}</strong><span className={'shrink-0 rounded-full px-1.5 py-1 text-[9px] font-semibold ' + (important ? 'bg-rose-50 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300')}>{important ? 'Important' : 'General'}</span></span><span className="mt-1 block line-clamp-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{item.content}</span><span className="mt-2 flex flex-wrap items-center gap-2 text-[9px] text-slate-500 dark:text-slate-400"><span>{item.target_class || (item.target_audience === 'teachers' ? 'Teachers' : 'School')}</span><span>{fullDate(item.status === 'scheduled' ? item.scheduled_at : item.published_at || item.created_at)}</span>{item.attachment_path && <span className="inline-flex items-center gap-1"><Paperclip className="h-3 w-3" />File</span>}<span className="capitalize">{item.status}</span></span></span></button>{mine && <div className="mt-2 flex justify-end border-t border-slate-100 pt-2 dark:border-slate-800"><button type="button" onClick={onEdit} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">Edit</button></div>}</div>;
}
function Empty({ title, detail, compact = false }: { title: string; detail: string; compact?: boolean }) {
  return <div className={'text-center ' + (compact ? 'p-5' : 'rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900')}><MessageSquare className="mx-auto h-6 w-6 text-slate-300 dark:text-slate-600" /><h3 className="mt-2 text-xs font-bold">{title}</h3><p className="mx-auto mt-1 max-w-xs text-[10px] leading-4 text-slate-500 dark:text-slate-400">{detail}</p></div>;
}
function PageSkeleton() {
  return <div className="min-h-screen bg-white dark:bg-slate-950"><Sidebar /><div className="pt-10 lg:ml-64"><TopBar /><main className="px-3.5 pb-28 pt-7 sm:px-6 lg:pt-24"><div className="mx-auto max-w-[1500px] animate-pulse"><div className="h-24 rounded-xl bg-blue-50 dark:bg-slate-900" /><div className="mt-2 h-9 border-b border-slate-200 dark:border-slate-700" /><div className="mt-3 grid grid-cols-4 gap-1.5">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-20 rounded-xl bg-slate-100 dark:bg-slate-900" />)}</div><div className="mt-5 space-y-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-900" />)}</div></div></main></div></div>;
}
