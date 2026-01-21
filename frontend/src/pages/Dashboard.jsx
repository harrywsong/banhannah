import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { BookOpen, Download, Video, Clock, Award, Target, ExternalLink, FileText } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [myResources, setMyResources] = useState([])
  const [registeredClasses, setRegisteredClasses] = useState([])

  useEffect(() => {
    if (user) {
      // Load user's downloaded resources
      const savedResources = localStorage.getItem(`resources_${user.id}`) || '[]'
      setMyResources(JSON.parse(savedResources))

      // Load registered classes
      const savedRegistrations = localStorage.getItem(`registrations_${user.id}`) || '[]'
      const registrations = JSON.parse(savedRegistrations)
      
      // Get class details for registered classes
      const allClasses = JSON.parse(localStorage.getItem('liveClasses') || '[]')
      const classes = allClasses.filter(c => registrations.some(r => r.classId === c.id))
      setRegisteredClasses(classes)
    }
  }, [user])

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
    { label: '예정된 클래스', value: registeredClasses.filter(c => new Date(c.date) >= new Date()).length.toString(), icon: <Clock className="h-6 w-6" />, color: 'bg-orange-500' },
    { label: '총 다운로드', value: '12', icon: <FileText className="h-6 w-6" />, color: 'bg-green-500' },
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
                            {new Date(resource.downloadedAt).toLocaleDateString('ko-KR')} 다운로드
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{resource.format}</span>
                            <span>{resource.size}</span>
                          </div>
                        </div>
                        <Link
                          to={`/resources/${resource.id}`}
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

            {/* Learning Goals */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Target className="h-6 w-6 text-primary-600" />
                <h2 className="text-xl font-bold text-gray-900">이번 주 목표</h2>
              </div>
              <div className="bg-primary-50 rounded-lg p-4">
                <p className="text-gray-700 mb-3">
                  이번 주에 새 자료 3개 다운로드하기
                </p>
                <div className="mb-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">진행도</span>
                    <span className="font-semibold text-gray-900">
                      {myResources.length}/3
                    </span>
                  </div>
                  <div className="w-full bg-primary-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${Math.min((myResources.length / 3) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  {myResources.length < 3 
                    ? `목표까지 ${3 - myResources.length}개 더 필요합니다! 🎯`
                    : '목표 달성! 🎉'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
