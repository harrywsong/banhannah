import React, { useState, useEffect } from 'react';
import { Trash2, Search, Filter, AlertTriangle, Star, FileText, BookOpen, User, Calendar } from 'lucide-react';
import { useApi } from '../../hooks/useApi';

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  
  const { request } = useApi();

  const fetchReviews = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterType) params.append('itemType', filterType);
      if (filterRating) params.append('rating', filterRating);
      
      const response = await request(`/admin/reviews/all?${params}`);
      setReviews(response.reviews);
      setTotalPages(response.pagination.pages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(1);
  }, [searchTerm, filterType, filterRating]);

  const handleDeleteReview = async (reviewId) => {
    try {
      await request(`/admin/reviews/${reviewId}`, {
        method: 'DELETE'
      });
      
      // Remove from local state
      setReviews(reviews.filter(review => review.id !== reviewId));
      setShowDeleteModal(false);
      setReviewToDelete(null);
      
      // Show success message (you can add a toast notification here)
      alert('Review deleted successfully');
    } catch (error) {
      console.error('Failed to delete review:', error);
      alert('Failed to delete review');
    }
  };

  const confirmDelete = (review) => {
    setReviewToDelete(review);
    setShowDeleteModal(true);
  };

  const getItemIcon = (itemType) => {
    switch (itemType) {
      case 'file':
        return <FileText className="h-4 w-4" />;
      case 'course':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getRatingStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">리뷰 관리</h1>
        <p className="text-gray-600">사용자 리뷰를 관리하고 부적절한 내용을 삭제할 수 있습니다.</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="리뷰 내용, 사용자명으로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">모든 타입</option>
            <option value="file">파일</option>
            <option value="course">강의</option>
          </select>
          
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
          >
            <option value="">모든 평점</option>
            <option value="1">1점</option>
            <option value="2">2점</option>
            <option value="3">3점</option>
            <option value="4">4점</option>
            <option value="5">5점</option>
          </select>
          
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('');
              setFilterRating('');
            }}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            필터 초기화
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">리뷰를 불러오는 중...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">검색 조건에 맞는 리뷰가 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reviews.map((review) => (
              <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Review Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {getItemIcon(review.itemType)}
                        <span className="font-medium">
                          {review.itemType === 'file' ? '파일' : '강의'}
                        </span>
                        {review.item && (
                          <span className="text-gray-800">→ {review.item.title}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {getRatingStars(review.rating)}
                      </div>
                    </div>

                    {/* Review Content */}
                    <div className="mb-3">
                      <p className="text-gray-900 leading-relaxed">{review.comment}</p>
                    </div>

                    {/* Review Meta */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{review.user.name}</span>
                        <span className="text-gray-400">({review.user.email})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-4">
                    <button
                      onClick={() => confirmDelete(review)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="리뷰 삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">
                페이지 {currentPage} / {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchReviews(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <button
                  onClick={() => fetchReviews(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && reviewToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">리뷰 삭제 확인</h3>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-3">다음 리뷰를 삭제하시겠습니까?</p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-800 mb-2">
                  <strong>작성자:</strong> {reviewToDelete.user.name} ({reviewToDelete.user.email})
                </p>
                <p className="text-sm text-gray-800 mb-2">
                  <strong>내용:</strong> {reviewToDelete.comment}
                </p>
                <div className="flex items-center gap-1">
                  <strong className="text-sm text-gray-800">평점:</strong>
                  {getRatingStars(reviewToDelete.rating)}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setReviewToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => handleDeleteReview(reviewToDelete.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;