// frontend/src/pages/admin/AdminFiles.jsx - FIXED VERSION
import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { Plus, Edit, Trash2, Download, Star } from 'lucide-react';

export default function AdminFiles() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    format: 'PDF',
    level: '1',
    published: false,
    featured: false
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      // FIXED: Use admin endpoint to get ALL files (published and unpublished)
      const response = await apiClient.get('/admin/files/all');
      console.log('Fetched files:', response.data);
      setFiles(response.data.files || []);
    } catch (error) {
      console.error('Failed to fetch files:', error);
      // Fallback to public endpoint if admin endpoint not available
      try {
        const response = await apiClient.get('/files');
        setFiles(response.data.files || []);
      } catch (fallbackError) {
        alert('파일 목록을 불러오는데 실패했습니다');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingFile && !selectedFile) {
      alert('파일을 선택해주세요');
      return;
    }

    setSubmitting(true);

    try {
      // Create FormData for file upload
      const data = new FormData();
      
      // Add all form fields
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('format', formData.format);
      data.append('level', formData.level);
      data.append('published', formData.published);
      data.append('featured', formData.featured);
      
      // Add files
      if (selectedFile) {
        data.append('file', selectedFile);
      }
      if (previewImage) {
        data.append('preview', previewImage);
      }

      if (editingFile) {
        await apiClient.put(`/files/${editingFile.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('파일이 수정되었습니다!');
      } else {
        await apiClient.post('/files', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('파일이 업로드되었습니다!');
      }

      setShowModal(false);
      setEditingFile(null);
      resetForm();
      fetchFiles();
    } catch (error) {
      console.error('Submit error:', error);
      alert(error.response?.data?.error || '저장에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (file) => {
    setEditingFile(file);
    setFormData({
      title: file.title,
      description: file.description,
      format: file.format,
      level: file.level.toString(),
      published: file.published,
      featured: file.featured
    });
    setSelectedFile(null);
    setPreviewImage(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await apiClient.delete(`/files/${id}`);
      alert('파일이 삭제되었습니다!');
      fetchFiles();
    } catch (error) {
      alert('삭제에 실패했습니다');
    }
  };

  const togglePublished = async (file) => {
    try {
      const data = new FormData();
      data.append('published', !file.published);
      
      await apiClient.put(`/files/${file.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchFiles();
    } catch (error) {
      alert('상태 변경에 실패했습니다');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      format: 'PDF',
      level: '1',
      published: false,
      featured: false
    });
    setSelectedFile(null);
    setPreviewImage(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handlePreviewChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImage(file);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">자료 관리</h1>
          <button
            onClick={() => {
              setEditingFile(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            새 자료 업로드
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          </div>
        ) : files.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">등록된 자료가 없습니다</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    형식
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    크기
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    레벨
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    다운로드
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {files.map((file) => (
                  <tr key={file.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {file.featured && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                        <span className="font-medium">{file.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {file.format}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {formatFileSize(file.fileSize)}
                    </td>
                    <td className="px-6 py-4">
                      {file.level === 1 ? '초급' : file.level === 2 ? '중급' : '고급'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePublished(file)}
                        className={`px-2 py-1 text-xs rounded ${
                          file.published 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {file.published ? '게시됨' : '비공개'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {file.downloads}회
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <a
                          href={file.downloadUrl}
                          className="text-green-600 hover:text-green-800"
                          download
                        >
                          <Download className="h-5 w-5" />
                        </a>
                        <button
                          onClick={() => handleEdit(file)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(file.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full my-8">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">
                {editingFile ? '자료 수정' : '새 자료 업로드'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editingFile && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    파일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required={!editingFile}
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-1">
                      선택됨: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  미리보기 이미지 (선택)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePreviewChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
                {previewImage && (
                  <p className="text-sm text-gray-600 mt-1">선택됨: {previewImage.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  설명 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  rows="4"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">형식</label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="PDF">PDF</option>
                    <option value="ZIP">ZIP</option>
                    <option value="ZIP (MP3 + PDF)">ZIP (MP3 + PDF)</option>
                    <option value="DOCX">DOCX</option>
                    <option value="PPTX">PPTX</option>
                    <option value="XLSX">XLSX</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">레벨</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="1">초급</option>
                    <option value="2">중급</option>
                    <option value="3">고급</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">게시</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">추천 자료</span>
                </label>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingFile(null);
                    resetForm();
                  }}
                  className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={submitting}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? '저장 중...' : editingFile ? '수정' : '업로드'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}