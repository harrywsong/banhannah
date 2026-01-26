// frontend/src/pages/admin/AdminDashboard.jsx - Enhanced with real stats
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';

import {
  BookOpen,
  FileText,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  Download,
  ShoppingCart,
  Award
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/admin/stats/dashboard');
      setStats(response.data);
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

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">통계를 불러올 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">


      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
            <p className="text-gray-600 mt-1">플랫폼 전체 현황을 한눈에 확인하세요</p>
          </div>
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

        {/* Main Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">총 사용자</p>
                <p className="text-3xl font-bold text-gray-900">{stats.overview.totalUsers}</p>
                <p className="text-sm text-green-600 mt-2">
                  +{stats.growth.newUsersThisWeek} 이번 주
                </p>
              </div>
              <Users className="h-12 w-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">총 강의</p>
                <p className="text-3xl font-bold text-gray-900">{stats.overview.totalCourses}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {stats.overview.publishedCourses} 게시됨
                </p>
              </div>
              <BookOpen className="h-12 w-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">총 자료</p>
                <p className="text-3xl font-bold text-gray-900">{stats.overview.totalFiles}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {stats.overview.publishedFiles} 게시됨
                </p>
              </div>
              <FileText className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">총 수익</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${stats.overview.totalRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {stats.overview.totalPurchases} 판매
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Growth Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">주간 성장률</h2>
                <p className="text-sm text-gray-500">지난 7일간 (최근 일주일)</p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-gray-600">신규 사용자</span>
                  <p className="text-xs text-gray-400">지난 주 대비</p>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  +{stats.growth.newUsersThisWeek}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-gray-600">신규 등록</span>
                  <p className="text-xs text-gray-400">강의 등록 수</p>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  +{stats.growth.enrollmentsThisWeek}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">플랫폼 현황</h2>
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <p className="text-sm text-gray-600">게시된 강의</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.overview.publishedCourses}
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <p className="text-sm text-gray-600">게시된 자료</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.overview.publishedFiles}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Content */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Top Courses */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">인기 강의 TOP 5</h2>
            </div>
            <div className="p-6">
              {stats.topContent.courses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">강의가 없습니다</p>
              ) : (
                <div className="space-y-4">
                  {stats.topContent.courses.map((course, index) => (
                    <div key={course.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{course.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {course.enrollments}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            {course.views}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${course.type === 'free'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                            }`}>
                            {course.type === 'free' ? '무료' : '유료'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Top Files */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">인기 자료 TOP 5</h2>
            </div>
            <div className="p-6">
              {stats.topContent.files.length === 0 ? (
                <p className="text-gray-500 text-center py-8">자료가 없습니다</p>
              ) : (
                <div className="space-y-4">
                  {stats.topContent.files.map((file, index) => (
                    <div key={file.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{file.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Download className="h-4 w-4" />
                            {file.downloads}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                            {file.format}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold">최근 구매 내역</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    강의
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    결제 수단
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    구매일
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentActivity.purchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium">{purchase.user.name}</div>
                        <div className="text-sm text-gray-500">{purchase.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium">{purchase.course.title}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold">
                        ${purchase.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm">{purchase.paymentMethod || '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(purchase.purchasedAt).toLocaleDateString('ko-KR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">빠른 작업</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Link
              to="/admin/courses"
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-600 hover:bg-blue-50 transition"
            >
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="font-semibold">강의 관리</p>
            </Link>
            <Link
              to="/admin/files"
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-600 hover:bg-green-50 transition"
            >
              <FileText className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="font-semibold">자료 관리</p>
            </Link>
            <Link
              to="/admin/users"
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-600 hover:bg-purple-50 transition"
            >
              <Users className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="font-semibold">사용자 관리</p>
            </Link>
            <Link
              to="/admin/purchases"
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yellow-600 hover:bg-yellow-50 transition"
            >
              <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <p className="font-semibold">구매 내역</p>
            </Link>
          </div>
        </div>
      </div>


    </div>
  );
}