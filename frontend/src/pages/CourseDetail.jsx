import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Star, Clock, BookOpen, Users, CheckCircle } from 'lucide-react';

export default function CourseDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const response = await apiClient.get(`/courses/${id}`);
      setCourse(response.data.course);
    } catch (error) {
      console.error('Failed to fetch course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setEnrolling(true);
    try {
      if (course.type === 'free') {
        await apiClient.post(`/courses/${id}/enroll`);
        alert('무료 강의에 등록되었습니다!');
      } else {
        await apiClient.post(`/courses/${id}/purchase`, {
          paymentMethod: '신용카드'
        });
        alert('강의를 구매했습니다!');
      }
      fetchCourse();
    } catch (error) {
      alert(error.response?.data?.error || '등록에 실패했습니다');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>강의를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex gap-2 mb-4">
                {course.type === 'free' ? (
                  <span className="px-3 py-1 bg-green-500 rounded text-sm">무료</span>
                ) : (
                  <span className="px-3 py-1 bg-yellow-500 rounded text-sm">유료</span>
                )}
                <span className="px-3 py-1 bg-white/20 rounded text-sm">
                  {course.level === 1 ? '초급' : course.level === 2 ? '중급' : '고급'}
                </span>
              </div>
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl opacity-90 mb-6">{course.description}</p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-current" />
                  <span>{course.averageRating.toFixed(1)} ({course.reviews.length}개 리뷰)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>{course.enrollments}명 수강</span>
                </div>
              </div>
            </div>

            <div className="bg-white text-gray-900 rounded-lg p-6 shadow-xl">
              {course.previewImage && (
                <img
                  src={`/api/files/preview/${course.previewImage}`}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded mb-4"
                />
              )}
              {course.type === 'paid' && (
                <div className="mb-4">
                  {course.discountPrice ? (
                    <>
                      <span className="text-3xl font-bold text-blue-600">
                        ₩{course.discountPrice.toLocaleString()}
                      </span>
                      <span className="text-lg text-gray-400 line-through ml-2">
                        ₩{course.price.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <span className="text-3xl font-bold text-blue-600">
                      ₩{course.price.toLocaleString()}
                    </span>
                  )}
                </div>
              )}
              {course.hasPurchased ? (
                <button className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  등록 완료
                </button>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {enrolling
                    ? '처리 중...'
                    : course.type === 'free'
                    ? '무료 등록'
                    : '지금 구매하기'}
                </button>
              )}
              {course.duration && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>수강 기간: {course.duration}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">강의 소개</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{course.description}</p>
            </div>

            {course.lessons && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-4">커리큘럼</h2>
                <div className="space-y-2">
                  {course.lessons.map((lesson, index) => (
                    <div
                      key={index}
                      className="border rounded p-4 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold">{lesson.title}</span>
                      </div>
                      {lesson.description && (
                        <p className="text-sm text-gray-600 mt-2 ml-7">
                          {lesson.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="text-xl font-bold mb-4">강의 정보</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">레벨</span>
                  <span className="font-semibold">
                    {course.level === 1 ? '초급' : course.level === 2 ? '중급' : '고급'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">타입</span>
                  <span className="font-semibold">
                    {course.type === 'free' ? '무료' : '유료'}
                  </span>
                </div>
                {course.duration && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">기간</span>
                    <span className="font-semibold">{course.duration}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">수강생</span>
                  <span className="font-semibold">{course.enrollments}명</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">평점</span>
                  <span className="font-semibold">
                    ⭐ {course.averageRating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}