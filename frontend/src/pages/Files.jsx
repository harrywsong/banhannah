// src/pages/Files.jsx - FIXED (Auth required via App.jsx)
import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Download, FileText, Search, Star } from 'lucide-react';

export default function Files() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  useEffect(() => {
    fetchFiles();
  }, [formatFilter, levelFilter]);

  const fetchFiles = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (formatFilter) params.append('format', formatFilter);
      if (levelFilter) params.append('level', levelFilter);

      const response = await apiClient.get(`/files?${params}`);
      setFiles(response.data.files);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFiles();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">학습 자료</h1>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="자료 검색..."
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">모든 형식</option>
              <option value="PDF">PDF</option>
              <option value="ZIP">ZIP</option>
              <option value="DOCX">DOCX</option>
              <option value="PPTX">PPTX</option>
            </select>

            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">모든 레벨</option>
              <option value="1">초급</option>
              <option value="2">중급</option>
              <option value="3">고급</option>
            </select>

            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              검색
            </button>
          </form>
        </div>

        {/* Files Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">검색 결과가 없습니다</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition"
              >
                {file.previewUrl ? (
                  <img
                    src={file.previewUrl}
                    alt={file.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                    <FileText className="h-16 w-16 text-white" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {file.format}
                    </span>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                      {file.level === 1 ? '초급' : file.level === 2 ? '중급' : '고급'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(file.fileSize / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{file.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {file.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-semibold">
                        {file.averageRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({file.reviewCount})
                      </span>
                    </div>
                    <a
                      href={file.downloadUrl}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                      download
                    >
                      <Download className="h-4 w-4" />
                      다운로드
                    </a>
                  </div>
                  <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                    {file.downloads}회 다운로드
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}