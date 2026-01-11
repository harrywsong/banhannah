import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { ArrowLeft, PlayCircle, Video, FileText, Download, Clock, Star, MessageCircle, X, Lock, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useReviews } from '../contexts/ReviewsContext'

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
  const [progress, setProgress] = useState({}) // Track lesson progress

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    const savedCourses = JSON.parse(localStorage.getItem('onlineCourses') || '[]')
    const foundCourse = savedCourses.find(c => c.id === parseInt(id))
    if (foundCourse) {
      setCourse(foundCourse)
      if (foundCourse.lessons && foundCourse.lessons.length > 0) {
        setSelectedLesson(foundCourse.lessons[0])
      }
    }

    // Check if user has purchased this course (for paid courses)
    if (foundCourse && foundCourse.type === 'paid' && user) {
      const purchases = JSON.parse(localStorage.getItem(`coursePurchases_${user.id}`) || '[]')
      const purchased = purchases.find(p => p.courseId === foundCourse.id)
      setIsPurchased(!!purchased)
    }

    // Load progress
    const savedProgress = JSON.parse(localStorage.getItem(`courseProgress_${user.id}_${id}`) || '{}')
    setProgress(savedProgress)

    const itemReviews = getReviewsByItemId(parseInt(id), 'course')
    setReviews(itemReviews)

    // Check if user has already reviewed this course
    const userReview = getUserReview(user.id, parseInt(id), 'course')
    if (userReview) {
      setEditingReview(userReview)
      setReviewForm({ rating: userReview.rating, comment: userReview.comment })
    }
  }, [id, user, navigate, getReviewsByItemId, getUserReview])

  if (!user) {
    return null
  }

  const handlePurchase = () => {
    if (!course || course.type !== 'paid' || !user) return

    const purchases = JSON.parse(localStorage.getItem(`coursePurchases_${user.id}`) || '[]')
    
    if (purchases.find(p => p.courseId === course.id)) {
      alert('이미 구매한 클래스입니다.')
      setIsPurchased(true)
      return
    }

    const purchase = {
      courseId: course.id,
      courseTitle: course.title,
      price: course.price,
      purchasedAt: new Date().toISOString(),
      transactionId: `COURSE_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    }
    
    purchases.push(purchase)
    localStorage.setItem(`coursePurchases_${user.id}`, JSON.stringify(purchases))
    
    setIsPurchased(true)
    alert(`구매가 완료되었습니다!\n거래 ID: ${purchase.transactionId}\n\n이제 클래스를 수강할 수 있습니다.`)
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
    // In production, this would trigger actual file download
    alert(`파일 다운로드: ${file.name || file.title}\n\n(데모: 실제 파일 다운로드로 교체하세요)`)
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
        <p className="text-xl text-gray-600">클래스를 찾을 수 없습니다</p>
      </div>
    )
  }

  const canAccess = course.type === 'free' || isPurchased
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
            온라인 클래스 목록으로 돌아가기
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
                  <p className="text-sm opacity-75">클래스 이미지로 교체하세요</p>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-4">클래스 소개</h2>
                <p className="text-gray-700 leading-relaxed">{course.fullDescription || course.description}</p>
              </div>
            </div>

            {/* Lessons Section */}
            {canAccess ? (
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
                      onClick={() => handleLessonSelect(lesson)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-grow">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{lesson.title}</h3>
                              {progress[lesson.id]?.completed && (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                            {lesson.duration && (
                              <div className="flex items-center space-x-1 text-sm text-gray-500 mb-2">
                                <Clock className="h-4 w-4" />
                                <span>{lesson.duration}</span>
                              </div>
                            )}
                            {lesson.files && lesson.files.length > 0 && (
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

                {/* Video Player for Selected Lesson */}
                {selectedLesson && (
                  <div className="mt-8 border-t pt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedLesson.title}</h3>
                    <div className="aspect-video bg-black rounded-lg mb-4 flex items-center justify-center">
                      {selectedLesson.videoUrl ? (
                        <video
                          src={selectedLesson.videoUrl}
                          controls
                          className="w-full h-full rounded-lg"
                        >
                          비디오를 재생할 수 없습니다.
                        </video>
                      ) : (
                        <div className="text-center text-white">
                          <Video className="h-16 w-16 mx-auto mb-2 opacity-50" />
                          <p className="text-lg font-semibold">[비디오 플레이어]</p>
                          <p className="text-sm opacity-75">비디오 URL을 설정하면 여기에 표시됩니다</p>
                        </div>
                      )}
                    </div>
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
            ) : (
              <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                <div className="text-center py-12">
                  <Lock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">유료 클래스입니다</h3>
                  <p className="text-gray-600 mb-6">이 클래스를 수강하려면 구매가 필요합니다.</p>
                  <div className="text-3xl font-bold text-orange-600 mb-6">{course.price}</div>
                  <button
                    onClick={handlePurchase}
                    className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    지금 구매하기
                  </button>
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
                  <h3 className="font-semibold text-gray-900 mb-4">클래스 정보:</h3>
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
