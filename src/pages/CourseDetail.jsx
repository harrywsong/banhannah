import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, PlayCircle, Video, FileText, Download, Clock, Star, MessageCircle, X, Lock, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useReviews } from '../contexts/ReviewsContext'
import { apiEndpoint, apiRequest } from '../config/api'

export default function CourseDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { getReviewsByItemId, addReview, updateReview, getUserReview } = useReviews()
  const [course, setCourse] = useState(null)
  const [reviews, setReviews] = useState([])
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [editingReview, setEditingReview] = useState(null)
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [isPurchased, setIsPurchased] = useState(false)
  const [purchaseExpired, setPurchaseExpired] = useState(false)
  const [canAccessContent, setCanAccessContent] = useState(false)
  const [progress, setProgress] = useState({}) // Track lesson progress

  useEffect(() => {
    // Load course from backend API
    const loadCourse = async () => {
      try {
        const response = await apiRequest(apiEndpoint(`courses/metadata/${id}`))
        if (response.ok) {
          const data = await response.json()
          const foundCourse = data.course
          if (foundCourse) {
            setCourse(foundCourse)
            if (foundCourse.lessons && foundCourse.lessons.length > 0) {
              setSelectedLesson(foundCourse.lessons[0])
            }
          }
        } else {
          // Fallback to localStorage if backend fails
          const savedCourses = JSON.parse(localStorage.getItem('onlineCourses') || '[]')
          const foundCourse = savedCourses.find(c => c.id === parseInt(id))
          if (foundCourse) {
            setCourse(foundCourse)
            if (foundCourse.lessons && foundCourse.lessons.length > 0) {
              setSelectedLesson(foundCourse.lessons[0])
            }
          }
        }
      } catch (error) {
        console.error('Error loading course:', error)
        // Fallback to localStorage if backend fails
        const savedCourses = JSON.parse(localStorage.getItem('onlineCourses') || '[]')
        const foundCourse = savedCourses.find(c => c.id === parseInt(id))
        if (foundCourse) {
          setCourse(foundCourse)
          if (foundCourse.lessons && foundCourse.lessons.length > 0) {
            setSelectedLesson(foundCourse.lessons[0])
          }
        }
      }
    }

    loadCourse()

    // Load reviews (visible to everyone)
    const itemReviews = getReviewsByItemId(parseInt(id), 'course')
    setReviews(itemReviews)

    if (!user) {
      return
    }

    // Check if user has purchased this course (for paid courses)
    if (foundCourse && foundCourse.type === 'paid') {
      const purchases = JSON.parse(localStorage.getItem(`coursePurchases_${user.id}`) || '[]')
      const purchase = purchases.find(p => p.courseId === foundCourse.id)
      if (purchase) {
        setIsPurchased(true)
        // Check if purchase has expired
        const purchasedAt = new Date(purchase.purchasedAt)
        const accessDuration = foundCourse.accessDuration || 30 // Default 30 days
        const expiresAt = new Date(purchasedAt.getTime() + accessDuration * 24 * 60 * 60 * 1000)
        const now = new Date()
        if (now > expiresAt) {
          setPurchaseExpired(true)
          setCanAccessContent(false)
        } else {
          setPurchaseExpired(false)
          setCanAccessContent(true)
        }
      } else {
        setIsPurchased(false)
        setCanAccessContent(false)
      }
    } else if (foundCourse && foundCourse.type === 'free') {
      // Free courses are always accessible
      setIsPurchased(true)
      setCanAccessContent(true)
    }

    // Load progress
    const savedProgress = JSON.parse(localStorage.getItem(`courseProgress_${user.id}_${id}`) || '{}')
    setProgress(savedProgress)

    // Check if user has already reviewed this course
    const userReview = getUserReview(user.id, parseInt(id), 'course')
    if (userReview) {
      setEditingReview(userReview)
      setReviewForm({ rating: userReview.rating, comment: userReview.comment })
    }
  }, [id, user, navigate, getReviewsByItemId, getUserReview])

  const handlePurchase = () => {
    if (!course || course.type !== 'paid' || !user) return

    const purchases = JSON.parse(localStorage.getItem(`coursePurchases_${user.id}`) || '[]')
    
    const existingPurchase = purchases.find(p => p.courseId === course.id)
    if (existingPurchase) {
      // Check if expired, if so, allow repurchase
      const purchasedAt = new Date(existingPurchase.purchasedAt)
      const accessDuration = course.accessDuration || 30
      const expiresAt = new Date(purchasedAt.getTime() + accessDuration * 24 * 60 * 60 * 1000)
      const now = new Date()
      if (now <= expiresAt) {
        alert('이미 구매한 코스입니다.')
        setIsPurchased(true)
        setCanAccessContent(true)
        return
      }
    }

    const purchase = {
      courseId: course.id,
      courseTitle: course.title,
      price: course.price,
      purchasedAt: new Date().toISOString(),
      accessDuration: course.accessDuration || 30,
      transactionId: `COURSE_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    }
    
    // Remove existing purchase if expired, then add new one
    const updatedPurchases = purchases.filter(p => p.courseId !== course.id)
    updatedPurchases.push(purchase)
    localStorage.setItem(`coursePurchases_${user.id}`, JSON.stringify(updatedPurchases))
    
    setIsPurchased(true)
    setPurchaseExpired(false)
    setCanAccessContent(true)
    alert(`구매가 완료되었습니다!\n거래 ID: ${purchase.transactionId}\n\n접근 기간: ${purchase.accessDuration}일\n이제 코스를 수강할 수 있습니다.`)
  }

  const handleLessonSelect = (lesson) => {
    setSelectedLesson(lesson)
  }

  const handleMarkComplete = (lessonId) => {
    const updatedProgress = {
      ...progress,
      [lessonId]: { completed: true, completedAt: new Date().toISOString() }
    }
    setProgress(updatedProgress)
    localStorage.setItem(`courseProgress_${user.id}_${id}`, JSON.stringify(updatedProgress))
  }

  const handleDownloadLessonFile = (file) => {
    if (!canAccess) {
      alert('코스를 구매하여 파일을 다운로드할 수 있습니다.')
      return
    }
    // In production, this would trigger actual file download
    alert(`파일 다운로드: ${file.name || file.title}\n\n(데모: 실제 파일 다운로드로 교체하세요)`)
  }

  const handleReviewSubmit = (e) => {
    e.preventDefault()
    if (!user) {
      alert('로그인이 필요합니다')
      return
    }

    // Check if user has purchased/accessed the course
    if (!canAccess && !editingReview) {
      alert('리뷰를 작성하려면 먼저 코스를 구매하거나 접근해야 합니다.')
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
        itemType: 'course',
        itemTitle: course.title,
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

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">코스를 찾을 수 없습니다</p>
      </div>
    )
  }

  const canAccess = course.type === 'free' || canAccessContent
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
            온라인 코스 목록으로 돌아가기
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Course Header */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <div className="relative h-64 rounded-lg mb-6 bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                <div className="text-center text-white">
                  <Video className="h-24 w-24 mx-auto mb-2 opacity-50" />
                  <p className="text-lg font-semibold">[클래스 이미지]</p>
                  <p className="text-sm opacity-75">코스 이미지로 교체하세요</p>
                </div>
                <div className="absolute top-4 right-4">
                  {course.type === 'paid' ? (
                    <div className="bg-white text-orange-600 px-4 py-2 rounded-full font-semibold">
                      유료
                    </div>
                  ) : (
                    <div className="bg-white text-green-600 px-4 py-2 rounded-full font-semibold">
                      무료
                    </div>
                  )}
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {course.title}
              </h1>
              <p className="text-xl text-gray-600 mb-6">{course.description}</p>

              <div className="flex flex-wrap items-center gap-6 mb-6 text-gray-600">
                <div className="flex items-center space-x-2">
                  <Video className="h-5 w-5" />
                  <span>{course.lessons?.length || 0}개 레슨</span>
                </div>
                {course.students && (
                  <div>
                    <span>{course.students.toLocaleString()}명 수강</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">코스 소개</h2>
                <p className="text-gray-700 leading-relaxed">{course.fullDescription || course.description}</p>
              </div>
            </div>

            {/* Lessons Section - Always visible, but content restricted */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">레슨 목록</h2>
              <div className="space-y-4">
                {course.lessons?.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedLesson?.id === lesson.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                    onClick={() => {
                      if (canAccess) {
                        handleLessonSelect(lesson)
                      } else {
                        alert('코스를 구매하거나 로그인하여 레슨을 볼 수 있습니다.')
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-grow">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{lesson.title}</h3>
                            {canAccess && progress[lesson.id]?.completed && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                          </div>
                          {lesson.duration && (
                            <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
                              <Clock className="h-4 w-4" />
                              <span>{lesson.duration}</span>
                            </div>
                          )}
                          {canAccess && lesson.files && lesson.files.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {lesson.files.map((file, fileIndex) => (
                                <div
                                  key={fileIndex}
                                  className="flex items-center space-x-2 text-sm text-gray-600"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDownloadLessonFile(file)
                                  }}
                                >
                                  <FileText className="h-4 w-4" />
                                  <span className="hover:text-primary-600">{file.name || file.title}</span>
                                  <Download className="h-3 w-3" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

{/* Video Player for Selected Lesson - Only if canAccess */}
{canAccess && selectedLesson && (
                <div className="mt-8 border-t pt-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedLesson.title}</h3>
                  <div className="aspect-video bg-black rounded-lg mb-4 overflow-hidden">
                    {selectedLesson.videoUrl ? (
                      <iframe
                        src={(() => {
                          // Convert video URL to embed format
                          const url = selectedLesson.videoUrl;
                          
                          // YouTube
                          const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
                          if (youtubeMatch) {
                            const videoId = youtubeMatch[1];
                            return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&controls=1`;
                          }
                          
                          // Vimeo
                          const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
                          if (vimeoMatch) {
                            const videoId = vimeoMatch[1];
                            return `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`;
                          }
                          
                          // Google Drive
                          const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
                          if (driveMatch) {
                            const fileId = driveMatch[1];
                            return `https://drive.google.com/file/d/${fileId}/preview`;
                          }
                          
                          // Already embed URL or unknown format
                          return url;
                        })()}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={selectedLesson.title}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <div className="text-center">
                          <Video className="h-16 w-16 mx-auto mb-2 opacity-50" />
                          <p className="text-lg font-semibold">비디오가 설정되지 않았습니다</p>
                          <p className="text-sm opacity-75">관리자가 비디오 URL을 추가해야 합니다</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Video Platform Info */}
                  {selectedLesson.videoUrl && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>안내:</strong> 이 비디오는 {(() => {
                          const url = selectedLesson.videoUrl;
                          if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
                          if (url.includes('vimeo.com')) return 'Vimeo';
                          if (url.includes('drive.google.com')) return 'Google Drive';
                          return '외부 플랫폼';
                        })()}에서 스트리밍됩니다. 다운로드가 제한되며 이 페이지에서만 시청 가능합니다.
                      </p>
                    </div>
                  )}
                  
                  {!progress[selectedLesson.id]?.completed && (
                    <button
                      onClick={() => handleMarkComplete(selectedLesson.id)}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <CheckCircle className="h-5 w-5" />
                      <span>레슨 완료로 표시</span>
                    </button>
                  )}
                  {progress[selectedLesson.id]?.completed && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      <span>레슨을 완료했습니다!</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Purchase/Login Prompt */}
            {!canAccess && course.type === 'paid' && user && !purchaseExpired && (
              <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                <div className="text-center py-12">
                  <Lock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">유료 코스입니다</h3>
                  <p className="text-gray-600 mb-6">이 코스를 수강하려면 구매가 필요합니다.</p>
                  <div className="text-3xl font-bold text-orange-600 mb-2">{course.price}</div>
                  {course.accessDuration && (
                    <p className="text-sm text-gray-500 mb-6">구매 후 {course.accessDuration}일간 접근 가능</p>
                  )}
                  <button
                    onClick={handlePurchase}
                    className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    지금 구매하기
                  </button>
                </div>
              </div>
            )}

            {!canAccess && course.type === 'paid' && user && purchaseExpired && (
              <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                <div className="text-center py-12">
                  <Lock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">접근 기간이 만료되었습니다</h3>
                  <p className="text-gray-600 mb-6">이 코스를 계속 수강하려면 다시 구매해주세요.</p>
                  <div className="text-3xl font-bold text-orange-600 mb-2">{course.price}</div>
                  {course.accessDuration && (
                    <p className="text-sm text-gray-500 mb-6">구매 후 {course.accessDuration}일간 접근 가능</p>
                  )}
                  <button
                    onClick={handlePurchase}
                    className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    다시 구매하기
                  </button>
                </div>
              </div>
            )}

            {!canAccess && course.type === 'paid' && !user && (
              <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                <div className="text-center py-12">
                  <Lock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h3>
                  <p className="text-gray-600 mb-6">이 코스를 수강하려면 로그인 후 구매해주세요.</p>
                  <Link
                    to="/login"
                    className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    로그인하기
                  </Link>
                </div>
              </div>
            )}

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
                {user && canAccess && (
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
                        placeholder="이 클래스에 대한 리뷰를 작성해주세요..."
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
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <div className="mb-6">
                {course.type === 'paid' ? (
                  <>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{course.price}</div>
                    <p className="text-gray-600">일회성 구매</p>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-green-600 mb-2">무료</div>
                    <p className="text-gray-600">결제 불필요</p>
                  </>
                )}
              </div>

              {course.type === 'paid' && !isPurchased && (
                <button
                  onClick={handlePurchase}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors mb-4"
                >
                  구매하기
                </button>
              )}

              {canAccess && (
                <div className="border-t mt-6 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">코스 정보:</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>레슨:</span>
                      <span className="font-semibold">{course.lessons?.length || 0}개</span>
                    </div>
                    {course.students && (
                      <div className="flex justify-between">
                        <span>수강생:</span>
                        <span className="font-semibold">{course.students.toLocaleString()}명</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
