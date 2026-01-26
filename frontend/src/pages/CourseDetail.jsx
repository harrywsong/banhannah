// frontend/src/pages/CourseDetail.jsx - UPDATED for English Learning
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';

import CourseContentViewer from '../components/CourseContentViewer';
import CourseReviews from '../components/CourseReviews';
import CompactCourseReviews from '../components/CompactCourseReviews';
import PreviewImage from '../components/PreviewImage';
import { Star, Clock, BookOpen, Users, CheckCircle, PlayCircle, Lock, Trophy } from 'lucide-react';

export default function CourseDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [quizScores, setQuizScores] = useState({});
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [id, user]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/courses/${id}`);
      const courseData = response.data.course;
      setCourse(courseData);

      console.log('Course data:', courseData);
      console.log('Has purchased:', courseData.hasPurchased);
      console.log('Lessons:', courseData.lessons);

      // Load progress if user has purchased
      if (courseData.hasPurchased) {
        // Set first lesson as current
        if (courseData.lessons?.length > 0) {
          setCurrentLesson(courseData.lessons[0]);
        }

        // Load saved progress
        try {
          const progressResponse = await apiClient.get(`/courses/${id}/progress`);
          console.log('Progress response:', progressResponse.data);
          if (progressResponse.data.progress?.completedLessons) {
            const completed = progressResponse.data.progress.completedLessons;
            console.log('Loaded completed lessons:', completed);
            setCompletedLessons(Array.isArray(completed) ? completed : []);
          }
        } catch (err) {
          console.log('No saved progress yet or error loading:', err);
          setCompletedLessons([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch course:', error);
      alert('강의를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setEnrolling(true);
    try {
      if (course.type === 'free') {
        await apiClient.post(`/courses/${id}/enroll`);
        alert('무료 강의에 등록되었습니다!');
      } else {
        await apiClient.post(`/courses/${id}/purchase`, {
          paymentMethod: '신용카드'
        });
        alert('강의를 구매했습니다!');
      }
      await fetchCourse();
    } catch (error) {
      alert(error.response?.data?.error || '등록에 실패했습니다');
    } finally {
      setEnrolling(false);
    }
  };

  const handleLessonComplete = async (lessonId) => {
    const wasCompleted = completedLessons.includes(lessonId);
    
    if (!wasCompleted) {
      const newCompleted = [...completedLessons, lessonId];
      setCompletedLessons(newCompleted);

      // Check if course is now 100% complete
      const totalLessons = course?.lessons?.length || 0;
      const completionPercentage = totalLessons > 0 ? (newCompleted.length / totalLessons) * 100 : 0;
      
      // Trigger celebration if course is completed
      if (completionPercentage === 100) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 4000);
      }

      try {
        await apiClient.put(`/courses/${id}/progress`, {
          completedLessons: newCompleted
        });
        console.log('Progress saved:', newCompleted);
      } catch (error) {
        console.error('Failed to update progress:', error);
        alert('진행 상황을 저장하지 못했습니다');
      }
    } else {
      // Uncomplete the lesson
      const newCompleted = completedLessons.filter(id => id !== lessonId);
      setCompletedLessons(newCompleted);

      try {
        await apiClient.put(`/courses/${id}/progress`, {
          completedLessons: newCompleted
        });
        console.log('Progress updated:', newCompleted);
      } catch (error) {
        console.error('Failed to update progress:', error);
        alert('진행 상황을 저장하지 못했습니다');
      }
    }
  };

  const handleLessonClick = (lesson) => {
    if (!course.hasPurchased) {
      alert('강의를 구매해야 수강할 수 있습니다');
      return;
    }
    setCurrentLesson(lesson);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuizAnswer = (quizType, isCorrect) => {
    const key = `${currentLesson.id}-${quizType}`;
    setQuizScores(prev => ({
      ...prev,
      [key]: isCorrect
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">강의를 찾을 수 없습니다</p>
          <button
            onClick={() => navigate('/courses')}
            className="text-blue-600 hover:underline"
          >
            강의 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Celebration Effect */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center animate-bounce">
              <div className="text-8xl mb-6">🎉</div>
              <div className="bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white px-12 py-6 rounded-2xl text-2xl font-bold shadow-2xl animate-pulse">
                <Trophy className="inline h-8 w-8 mr-3" />
                축하합니다! 강의를 완료했습니다!
                <Trophy className="inline h-8 w-8 ml-3" />
              </div>
              <div className="mt-4 text-lg font-semibold text-gray-700 animate-pulse">
                🏆 모든 레슨을 성공적으로 완료하셨습니다! 🏆
              </div>
            </div>
          </div>
          {/* Enhanced Confetti Animation */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-ping"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            >
              <div 
                className={`w-3 h-3 rounded-full animate-bounce ${
                  ['bg-yellow-400', 'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'][Math.floor(Math.random() * 6)]
                }`}
                style={{
                  animationDelay: `${Math.random() * 1}s`
                }}
              ></div>
            </div>
          ))}
          {/* Fireworks effect */}
          <div className="absolute top-1/4 left-1/4 animate-pulse">
            <div className="text-4xl">✨</div>
          </div>
          <div className="absolute top-1/3 right-1/4 animate-pulse" style={{animationDelay: '0.5s'}}>
            <div className="text-4xl">🎆</div>
          </div>
          <div className="absolute bottom-1/4 left-1/3 animate-pulse" style={{animationDelay: '1s'}}>
            <div className="text-4xl">🎊</div>
          </div>
          <div className="absolute bottom-1/3 right-1/3 animate-pulse" style={{animationDelay: '1.5s'}}>
            <div className="text-4xl">⭐</div>
          </div>
        </div>
      )}

      {/* Course Player View (when enrolled) */}
      {course.hasPurchased && currentLesson ? (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-4">
            <button
              onClick={() => setCurrentLesson(null)}
              className="text-blue-600 hover:underline flex items-center gap-2"
            >
              ← 강의 개요로 돌아가기
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 border-b">
                  <h1 className="text-2xl font-bold mb-2">{currentLesson.title}</h1>
                  <p className="text-gray-600">{currentLesson.description}</p>
                </div>

                <div className="p-6">
                  <CourseContentViewer
                    lesson={currentLesson}
                    onQuizAnswer={handleQuizAnswer}
                  />

                  <div className="mt-8 pt-6 border-t flex justify-between items-center">
                    <button
                      onClick={() => handleLessonComplete(currentLesson.id)}
                      className={`px-6 py-2 rounded-lg font-semibold flex items-center gap-2 ${completedLessons.includes(currentLesson.id)
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                    >
                      <CheckCircle className="h-5 w-5" />
                      {completedLessons.includes(currentLesson.id) ? '완료됨' : '완료 표시'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Lesson List Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow sticky top-4">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold">강의 목록</h3>
                    {completedLessons.length === (course.lessons?.length || 0) && course.lessons?.length > 0 && (
                      <div className="flex items-center gap-1 text-green-600 animate-pulse">
                        <Trophy className="h-4 w-4" />
                        <span className="text-sm font-semibold">완료!</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 bg-gray-200 rounded-full h-3 relative overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        completedLessons.length === (course.lessons?.length || 0) && course.lessons?.length > 0
                          ? 'bg-gradient-to-r from-green-400 via-green-500 to-green-600 animate-pulse'
                          : 'bg-gradient-to-r from-blue-400 to-blue-600'
                      }`}
                      style={{
                        width: `${(completedLessons.length / (course.lessons?.length || 1)) * 100}%`
                      }}
                    />
                    {completedLessons.length === (course.lessons?.length || 0) && course.lessons?.length > 0 && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-600">
                      {completedLessons.length} / {course.lessons?.length || 0} 완료
                    </p>
                    <p className={`text-sm font-semibold ${
                      completedLessons.length === (course.lessons?.length || 0) && course.lessons?.length > 0
                        ? 'text-green-600'
                        : 'text-blue-600'
                    }`}>
                      {Math.round((completedLessons.length / (course.lessons?.length || 1)) * 100)}%
                    </p>
                  </div>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {course.lessons?.map((lesson, index) => (
                    <button
                      key={lesson.id}
                      onClick={() => handleLessonClick(lesson)}
                      className={`w-full text-left p-4 border-b hover:bg-gray-50 transition ${currentLesson?.id === lesson.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {completedLessons.includes(lesson.id) ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <PlayCircle className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{index + 1}. {lesson.title}</p>
                          {lesson.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {lesson.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                
                {/* Compact Review Section */}
                <CompactCourseReviews 
                  courseId={parseInt(id)} 
                  hasPurchased={course.hasPurchased} 
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Course Preview (not enrolled)
        <>
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-primary-400 to-primary-600 text-white py-16">
            <div className="max-w-7xl mx-auto px-4">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex gap-2 mb-4">
                    {course.type === 'free' ? (
                      <span className="badge bg-accent-400 text-accent-900 border-0">무료</span>
                    ) : (
                      <span className="badge bg-white/20 text-white border-white/30">유료</span>
                    )}
                    <span className="badge bg-white/20 text-white border-white/30">
                      {course.level === 1 ? '초급' : course.level === 2 ? '중급' : '고급'}
                    </span>
                  </div>
                  <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
                  <p className="text-xl opacity-90 mb-6">{course.description}</p>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-current" />
                      <span>{course.averageRating?.toFixed(1) || '0.0'} ({course.reviews?.length || 0}개 리뷰)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span>{course.enrollments || 0}명 수강</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white text-gray-900 rounded-lg p-6 shadow-xl">
                  <PreviewImage
                    previewImage={course.previewImage}
                    alt={course.title}
                    className="w-full h-48 object-cover rounded mb-4"
                  />
                  {course.type === 'paid' && (
                    <div className="mb-4">
                      {course.discountPrice ? (
                        <>
                          <span className="text-3xl font-bold text-blue-600">
                            ${course.discountPrice.toLocaleString()}
                          </span>
                          <span className="text-lg text-gray-400 line-through ml-2">
                            ${course.price.toLocaleString()}
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl font-bold text-blue-600">
                          ${course.price?.toLocaleString() || '0'}
                        </span>
                      )}
                    </div>
                  )}
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {enrolling
                      ? '처리 중...'
                      : course.type === 'free'
                        ? '무료 등록'
                        : '지금 구매하기'}
                  </button>
                  {course.duration && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>수강 기간: {course.duration}</span>
                    </div>
                  )}
                </div>
              </div >
            </div >
          </div >

          {/* Course Content Preview */}
          < div className="max-w-7xl mx-auto px-4 py-12" >
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                {course.lessons && course.lessons.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-2xl font-bold mb-4">커리큘럼</h2>
                    <div className="space-y-2">
                      {course.lessons.map((lesson, index) => (
                        <div
                          key={index}
                          className="border rounded p-4 hover:bg-gray-50 transition"
                        >
                          <div className="flex items-center gap-2">
                            {!course.hasPurchased && <Lock className="h-5 w-5 text-gray-400" />}
                            <BookOpen className="h-5 w-5 text-blue-600" />
                            <span className="font-semibold">{lesson.title}</span>
                          </div>
                          {lesson.description && (
                            <p className="text-sm text-gray-600 mt-2 ml-7">
                              {lesson.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                  <h3 className="text-xl font-bold mb-4">강의 정보</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">레벨</span>
                      <span className="font-semibold">
                        {course.level === 1 ? '초급' : course.level === 2 ? '중급' : '고급'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">타입</span>
                      <span className="font-semibold">
                        {course.type === 'free' ? '무료' : '유료'}
                      </span>
                    </div>
                    {course.duration && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">기간</span>
                        <span className="font-semibold">{course.duration}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">수강생</span>
                      <span className="font-semibold">{course.enrollments || 0}명</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">평점</span>
                      <span className="font-semibold">
                        ⭐ {course.averageRating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Course Reviews Section */}
                <div className="mt-6">
                  <CourseReviews 
                    courseId={parseInt(id)} 
                    hasPurchased={course.hasPurchased} 
                  />
                </div>
              </div>
            </div>
          </div >
        </>
      )
      }

    </div >
  );
}