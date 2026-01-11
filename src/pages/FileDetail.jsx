import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, Download, FileText, Clock, Star, MessageCircle, X, Eye } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useReviews } from '../contexts/ReviewsContext'

export default function FileDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { getReviewsByItemId, addReview, updateReview, getUserReview } = useReviews()
  const [file, setFile] = useState(null)
  const [reviews, setReviews] = useState([])
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [editingReview, setEditingReview] = useState(null)
  const [showViewer, setShowViewer] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    const savedFiles = JSON.parse(localStorage.getItem('resourceFiles') || '[]')
    const foundFile = savedFiles.find(f => f.id === parseInt(id))
    if (foundFile) {
      setFile(foundFile)
    }

    const itemReviews = getReviewsByItemId(parseInt(id), 'file')
    setReviews(itemReviews)

    // Check if user has already reviewed this file
    const userReview = getUserReview(user.id, parseInt(id), 'file')
    if (userReview) {
      setEditingReview(userReview)
      setReviewForm({ rating: userReview.rating, comment: userReview.comment })
    }
  }, [id, user, navigate, getReviewsByItemId, getUserReview])

  if (!user) {
    return null
  }

  // Helper function to increment access count
  const incrementAccessCount = () => {
    const allFiles = JSON.parse(localStorage.getItem('resourceFiles') || '[]')
    const updatedFiles = allFiles.map(f => 
      f.id === file.id 
        ? { ...f, downloads: (f.downloads || 0) + 1 }
        : f
    )
    localStorage.setItem('resourceFiles', JSON.stringify(updatedFiles))
    setFile({ ...file, downloads: (file.downloads || 0) + 1 })
  }

  const handleDownload = () => {
    if (!file) return
    
    // If fileUrl exists, trigger actual download
    if (file.fileUrl) {
      const link = document.createElement('a')
      link.href = file.fileUrl
      link.download = file.title || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
    
    // Save to user's downloads
    const myFiles = JSON.parse(localStorage.getItem(`files_${user.id}`) || '[]')
    const fileToSave = {
      id: file.id,
      title: file.title,
      format: file.format,
      size: file.size,
      downloadedAt: new Date().toISOString()
    }
    
    if (!myFiles.find(f => f.id === file.id)) {
      myFiles.push(fileToSave)
      localStorage.setItem(`files_${user.id}`, JSON.stringify(myFiles))
    }

    // Update access count
    incrementAccessCount()
  }

  const handleViewInBrowser = () => {
    if (!file) return
    
    // If fileUrl exists, show viewer in same page
    if (file.fileUrl) {
      setShowViewer(true)
      // Increment access count when viewing in browser
      incrementAccessCount()
    } else {
      alert(`브라우저에서 파일을 확인합니다.\n\n파일: ${file.title}\n형식: ${file.format}\n\n파일 URL이 설정되지 않았습니다. 관리자 패널에서 파일 URL을 설정해주세요.`)
    }
  }

  const handleReviewSubmit = (e) => {
    e.preventDefault()
    if (!user) {
      alert('로그인이 필요합니다')
      return
    }

    if (editingReview) {
      const updatedReview = updateReview(editingReview.id, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        userName: user.name
      })
      
      const updatedReviews = reviews.map(r => r.id === editingReview.id ? updatedReview : r)
      setReviews(updatedReviews)
      setEditingReview(updatedReview)
      setShowReviewForm(false)
      alert('리뷰가 수정되었습니다!')
    } else {
      const newReview = addReview({
        itemId: parseInt(id),
        itemType: 'file',
        itemTitle: file.title,
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

  if (!file) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">파일을 찾을 수 없습니다</p>
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
            파일 목록으로 돌아가기
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* File Viewer (when viewing) */}
            {showViewer && file.fileUrl && (
              <div className="bg-white rounded-xl shadow-md mb-8">
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-xl font-bold text-gray-900">{file.title}</h2>
                  <button
                    onClick={() => setShowViewer(false)}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="w-full" style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}>
                  <iframe
                    src={file.fileUrl}
                    className="w-full h-full border-0"
                    title={`${file.title} 뷰어`}
                  />
                </div>
              </div>
            )}

            {/* File Header */}
            {!showViewer && (
              <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                {/* File Preview */}
                <div className="relative h-64 rounded-lg mb-6 overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600">
                  {file.previewImage ? (
                    <img 
                      src={file.previewImage} 
                      alt={`${file.title} 미리보기`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-white">
                        <FileText className="h-24 w-24 mx-auto mb-2 opacity-50" />
                        <p className="text-lg font-semibold">[파일 미리보기]</p>
                        <p className="text-sm opacity-75">미리보기 이미지가 설정되지 않았습니다</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <div className="bg-white text-green-600 px-4 py-2 rounded-full font-semibold">
                      무료
                    </div>
                  </div>
                </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {file.title}
              </h1>
              <p className="text-xl text-gray-600 mb-6">{file.description}</p>

              <div className="flex flex-wrap items-center gap-6 mb-6 text-gray-600">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>{file.format}</span>
                </div>
                {file.size && (
                  <div className="flex items-center space-x-2">
                    <Download className="h-5 w-5" />
                    <span>{file.size}</span>
                  </div>
                )}
                {file.pages && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>{file.pages}</span>
                  </div>
                )}
                <div>
                  <span>접근 횟수: {file.downloads?.toLocaleString() || 0}</span>
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">파일 소개</h2>
                <p className="text-gray-700 leading-relaxed">{file.fullDescription || file.description}</p>
              </div>
              </div>
            )}

            {/* Reviews Section */}
            {!showViewer && (
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
                        placeholder="이 파일에 대한 리뷰를 작성해주세요..."
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
                            {review.updatedAt && review.updatedAt !== review.createdAt && (
                              <span className="ml-2">(수정됨)</span>
                            )}
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
                  아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!
                </div>
              )}
            </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <div className="mb-6">
                <div className="text-3xl font-bold text-green-600 mb-2">무료</div>
                <p className="text-gray-600">모든 파일은 무료로 제공됩니다</p>
              </div>

              <button
                onClick={handleViewInBrowser}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors mb-3 flex items-center justify-center space-x-2"
              >
                <Eye className="h-5 w-5" />
                <span>브라우저에서 보기</span>
              </button>

              <button
                onClick={handleDownload}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors mb-4 flex items-center justify-center space-x-2"
              >
                <Download className="h-5 w-5" />
                <span>다운로드</span>
              </button>

              <div className="border-t mt-6 pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">파일 정보:</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>형식:</span>
                    <span className="font-semibold">{file.format}</span>
                  </div>
                  {file.size && (
                    <div className="flex justify-between">
                      <span>크기:</span>
                      <span className="font-semibold">{file.size}</span>
                    </div>
                  )}
                  {file.pages && (
                    <div className="flex justify-between">
                      <span>페이지:</span>
                      <span className="font-semibold">{file.pages}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>접근 횟수:</span>
                    <span className="font-semibold">{file.downloads?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
