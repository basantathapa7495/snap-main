'use client';

import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';
import DocumentLibrary from '@/components/documents/DocumentLibrary';

export default function TeacherDocumentsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-h-screen flex-col pt-10 lg:ml-64">
        <TopBar />
        <main className="flex-1 px-4 pb-24 pt-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <DocumentLibrary
              audience="teachers"
              title="Shared documents"
              description="Current files shared with all teachers or directly with you."
            />
          </div>
        </main>
      </div>
    </div>
  );
}
