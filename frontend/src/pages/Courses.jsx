import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PreviewImage from '../components/PreviewImage';
import { Search, Filter, Star } from 'lucide-react';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  useEffect(() => {
    fetchCourses();
  }, [typeFilter, levelFilter]);

  const fetchCourses = async () => {
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (levelFilter) params.append('level', levelFilter);
      if (search) params.append('search', search);

      const response = await apiClient.get(`/courses?${params}`);
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCourses();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">모든 강의</h1>

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
                  placeholder="강의 검색..."
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">모든 타입</option>
              <option value="free">무료</option>
              <option value="paid">유료</option>
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

        {/* Courses Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">검색 결과가 없습니다</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition"
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
                  <div className="flex items-center gap-2 mb-2">
                    {course.type === 'free' ? (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                        무료
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        유료
                      </span>
                    )}
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                      {course.level === 1 ? '초급' : course.level === 2 ? '중급' : '고급'}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                    {course.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-semibold">
                        {course.averageRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({course.reviewCount})
                      </span>
                    </div>
                    {course.type === 'paid' && (
                      <span className="text-lg font-bold text-blue-600">
                        {course.discountPrice
                          ? `₩${course.discountPrice.toLocaleString()}`
                          : `₩${course.price.toLocaleString()}`}
                      </span>
                    )}
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