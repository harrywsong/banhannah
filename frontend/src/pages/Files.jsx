import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import FileViewer from '../components/FileViewer';
import PreviewImage from '../components/PreviewImage';
import { Download, FileText, Search, Star, Eye } from 'lucide-react';

export default function Files() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [viewingFile, setViewingFile] = useState(null);

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

  const handleView = (file) => {
    setViewingFile(file);
  };

  const handleDownload = async (file) => {
    try {
      await apiClient.get(`/files/download/${file.filename}`);
      window.location.href = file.downloadUrl;
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm">
              <FileText className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">학습 자료</h1>
            <p className="text-xl opacity-90 font-light leading-relaxed">
              다양한 학습 자료를 다운로드하고 활용하세요
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Search and Filters */}
            <div className="card p-6 mb-8 hover:shadow-xl transition-shadow duration-300">
              <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="자료 검색..."
                    />
                  </div>
                </div>

                <select
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value)}
                  className="px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-colors"
                >
                  <option value="">모든 형식</option>
                  <option value="PDF">PDF</option>
                  <option value="ZIP">ZIP</option>
                  <option value="DOCX">DOCX</option>
                </select>

                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-colors"
                >
                  <option value="">모든 레벨</option>
                  <option value="1">초급</option>
                  <option value="2">중급</option>
                  <option value="3">고급</option>
                </select>

                <button
                  type="submit"
                  className="btn btn-primary rounded-full px-8 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300"
                >
                  검색
                </button>
              </form>
            </div>

            {/* Files Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : files.length === 0 ? (
              <div className="card p-12 text-center">
                <FileText className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-500">검색 결과가 없습니다</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="card overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <PreviewImage
                      previewImage={file.previewImage}
                      alt={file.title}
                      className="w-full h-48 object-cover"
                      fallbackContent={
                        <div className="w-full h-48 bg-gradient-to-br from-accent-200 to-accent-400 flex items-center justify-center">
                          <FileText className="h-16 w-16 text-accent-700" />
                        </div>
                      }
                    />
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="badge badge-primary">{file.format}</span>
                        <span className="badge badge-secondary">
                          {file.level === 1 ? '초급' : file.level === 2 ? '중급' : '고급'}
                        </span>
                        {file.featured && <Star className="h-4 w-4 text-accent-400 fill-current" />}
                      </div>
                      <h3 className="text-xl font-semibold text-neutral-900 mb-2">{file.title}</h3>
                      <p className="text-neutral-600 text-sm line-clamp-2 mb-4">
                        {file.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-neutral-500">
                          <Download className="h-4 w-4" />
                          <span>{file.downloads || 0}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleView(file)}
                            className="btn btn-sm btn-outline rounded-full"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            미리보기
                          </button>
                          <button
                            onClick={() => handleDownload(file)}
                            className="btn btn-sm btn-primary rounded-full"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            다운로드
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* File Viewer Modal */}
      {viewingFile && (
        <FileViewer
          file={viewingFile}
          onClose={() => setViewingFile(null)}
        />
      )}
    </div>
  );
}