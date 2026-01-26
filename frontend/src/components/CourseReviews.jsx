import React, { useState, useEffect } from 'react';
import { Star, Edit2, Trash2, MessageCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function CourseReviews({ courseId, hasPurchased }) {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [courseId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/reviews/course/${courseId}`);
      const reviewsData = response.data.reviews || [];
      setReviews(reviewsData);
      
      // Find user's review if exists
      if (isAuthenticated && user) {
        const myReview = reviewsData.find(review => review.userId === user.id);
        if (myReview) {
          setUserReview(myReview);
          setFormData({
            rating: myReview.rating,
            comment: myReview.comment
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!hasPurchased) {
      alert('강의를 구매한 후에 리뷰를 작성할 수 있습니다.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingReview && userReview) {
        // Update existing review
        await apiClient.put(`/reviews/${userReview.id}`, {
          rating: formData.rating,
          comment: formData.comment
        });
        alert('리뷰가 수정되었습니다!');
      } else {
        // Create new review
        await apiClient.post('/reviews', {
          itemType: 'course',
          itemId: courseId,
          rating: formData.rating,
          comment: formData.comment
        });
        alert('리뷰가 작성되었습니다!');
      }
      
      setShowReviewForm(false);
      setEditingReview(false);
      await fetchReviews();
    } catch (error) {
      alert(error.response?.data?.error || '리뷰 작성에 실패했습니다.');
      
      // If the error is about not purchasing, show specific message
      if (error.response?.data?.error?.includes('purchase')) {
        setShowReviewForm(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReview = () => {
    setEditingReview(true);
    setShowReviewForm(true);
    setFormData({
      rating: userReview.rating,
      comment: userReview.comment
    });
  };

  const handleCancelEdit = () => {
    setShowReviewForm(false);
    setEditingReview(false);
    if (userReview) {
      setFormData({
        rating: userReview.rating,
        comment: userReview.comment
      });
    } else {
      setFormData({
        rating: 5,
        comment: ''
      });
    }
  };

  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => onRatingChange(star) : undefined}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <Star
              className={`h-5 w-5 ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            수강생 리뷰
          </h3>
          <div className="flex items-center gap-2 mt-2">
            {renderStars(Math.round(parseFloat(averageRating)))}
            <span className="text-lg font-semibold">{averageRating}</span>
            <span className="text-gray-500">({reviews.length}개 리뷰)</span>
          </div>
        </div>
        
        {/* Review Action Button */}
        {isAuthenticated && hasPurchased && (
          <div>
            {userReview ? (
              <button
                onClick={handleEditReview}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Edit2 className="h-4 w-4" />
                리뷰 수정
              </button>
            ) : (
              <button
                onClick={() => setShowReviewForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                리뷰 작성
              </button>
            )}
          </div>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <h4 className="font-semibold mb-4">
            {editingReview ? '리뷰 수정' : '리뷰 작성'}
          </h4>
          <form onSubmit={handleSubmitReview}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">평점</label>
              {renderStars(formData.rating, true, (rating) => 
                setFormData(prev => ({ ...prev, rating }))
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">리뷰 내용</label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="4"
                placeholder="강의에 대한 솔직한 후기를 남겨주세요..."
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {submitting ? '저장 중...' : (editingReview ? '수정 완료' : '리뷰 등록')}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>아직 작성된 리뷰가 없습니다.</p>
            {isAuthenticated && hasPurchased && (
              <p className="text-sm mt-1">첫 번째 리뷰를 작성해보세요!</p>
            )}
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border-b pb-4 last:border-b-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{review.user.name}</span>
                    {review.userId === user?.id && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                        내 리뷰
                      </span>
                    )}
                  </div>
                  {renderStars(review.rating)}
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
              <p className="text-gray-700 leading-relaxed">{review.comment}</p>
            </div>
          ))
        )}
      </div>

      {/* Info for non-enrolled users */}
      {isAuthenticated && !hasPurchased && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            💡 강의를 구매하시면 리뷰를 작성할 수 있습니다.
          </p>
        </div>
      )}

      {/* Info for non-authenticated users */}
      {!isAuthenticated && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 로그인 후 강의를 구매하시면 리뷰를 작성할 수 있습니다.
          </p>
        </div>
      )}
    </div>
  );
}