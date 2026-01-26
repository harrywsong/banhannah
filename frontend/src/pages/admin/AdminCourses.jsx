// frontend/src/pages/admin/AdminCourses.jsx - WITH CONTENT EDITOR
import { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';

import CourseEditor from '../../components/CourseEditor';
import { Plus, Edit, Trash2, Star, BookOpen } from 'lucide-react';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' or 'content'

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'free',
    price: '',
    discountPrice: '',
    level: '1',
    duration: '',
    accessDuration: '30',
    published: false,
    featured: false,
    lessons: []
  });
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await apiClient.get('/admin/courses/all');
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      try {
        const response = await apiClient.get('/courses');
        setCourses(response.data.courses || []);
      } catch (fallbackError) {
        alert('강의 목록을 불러오는데 실패했습니다');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = new FormData();

      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('type', formData.type);
      data.append('level', formData.level);
      data.append('duration', formData.duration);
      data.append('accessDuration', formData.accessDuration);
      data.append('published', formData.published);
      data.append('featured', formData.featured);

      // Add lessons as JSON
      data.append('lessons', JSON.stringify(formData.lessons));

      if (formData.type === 'paid') {
        data.append('price', formData.price);
        if (formData.discountPrice) {
          data.append('discountPrice', formData.discountPrice);
        }
      }

      if (previewImage) {
        data.append('previewImage', previewImage);
      }

      if (editingCourse) {
        await apiClient.put(`/courses/${editingCourse.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('강의가 수정되었습니다!');
      } else {
        await apiClient.post('/courses', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        alert('강의가 생성되었습니다!');
      }

      setShowModal(false);
      setEditingCourse(null);
      resetForm();
      fetchCourses();
    } catch (error) {
      console.error('Submit error:', error);
      alert(error.response?.data?.error || '저장에 실패했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      type: course.type,
      price: course.price || '',
      discountPrice: course.discountPrice || '',
      level: course.level.toString(),
      duration: course.duration || '',
      accessDuration: course.accessDuration.toString(),
      published: course.published,
      featured: course.featured,
      lessons: course.lessons || []
    });
    setPreviewImage(null);
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      await apiClient.delete(`/courses/${id}`);
      alert('강의가 삭제되었습니다!');
      fetchCourses();
    } catch (error) {
      alert('삭제에 실패했습니다');
    }
  };

  const togglePublished = async (course) => {
    try {
      const data = new FormData();
      data.append('published', !course.published);

      await apiClient.put(`/courses/${course.id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchCourses();
    } catch (error) {
      alert('상태 변경에 실패했습니다');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'free',
      price: '',
      discountPrice: '',
      level: '1',
      duration: '',
      accessDuration: '30',
      published: false,
      featured: false,
      lessons: []
    });
    setPreviewImage(null);
    setActiveTab('basic');
  };

  return (
    <div className="min-h-screen bg-gray-50">


      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">강의 관리</h1>
            <p className="text-gray-600 mt-1">총 {courses.length}개의 강의</p>
          </div>
          <button
            onClick={() => {
              setEditingCourse(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            새 강의 만들기
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">등록된 강의가 없습니다</p>
            <button
              onClick={() => {
                setEditingCourse(null);
                resetForm();
                setShowModal(true);
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              첫 강의 만들기
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">강의명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">타입</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">가격</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">레슨</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">수강생</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {course.featured && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                        <span className="font-medium">{course.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded ${course.type === 'free' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                        {course.type === 'free' ? '무료' : '유료'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {course.type === 'paid' ? (
                        <span className="font-semibold">${(course.discountPrice || course.price)?.toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{course.lessons?.length || 0}개</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePublished(course)}
                        className={`px-2 py-1 text-xs rounded ${course.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {course.published ? '게시됨' : '비공개'}
                      </button>
                    </td>
                    <td className="px-6 py-4">{course.enrollments || 0}명</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(course)}
                          className="text-blue-600 hover:text-blue-800"
                          title="수정"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="text-red-600 hover:text-red-800"
                          title="삭제"
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
          <div className="bg-white rounded-lg max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold">
                {editingCourse ? '강의 수정' : '새 강의 만들기'}
              </h2>
              <div className="flex gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('basic')}
                  className={`pb-2 px-4 font-medium border-b-2 ${activeTab === 'basic' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
                    }`}
                >
                  기본 정보
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('content')}
                  className={`pb-2 px-4 font-medium border-b-2 ${activeTab === 'content' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
                    }`}
                >
                  강의 콘텐츠
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {activeTab === 'basic' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      강의명 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows="4"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">타입</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="free">무료</option>
                        <option value="paid">유료</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">레벨</label>
                      <select
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="1">초급</option>
                        <option value="2">중급</option>
                        <option value="3">고급</option>
                      </select>
                    </div>
                  </div>

                  {formData.type === 'paid' && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          가격 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          required={formData.type === 'paid'}
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">할인가 (선택)</label>
                        <input
                          type="number"
                          value={formData.discountPrice}
                          onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">강의 기간</label>
                      <input
                        type="text"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="예: 4주"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        수강 기한 (일)
                        {formData.type === 'free' && (
                          <span className="text-green-600 text-xs ml-2">(무료 강의는 무제한)</span>
                        )}
                      </label>
                      {formData.type === 'free' ? (
                        <input
                          type="text"
                          value="무제한"
                          disabled
                          className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-600"
                        />
                      ) : (
                        <input
                          type="number"
                          value={formData.accessDuration}
                          onChange={(e) => setFormData({ ...formData, accessDuration: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          min="1"
                          placeholder="예: 90"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">미리보기 이미지</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPreviewImage(e.target.files[0])}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {previewImage && (
                      <p className="text-sm text-gray-600 mt-1">선택됨: {previewImage.name}</p>
                    )}
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
                      <span className="text-sm">추천 강의</span>
                    </label>
                  </div>
                </div>
              ) : (
                <CourseEditor
                  lessons={formData.lessons}
                  onChange={(lessons) => setFormData({ ...formData, lessons })}
                />
              )}

              <div className="flex justify-end gap-4 pt-6 mt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCourse(null);
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
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? '저장 중...' : editingCourse ? '수정' : '생성'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </div>
  );
}