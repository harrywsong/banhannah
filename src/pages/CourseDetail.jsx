import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useReviews } from '../contexts/ReviewsContext'
import { apiEndpoint, apiRequest } from '../config/api'
import HLSVideoPlayer from '../components/HLSVideoPlayer'
import { ArrowLeft, PlayCircle, Video, FileText, Download, Clock, Star, MessageCircle, X, Lock, CheckCircle, ChevronRight, ChevronDown, RotateCcw, BookOpen, FileQuestion } from 'lucide-react'

export default function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { getReviewsByItemId, addReview, updateReview, getUserReview } = useReviews()
  const [course, setCourse] = useState(null)
  const [reviews, setReviews] = useState([])
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', isForEntireCourse: false, lessonId: null })
  const [editingReview, setEditingReview] = useState(null)
  const [selectedLesson, setSelectedLesson] = useState(null)
  const [isPurchased, setIsPurchased] = useState(false)
  const [purchaseExpired, setPurchaseExpired] = useState(false)
  const [canAccessContent, setCanAccessContent] = useState(false)
  const [progress, setProgress] = useState({})
  const [expandedChapters, setExpandedChapters] = useState({})
  const [showSidebar, setShowSidebar] = useState(true)
  const [questionAnswers, setQuestionAnswers] = useState({})
  const [questionResults, setQuestionResults] = useState({})
  const [matchingAnswers, setMatchingAnswers] = useState({})

  // Interactive Question Handlers
  const handleMultipleChoiceAnswer = (questionId, selectedOption) => {
    setQuestionAnswers({
      ...questionAnswers,
      [questionId]: selectedOption
    })
  }

  const checkMultipleChoiceAnswer = (question, blockId) => {
    const userAnswer = questionAnswers[blockId]
    const isCorrect = userAnswer === question.correctAnswer
    
    setQuestionResults({
      ...questionResults,
      [blockId]: {
        answered: true,
        correct: isCorrect,
        userAnswer,
        correctAnswer: question.correctAnswer
      }
    })
  }

  const handleMatchingAnswer = (questionId, leftIndex, rightValue) => {
    setMatchingAnswers({
      ...matchingAnswers,
      [questionId]: {
        ...(matchingAnswers[questionId] || {}),
        [leftIndex]: rightValue
      }
    })
  }

  const checkMatchingAnswer = (question, blockId) => {
    const userAnswers = matchingAnswers[blockId] || {}
    let correctCount = 0
    
    question.matchingPairs.forEach((pair, index) => {
      if (userAnswers[index] === pair.right) {
        correctCount++
      }
    })
    
    const isCorrect = correctCount === question.matchingPairs.length
    
    setQuestionResults({
      ...questionResults,
      [blockId]: {
        answered: true,
        correct: isCorrect,
        correctCount,
        totalCount: question.matchingPairs.length,
        userAnswers
      }
    })
  }

  const resetQuestion = (questionId) => {
    const newAnswers = { ...questionAnswers }
    delete newAnswers[questionId]
    setQuestionAnswers(newAnswers)
    
    const newMatching = { ...matchingAnswers }
    delete newMatching[questionId]
    setMatchingAnswers(newMatching)
    
    const newResults = { ...questionResults }
    delete newResults[questionId]
    setQuestionResults(newResults)
  }

  // Helper function to check purchase status
  const checkPurchaseStatus = (courseData) => {
    if (!user || !courseData || courseData.type !== 'paid') {
      if (courseData && courseData.type === 'free') {
        setIsPurchased(true)
        setCanAccessContent(true)
      }
      return
    }

    const purchases = JSON.parse(localStorage.getItem(`coursePurchases_${user.id}`) || '[]')
    const purchase = purchases.find(p => p.courseId === courseData.id)
    
    if (purchase) {
      setIsPurchased(true)
      const purchasedAt = new Date(purchase.purchasedAt)
      const accessDuration = courseData.accessDuration || 30
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
  }

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const response = await apiRequest(apiEndpoint(`courses/metadata/${id}`))
        if (response.ok) {
          const data = await response.json()
          const foundCourse = data.course
          
          if (foundCourse) {
            setCourse(foundCourse)
            
            // Select first non-chapter lesson
            if (foundCourse.lessons && foundCourse.lessons.length > 0) {
              const firstLesson = foundCourse.lessons.find(l => l.type !== 'chapter') || foundCourse.lessons[0]
              setSelectedLesson(firstLesson)
            }
            
            // Auto-expand all chapters
            const initialExpanded = {}
            foundCourse.lessons?.forEach((lesson, index) => {
              if (lesson.type === 'chapter') {
                initialExpanded[lesson.id] = true
              }
            })
            setExpandedChapters(initialExpanded)
            
            checkPurchaseStatus(foundCourse)
          }
        } else {
          const savedCourses = JSON.parse(localStorage.getItem('onlineCourses') || '[]')
          const foundCourse = savedCourses.find(c => c.id === parseInt(id))
          
          if (foundCourse) {
            setCourse(foundCourse)
            if (foundCourse.lessons && foundCourse.lessons.length > 0) {
              const firstLesson = foundCourse.lessons.find(l => l.type !== 'chapter') || foundCourse.lessons[0]
              setSelectedLesson(firstLesson)
            }
            
            const initialExpanded = {}
            foundCourse.lessons?.forEach((lesson) => {
              if (lesson.type === 'chapter') {
                initialExpanded[lesson.id] = true
              }
            })
            setExpandedChapters(initialExpanded)
            
            checkPurchaseStatus(foundCourse)
          }
        }
      } catch (error) {
        console.error('Error loading course:', error)
        const savedCourses = JSON.parse(localStorage.getItem('onlineCourses') || '[]')
        const foundCourse = savedCourses.find(c => c.id === parseInt(id))
        
        if (foundCourse) {
          setCourse(foundCourse)
          if (foundCourse.lessons && foundCourse.lessons.length > 0) {
            const firstLesson = foundCourse.lessons.find(l => l.type !== 'chapter') || foundCourse.lessons[0]
            setSelectedLesson(firstLesson)
          }
          
          const initialExpanded = {}
          foundCourse.lessons?.forEach((lesson) => {
            if (lesson.type === 'chapter') {
              initialExpanded[lesson.id] = true
            }
          })
          setExpandedChapters(initialExpanded)
          
          checkPurchaseStatus(foundCourse)
        }
      }
    }

    loadCourse()

    const itemReviews = getReviewsByItemId(parseInt(id), 'course')
    setReviews(itemReviews)

    if (user) {
      const savedProgress = JSON.parse(localStorage.getItem(`courseProgress_${user.id}_${id}`) || '{}')
      setProgress(savedProgress)

      const userReview = getUserReview(user.id, parseInt(id), 'course')
      if (userReview) {
        setEditingReview(userReview)
        setReviewForm({ rating: userReview.rating, comment: userReview.comment })
      }
    }
  }, [id, user, getReviewsByItemId, getUserReview])

  const handlePurchase = () => {
    if (!course || course.type !== 'paid' || !user) return

    // Use file system storage to match backend
    const purchases = JSON.parse(localStorage.getItem(`coursePurchases_${user.id}`) || '[]')
    
    const existingPurchase = purchases.find(p => p.courseId === course.id)
    if (existingPurchase) {
      const purchasedAt = new Date(existingPurchase.purchasedAt)
      const accessDuration = course.accessDuration || 30
      const expiresAt = new Date(purchasedAt.getTime() + accessDuration * 24 * 60 * 60 * 1000)
      const now = new Date()
      
      if (now <= expiresAt) {
        const remainingDays = Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000))
        alert(`이미 구매한 코스입니다.\n\n접근 만료일: ${expiresAt.toLocaleDateString('ko-KR')}\n남은 기간: ${remainingDays}일`)
        setIsPurchased(true)
        setCanAccessContent(true)
        return
      } else {
        // Access expired - offer renewal
        if (window.confirm(`이 코스의 접근 기간이 만료되었습니다.\n\n만료일: ${expiresAt.toLocaleDateString('ko-KR')}\n\n${course.price}에 다시 구매하시겠습니까?`)) {
          // Continue with purchase
        } else {
          return
        }
      }
    }

    // Show confirmation with access duration
    const accessDuration = course.accessDuration || 30
    const confirmMessage = `${course.title} 구매 확인\n\n가격: ${course.price}\n접근 기간: ${accessDuration}일\n\n구매하시겠습니까?`
    
    if (!window.confirm(confirmMessage)) {
      return
    }

    const purchase = {
      courseId: course.id,
      courseTitle: course.title,
      price: course.price,
      purchasedAt: new Date().toISOString(),
      accessDuration: accessDuration,
      transactionId: `COURSE_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    }
    
    // Update local storage
    const updatedPurchases = purchases.filter(p => p.courseId !== course.id)
    updatedPurchases.push(purchase)
    localStorage.setItem(`coursePurchases_${user.id}`, JSON.stringify(updatedPurchases))
    
    // IMPORTANT: Also save to backend data directory for server-side validation
    // This would be done via API call in production
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/courses/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      credentials: 'include',
      body: JSON.stringify(purchase)
    }).catch(err => console.error('Failed to save purchase to backend:', err))
    
    setIsPurchased(true)
    setPurchaseExpired(false)
    setCanAccessContent(true)
    
    const expiresAt = new Date(Date.now() + accessDuration * 24 * 60 * 60 * 1000)
    alert(`구매가 완료되었습니다!\n\n거래 ID: ${purchase.transactionId}\n접근 기간: ${accessDuration}일\n접근 만료일: ${expiresAt.toLocaleDateString('ko-KR')}\n\n이제 코스를 수강할 수 있습니다.`)
  }

  const handleLessonSelect = (lesson) => {
    if (lesson.type === 'chapter') {
      // Toggle chapter expansion
      setExpandedChapters(prev => ({
        ...prev,
        [lesson.id]: !prev[lesson.id]
      }))
    } else {
      setSelectedLesson(lesson)
    }
  }

  const handleMarkComplete = (lessonId) => {
    const updatedProgress = {
      ...progress,
      [lessonId]: { completed: true, completedAt: new Date().toISOString() }
    }
    setProgress(updatedProgress)
    localStorage.setItem(`courseProgress_${user.id}_${id}`, JSON.stringify(updatedProgress))
  }

  const handleMarkIncomplete = (lessonId) => {
    const updatedProgress = { ...progress }
    delete updatedProgress[lessonId]
    setProgress(updatedProgress)
    localStorage.setItem(`courseProgress_${user.id}_${id}`, JSON.stringify(updatedProgress))
  }

  const handleDownloadLessonFile = (file) => {
    if (!canAccess) {
      alert('코스를 구매하여 파일을 다운로드할 수 있습니다.')
      return
    }
    alert(`파일 다운로드: ${file.name || file.title}\n\n(데모: 실제 파일 다운로드로 교체하세요)`)
  }

  const handleReviewSubmit = (e) => {
    e.preventDefault()
    if (!user) {
      alert('로그인이 필요합니다')
      return
    }
  
    if (!canAccess && !editingReview) {
      alert('리뷰를 작성하려면 먼저 코스를 구매하거나 접근해야 합니다.')
      return
    }
  
    // Check for duplicate reviews
    const targetId = reviewForm.isForEntireCourse ? `course-${id}` : `lesson-${reviewForm.lessonId || selectedLesson?.id}`;
    const existingReview = reviews.find(r => 
      r.userId === user.id && 
      r.targetId === targetId &&
      (!editingReview || r.id !== editingReview.id)
    );
  
    if (existingReview) {
      alert(reviewForm.isForEntireCourse ? 
        '이미 전체 코스에 대한 리뷰를 작성하셨습니다.' : 
        '이미 이 레슨에 대한 리뷰를 작성하셨습니다.');
      return;
    }
  
    const reviewTarget = reviewForm.isForEntireCourse ? 
      '전체 코스' : 
      (selectedLesson?.title || '레슨');
  
    if (editingReview) {
      const updatedReview = updateReview(editingReview.id, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        userName: user.name,
        targetId: targetId,
        targetName: reviewTarget
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
        comment: reviewForm.comment,
        targetId: targetId,
        targetName: reviewTarget,
        lessonId: reviewForm.isForEntireCourse ? null : (reviewForm.lessonId || selectedLesson?.id)
      })
  
      setReviews([newReview, ...reviews])
      setEditingReview(newReview)
      setReviewForm({ rating: 5, comment: '', isForEntireCourse: false, lessonId: null })
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

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!course?.lessons) return 0
    const completableLessons = course.lessons.filter(l => l.type !== 'chapter')
    if (completableLessons.length === 0) return 0
    const completed = completableLessons.filter(l => progress[l.id]?.completed).length
    return Math.round((completed / completableLessons.length) * 100)
  }

// Calculate content statistics
const getContentStats = () => {
  if (!course?.lessons) return {
    chapters: 0,
    lessons: 0,
    videos: 0,
    files: 0,
    exercises: 0
  }

  let stats = {
    chapters: 0,
    lessons: 0,
    videos: 0,
    files: 0,
    exercises: 0
  }

  course.lessons.forEach(lesson => {
    if (lesson.type === 'chapter') {
      stats.chapters++
    } else {
      stats.lessons++
      
      // Count content blocks (NEW SYSTEM)
      if (lesson.content && Array.isArray(lesson.content)) {
        lesson.content.forEach(block => {
          if (block.type === 'video' && block.data?.url) {
            stats.videos++
          } else if (block.type === 'file' && block.data?.url) {
            stats.files++
          } else if (block.type === 'question') {
            stats.exercises++
          }
        })
      }
      
      // Legacy system support
      if (lesson.videoUrl) {
        stats.videos++
      }
      
      if (lesson.files && lesson.files.length > 0) {
        stats.files += lesson.files.length
      }
      
      if (lesson.questions && lesson.questions.length > 0) {
        stats.exercises += lesson.questions.length
      }
    }
  })

  return stats
}

// Group lessons by chapters
const groupLessonsByChapters = () => {
  if (!course?.lessons) return []
  
  const groups = []
  let currentChapter = null
  let currentLessons = []
  
  course.lessons.forEach((lesson, index) => {
    if (lesson.type === 'chapter') {
      if (currentChapter || currentLessons.length > 0) {
        groups.push({ chapter: currentChapter, lessons: currentLessons })
      }
      currentChapter = lesson
      currentLessons = []
    } else {
      currentLessons.push(lesson)
    }
  })
  
  if (currentChapter || currentLessons.length > 0) {
    groups.push({ chapter: currentChapter, lessons: currentLessons })
  }
  
  return groups
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
  const progressPercentage = calculateProgress()
  const groupedLessons = groupLessonsByChapters()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/resources" className="inline-flex items-center text-primary-600 hover:text-primary-700">
            <ArrowLeft className="h-5 w-5 mr-2" />
            온라인 코스 목록으로 돌아가기
          </Link>
          {canAccess && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                진행률: <span className="font-semibold text-primary-600">{progressPercentage}%</span>
              </div>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Course Navigation */}
          {canAccess && (
            <div className={`lg:col-span-1 ${showSidebar ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary-600" />
                    코스 목차
                  </h3>
                </div>

                <div className="space-y-2">
                  {groupedLessons.map((group, groupIndex) => (
                    <div key={groupIndex}>
                      {/* Chapter Header */}
                      {group.chapter && (
                        <button
                          onClick={() => handleLessonSelect(group.chapter)}
                          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg transition-colors mb-2"
                        >
                          <div className="flex items-center gap-2">
                            {expandedChapters[group.chapter.id] ? (
                              <ChevronDown className="h-4 w-4 text-blue-600" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-blue-600" />
                            )}
                            <span className="font-semibold text-blue-900 text-left">{group.chapter.title}</span>
                          </div>
                        </button>
                      )}

                      {/* Lessons under chapter */}
                      {(!group.chapter || expandedChapters[group.chapter.id]) && (
                        <div className={`space-y-1 ${group.chapter ? 'ml-4 border-l-2 border-blue-200 pl-2' : ''}`}>
                          {group.lessons.map((lesson) => (
                            <button
                              key={lesson.id}
                              onClick={() => handleLessonSelect(lesson)}
                              className={`w-full text-left p-3 rounded-lg transition-all ${
                                selectedLesson?.id === lesson.id
                                  ? 'bg-primary-50 border-2 border-primary-500 shadow-sm'
                                  : 'hover:bg-gray-50 border-2 border-transparent'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex-shrink-0 mt-1">
                                  {progress[lesson.id]?.completed ? (
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                                  )}
                                </div>
                                <div className="flex-grow min-w-0">
                                  <div className="font-medium text-gray-900 text-sm line-clamp-2">
                                    {lesson.title}
                                  </div>
                                  {lesson.duration && (
                                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {lesson.duration}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className={canAccess ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {/* Course Overview (shown when no lesson selected or course not accessed) */}
            {(!selectedLesson || !canAccess) && (
              <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                <div className="relative h-64 rounded-lg mb-6 bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Video className="h-24 w-24 mx-auto mb-2 opacity-50" />
                    <p className="text-lg font-semibold">[코스 이미지]</p>
                    <p className="text-sm opacity-75">코스 이미지로 교체하세요</p>
                  </div>
                  <div className="absolute top-4 right-4">
                    {course.type === 'paid' ? (
                      <div className="bg-white text-orange-600 px-4 py-2 rounded-full font-semibold">유료</div>
                    ) : (
                      <div className="bg-white text-green-600 px-4 py-2 rounded-full font-semibold">무료</div>
                    )}
                  </div>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{course.title}</h1>
                <p className="text-xl text-gray-600 mb-6">{course.description}</p>

                <div className="flex flex-wrap items-center gap-6 mb-6 text-gray-600">
                {(() => {
  const stats = getContentStats()
  return (
    <>
      {stats.chapters > 0 && (
        <div className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <span>{stats.chapters}개 챕터</span>
        </div>
      )}
      {stats.lessons > 0 && (
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-purple-600" />
          <span>{stats.lessons}개 레슨</span>
        </div>
      )}
      {stats.videos > 0 && (
        <div className="flex items-center space-x-2">
          <Video className="h-5 w-5 text-red-600" />
          <span>{stats.videos}개 비디오</span>
        </div>
      )}
      {stats.files > 0 && (
        <div className="flex items-center space-x-2">
          <Download className="h-5 w-5 text-green-600" />
          <span>{stats.files}개 파일</span>
        </div>
      )}
      {stats.exercises > 0 && (
        <div className="flex items-center space-x-2">
          <FileQuestion className="h-5 w-5 text-orange-600" />
          <span>{stats.exercises}개 문제</span>
        </div>
      )}
    </>
  )
})()}
                  {course.students && <div><span>{course.students.toLocaleString()}명 수강</span></div>}
                  {averageRating > 0 && (
                    <div className="flex items-center space-x-2">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                      <span>{averageRating} ({reviews.length})</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">코스 소개</h2>
                  <p className="text-gray-700 leading-relaxed">{course.fullDescription || course.description}</p>
                </div>

                {!canAccess && course.type === 'paid' && (
                  <div className="mt-8 p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200">
                    <div className="flex items-start gap-4">
                      <Lock className="h-8 w-8 text-orange-600 flex-shrink-0" />
                      <div className="flex-grow">
                        <h3 className="text-xl font-bold text-orange-900 mb-2">
                          {purchaseExpired ? '코스 접근 기간 만료' : '유료 코스입니다'}
                        </h3>
                        <p className="text-orange-800 mb-4">
                          {purchaseExpired 
                            ? '이 코스의 접근 기간이 만료되었습니다. 다시 구매하여 접근 권한을 복원하세요.'
                            : '이 코스를 수강하려면 구매가 필요합니다.'
                          }
                        </p>
                        <div className="flex items-center gap-6 mb-4">
                          <div>
                            <div className="text-3xl font-bold text-orange-600">{course.price}</div>
                            {course.accessDuration && (
                              <p className="text-sm text-orange-700 mt-1">
                                {purchaseExpired ? '재구매 시 ' : '구매 후 '}
                                {course.accessDuration}일간 접근 가능
                              </p>
                            )}
                          </div>
                        </div>
                        <button 
                          onClick={handlePurchase}
                          className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg"
                        >
                          지금 구매하기
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Lesson Content (shown when lesson selected and access granted) */}
            {canAccess && selectedLesson && selectedLesson.type !== 'chapter' && (
              <div className="space-y-6">
                {/* Lesson Header */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-grow">
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedLesson.title}</h2>
                      {selectedLesson.description && (
                        <p className="text-gray-600 mb-4">{selectedLesson.description}</p>
                      )}
                      {selectedLesson.duration && (
                        <div className="flex items-center text-gray-500 text-sm">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{selectedLesson.duration}</span>
                        </div>
                      )}
                    </div>
                    {progress[selectedLesson.id]?.completed ? (
                      <button
                        onClick={() => handleMarkIncomplete(selectedLesson.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        title="완료 취소"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span className="hidden sm:inline">완료 취소</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkComplete(selectedLesson.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">완료 표시</span>
                      </button>
                    )}
                  </div>
                  
                  {progress[selectedLesson.id]?.completed && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">
                        이 레슨을 완료했습니다! 
                        {progress[selectedLesson.id]?.completedAt && (
                          <span className="text-green-600 ml-2">
                            ({new Date(progress[selectedLesson.id].completedAt).toLocaleDateString('ko-KR')})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

            {/* Lesson Content Blocks */}
{selectedLesson.content && selectedLesson.content.length > 0 ? (
  <div className="space-y-6">
    {selectedLesson.content.sort((a, b) => a.order - b.order).map((block) => {
            // Video Block
      if (block.type === 'video' && block.data?.url) {
              console.log('🎥 Rendering video block:', {
                blockId: block.id,
                url: block.data.url,
                videoId: block.data.videoId
              });
        const hlsMatch = block.data.url.match(/\/api\/videos\/hls\/([^\/]+)/);
        
        return (
          <div key={block.id} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="aspect-video bg-black">
              {hlsMatch ? (
                <HLSVideoPlayer 
                  key={`video-${block.id}`}
                  videoId={hlsMatch[1]}
                  autoPlay={false}
                  onError={(err) => {
                    console.error('Video error:', err);
                  }}
                />
              ) : (
                (() => {
                  const url = block.data.url;
                  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
                  if (youtubeMatch) {
                    return (
                      <iframe
                        key={`youtube-${block.id}`}
                        src={`https://www.youtube-nocookie.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1&controls=1`}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="Video"
                      />
                    );
                  }
                  
                  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
                  if (vimeoMatch) {
                    return (
                      <iframe
                        key={`vimeo-${block.id}`}
                        src={`https://player.vimeo.com/video/${vimeoMatch[1]}?title=0&byline=0&portrait=0`}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title="Video"
                      />
                    );
                  }
                  
                  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
                  if (driveMatch) {
                    return (
                      <iframe
                        key={`drive-${block.id}`}
                        src={`https://drive.google.com/file/d/${driveMatch[1]}/preview`}
                        className="w-full h-full"
                        frameBorder="0"
                        allow="autoplay"
                        title="Video"
                      />
                    );
                  }
                  
                  return (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <div className="text-center">
                        <Video className="h-16 w-16 mx-auto mb-2 opacity-50" />
                        <p className="text-lg font-semibold">지원되지 않는 비디오 형식입니다</p>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        );
      }
      
{/* Text Block */}
if (block.type === 'text' && block.data.content) {
  return (
    <div key={block.id} className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-primary-600" />
        {block.data.title || '강의 내용'}
      </h3>
      <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
        {block.data.content}
      </div>
    </div>
  );
}
      
      // File Block
      if (block.type === 'file' && block.data.name) {
        return (
          <div key={block.id} className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Download className="h-5 w-5 text-primary-600" />
              첨부 파일
            </h3>
            <button
              onClick={() => {
                if (block.data.url) {
                  window.open(block.data.url, '_blank');
                } else {
                  alert(`파일 다운로드: ${block.data.name}\n\n(URL이 설정되지 않았습니다)`);
                }
              }}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
                <span className="font-medium text-gray-900">{block.data.name}</span>
              </div>
              <Download className="h-4 w-4 text-gray-400 group-hover:text-primary-600" />
            </button>
          </div>
        );
      }
      
      // Question Block
      if (block.type === 'question') {
        return (
          <div key={block.id} className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileQuestion className="h-5 w-5 text-primary-600" />
              연습 문제
            </h3>
            
            {block.data.questionType === 'multiple-choice' && (
              <div>
                <p className="font-semibold text-gray-900 mb-4">{block.data.question}</p>
                <div className="space-y-2 mb-4">
                  {block.data.options.map((option, i) => (
                    <button
                      key={i}
                      onClick={() => handleMultipleChoiceAnswer(block.id, i)}
                      disabled={questionResults[block.id]?.answered}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                        questionResults[block.id]?.answered
                          ? i === block.data.correctAnswer
                            ? 'border-green-500 bg-green-50'
                            : i === questionAnswers[block.id]
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 bg-gray-50'
                          : questionAnswers[block.id] === i
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                
                {!questionResults[block.id]?.answered ? (
                  <button
                    onClick={() => checkMultipleChoiceAnswer(block.data, block.id)}
                    disabled={questionAnswers[block.id] === undefined}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    정답 확인
                  </button>
                ) : (
                  <div>
                    <div className={`p-4 rounded-lg mb-2 ${
                      questionResults[block.id].correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {questionResults[block.id].correct ? '✓ 정답입니다!' : '✗ 오답입니다.'}
                    </div>
                    <button
                      onClick={() => resetQuestion(block.id)}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      다시 풀기
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {block.data.questionType === 'matching' && (
  <div>
    <p className="font-semibold text-gray-900 mb-4">항목을 올바르게 연결하세요</p>
    <div className="space-y-3 mb-4">
      {block.data.matchingPairs.map((pair, i) => {
        const userAnswer = matchingAnswers[block.id]?.[i];
        const isAnswered = questionResults[block.id]?.answered;
        const isCorrect = isAnswered && userAnswer === pair.right;
        const isIncorrect = isAnswered && userAnswer && userAnswer !== pair.right;
        
        return (
          <div key={i} className="space-y-2">
            <div className={`flex items-center gap-4 ${
              isAnswered ? (isCorrect ? 'opacity-100' : 'opacity-90') : ''
            }`}>
              <div className="flex-1 p-3 bg-blue-50 rounded-lg border border-blue-200">
                {pair.left}
              </div>
              <span className="text-gray-400">↔</span>
              <select
                value={matchingAnswers[block.id]?.[i] || ''}
                onChange={(e) => handleMatchingAnswer(block.id, i, e.target.value)}
                disabled={questionResults[block.id]?.answered}
                className={`flex-1 p-3 border-2 rounded-lg ${
                  isCorrect ? 'border-green-500 bg-green-50' :
                  isIncorrect ? 'border-red-500 bg-red-50' :
                  'border-gray-300'
                }`}
              >
                <option value="">선택하세요</option>
                {block.data.matchingPairs.map((p, j) => (
                  <option key={j} value={p.right}>{p.right}</option>
                ))}
              </select>
              {isAnswered && (
                <div className="flex-shrink-0">
                  {isCorrect ? (
                    <span className="text-green-600 font-bold">✓</span>
                  ) : (
                    <span className="text-red-600 font-bold">✗</span>
                  )}
                </div>
              )}
            </div>
            {isAnswered && isIncorrect && (
              <div className="text-sm text-gray-600 pl-4">
                정답: <span className="font-semibold text-green-600">{pair.right}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
    
    {!questionResults[block.id]?.answered ? (
      <button
        onClick={() => checkMatchingAnswer(block.data, block.id)}
        className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
      >
        정답 확인
      </button>
    ) : (
      <div>
        <div className={`p-4 rounded-lg mb-2 ${
          questionResults[block.id].correct ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {questionResults[block.id].correct 
            ? '✓ 모두 정답입니다!' 
            : `${questionResults[block.id].correctCount}/${questionResults[block.id].totalCount} 정답`
          }
        </div>
        <button
          onClick={() => resetQuestion(block.id)}
          className="text-primary-600 hover:text-primary-700 font-medium"
        >
          다시 풀기
        </button>
      </div>
    )}
  </div>
)}
          </div>
        );
      }
      
      return null;
    })}
  </div>
) : (
  <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
    <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
    <p className="text-lg">이 레슨에는 아직 콘텐츠가 없습니다.</p>
  </div>
)}

{/* Legacy content support - remove after migration */}
{(!selectedLesson.content || selectedLesson.content.length === 0) && (
  <>
    {/* Text Content */}
    {selectedLesson.textContent && (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary-600" />
          강의 내용
        </h3>
        <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
          {selectedLesson.textContent}
        </div>
      </div>
    )}

    {/* Files */}
    {selectedLesson.files && selectedLesson.files.length > 0 && (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Download className="h-5 w-5 text-primary-600" />
          첨부 파일
        </h3>
        <div className="space-y-2">
          {selectedLesson.files.map((file, fileIndex) => (
            <button
              key={fileIndex}
              onClick={() => handleDownloadLessonFile(file)}
              className="w-full flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
                <span className="font-medium text-gray-900">{file.name || file.title}</span>
              </div>
              <Download className="h-4 w-4 text-gray-400 group-hover:text-primary-600" />
            </button>
          ))}
        </div>
      </div>
    )}
  </>
)}
  </div>)}
            {/* Reviews Section */}
            {canAccess && (
              <div className="bg-white rounded-xl shadow-md p-8 mt-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">리뷰</h2>
                    {reviews.length > 0 && (
                      <div className="flex items-center space-x-2 mt-2">
                        <Star className="h-5 w-5 text-yellow-400 fill-current" />
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
                {showReviewForm && (
  <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-semibold text-gray-900">{editingReview ? '리뷰 수정' : '리뷰 작성'}</h3>
      <button onClick={() => setShowReviewForm(false)} className="text-gray-400 hover:text-gray-600">
        <X className="h-5 w-5" />
      </button>
    </div>
    <form onSubmit={handleReviewSubmit} className="space-y-4">
      {/* Review Target Selection */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={reviewForm.isForEntireCourse || false}
            onChange={(e) => setReviewForm({ ...reviewForm, isForEntireCourse: e.target.checked, lessonId: e.target.checked ? null : selectedLesson?.id })}
            className="h-4 w-4 text-primary-600 rounded"
          />
          <span className="font-medium text-gray-900">전체 코스에 대한 리뷰</span>
        </label>
        {!reviewForm.isForEntireCourse && selectedLesson && (
          <p className="text-sm text-gray-600 mt-2 ml-6">
            현재 레슨: <span className="font-semibold">{selectedLesson.title}</span>
          </p>
        )}
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
                          placeholder="이 코스에 대한 리뷰를 작성해주세요..."
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

                {reviews.length > 0 ? (
                  <div className="space-y-6">
{reviews.map((review) => (
  <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
    <div className="flex items-start justify-between mb-2">
      <div>
        <p className="font-semibold text-gray-900">{review.userName}</p>
        <p className="text-sm text-gray-500">
          {new Date(review.createdAt).toLocaleDateString('ko-KR')}
          {review.targetName && (
            <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs">
              {review.targetName}
            </span>
          )}
        </p>
      </div>
      <div className="flex text-yellow-400">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`h-5 w-5 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
        ))}
      </div>
    </div>
    <p className="text-gray-700">{review.comment}</p>
  </div>
))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}