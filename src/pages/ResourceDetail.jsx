import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, Download, DollarSign, FileText, Clock, Star, MessageCircle, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useReviews } from '../contexts/ReviewsContext'

export default function ResourceDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { getReviewsByItemId, addReview, updateReview, getUserReview } = useReviews()
  const [resource, setResource] = useState(null)
  const [reviews, setReviews] = useState([])
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [isPurchased, setIsPurchased] = useState(false)
  const [editingReview, setEditingReview] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    const savedResources = JSON.parse(localStorage.getItem('resources') || '[]')
    const foundResource = savedResources.find(r => r.id === parseInt(id))
    if (foundResource) {
      setResource(foundResource)
    }

    // Check if user has purchased this resource
    if (foundResource && foundResource.type === 'paid' && user) {
      const purchases = JSON.parse(localStorage.getItem(`purchases_${user.id}`) || '[]')
      const purchased = purchases.find(p => p.resourceId === foundResource.id)
      setIsPurchased(!!purchased)
    }

    const itemReviews = getReviewsByItemId(parseInt(id), 'resource')
    setReviews(itemReviews)

    // Check if user has already reviewed this resource
    const userReview = getUserReview(user.id, parseInt(id), 'resource')
    if (userReview) {
      setEditingReview(userReview)
      setReviewForm({ rating: userReview.rating, comment: userReview.comment })
    }
  }, [id, user, navigate, getReviewsByItemId, getUserReview])

  if (!user) {
    return null
  }

  const handlePurchase = () => {
    if (!resource || resource.type !== 'paid' || !user) return

    // Simulate payment processing
    const purchases = JSON.parse(localStorage.getItem(`purchases_${user.id}`) || '[]')
    
    // Check if already purchased
    if (purchases.find(p => p.resourceId === resource.id)) {
      alert('이미 구매한 자료입니다.')
      setIsPurchased(true)
      return
    }

    // Simulate payment - in production, this would integrate with payment gateway
    const purchase = {
      resourceId: resource.id,
      resourceTitle: resource.title,
      price: resource.price,
      purchasedAt: new Date().toISOString(),
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    }
    
    purchases.push(purchase)
    localStorage.setItem(`purchases_${user.id}`, JSON.stringify(purchases))
    
    // Also add to user's resources for dashboard
    const myResources = JSON.parse(localStorage.getItem(`resources_${user.id}`) || '[]')
    if (!myResources.find(r => r.id === resource.id)) {
      myResources.push({
        id: resource.id,
        title: resource.title,
        format: resource.format,
        size: resource.size,
        downloadedAt: new Date().toISOString(),
        purchased: true
      })
      localStorage.setItem(`resources_${user.id}`, JSON.stringify(myResources))
    }
    
    setIsPurchased(true)
    alert(`구매가 완료되었습니다!\n거래 ID: ${purchase.transactionId}\n\n이제 다운로드할 수 있습니다.`)
  }

  const handleDownload = () => {
    if (resource.type === 'paid' && !user) {
      alert('로그인하여 이 자료를 구매하세요')
      return
    }
    
    if (resource.type === 'paid' && !isPurchased) {
      if (window.confirm(`${resource.price} 결제하고 이 자료를 구매하시겠습니까?\n\n(데모: 실제 결제가 발생하지 않습니다)`)) {
        handlePurchase()
      }
      return
    }
    
    // Free resource or purchased paid resource - proceed with download
    // In production, this would trigger actual file download
    console.log('Downloading resource:', resource.title)
    
    if (user) {
      // Save to user's downloads
      const myResources = JSON.parse(localStorage.getItem(`resources_${user.id}`) || '[]')
      const resourceToSave = {
        id: resource.id,
        title: resource.title,
        format: resource.format,
        size: resource.size,
        downloadedAt: new Date().toISOString(),
        purchased: resource.type === 'paid'
      }
      
      if (!myResources.find(r => r.id === resource.id)) {
        myResources.push(resourceToSave)
        localStorage.setItem(`resources_${user.id}`, JSON.stringify(myResources))
      }
    }

    // Automatically update download count
    const allResources = JSON.parse(localStorage.getItem('resources') || '[]')
    const updatedResources = allResources.map(r => 
      r.id === resource.id 
        ? { ...r, downloads: (r.downloads || 0) + 1 }
        : r
    )
    localStorage.setItem('resources', JSON.stringify(updatedResources))
    setResource({ ...resource, downloads: (resource.downloads || 0) + 1 })
    
    // Show download message
    alert(`다운로드가 시작되었습니다!\n\n파일: ${resource.title}\n형식: ${resource.format}\n크기: ${resource.size}\n\n(데모: 실제 파일 다운로드로 교체하세요)`)
  }

  const handleReviewSubmit = (e) => {
    e.preventDefault()
    if (!user) {
      alert('로그인이 필요합니다')
      return
    }

    if (editingReview) {
      // Update existing review
      const updatedReview = updateReview(editingReview.id, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        userName: user.name
      })
      
      // Update local reviews state
      const updatedReviews = reviews.map(r => r.id === editingReview.id ? updatedReview : r)
      setReviews(updatedReviews)
      setEditingReview(updatedReview)
      setShowReviewForm(false)
      alert('리뷰가 수정되었습니다!')
    } else {
      // Create new review
      const newReview = addReview({
        itemId: parseInt(id),
        itemType: 'resource',
        itemTitle: resource.title,
        userId: user.id,
        userName: user.name,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      })

      setReviews([newReview, ...reviews])
      setEditingReview(newReview)
      setReviewForm({ rating: 5, comment: '' })
      setShowReviewForm(false)
      alert('리뷰가 등록되었습니다!')
    }
  }

  const handleEditReview = () => {
    if (editingReview) {
      setReviewForm({ rating: editingReview.rating, comment: editingReview.comment })
      setShowReviewForm(true)
    }
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">자료를 찾을 수 없습니다</p>
      </div>
    )
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/resources" className="inline-flex items-center text-primary-600 hover:text-primary-700">
            <ArrowLeft className="h-5 w-5 mr-2" />
            자료 목록으로 돌아가기
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Resource Header */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              {/* PLACEHOLDER IMAGE */}
              <div className={`relative h-64 rounded-lg mb-6 flex items-center justify-center ${
                resource.type === 'paid' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-primary-400 to-primary-600'
              }`}>
                <div className="text-center text-white">
                  <FileText className="h-24 w-24 mx-auto mb-2 opacity-50" />
                  <p className="text-lg font-semibold">[자료 상세 이미지]</p>
                  <p className="text-sm opacity-75">실제 문서의 첫 페이지 미리보기로 교체하세요</p>
                </div>
                <div className="absolute top-4 right-4">
                  {resource.type === 'paid' ? (
                    <div className="bg-white text-orange-600 px-4 py-2 rounded-full font-semibold flex items-center space-x-1">
                      <DollarSign className="h-5 w-5" />
                      <span>유료 자료</span>
                    </div>
                  ) : (
                    <div className="bg-white text-green-600 px-4 py-2 rounded-full font-semibold">
                      무료 자료
                    </div>
                  )}
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {resource.title}
              </h1>
              <p className="text-xl text-gray-600 mb-6">{resource.description}</p>

              <div className="flex flex-wrap items-center gap-6 mb-6 text-gray-600">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>{resource.format}</span>
                </div>
                {resource.size && (
                  <div className="flex items-center space-x-2">
                    <Download className="h-5 w-5" />
                    <span>{resource.size}</span>
                  </div>
                )}
                {resource.pages && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>{resource.pages}</span>
                  </div>
                )}
                <div>
                  <span>{resource.downloads?.toLocaleString() || 0} 다운로드</span>
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">이 자료에 대해</h2>
                <p className="text-gray-700 leading-relaxed">{resource.fullDescription || resource.description}</p>
              </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">리뷰</h2>
                  {reviews.length > 0 && (
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex text-yellow-400">
                        <Star className="h-5 w-5 fill-current" />
                      </div>
                      <span className="text-lg font-semibold text-gray-900">{averageRating}</span>
                      <span className="text-gray-600">({reviews.length}개 리뷰)</span>
                    </div>
                  )}
                </div>
                {user && (
                  <button
                    onClick={editingReview ? handleEditReview : () => setShowReviewForm(!showReviewForm)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{editingReview ? '리뷰 수정' : '리뷰 작성'}</span>
                  </button>
                )}
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">{editingReview ? '리뷰 수정' : '리뷰 작성'}</h3>
                    <button onClick={() => setShowReviewForm(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>개인정보 보호:</strong> 리뷰 작성 시 이름의 첫 글자와 마지막 글자만 표시되며, 나머지는 별표(*)로 처리됩니다. 
                        예: 반혜나 → 반*나, Andrew Lee → A***** **e
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">평점</label>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-8 w-8 ${
                                star <= reviewForm.rating
                                  ? 'text-yellow-400 fill-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">리뷰 내용</label>
                      <textarea
                        required
                        rows="4"
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="이 자료에 대한 리뷰를 작성해주세요..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
                    >
                      {editingReview ? '리뷰 수정' : '리뷰 등록'}
                    </button>
                  </form>
                </div>
              )}

              {/* Reviews List */}
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold text-gray-900">{review.userName}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>아직 리뷰가 없습니다</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <div className="mb-6">
                {resource.type === 'paid' ? (
                  <>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{resource.price}</div>
                    <p className="text-gray-600">일회성 구매</p>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-green-600 mb-2">무료</div>
                    <p className="text-gray-600">결제 불필요</p>
                  </>
                )}
              </div>

              {resource.type === 'paid' && !user && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    로그인하여 이 자료를 구매하세요
                  </p>
                </div>
              )}

              <button
                onClick={handleDownload}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors mb-4 flex items-center justify-center space-x-2"
              >
                <Download className="h-5 w-5" />
                <span>
                  {resource.type === 'paid' 
                    ? (isPurchased ? '다운로드' : '구매 및 다운로드')
                    : '지금 다운로드'}
                </span>
              </button>

              {resource.type === 'paid' && (
                <p className="text-xs text-gray-500 text-center mb-4">
                  {isPurchased 
                    ? '구매 완료. 언제든지 다운로드할 수 있습니다.'
                    : '안전한 결제 처리. 구매 후 즉시 다운로드 가능.'}
                </p>
              )}

              <div className="border-t mt-6 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">자료 정보:</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-center justify-between">
                    <span>형식:</span>
                    <span className="font-semibold text-gray-900">{resource.format}</span>
                  </li>
                  {resource.size && (
                    <li className="flex items-center justify-between">
                      <span>파일 크기:</span>
                      <span className="font-semibold text-gray-900">{resource.size}</span>
                    </li>
                  )}
                  {resource.pages && (
                    <li className="flex items-center justify-between">
                      <span>페이지:</span>
                      <span className="font-semibold text-gray-900">{resource.pages}</span>
                    </li>
                  )}
                  <li className="flex items-center justify-between">
                    <span>다운로드:</span>
                    <span className="font-semibold text-gray-900">{resource.downloads?.toLocaleString() || 0}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
