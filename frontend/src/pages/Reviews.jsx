import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, MessageSquare, User } from 'lucide-react';
import { apiClient } from '../api/client';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/reviews/all?limit=20');
      setReviews(response.data.reviews || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('리뷰를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getItemName = (review) => {
    if (review.itemDetails) {
      return (
        <Link 
          to={review.itemDetails.link}
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {review.itemType === 'course' ? '강의: ' : '자료: '}{review.itemDetails.title}
        </Link>
      );
    }
    return review.itemType === 'course' ? '강의' : '자료';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">리뷰를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="relative pt-12 pb-12 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-neutral-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-100/30 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-4 shadow-lg shadow-amber-500/25">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
              수강 후기
            </h1>
            <p className="text-lg text-slate-600 font-light leading-relaxed max-w-2xl mx-auto">
              실제 수강생들의 생생한 경험을 확인해보세요
            </p>
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">아직 리뷰가 없습니다</h3>
                <p className="text-gray-600">첫 번째 리뷰를 남겨주세요!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="card p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${i < review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-neutral-300'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-neutral-600 font-medium">{review.rating}/5</span>
                  </div>

                  <p className="text-neutral-700 mb-6 leading-relaxed italic">"{review.comment}"</p>

                  <div className="border-t border-neutral-100 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                        {review.user.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">{review.user.name}</p>
                        <p className="text-sm text-neutral-600">{getItemName(review)}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{formatDate(review.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            </div>

            {/* CTA Card */}
            <div className="card p-8 md:p-10 text-center mt-12 bg-gradient-to-br from-primary-50 to-white border-primary-100">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">후기를 남겨주세요</h2>
              <p className="text-neutral-600 mb-6 leading-relaxed max-w-2xl mx-auto">
                수강하신 강의에 대한 솔직한 후기를 남겨주시면 다른 학습자들에게 큰 도움이 됩니다.
              </p>
              <button className="btn btn-primary btn-lg rounded-full px-8 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300">
                후기 작성하기
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}