'use client';

import { useState, useMemo } from 'react';
import { 
  Upload, Search, Filter, FileText, FileSpreadsheet, FileImage, 
  Eye, Download, Trash2, X, FolderOpen, File
} from 'lucide-react';
import Sidebar from '@/components/sidebar';
import TopBar from '@/components/TopBar';

// --- Mock Data ---
const mockDocuments = [
  { id: 1, name: 'school policy2083.pdf', type: 'PDF', category: 'Policies', uploadedBy: 'Admin Principal', date: '2023-10-24', size: '2.4 MB' },
  { id: 2, name: 'admission form template.docx', type: 'DOCX', category: 'Student Documents', uploadedBy: 'Admin Principal', date: '2023-10-20', size: '156 KB' },
  { id: 3, name: 'fee structure2083.xlsx', type: 'XLSX', category: 'Reports', uploadedBy: 'Accountant', date: '2023-10-15', size: '89 KB' },
  { id: 4, name: 'character certificate sample.pdf', type: 'PDF', category: 'School Certificates', uploadedBy: 'Admin Principal', date: '2023-10-10', size: '1.1 MB' },
  { id: 5, name: 'school logo.png', type: 'PNG', category: 'Official Documents', uploadedBy: 'Web Admin', date: '2023-09-01', size: '450 KB' },
];

const categories = [
  'All Categories', 
  'Student Documents', 
  'Teacher Documents', 
  'School Certificates', 
  'Official Documents', 
  'Reports', 
  'Policies'
];

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Filter Logic
  const filteredDocuments = useMemo(() => {
    return mockDocuments.filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'All Categories' || doc.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, categoryFilter]);

  // Helper to get file icon and color
  const getFileIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PDF': return { icon: FileText, color: 'text-red-600 bg-red-50 border-red-100' };
      case 'DOCX': return { icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-100' };
      case 'XLSX': return { icon: FileSpreadsheet, color: 'text-green-600 bg-green-50 border-green-100' };
      case 'PNG': 
      case 'JPG': 
      case 'JPEG': return { icon: FileImage, color: 'text-purple-600 bg-purple-50 border-purple-100' };
      default: return { icon: File, color: 'text-gray-600 bg-gray-50 border-gray-100' };
    }
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
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Documents</h1>
              <p className="mt-1.5 text-sm text-gray-500">Manage school policies, certificates, and official files.</p>
            </div>
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Upload className="h-4 w-4" /> Upload Document
            </button>
          </div>

          {/* Toolbar: Search & Filter */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search files by name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
              />
            </div>
            <div className="relative w-full sm:w-56">
              <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-8 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          {/* Documents Table */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {filteredDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
                  <FolderOpen className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No documents found</h3>
                <p className="mt-1 text-sm text-gray-500">Try adjusting your search or category filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-medium text-gray-500">File Name</th>
                      <th className="px-6 py-4 font-medium text-gray-500 hidden md:table-cell">Category</th>
                      <th className="px-6 py-4 font-medium text-gray-500 hidden lg:table-cell">Uploaded By</th>
                      <th className="px-6 py-4 font-medium text-gray-500 hidden lg:table-cell">Date</th>
                      <th className="px-6 py-4 font-medium text-gray-500">Size</th>
                      <th className="px-6 py-4 font-medium text-gray-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredDocuments.map((doc) => {
                      const { icon: Icon, color } = getFileIcon(doc.type);
                      return (
                        <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                          {/* File Name & Icon */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${color}`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-none">{doc.name}</p>
                                <p className="text-xs text-gray-500 md:hidden">{doc.category}</p>
                              </div>
                            </div>
                          </td>
                          
                          {/* Category */}
                          <td className="px-6 py-4 hidden md:table-cell">
                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                              {doc.category}
                            </span>
                          </td>

                          {/* Uploaded By */}
                          <td className="px-6 py-4 hidden lg:table-cell text-gray-600">
                            {doc.uploadedBy}
                          </td>

                          {/* Date */}
                          <td className="px-6 py-4 hidden lg:table-cell text-gray-500">
                            {doc.date}
                          </td>

                          {/* Size */}
                          <td className="px-6 py-4 font-medium text-gray-700">
                            {doc.size}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => alert(`Previewing ${doc.name}...`)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                              >
                                <Eye className="h-3.5 w-3.5" /> Preview
                              </button>
                              <button 
                                onClick={() => alert(`Downloading ${doc.name}...`)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 border border-blue-100 transition-colors"
                              >
                                <Download className="h-3.5 w-3.5" /> Download
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ✅ Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsUploadModalOpen(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Upload Document</h2>
                <p className="text-blue-100 text-sm mt-1">Add a new file to the school repository.</p>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="rounded-full bg-white/20 p-2 hover:bg-white/30">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              
              {/* Drag & Drop Area */}
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-colors">
                <Upload className="h-10 w-10 text-gray-400 mb-3" />
                <p className="text-sm font-semibold text-gray-900">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">PDF, DOCX, XLSX, PNG up to 10MB</p>
              </div>

              {/* File Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">File Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., Annual Report 2081" 
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
                  {categories.filter(c => c !== 'All Categories').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-100 p-4 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setIsUploadModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200">Cancel</button>
              <button 
                onClick={() => { alert('Document uploaded successfully!'); setIsUploadModalOpen(false); }}
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Upload File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}