import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Filter, FileText, ArrowRight, Lock, Video, PlayCircle, Download } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Resources() {
  const [activeTab, setActiveTab] = useState('files') // 'files' or 'classes'
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all', 'free', 'paid'
  const [files, setFiles] = useState([])
  const [onlineCourses, setOnlineCourses] = useState([])
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Load files (formerly resources - all free)
    const savedFiles = localStorage.getItem('resourceFiles')
    if (savedFiles) {
      setFiles(JSON.parse(savedFiles))
    } else {
      // Default files - migrate old resources or create new defaults
      const oldResources = JSON.parse(localStorage.getItem('resources') || '[]')
      if (oldResources.length > 0) {
        // Migrate old resources to files (make all free)
        const migratedFiles = oldResources.map(r => ({
          ...r,
          type: 'file',
          price: 'Free'
        }))
        setFiles(migratedFiles)
        localStorage.setItem('resourceFiles', JSON.stringify(migratedFiles))
      } else {
        // Default files
        const defaultFiles = [
          {
            id: 1,
            title: '기초 어휘 워크북',
            description: '재미있는 활동과 함께하는 초급자를 위한 필수 어휘 연습 문제입니다.',
            format: 'PDF',
            size: '2.5 MB',
            pages: '105 페이지',
            downloads: 1250,
            type: 'file',
            createdAt: new Date().toISOString()
          }
        ]
        setFiles(defaultFiles)
        localStorage.setItem('resourceFiles', JSON.stringify(defaultFiles))
      }
    }

    // Load online courses
    const savedCourses = localStorage.getItem('onlineCourses')
    if (savedCourses) {
      setOnlineCourses(JSON.parse(savedCourses))
    } else {
      // Default online courses
      const defaultCourses = [
        {
          id: 1,
          title: '기초 영어 회화 클래스',
          description: '초급자를 위한 실용적인 영어 회화 기초 과정입니다.',
          type: 'free', // free or paid
          price: 'Free',
          lessons: [
            {
              id: 1,
              title: '인사하기와 소개',
              videoUrl: '', // Video URL placeholder
              duration: '15분',
              files: [] // Optional files
            }
          ],
          students: 450,
          createdAt: new Date().toISOString()
        }
      ]
      setOnlineCourses(defaultCourses)
      localStorage.setItem('onlineCourses', JSON.stringify(defaultCourses))
    }
  }, [])

  // Filter files (all files are free, but filter UI is there for consistency)
  const filteredFiles = files
    .filter(file => {
      const matchesSearch = file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           file.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'all' || filterType === 'free' // All files are free
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt) : new Date(a.id)
      const bDate = b.createdAt ? new Date(b.createdAt) : new Date(b.id)
      return bDate - aDate
    })

  // Filter courses
  const filteredCourses = onlineCourses
    .filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = filterType === 'all' || course.type === filterType
      return matchesSearch && matchesType
    })
    .sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt) : new Date(a.id)
      const bDate = b.createdAt ? new Date(b.createdAt) : new Date(b.id)
      return bDate - aDate
    })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">교육 자료</h1>
          <p className="text-xl text-primary-100">무료 자료를 다운로드하고 온라인 클래스를 통해 학습하세요</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('files')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'files'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>파일</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('classes')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'classes'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <PlayCircle className="h-5 w-5" />
                <span>온라인 클래스</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Login Prompt if not logged in */}
        {!user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-center space-x-3">
              <Lock className="h-6 w-6 text-yellow-600" />
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-yellow-900 mb-1">로그인이 필요합니다</h3>
                <p className="text-yellow-800">
                  파일을 다운로드하거나 온라인 클래스를 보려면 로그인이 필요합니다.
                </p>
              </div>
              <Link
                to="/login"
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-semibold whitespace-nowrap"
              >
                로그인
              </Link>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={activeTab === 'files' ? '파일 검색...' : '온라인 클래스 검색...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">모든 항목</option>
                <option value="free">무료</option>
                {activeTab === 'classes' && <option value="paid">유료</option>}
              </select>
            </div>
          </div>
        </div>

        {/* Files Tab */}
        {activeTab === 'files' && (
          <>
            {!user ? (
              <div className="text-center py-12 bg-white rounded-xl">
                <Lock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-xl text-gray-600 mb-4">로그인하여 파일을 확인하세요</p>
                <Link
                  to="/login"
                  className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                >
                  로그인하기
                </Link>
              </div>
            ) : filteredFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group"
                  >
                    {/* Document Preview */}
                    <div className="relative h-48 bg-gradient-to-br from-primary-400 to-primary-600 overflow-hidden">
                      {file.previewImage ? (
                        <img 
                          src={file.previewImage} 
                          alt={`${file.title} 미리보기`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-center text-white">
                            <FileText className="h-16 w-16 mx-auto mb-2 opacity-50" />
                            <p className="text-sm font-semibold">[파일 미리보기]</p>
                            <p className="text-xs opacity-75">미리보기 이미지가 설정되지 않았습니다</p>
                          </div>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <div className="bg-white text-green-600 px-3 py-1 rounded-full text-sm font-semibold">
                          무료
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                        {file.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {file.description}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-1">
                          <FileText className="h-4 w-4" />
                          <span>{file.format}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Download className="h-4 w-4" />
                          <span>접근 {file.downloads?.toLocaleString() || 0}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        {file.size && (
                          <div className="text-sm text-gray-600">
                            <span className="font-semibold">{file.size}</span>
                          </div>
                        )}
                      </div>

                      <Link
                        to={`/files/${file.id}`}
                        className="w-full flex items-center justify-center text-primary-600 font-semibold hover:text-primary-700 border-2 border-primary-600 py-2 rounded-lg hover:bg-primary-50 transition-colors group-hover:border-primary-700"
                      >
                        <span>자세히 보기</span>
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl">
                <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-xl text-gray-600">검색 조건에 맞는 파일이 없습니다.</p>
              </div>
            )}
          </>
        )}

        {/* Classes Tab */}
        {activeTab === 'classes' && (
          <>
            {!user ? (
              <div className="text-center py-12 bg-white rounded-xl">
                <Lock className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-xl text-gray-600 mb-4">로그인하여 온라인 클래스를 확인하세요</p>
                <Link
                  to="/login"
                  className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                >
                  로그인하기
                </Link>
              </div>
            ) : filteredCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group"
                  >
                    {/* Course Preview */}
                    <div className="relative h-48 bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Video className="h-16 w-16 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-semibold">[클래스 이미지 #{course.id}]</p>
                        <p className="text-xs opacity-75">클래스 이미지로 교체하세요</p>
                      </div>
                      <div className="absolute top-2 right-2">
                        {course.type === 'paid' ? (
                          <div className="bg-white text-orange-600 px-3 py-1 rounded-full text-sm font-semibold">
                            유료
                          </div>
                        ) : (
                          <div className="bg-white text-green-600 px-3 py-1 rounded-full text-sm font-semibold">
                            무료
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {course.description}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-1">
                          <Video className="h-4 w-4" />
                          <span>{course.lessons?.length || 0}개 레슨</span>
                        </div>
                        {course.students && (
                          <div className="flex items-center space-x-1">
                            <span>{course.students}명 수강</span>
                          </div>
                        )}
                      </div>

                      {course.type === 'paid' && (
                        <div className="text-lg font-bold text-orange-600 mb-4">
                          {course.price}
                        </div>
                      )}

                      <Link
                        to={`/courses/${course.id}`}
                        className="w-full flex items-center justify-center text-primary-600 font-semibold hover:text-primary-700 border-2 border-primary-600 py-2 rounded-lg hover:bg-primary-50 transition-colors group-hover:border-primary-700"
                      >
                        <span>클래스 보기</span>
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl">
                <Video className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-xl text-gray-600">검색 조건에 맞는 온라인 클래스가 없습니다.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
