import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { 
  BookOpen, 
  FileText, 
  Users, 
  DollarSign,
  TrendingUp,
  Eye,
  Download
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalFiles: 0,
    totalUsers: 0,
    totalRevenue: 0,
    recentCourses: [],
    recentFiles: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [coursesRes, filesRes] = await Promise.all([
        apiClient.get('/courses'),
        apiClient.get('/files')
      ]);

      const courses = coursesRes.data.courses;
      const files = filesRes.data.files;

      setStats({
        totalCourses: courses.length,
        totalFiles: files.length,
        totalUsers: 0, // Would need a separate endpoint
        totalRevenue: 0, // Would need a separate endpoint
        recentCourses: courses.slice(0, 5),
        recentFiles: files.slice(0, 5)
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
          <div className="flex gap-4">
            <Link
              to="/admin/courses"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              강의 관리
            </Link>
            <Link
              to="/admin/files"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              자료 관리
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">총 강의</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCourses}</p>
              </div>
              <BookOpen className="h-12 w-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">총 자료</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalFiles}</p>
              </div>
              <FileText className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">총 사용자</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
              <Users className="h-12 w-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">총 수익</p>
                <p className="text-3xl font-bold text-gray-900">
                  ₩{stats.totalRevenue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Recent Content */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Courses */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">최근 강의</h2>
            </div>
            <div className="p-6">
              {stats.recentCourses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">강의가 없습니다</p>
              ) : (
                <div className="space-y-4">
                  {stats.recentCourses.map((course) => (
                    <div key={course.id} className="border-l-4 border-blue-600 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{course.title}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              {course.views} 조회
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {course.enrollments} 수강
                            </span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          course.published 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {course.published ? '게시됨' : '비공개'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Files */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">최근 자료</h2>
            </div>
            <div className="p-6">
              {stats.recentFiles.length === 0 ? (
                <p className="text-gray-500 text-center py-8">자료가 없습니다</p>
              ) : (
                <div className="space-y-4">
                  {stats.recentFiles.map((file) => (
                    <div key={file.id} className="border-l-4 border-green-600 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{file.title}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Download className="h-4 w-4" />
                              {file.downloads} 다운로드
                            </span>
                            <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {file.format}
                            </span>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          file.published 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {file.published ? '게시됨' : '비공개'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">빠른 작업</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              to="/admin/courses"
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-600 hover:bg-blue-50 transition"
            >
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="font-semibold">새 강의 만들기</p>
            </Link>
            <Link
              to="/admin/files"
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-600 hover:bg-green-50 transition"
            >
              <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="font-semibold">자료 업로드</p>
            </Link>
            <button className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-600 hover:bg-purple-50 transition">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="font-semibold">통계 보기</p>
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}