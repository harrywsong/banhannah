import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import PreviewImage from '../components/PreviewImage';
import { BookOpen, FileText, Star, TrendingUp, ArrowRight, Clock, Award, Download, CheckCircle, Trophy } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [myCourses, setMyCourses] = useState([]);
  const [myFiles, setMyFiles] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [fileStats, setFileStats] = useState({ totalDownloads: 0 });
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [coursesResponse, progressResponse, myFilesResponse, fileStatsResponse] = await Promise.all([
        apiClient.get('/courses/my/courses'),
        apiClient.get('/auth/my-progress'),
        apiClient.get('/auth/my-files?limit=6'), // Get user's accessed files
        apiClient.get('/auth/file-stats').catch(() => ({ data: { totalFilesAccessed: 0, totalDownloads: 0 } }))
      ]);
      
      setMyCourses(coursesResponse.data.courses);
      setUserProgress(progressResponse.data.progress);
      setMyFiles(myFilesResponse.data.files || []);
      setFileStats(fileStatsResponse.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate completed courses
  const completedCoursesCount = userProgress.filter(progress => {
    const course = myCourses.find(c => c.id === progress.courseId);
    if (!course || !course.lessons || !progress.completedLessons) return false;
    
    const totalLessons = course.lessons.length;
    const completedLessons = progress.completedLessons.length;
    
    return totalLessons > 0 && completedLessons >= totalLessons;
  }).length;

  // Get course completion percentage
  const getCourseCompletion = (courseId) => {
    const course = myCourses.find(c => c.id === courseId);
    const progress = userProgress.find(p => p.courseId === courseId);
    
    if (!course || !course.lessons || !progress || !progress.completedLessons) return 0;
    
    const totalLessons = course.lessons.length;
    const completedLessons = progress.completedLessons.length;
    
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  // Check if course is completed
  const isCourseCompleted = (courseId) => {
    return getCourseCompletion(courseId) === 100;
  };

  // Trigger celebration effect
  const triggerCelebration = () => {
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 3000);
  };

  // Check for newly completed courses and trigger celebration
  useEffect(() => {
    const completedCourses = myCourses.filter(course => isCourseCompleted(course.id));
    if (completedCourses.length > 0 && !showCelebration) {
      // Only trigger if there are completed courses and celebration isn't already showing
      const hasNewCompletion = completedCourses.some(course => {
        // You could store this in localStorage to track new completions
        const lastCheck = localStorage.getItem(`completion_${course.id}`);
        if (!lastCheck) {
          localStorage.setItem(`completion_${course.id}`, 'true');
          return true;
        }
        return false;
      });
      
      if (hasNewCompletion) {
        triggerCelebration();
      }
    }
  }, [myCourses, userProgress]);

  const stats = [
    {
      icon: BookOpen,
      label: '내 강의',
      value: myCourses.length,
      color: 'from-primary-400 to-primary-600',
      iconBg: 'bg-primary-100',
      iconColor: 'text-primary-600'
    },
    {
      icon: Award,
      label: '완료한 강의',
      value: completedCoursesCount,
      color: 'from-accent-300 to-accent-500',
      iconBg: 'bg-accent-100',
      iconColor: 'text-accent-700'
    },
    {
      icon: FileText,
      label: '내 파일',
      value: fileStats.totalFilesAccessed || myFiles.length,
      color: 'from-green-400 to-green-600',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      icon: Download,
      label: '다운로드',
      value: fileStats.totalDownloads || 0,
      color: 'from-purple-400 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 relative">
      {/* Celebration Effect */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center animate-bounce">
              <div className="text-6xl mb-4">🎉</div>
              <div className="bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white px-8 py-4 rounded-full text-xl font-bold shadow-2xl animate-pulse">
                축하합니다! 강의를 완료했습니다! 🏆
              </div>
            </div>
          </div>
          {/* Confetti Animation */}
          <div className="absolute top-0 left-1/4 animate-ping">
            <div className="w-4 h-4 bg-yellow-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          </div>
          <div className="absolute top-10 right-1/4 animate-ping">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
          </div>
          <div className="absolute top-20 left-1/3 animate-ping">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.5s'}}></div>
          </div>
          <div className="absolute top-5 right-1/3 animate-ping">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.7s'}}></div>
          </div>
          <div className="absolute top-32 left-1/5 animate-ping">
            <div className="w-4 h-4 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.9s'}}></div>
          </div>
          <div className="absolute top-16 right-1/5 animate-ping">
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{animationDelay: '1.1s'}}></div>
          </div>
        </div>
      )}
      {/* Welcome Header */}
      <section className="relative pt-12 pb-12 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-neutral-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-100/20 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-slate-800">
              <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                안녕하세요, {user?.name}님! 👋
              </h1>
              <p className="text-lg text-slate-600 font-light">
                오늘도 즐거운 학습 되세요
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="card p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-5 rounded-full -mr-16 -mt-16`}></div>
                  <div className="relative">
                    <div className={`inline-flex p-3 rounded-xl ${stat.iconBg} mb-4`}>
                      <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                    </div>
                    <p className="text-neutral-500 text-sm font-medium mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-neutral-900">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* My Courses Section */}
            <div className="card p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-1">내 강의</h2>
                  <p className="text-neutral-600">현재 수강 중인 강의를 확인하세요</p>
                </div>
                <Link
                  to="/courses"
                  className="btn btn-primary rounded-full px-6 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300"
                >
                  새 강의 찾기
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </div>

              {loading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="text-neutral-500 mt-4">강의를 불러오는 중...</p>
                </div>
              ) : myCourses.length === 0 ? (
                <div className="text-center py-16 bg-neutral-50 rounded-xl">
                  <div className="inline-flex p-6 rounded-2xl bg-primary-50 mb-6">
                    <BookOpen className="h-16 w-16 text-primary-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    아직 등록한 강의가 없습니다
                  </h3>
                  <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                    다양한 강의를 둘러보고 학습을 시작해보세요
                  </p>
                  <Link
                    to="/courses"
                    className="btn btn-primary btn-lg rounded-full px-8 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300"
                  >
                    강의 둘러보기
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myCourses.map((course) => {
                    const completionPercentage = getCourseCompletion(course.id);
                    const isCompleted = isCourseCompleted(course.id);
                    
                    return (
                      <Link
                        key={course.id}
                        to={`/courses/${course.id}`}
                        className={`group bg-white rounded-xl border overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative ${
                          isCompleted 
                            ? 'border-green-300 bg-gradient-to-br from-green-50 to-white' 
                            : 'border-neutral-200'
                        }`}
                      >
                        {/* Completion Badge */}
                        {isCompleted && (
                          <div className="absolute top-3 right-3 z-10 bg-green-500 text-white rounded-full p-2 shadow-lg">
                            <Trophy className="h-4 w-4" />
                          </div>
                        )}
                        
                        <PreviewImage
                          previewImage={course.previewImage}
                          alt={course.title}
                          className="w-full h-48 object-cover"
                          fallbackContent={
                            <div className="w-full h-48 bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center text-white font-semibold">
                              미리보기 없음
                            </div>
                          }
                        />
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={`font-semibold mb-2 group-hover:text-primary-600 transition-colors ${
                              isCompleted ? 'text-green-700' : 'text-neutral-900'
                            }`}>
                              {course.title}
                            </h3>
                            {isCompleted && (
                              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                          
                          <p className="text-sm text-neutral-600 line-clamp-2 mb-4">
                            {course.description}
                          </p>
                          
                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-neutral-500">진행률</span>
                              <span className={`text-xs font-semibold ${
                                isCompleted ? 'text-green-600' : 'text-neutral-700'
                              }`}>
                                {completionPercentage}%
                              </span>
                            </div>
                            <div className="w-full bg-neutral-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  isCompleted 
                                    ? 'bg-gradient-to-r from-green-400 to-green-600' 
                                    : 'bg-gradient-to-r from-primary-400 to-primary-600'
                                }`}
                                style={{ width: `${completionPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-accent-400 fill-current" />
                              <span className="text-sm font-semibold text-neutral-900">
                                {course.averageRating?.toFixed(1) || '0.0'}
                              </span>
                            </div>
                            <span className={`text-sm font-medium group-hover:translate-x-1 transition-transform ${
                              isCompleted ? 'text-green-600' : 'text-primary-600'
                            }`}>
                              {isCompleted ? '완료됨 ✓' : '계속 학습 →'}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* My Files Section */}
            <div className="card p-8 mt-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-1">내 파일</h2>
                  <p className="text-neutral-600">다운로드하거나 조회한 학습 자료</p>
                </div>
                <Link
                  to="/files"
                  className="btn btn-secondary rounded-full px-6 shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300"
                >
                  모든 파일 보기
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </div>

              {loading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-neutral-500 mt-4">파일을 불러오는 중...</p>
                </div>
              ) : myFiles.length === 0 ? (
                <div className="text-center py-16 bg-neutral-50 rounded-xl">
                  <div className="inline-flex p-6 rounded-2xl bg-green-50 mb-6">
                    <FileText className="h-16 w-16 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                    아직 다운로드한 파일이 없습니다
                  </h3>
                  <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                    파일을 다운로드하거나 조회하면 여기에 표시됩니다
                  </p>
                  <Link
                    to="/files"
                    className="btn btn-secondary btn-lg rounded-full px-8 shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transition-all duration-300"
                  >
                    파일 둘러보기
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myFiles.slice(0, 6).map((file) => (
                    <Link
                      key={file.id}
                      to="/files"
                      className="group bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <PreviewImage
                        previewImage={file.previewImage}
                        alt={file.title}
                        className="w-full h-32 object-cover"
                        fallbackContent={
                          <div className="w-full h-32 bg-gradient-to-br from-green-300 to-green-500 flex items-center justify-center text-white font-semibold">
                            <FileText className="h-8 w-8" />
                          </div>
                        }
                      />
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="badge badge-secondary text-xs">{file.format}</span>
                          <span className="badge badge-outline text-xs">
                            {file.level === 1 ? '초급' : file.level === 2 ? '중급' : '고급'}
                          </span>
                        </div>
                        <h3 className="font-semibold text-neutral-900 mb-2 group-hover:text-green-600 transition-colors line-clamp-1">
                          {file.title}
                        </h3>
                        <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
                          {file.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-sm text-neutral-500">
                            <div className="flex items-center gap-1">
                              <Download className="h-4 w-4" />
                              <span>{file.downloads || 0}</span>
                            </div>
                            {file.userAccess && (
                              <div className="flex items-center gap-1 text-green-600">
                                {file.userAccess.accessType === 'download' && <Download className="h-3 w-3" />}
                                {file.userAccess.accessType === 'view' && <FileText className="h-3 w-3" />}
                                <span className="text-xs">
                                  {file.userAccess.accessType === 'download' ? '다운로드함' : '조회함'}
                                </span>
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-green-600 font-medium group-hover:translate-x-1 transition-transform">
                            보기 →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}