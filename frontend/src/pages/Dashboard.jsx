import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PreviewImage from '../components/PreviewImage';
import { BookOpen, FileText, Star, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      const response = await apiClient.get('/courses/my/courses');
      setMyCourses(response.data.courses);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          안녕하세요, {user?.name}님!
        </h1>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">내 강의</p>
                <p className="text-2xl font-bold">{myCourses.length}</p>
              </div>
              <BookOpen className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">완료한 강의</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <Star className="h-10 w-10 text-yellow-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">학습 시간</p>
                <p className="text-2xl font-bold">0h</p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">다운로드</p>
                <p className="text-2xl font-bold">0</p>
              </div>
              <FileText className="h-10 w-10 text-purple-600" />
            </div>
          </div>
        </div>

        {/* My Courses */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">내 강의</h2>
            <Link to="/courses" className="text-blue-600 hover:underline">
              새 강의 찾기 →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : myCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">아직 등록한 강의가 없습니다</p>
              <Link
                to="/courses"
                className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                강의 둘러보기
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCourses.map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="border rounded-lg overflow-hidden hover:shadow-lg transition"
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
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {course.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">진행률</span>
                      <span className="font-semibold text-blue-600">0%</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}