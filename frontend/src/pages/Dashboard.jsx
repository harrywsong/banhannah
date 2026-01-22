import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { BookOpen, Download, Video, Clock, Award, Target, ExternalLink, FileText } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiEndpoint, apiRequest } from '../config/api'  // ✅ ADD THIS
import { registrationsApi } from '../api/registrations'
import { resourcesApi } from '../api/resources'
import { progressApi } from '../api/progress'

export default function Dashboard() {
  const { user } = useAuth()
  const [myResources, setMyResources] = useState([])
  const [registeredClasses, setRegisteredClasses] = useState([])
  const [completedCourses, setCompletedCourses] = useState([])
  const [onlineCourses, setOnlineCourses] = useState([])

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        // Load accessed resources
        const { resources } = await resourcesApi.getAccessedResources();
        setMyResources(resources);

        // Load class registrations
        const { registrations } = await registrationsApi.getRegistrations();
        
        // Get class details for registered classes
        const allClasses = JSON.parse(localStorage.getItem('liveClasses') || '[]');
        const classes = allClasses.filter(c => 
          registrations.some(r => r.classId === c.id)
        );
        setRegisteredClasses(classes);

        // Load courses from database
        const coursesResponse = await apiRequest(apiEndpoint('courses/metadata'));
        const allOnlineCourses = coursesResponse.ok ? (await coursesResponse.json()).courses : [];
        setOnlineCourses(allOnlineCourses);
        
        // Calculate completed courses
        const completedPromises = allOnlineCourses.map(async (course) => {
          try {
            const { progress } = await progressApi.getCourseProgress(course.id);
            const completableLessons = (course.lessons || []).filter(l => l.type !== 'chapter');
            
            if (completableLessons.length === 0) return null;
            
            const completedLessons = completableLessons.filter(l => progress[l.id]?.completed === true);
            const isFullyCompleted = completedLessons.length === completableLessons.length;
            
            return isFullyCompleted ? course : null;
          } catch (error) {
            console.error('Error loading progress for course', course.id, error);
            return null;
          }
        });
        
        const completed = (await Promise.all(completedPromises)).filter(c => c !== null);
        setCompletedCourses(completed);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();

    // Listen for updates
    const handleUpdate = () => loadData();
    window.addEventListener('dashboardUpdate', handleUpdate);
    return () => window.removeEventListener('dashboardUpdate', handleUpdate);
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">대시보드를 보려면 로그인해주세요</h2>
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
            로그인 페이지로 이동 →
          </Link>
        </div>
      </div>
    )
  }

  const stats = [
    { label: '다운로드한 자료', value: myResources.length.toString(), icon: <Download className="h-6 w-6" />, color: 'bg-blue-500' },
    { label: '등록한 클래스', value: registeredClasses.length.toString(), icon: <Video className="h-6 w-6" />, color: 'bg-purple-500' },
    { label: '완료한 코스', value: completedCourses.length.toString(), icon: <Award className="h-6 w-6" />, color: 'bg-green-500' },
    { label: '예정된 클래스', value: registeredClasses.filter(c => new Date(c.date) >= new Date()).length.toString(), icon: <Clock className="h-6 w-6" />, color: 'bg-orange-500' },
  ]

  const upcomingClasses = registeredClasses
    .filter(c => new Date(c.date) >= new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">내 대시보드</h1>
          <p className="text-primary-100">돌아오신 것을 환영합니다, {user.name}님! 학습 여정을 계속하세요.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} text-white p-3 rounded-lg`}>
                  {stat.icon}
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Resources & Upcoming Classes */}
          <div className="lg:col-span-2 space-y-8">
            {/* My Resources */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">내 자료</h2>
                <Link to="/resources" className="text-primary-600 hover:text-primary-700 font-semibold">
                  모두 보기 →
                </Link>
              </div>

              {myResources.length > 0 ? (
                <div className="space-y-4">
                  {myResources.slice(0, 3).map((resource) => (
                    <div key={resource.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                          <FileText className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-grow">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {resource.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {new Date(resource.accessedAt).toLocaleDateString('ko-KR')} 다운로드
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{resource.format}</span>
                            <span>{resource.size}</span>
                          </div>
                        </div>
                        <Link
                          to={`/files/${resource.id}`}  // ✅ Changed from /resources/ to /files/
                          className="text-primary-600 hover:text-primary-700 font-semibold text-sm"
                        >
                          View →
                        </Link>

                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Download className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">아직 다운로드한 자료가 없습니다</p>
                  <Link to="/resources" className="text-primary-600 hover:text-primary-700 font-semibold mt-2 inline-block">
                    자료 둘러보기 →
                  </Link>
                </div>
              )}
            </div>

            {/* Upcoming Classes */}
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">예정된 라이브 클래스</h2>
                <Link to="/live-classes" className="text-primary-600 hover:text-primary-700 font-semibold">
                  모두 보기 →
                </Link>
              </div>

              {upcomingClasses.length > 0 ? (
                <div className="space-y-4">
                  {upcomingClasses.map((classItem) => (
                    <div key={classItem.id} className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-grow">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {classItem.title}
                          </h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {new Date(classItem.date).toLocaleDateString('ko-KR')} {classItem.time}
                                {classItem.timezone && (
                                  <span className="ml-1 text-xs text-gray-500">
                                    [{classItem.timezone.split('/')[1] || classItem.timezone}]
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Video className="h-4 w-4" />
                              <span>{classItem.platform}</span>
                            </div>
                          </div>
                        </div>
                        <a
                          href={classItem.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 text-sm"
                        >
                          <ExternalLink className="h-4 w-4" />
                          <span>참여</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Video className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">예정된 클래스가 없습니다</p>
                  <Link to="/live-classes" className="text-primary-600 hover:text-primary-700 font-semibold mt-2 inline-block">
                    클래스 둘러보기 →
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">빠른 작업</h2>
              <div className="space-y-3">
                <Link
                  to="/resources"
                  className="block w-full bg-primary-600 text-white px-4 py-3 rounded-lg hover:bg-primary-700 transition-colors text-center font-semibold"
                >
                  자료 둘러보기
                </Link>
                <Link
                  to="/live-classes"
                  className="block w-full border-2 border-primary-600 text-primary-600 px-4 py-3 rounded-lg hover:bg-primary-50 transition-colors text-center font-semibold"
                >
                  라이브 클래스 보기
                </Link>
              </div>
            </div>

            {/* Learning Progress */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Award className="h-6 w-6 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">학습 진행 상황</h2>
              </div>
              <div className="space-y-4">
                {/* Resources Progress */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">다운로드한 자료</h3>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{myResources.length}개</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {myResources.length === 0 
                      ? '첫 자료를 다운로드해보세요!'
                      : myResources.length < 5
                      ? '좋은 시작입니다! 계속 학습하세요 📚'
                      : myResources.length < 10
                      ? '훌륭해요! 꾸준히 학습 중이시네요 🌟'
                      : '대단합니다! 열정적인 학습자세요 🎉'}
                  </p>
                </div>

                {/* Classes Progress */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Video className="h-5 w-5 text-purple-600" />
                    <h3 className="font-semibold text-gray-900">등록한 클래스</h3>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{registeredClasses.length}개</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {registeredClasses.length === 0 
                      ? '첫 클래스에 등록해보세요!'
                      : upcomingClasses.length > 0
                      ? `다음 클래스: ${upcomingClasses[0]?.title || '곧 시작'}`
                      : '다음 라이브 클래스를 기대해주세요!'}
                  </p>
                </div>

                {/* Online Courses Progress */}
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">완료한 온라인 코스</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{completedCourses.length}개</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {completedCourses.length === 0 
                      ? '첫 코스를 완료해보세요!'
                      : completedCourses.length === 1
                      ? '첫 코스 완료! 축하합니다 🎉'
                      : completedCourses.length < 5
                      ? `훌륭해요! ${completedCourses.length}개 코스 완료 🌟`
                      : `놀라워요! ${completedCourses.length}개 코스 완료 🏆`}
                  </p>
                  {completedCourses.length > 0 && (
                    <Link 
                      to="/resources"
                      className="text-sm text-green-600 hover:text-green-700 font-semibold mt-2 inline-block"
                    >
                      더 많은 코스 보기 →
                    </Link>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
