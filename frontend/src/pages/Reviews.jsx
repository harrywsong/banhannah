import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, MessageCircle, FileText, Video, Users, Edit2, Trash2, Filter } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useReviews } from '../contexts/ReviewsContext'

export default function Reviews() {
  const { user } = useAuth()
  const { reviews, loading } = useReviews()
  const [filterType, setFilterType] = useState('all')
  const [filterRating, setFilterRating] = useState('all')

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    const matchesType = filterType === 'all' || review.itemType === filterType
    const matchesRating = filterRating === 'all' || review.rating === parseInt(filterRating)
    return matchesType && matchesRating
  })

  // Get user's reviews
  const myReviews = user ? reviews.filter(r => r.userId === user.id) : []

  // Get icon for item type
  const getItemIcon = (itemType) => {
    switch (itemType) {
      case 'file': return <FileText className="h-4 w-4" />
      case 'course': return <Video className="h-4 w-4" />
      case 'class': return <Users className="h-4 w-4" />
      default: return <MessageCircle className="h-4 w-4" />
    }
  }

  // Get label for item type
  const getItemTypeLabel = (itemType) => {
    switch (itemType) {
      case 'file': return '파일'
      case 'course': return '온라인 코스'
      case 'class': return '라이브 클래스'
      default: return '리뷰'
    }
  }

  // Get link for item
  const getItemLink = (review) => {
    switch (review.itemType) {
      case 'file': return `/files/${review.itemId}`
      case 'course': return `/courses/${review.itemId}`
      case 'class': return `/live-classes`
      default: return '#'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">리뷰를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">리뷰</h1>
          <p className="text-xl text-primary-100">사용자들의 솔직한 후기를 확인하세요</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* My Reviews Section - Only shown when logged in */}
        {user && myReviews.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">내가 작성한 리뷰</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myReviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl shadow-md p-6 border-2 border-primary-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-grow">
                      {/* ✅ Format: "타입 리뷰 - 제목" */}
                      <Link 
                        to={getItemLink(review)}
                        className="text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors block mb-2"
                      >
                        {getItemTypeLabel(review.itemType)} 리뷰 - {review.itemTitle}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={getItemLink(review)}
                        className="text-primary-600 hover:text-primary-700 p-2"
                        title="리뷰 수정"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  <div className="flex text-yellow-400 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-5 w-5 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>

                  <p className="text-gray-700 mb-3">{review.comment}</p>

                  <p className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">필터</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">타입별</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">모든 타입</option>
                <option value="file">파일</option>
                <option value="course">온라인 코스</option>
                <option value="class">라이브 클래스</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">평점별</label>
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">모든 평점</option>
                <option value="5">⭐⭐⭐⭐⭐ (5점)</option>
                <option value="4">⭐⭐⭐⭐ (4점)</option>
                <option value="3">⭐⭐⭐ (3점)</option>
                <option value="2">⭐⭐ (2점)</option>
                <option value="1">⭐ (1점)</option>
              </select>
            </div>
          </div>
        </div>

        {/* All Reviews */}
        <div>
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-3xl font-bold text-gray-900">모든 리뷰</h2>
    <div className="text-sm text-gray-600">
      총 <span className="font-semibold text-primary-600">{filteredReviews.length}</span>개의 리뷰
    </div>
  </div>

  {filteredReviews.length > 0 ? (
    <div className="space-y-6">
      {filteredReviews.map((review) => (
        <div key={review.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
          {/* ✅ FIXED: Item Title Display */}
          <div className="mb-4">
            <Link 
              to={getItemLink(review)}
              className="text-xl font-bold text-gray-900 hover:text-primary-600 transition-colors block"
            >
              {/* ✅ Show title if available, otherwise show type only */}
              {review.itemTitle ? (
                <>
                  {getItemTypeLabel(review.itemType)} 리뷰 - {review.itemTitle}
                </>
              ) : (
                <>
                  {getItemTypeLabel(review.itemType)} 리뷰
                  <span className="ml-2 text-sm text-gray-500">(제목 없음)</span>
                </>
              )}
            </Link>
          </div>

          {/* Rating and User Info */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={`all-reviews-${review.id}-star-${i}`} className={`h-5 w-5 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                  ))}
                </div>
                <span className="text-lg font-semibold text-gray-900">{review.rating}.0</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="font-semibold">{review.userName}</span>
                <span>•</span>
                <span>{new Date(review.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
            </div>
          </div>

          {/* Review Comment */}
          <p className="text-gray-700 leading-relaxed">{review.comment}</p>
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center py-12 bg-white rounded-xl">
      <MessageCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
      <p className="text-xl text-gray-600">검색 조건에 맞는 리뷰가 없습니다</p>
    </div>
  )}
</div>
      </div>
    </div>
  )
}