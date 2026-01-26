import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { BookOpen, FileText, Award, Users, ArrowRight, CheckCircle, Star } from 'lucide-react';
import { apiClient } from '../api/client';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalFiles: 0,
    totalReviews: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/stats/public');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Keep default values if API fails
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchTestimonials = async () => {
    try {
      const response = await apiClient.get('/reviews/all?limit=3');
      setTestimonials(response.data.reviews || []);
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      // Fallback to empty array if API fails
      setTestimonials([]);
    } finally {
      setTestimonialsLoading(false);
    }
  };

  const features = [
    {
      icon: BookOpen,
      title: '전문 강의',
      description: '업계 전문가가 제작한 고품질 강의 콘텐츠'
    },
    {
      icon: FileText,
      title: '풍부한 자료',
      description: 'PDF, 동영상 등 다양한 학습 자료 제공'
    },
    {
      icon: Award,
      title: '수료 인증',
      description: '강의 완료 시 공식 수료증 발급'
    },
    {
      icon: Users,
      title: '학습 커뮤니티',
      description: '함께 학습하는 동료들과의 소통'
    }
  ];

  const displayStats = [
    { 
      number: statsLoading ? '...' : `${stats.totalUsers}+`, 
      label: '수강생',
      color: 'text-blue-600'
    },
    { 
      number: statsLoading ? '...' : `${stats.totalCourses}`, 
      label: '강의',
      color: 'text-green-600'
    },
    { 
      number: statsLoading ? '...' : `${stats.totalFiles}`, 
      label: '학습자료',
      color: 'text-purple-600'
    },
    { 
      number: statsLoading ? '...' : `${stats.totalReviews}`, 
      label: '후기',
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-50 via-blue-50/30 to-purple-50/20 -z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-[0.03] -z-10"></div>
        
        {/* Floating color orbs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-200/20 rounded-full blur-xl -z-10"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-200/20 rounded-full blur-xl -z-10"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-blue-200/20 rounded-full blur-xl -z-10"></div>

        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-primary-50 text-primary-700 mb-6 border border-primary-100">
              <span className="flex h-2 w-2 rounded-full bg-primary-600 mr-2"></span>
              새로운 학습 경험
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6 text-balance tracking-tight leading-tight">
              온라인 학습의
              <span className="text-primary-600"> 새로운 기준</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto leading-relaxed font-light">
              전문가가 만든 고품질 강의와 학습 자료로 당신의 꿈을 실현하세요.
              체계적인 커리큘럼이 당신을 기다립니다.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/courses"
                    className="btn btn-primary btn-lg rounded-full px-8 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300"
                  >
                    강의 둘러보기
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  <Link
                    to="/dashboard"
                    className="btn btn-outline btn-lg rounded-full px-8 border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50"
                  >
                    대시보드
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn btn-primary btn-lg rounded-full px-8 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300"
                  >
                    무료 시작하기
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  <Link
                    to="/courses"
                    className="btn btn-outline btn-lg rounded-full px-8 border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50"
                  >
                    강의 둘러보기
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-neutral-200 pt-12">
              {displayStats.map((stat, index) => (
                <div key={index} className="text-center group hover:transform hover:-translate-y-1 transition-transform duration-300">
                  <div className={`text-3xl font-bold mb-1 group-hover:scale-110 transition-all duration-300 ${stat.color}`}>
                    {stat.number}
                  </div>
                  <div className="text-sm text-neutral-500 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gradient-to-b from-white via-green-50/30 to-white border-t border-neutral-100 relative">
        {/* Subtle background elements */}
        <div className="absolute top-10 right-20 w-20 h-20 bg-green-200/20 rounded-full blur-lg"></div>
        <div className="absolute bottom-10 left-20 w-16 h-16 bg-blue-200/20 rounded-full blur-lg"></div>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              왜 우리를 선택해야 할까요?
            </h2>
            <p className="text-lg text-neutral-600 font-light">
              체계적인 학습 시스템과 전문적인 콘텐츠로 효과적인 학습을 지원합니다
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card p-8 text-center hover:shadow-xl hover:border-primary-100 transition-all duration-300 group">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-600 transition-colors duration-300">
                  <feature.icon className="w-7 h-7 text-primary-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">{feature.title}</h3>
                <p className="text-neutral-500 leading-relaxed text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-24 bg-gradient-to-br from-neutral-50 via-orange-50/20 to-neutral-50 border-t border-neutral-200 relative">
        {/* Subtle background elements */}
        <div className="absolute top-16 left-16 w-28 h-28 bg-orange-200/15 rounded-full blur-xl"></div>
        <div className="absolute bottom-16 right-16 w-24 h-24 bg-yellow-200/15 rounded-full blur-xl"></div>
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                수강생들의 이야기
              </h2>
              <p className="text-lg text-neutral-600 font-light">
                실제 수강생들이 경험한 학습의 변화를 확인해보세요
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonialsLoading ? (
                // Loading state
                [...Array(3)].map((_, index) => (
                  <div key={index} className="card p-8 bg-white animate-pulse">
                    <div className="flex items-center mb-4">
                      <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    </div>
                    <div className="space-y-2 mb-6">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                      <div className="space-y-1">
                        <div className="h-4 w-16 bg-gray-200 rounded"></div>
                        <div className="h-3 w-12 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : testimonials.length === 0 ? (
                // No reviews state
                <div className="col-span-full text-center py-12">
                  <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">아직 리뷰가 없습니다</h3>
                  <p className="text-gray-500">첫 번째 리뷰를 남겨주세요!</p>
                </div>
              ) : (
                // Real testimonials
                testimonials.map((testimonial, index) => (
                  <div key={testimonial.id || index} className="card p-8 bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-neutral-700 mb-6 leading-relaxed italic">"{testimonial.comment}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500 font-bold">
                        {testimonial.user?.name?.[0] || '?'}
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900 text-sm">{testimonial.user?.name || '익명'}</div>
                        <div className="text-xs text-neutral-500">
                          {testimonial.itemDetails ? (
                            <Link 
                              to={testimonial.itemDetails.link}
                              className="text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {testimonial.itemType === 'course' ? '강의: ' : '자료: '}{testimonial.itemDetails.title}
                            </Link>
                          ) : (
                            testimonial.itemType === 'course' ? '강의 수강생' : '자료 이용자'
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-neutral-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 to-neutral-900 opacity-90"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
              지금 바로 시작하세요
            </h2>
            <p className="text-xl mb-10 text-neutral-300 font-light">
              무료 강의로 시작해서 전문가 수준까지 성장하세요. <br className="hidden sm:block" />
              당신의 성장을 응원합니다.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 mb-10 text-neutral-300 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary-400" />
                <span>무료 회원가입</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary-400" />
                <span>즉시 학습 시작</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary-400" />
                <span>수료증 발급</span>
              </div>
            </div>

            {!isAuthenticated && (
              <Link
                to="/register"
                className="inline-flex items-center bg-white text-neutral-900 px-8 py-4 rounded-full font-semibold hover:bg-neutral-100 transition-colors text-lg shadow-lg"
              >
                회원가입하고 시작하기
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
