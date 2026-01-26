import { useState, useCallback, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Star, MessageCircle, X } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../hooks/useAuth';

export default function FileReviewButton({ fileId, fileName }) {
  const { isAuthenticated, user } = useAuth();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [formData, setFormData] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check if user has already reviewed this file
  useEffect(() => {
    const checkExistingReview = async () => {
      if (!isAuthenticated || !user) return;
      
      setLoading(true);
      try {
        const response = await apiClient.get(`/reviews/file/${fileId}`);
        const userReview = response.data.reviews.find(review => review.userId === user.id);
        if (userReview) {
          setExistingReview(userReview);
          setFormData({ rating: userReview.rating, comment: userReview.comment });
        }
      } catch (error) {
        // If error, assume no existing review
        setExistingReview(null);
      } finally {
        setLoading(false);
      }
    };

    checkExistingReview();
  }, [isAuthenticated, user, fileId]);

  const handleSubmitReview = useCallback(async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('로그인 후 리뷰를 작성할 수 있습니다.');
      return;
    }

    setSubmitting(true);
    try {
      if (existingReview) {
        // Update existing review
        await apiClient.put(`/reviews/${existingReview.id}`, {
          rating: formData.rating,
          comment: formData.comment
        });
        alert('리뷰가 수정되었습니다!');
      } else {
        // Create new review
        await apiClient.post('/reviews', {
          itemType: 'file',
          itemId: fileId,
          rating: formData.rating,
          comment: formData.comment
        });
        alert('리뷰가 작성되었습니다!');
      }
      setShowReviewModal(false);
      // Refresh the existing review data
      const response = await apiClient.get(`/reviews/file/${fileId}`);
      const userReview = response.data.reviews.find(review => review.userId === user.id);
      setExistingReview(userReview);
    } catch (error) {
      if (error.response?.status === 409) {
        alert('이미 이 자료에 대한 리뷰를 작성하셨습니다.');
      } else {
        alert(error.response?.data?.error || '리뷰 작성에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [isAuthenticated, fileId, formData.rating, formData.comment, existingReview, user]);

  const handleOpenModal = useCallback(() => {
    if (!isAuthenticated) {
      alert('로그인 후 리뷰를 작성할 수 있습니다.');
      return;
    }
    // Set form data to existing review if available
    if (existingReview) {
      setFormData({ rating: existingReview.rating, comment: existingReview.comment });
    }
    setShowReviewModal(true);
  }, [isAuthenticated, existingReview]);

  const handleCloseModal = useCallback(() => {
    setShowReviewModal(false);
    // Reset form data based on existing review or defaults
    if (existingReview) {
      setFormData({ rating: existingReview.rating, comment: existingReview.comment });
    } else {
      setFormData({ rating: 5, comment: '' });
    }
  }, [existingReview]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  }, [handleCloseModal]);

  const handleTextareaChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, comment: e.target.value }));
  }, []);

  const handleRatingChange = useCallback((rating) => {
    setFormData(prev => ({ ...prev, rating }));
  }, []);

  const renderStars = useCallback((rating, interactive = false, onRatingChange = null) => {
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
            <Star className={`h-5 w-5 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
          </button>
        ))}
      </div>
    );
  }, []);

  // Memoize the modal component to prevent recreation
  const ReviewModal = useMemo(() => {
    if (!showReviewModal) return null;
    
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        style={{ zIndex: 9999 }}
        onClick={handleBackdropClick}
      >
        <div 
          className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {existingReview ? '리뷰 수정' : '리뷰 작성'}
              </h3>
              <button 
                onClick={handleCloseModal} 
                className="text-gray-400 hover:text-gray-600 transition-colors" 
                type="button"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">자료</p>
              <p className="font-medium text-gray-900">{fileName}</p>
            </div>

            <form onSubmit={handleSubmitReview}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">평점</label>
                {renderStars(formData.rating, true, handleRatingChange)}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">리뷰 내용</label>
                <textarea
                  key="review-textarea"
                  value={formData.comment}
                  onChange={handleTextareaChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows="4"
                  placeholder="자료에 대한 솔직한 후기를 남겨주세요..."
                  required
                  autoFocus={false}
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? '저장 중...' : (existingReview ? '리뷰 수정' : '리뷰 등록')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }, [showReviewModal, fileName, formData.rating, formData.comment, submitting, existingReview, handleBackdropClick, handleCloseModal, handleSubmitReview, handleTextareaChange, handleRatingChange, renderStars]);

  return (
    <>
      {/* Only the button is rendered in the card */}
      <button
        onClick={handleOpenModal}
        className="btn btn-sm btn-outline rounded-full flex items-center gap-1"
        disabled={loading}
      >
        <MessageCircle className="h-4 w-4" />
        {loading ? '확인 중...' : (existingReview ? '리뷰 수정' : '리뷰 작성')}
      </button>

      {/* Modal is rendered at document.body level, completely outside the card */}
      {ReviewModal && createPortal(ReviewModal, document.body)}
    </>
  );
}