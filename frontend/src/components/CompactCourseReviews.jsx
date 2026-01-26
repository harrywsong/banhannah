import React, { useState, useEffect } from 'react';
import { Star, Edit2, MessageCircle, Plus } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function CompactCourseReviews({ courseId, hasPurchased = true }) {
  const { user, isAuthenticated } = useAuth();
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
    fetchUserReview();
  }, [courseId]);

  const fetchUserReview = async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.get(`/reviews/course/${courseId}`);
      const reviewsData = response.data.reviews || [];
      
      // Find user's review if exists
      const myReview = reviewsData.find(review => review.userId === user.id);
      if (myReview) {
        setUserReview(myReview);
        setFormData({
          rating: myReview.rating,
          comment: myReview.comment
        });
      }
    } catch (error) {
      console.error('Failed to fetch user review:', error);
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
      await fetchUserReview();
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
              className={`h-4 w-4 ${
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

  if (loading) {
    return (
      <div className="p-4 border-t">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t">
      {/* Review Form */}
      {showReviewForm && (
        <div className="p-4 bg-gray-50">
          <h4 className="font-medium mb-3 text-sm">
            {editingReview ? '리뷰 수정' : '리뷰 작성'}
          </h4>
          <form onSubmit={handleSubmitReview}>
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">평점</label>
              {renderStars(formData.rating, true, (rating) => 
                setFormData(prev => ({ ...prev, rating }))
              )}
            </div>
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">리뷰 내용</label>
              <textarea
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                className="w-full px-2 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="강의에 대한 후기를 남겨주세요..."
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {submitting ? '저장 중...' : (editingReview ? '수정' : '등록')}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1.5 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User's Review Display or Action Button */}
      {!showReviewForm && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-sm flex items-center gap-1">
              <MessageCircle className="h-4 w-4 text-blue-600" />
              내 리뷰
            </h4>
            {userReview ? (
              <button
                onClick={handleEditReview}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition"
              >
                <Edit2 className="h-3 w-3" />
                수정
              </button>
            ) : hasPurchased ? (
              <button
                onClick={() => setShowReviewForm(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                <Plus className="h-3 w-3" />
                작성
              </button>
            ) : (
              <button
                disabled
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-300 text-gray-500 rounded cursor-not-allowed"
              >
                <Plus className="h-3 w-3" />
                작성
              </button>
            )}
          </div>
          
          {userReview ? (
            <div>
              <div className="mb-2">
                {renderStars(userReview.rating)}
              </div>
              <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">
                {userReview.comment}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(userReview.createdAt).toLocaleDateString('ko-KR')}
              </p>
            </div>
          ) : hasPurchased ? (
            <p className="text-xs text-gray-500">
              강의에 대한 리뷰를 작성해보세요
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              강의 구매 후 리뷰 작성 가능
            </p>
          )}
        </div>
      )}
    </div>
  );
}