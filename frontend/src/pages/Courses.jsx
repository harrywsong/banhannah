import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import PreviewImage from '../components/PreviewImage';
import { Search, Star, BookOpen } from 'lucide-react';

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
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm">
              <BookOpen className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">모든 강의</h1>
            <p className="text-xl opacity-90 font-light leading-relaxed">
              전문가가 만든 고품질 강의로 실력을 향상시키세요
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
                      placeholder="강의 검색..."
                      className="pl-10 w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    />
                  </div>
                </div>

                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-colors"
                >
                  <option value="">모든 타입</option>
                  <option value="free">무료</option>
                  <option value="paid">유료</option>
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

            {/* Courses Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : courses.length === 0 ? (
              <div className="card p-12 text-center">
                <BookOpen className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-500">검색 결과가 없습니다</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="card overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <PreviewImage
                      previewImage={course.previewImage}
                      alt={course.title}
                      className="w-full h-48 object-cover"
                      fallbackContent={
                        <div className="w-full h-48 bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center text-white font-semibold">
                          미리보기 없음
                        </div>
                      }
                    />
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        {course.type === 'free' ? (
                          <span className="badge badge-success">무료</span>
                        ) : (
                          <span className="badge badge-primary">유료</span>
                        )}
                        <span className="badge badge-secondary">
                          {course.level === 1 ? '초급' : course.level === 2 ? '중급' : '고급'}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-neutral-900 mb-2">{course.title}</h3>
                      <p className="text-neutral-600 text-sm line-clamp-2 mb-4">
                        {course.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-accent-400 fill-current" />
                          <span className="text-sm font-semibold text-neutral-900">
                            {course.averageRating?.toFixed(1) || '0.0'}
                          </span>
                          <span className="text-sm text-neutral-500">
                            ({course.reviewCount || 0})
                          </span>
                        </div>
                        {course.type === 'paid' && (
                          <span className="text-lg font-bold text-primary-600">
                            {course.discountPrice
                              ? `₩${course.discountPrice.toLocaleString()}`
                              : `₩${course.price?.toLocaleString() || '0'}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}