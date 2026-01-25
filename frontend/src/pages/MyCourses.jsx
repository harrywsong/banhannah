// src/pages/MyCourses.jsx - FIXED VERSION
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PreviewImage from '../components/PreviewImage';
import { BookOpen, PlayCircle } from 'lucide-react';

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      const response = await apiClient.get('/courses/my/courses');
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">내 강의</h1>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">등록한 강의가 없습니다</h2>
            <p className="text-gray-600 mb-6">새로운 강의를 시작해보세요</p>
            <Link
              to="/courses"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              강의 둘러보기
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
              >
                <PreviewImage
                  previewImage={course.previewImage}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                  fallbackContent={
                    <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      미리보기 없음
                    </div>
                  }
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">진행률</span>
                    <span className="text-sm font-semibold text-blue-600">0%</span>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                      <PlayCircle className="h-5 w-5" />
                      학습 계속하기
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}