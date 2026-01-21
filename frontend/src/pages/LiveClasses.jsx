import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Video, Users, ExternalLink, UserCheck, Star, MessageCircle, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useReviews } from '../contexts/ReviewsContext'

export default function LiveClasses({ hideHeader = false }) {
  const { user } = useAuth()
  const { getReviewsByItemId, addReview, updateReview, getUserReview } = useReviews()
  const [classes, setClasses] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [selectedClassForReview, setSelectedClassForReview] = useState(null)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [editingReview, setEditingReview] = useState(null)

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/liveclasses/metadata`, {
          headers: {
            'ngrok-skip-browser-warning': 'true',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to load live classes');
        }
        const data = await response.json();
        setClasses(data.liveclasses || []);
      } catch (error) {
        console.error('Error loading live classes:', error);
      }
    };

    loadClasses();
    // … (keep any other logic in your useEffect)
  }, [user]);

  // Helper to create proper date object from date string (YYYY-MM-DD)
  const getClassDateTime = (classItem) => {
    if (!classItem.date) return null
    // Combine date and time, or use midnight if no time specified
    const dateTimeString = classItem.time 
      ? `${classItem.date}T${classItem.time}:00`
      : `${classItem.date}T00:00:00`
    return new Date(dateTimeString)
  }

  const isRegistrationOpen = (classItem) => {
    if (!classItem.registrationStart || !classItem.registrationEnd) return true
    const now = new Date()
    const start = new Date(classItem.registrationStart)
    const end = new Date(classItem.registrationEnd)
    return now >= start && now <= end
  }

  const handleRegister = (classId) => {
    if (!user) {
      alert('라이브 클래스 등록을 위해 로그인해주세요')
      return
    }

    const classItem = classes.find(c => c.id === classId)
    if (!classItem) return

    if (!isRegistrationOpen(classItem)) {
      alert('등록 기간이 아닙니다.')
      return
    }

    const classDateTime = getClassDateTime(classItem)
    if (classDateTime && classDateTime < new Date()) {
      alert('이미 지난 클래스입니다.')
      return
    }

    const newRegistration = {
      classId,
      userId: user.id,
      registeredAt: new Date().toISOString()
    }

    const updatedRegistrations = [...registrations, newRegistration]
    setRegistrations(updatedRegistrations)
    localStorage.setItem(`registrations_${user.id}`, JSON.stringify(updatedRegistrations))
    
    // Update registered count
    const updatedClasses = classes.map(c => 
      c.id === classId ? { ...c, registeredCount: (c.registeredCount || 0) + 1 } : c
    )
    setClasses(updatedClasses)
    localStorage.setItem('liveClasses', JSON.stringify(updatedClasses))
    
    alert(`"${classItem.title}" 클래스 등록이 완료되었습니다! 대시보드에서 미팅 정보를 확인하세요.`)
  }

  const handleUnregister = (classId) => {
    if (!user) return

    const classItem = classes.find(c => c.id === classId)
    if (!classItem) return

    if (!window.confirm(`"${classItem.title}" 클래스 등록을 취소하시겠습니까?`)) {
      return
    }

    const updatedRegistrations = registrations.filter(r => !(r.classId === classId && r.userId === user.id))
    setRegistrations(updatedRegistrations)
    localStorage.setItem(`registrations_${user.id}`, JSON.stringify(updatedRegistrations))
    
    // Update registered count
    const updatedClasses = classes.map(c => 
      c.id === classId ? { ...c, registeredCount: Math.max(0, (c.registeredCount || 0) - 1) } : c
    )
    setClasses(updatedClasses)
    localStorage.setItem('liveClasses', JSON.stringify(updatedClasses))
    
    alert(`"${classItem.title}" 클래스 등록이 취소되었습니다.`)
  }

  const isRegistered = (classId) => {
    return registrations.some(r => r.classId === classId && r.userId === user?.id)
  }

  const handleReviewSubmit = (e) => {
    e.preventDefault()
    if (!user) {
      alert('로그인이 필요합니다')
      return
    }

    // Check if user has registered for the class
    if (!selectedClassForReview || !isRegistered(selectedClassForReview.id)) {
      alert('리뷰를 작성하려면 먼저 클래스에 등록해야 합니다.')
      return
    }

    if (editingReview) {
      // Update existing review
      updateReview(editingReview.id, {
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        userName: user.name
      })
      setReviewForm({ rating: 5, comment: '' })
      setEditingReview(null)
      setSelectedClassForReview(null)
      alert('리뷰가 수정되었습니다!')
    } else {
      // Create new review
      addReview({
        itemId: selectedClassForReview.id,
        itemType: 'class',
        itemTitle: selectedClassForReview.title,
        userId: user.id,
        userName: user.name,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      })

      setReviewForm({ rating: 5, comment: '' })
      setSelectedClassForReview(null)
      alert('리뷰가 등록되었습니다!')
    }
  }

  const handleOpenReviewForm = (classItem) => {
    setSelectedClassForReview(classItem)
    // Check if user has already reviewed this class
    const userReview = getUserReview(user.id, classItem.id, 'class')
    if (userReview) {
      setEditingReview(userReview)
      setReviewForm({ rating: userReview.rating, comment: userReview.comment })
    } else {
      setEditingReview(null)
      setReviewForm({ rating: 5, comment: '' })
    }
  }

  // Filter classes by date properly
  const now = new Date()
  const upcomingClasses = classes.filter(c => {
    const classDateTime = getClassDateTime(c)
    return classDateTime && classDateTime >= now
  }).sort((a, b) => {
    const dateA = getClassDateTime(a)
    const dateB = getClassDateTime(b)
    return dateA - dateB
  })
  
  const pastClasses = classes.filter(c => {
    const classDateTime = getClassDateTime(c)
    return classDateTime && classDateTime < now
  }).sort((a, b) => {
    const dateA = getClassDateTime(a)
    const dateB = getClassDateTime(b)
    return dateB - dateA // Most recent first
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideHeader && (
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">라이브 클래스</h1>
            <p className="text-xl text-primary-100">전문 강사들과 함께하는 인터랙티브 라이브 세션에 참여하세요</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Upcoming Classes */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">예정된 클래스</h2>
          
          {upcomingClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingClasses.map((classItem) => {
                const registered = isRegistered(classItem.id)
                const isFull = (classItem.registeredCount || 0) >= classItem.maxParticipants
                const spotsLeft = classItem.maxParticipants - (classItem.registeredCount || 0)
                const registrationOpen = isRegistrationOpen(classItem)
                const reviews = getReviewsByItemId(classItem.id, 'class')
                const averageRating = reviews.length > 0
                  ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                  : null

                return (
                  <div key={classItem.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    {/* PLACEHOLDER IMAGE */}
                    <div className="relative h-48 bg-gradient-to-br from-purple-400 to-pink-500 overflow-hidden">
                      {classItem.previewImage ? (
                        <img 
                          src={(() => {
                            // Build URL correctly from filename
                            if (classItem.previewImage.startsWith('http')) {
                              return classItem.previewImage;
                            }
                            
                            // Get API URL from environment
                            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
                            const cleanFilename = classItem.previewImage.split('/').pop();
                            return `${API_URL}/api/files/view/${encodeURIComponent(cleanFilename)}`;
                          })()}
                          alt={`${classItem.title} 미리보기`}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            console.error('❌ Live class preview failed for:', classItem.previewImage);
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center text-white">
                            <Video className="h-16 w-16 mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-semibold">[클래스 이미지]</p>
                            <p className="text-xs opacity-75">미리보기 이미지가 설정되지 않았습니다</p>
                          </div>
                        </div>
                      )}

                      <div className="absolute top-2 right-2 bg-white text-purple-600 px-3 py-1 rounded-full text-sm font-semibold">
                        {classItem.platform}
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{classItem.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">{classItem.description}</p>

                      {averageRating && (
                        <div className="flex items-center space-x-1 mb-3">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-semibold">{averageRating}</span>
                          <span className="text-sm text-gray-500">({reviews.length})</span>
                        </div>
                      )}

                      <div className="space-y-2 mb-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{getClassDateTime(classItem)?.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) || classItem.date}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {classItem.time} ({classItem.duration})
                            {classItem.timezone && (
                              <span className="ml-2 text-xs text-gray-500">
                                [{classItem.timezone.split('/')[1] || classItem.timezone}]
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4" />
                          <span>
                            {classItem.registeredCount || 0}/{classItem.maxParticipants} 등록됨
                            {!isFull && ` (${spotsLeft}자리 남음)`}
                          </span>
                        </div>
                        {classItem.registrationStart && (
                          <div className="text-xs text-gray-500 pt-1 border-t">
                            등록 기간: {new Date(classItem.registrationStart).toLocaleString('ko-KR')} ~ {new Date(classItem.registrationEnd).toLocaleString('ko-KR')}
                          </div>
                        )}
                      </div>

                      {registered ? (
                        <>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                            <div className="flex items-center space-x-2 text-green-700">
                              <UserCheck className="h-5 w-5" />
                              <span className="font-semibold">등록 완료!</span>
                            </div>
                            <p className="text-sm text-green-600 mt-1">대시보드에서 미팅 링크 확인</p>
                          </div>
                          <button
                            onClick={() => handleUnregister(classItem.id)}
                            className="w-full py-3 rounded-lg font-semibold transition-colors mb-4 bg-gray-200 text-gray-700 hover:bg-gray-300"
                          >
                            등록 취소
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleRegister(classItem.id)}
                          disabled={isFull || !registrationOpen}
                          className={`w-full py-3 rounded-lg font-semibold transition-colors mb-4 ${
                            isFull || !registrationOpen
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-primary-600 text-white hover:bg-primary-700'
                          }`}
                        >
                          {!registrationOpen ? '등록 기간이 아닙니다' : isFull ? '정원 마감' : '지금 등록하기'}
                        </button>
                      )}

                      {registered && (
                        <a
                          href={classItem.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center border-2 border-primary-600 text-primary-600 py-2 rounded-lg font-semibold hover:bg-primary-50 transition-colors mb-2"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          미팅 참여
                        </a>
                      )}

                      {registered && (
                        <button
                          onClick={() => handleOpenReviewForm(classItem)}
                          className="w-full text-primary-600 hover:text-primary-700 text-sm font-medium py-2"
                        >
                          {getUserReview(user?.id, classItem.id, 'class') ? '리뷰 수정' : '리뷰 작성'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl">
              <Video className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-xl text-gray-600">예정된 클래스가 없습니다</p>
              <p className="text-gray-500 mt-2">새로운 라이브 세션이 추가되면 확인하세요!</p>
            </div>
          )}
        </div>

        {/* Past Classes */}
        {pastClasses.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">지난 클래스</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pastClasses.map((classItem) => {
                const reviews = getReviewsByItemId(classItem.id, 'class')
                const averageRating = reviews.length > 0
                  ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                  : null

                return (
                  <div key={classItem.id} className="bg-white rounded-xl shadow-md overflow-hidden opacity-75">
                    <div className="relative h-48 bg-gray-300 overflow-hidden">
                      {classItem.previewImage ? (
                        <img 
                          src={(() => {
                            if (classItem.previewImage.startsWith('http')) {
                              return classItem.previewImage;
                            }
                            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
                            const cleanFilename = classItem.previewImage.split('/').pop();
                            return `${API_URL}/api/files/view/${encodeURIComponent(cleanFilename)}`;
                          })()}
                          alt={`${classItem.title} 미리보기`}
                          className="w-full h-full object-cover opacity-75"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{classItem.title}</h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">{classItem.description}</p>
                      {averageRating && (
                        <div className="flex items-center space-x-1 mb-2">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-semibold">{averageRating}</span>
                          <span className="text-sm text-gray-500">({reviews.length})</span>
                        </div>
                      )}
                      <p className="text-sm text-gray-500">
                        {new Date(classItem.date).toLocaleDateString('ko-KR')} {classItem.time}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedClassForReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">{editingReview ? '리뷰 수정' : '리뷰 작성'}</h3>
              <button onClick={() => {
                setSelectedClassForReview(null)
                setEditingReview(null)
                setReviewForm({ rating: 5, comment: '' })
              }} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">{selectedClassForReview.title}</p>
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
                  placeholder="클래스에 대한 리뷰를 작성해주세요..."
                />
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setSelectedClassForReview(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                  {editingReview ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
