import { useState, useEffect } from 'react'
import AdminLogin from '../components/AdminLogin'
import { apiEndpoint, apiRequest, addAuthHeaders } from '../config/api'  // ← ADD addAuthHeaders here
import { Plus, Calendar, Clock, Video, Users, Edit, Trash2, X, FileText, Upload, PlayCircle, LogOut, BarChart3, Settings, Shield } from 'lucide-react'


export default function AdminPanel() {
  
  const [adminSession, setAdminSession] = useState(null)
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard', 'classes', 'files', or 'courses'
  const [classes, setClasses] = useState([])
  const [files, setFiles] = useState([])
  const [onlineCourses, setOnlineCourses] = useState([])
  const [showClassForm, setShowClassForm] = useState(false)
  const [showFileForm, setShowFileForm] = useState(false)
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [editingFile, setEditingFile] = useState(null)
  const [editingCourse, setEditingCourse] = useState(null)
  const [editingLesson, setEditingLesson] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(null) // { fileName: string, progress: number, type: 'file'|'video' }
  const [videoSourceType, setVideoSourceType] = useState('upload') // 'upload' or 'url'
  const [currentQuestion, setCurrentQuestion] = useState({
    type: 'multiple-choice',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    matchingPairs: [{ left: '', right: '' }]
  })
  const [showQuestionForm, setShowQuestionForm] = useState(false)
  
  const [classFormData, setClassFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    timezone: 'Asia/Seoul',
    duration: '',
    platform: 'Zoom',
    meetingLink: '',
    instructor: '',
    maxParticipants: '20',
    registrationStart: '',
    registrationEnd: ''
  })

  const [fileFormData, setFileFormData] = useState({
    title: '',
    description: '',
    format: 'PDF',
    size: '',
    pages: '',
    fileUrl: '',
    previewImage: ''
  })

  const [courseFormData, setCourseFormData] = useState({
    title: '',
    description: '',
    type: 'free',
    price: '',
    accessDuration: 30, // Days for paid courses
    lessons: []
  })
  
  const [currentLessonForm, setCurrentLessonForm] = useState({
    title: '',
    description: '',
    type: 'lesson',
    videoUrl: '',
    textContent: '',
    duration: '',
    files: [],
    questions: [] // NEW: For interactive questions
  })

  // Check for admin session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('adminSession')
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession)
        setAdminSession(session)
      } catch (err) {
        localStorage.removeItem('adminSession')
      }
    }
  }, [])

  // Load data when authenticated
  useEffect(() => {
    if (!adminSession) return

    // Load classes (still using localStorage for now)
    const savedClasses = localStorage.getItem('liveClasses')
    if (savedClasses) {
      setClasses(JSON.parse(savedClasses))
    }

    // Load files from backend API
    const loadFiles = async () => {
      try {
        const response = await apiRequest(apiEndpoint('files/metadata'))
        if (response.ok) {
          const data = await response.json()
          setFiles(data.files || [])
        } else {
          console.error('Failed to load files from backend')
          // Fallback to localStorage if backend fails
          const savedFiles = localStorage.getItem('resourceFiles')
          if (savedFiles) {
            setFiles(JSON.parse(savedFiles))
          }
        }
      } catch (error) {
        console.error('Error loading files:', error)
        // Fallback to localStorage if backend fails
        const savedFiles = localStorage.getItem('resourceFiles')
        if (savedFiles) {
          setFiles(JSON.parse(savedFiles))
        }
      }
    }

    // Load courses from backend API
    const loadCourses = async () => {
      try {
        const response = await apiRequest(apiEndpoint('courses/metadata'))
        if (response.ok) {
          const data = await response.json()
          setOnlineCourses(data.courses || [])
        } else {
          console.error('Failed to load courses from backend')
          // Fallback to localStorage if backend fails
          const savedCourses = localStorage.getItem('onlineCourses')
          if (savedCourses) {
            setOnlineCourses(JSON.parse(savedCourses))
          }
        }
      } catch (error) {
        console.error('Error loading courses:', error)
        // Fallback to localStorage if backend fails
        const savedCourses = localStorage.getItem('onlineCourses')
        if (savedCourses) {
          setOnlineCourses(JSON.parse(savedCourses))
        }
      }
    }

    loadFiles()
    loadCourses()
  }, [adminSession])

      // Prevent navigation during uploads
useEffect(() => {
  const handleBeforeUnload = (e) => {
    if (uploadProgress) {
      e.preventDefault()
      e.returnValue = '파일 업로드 중입니다. 페이지를 떠나면 업로드가 취소됩니다.'
      return e.returnValue
    }
  }
  

  window.addEventListener('beforeunload', handleBeforeUnload)
  return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [uploadProgress])

  const handleAdminLogin = (session) => {
    setAdminSession(session)
  }

  const handleLogout = () => {
    // Clear both adminSession and token
    localStorage.removeItem('adminSession')
    localStorage.removeItem('token')
    
    // Also call backend logout endpoint to clear cookie
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    }).catch(err => console.error('Logout error:', err))
    
    setAdminSession(null)
    console.log('✓ Admin logged out successfully')
  }

  // Class handlers
  const handleClassSubmit = (e) => {
    e.preventDefault()

    const classData = {
      id: editingClass?.id || Date.now(),
      ...classFormData,
      registeredCount: editingClass?.registeredCount || 0,
      maxParticipants: parseInt(classFormData.maxParticipants)
    }

    let updatedClasses
    if (editingClass) {
      updatedClasses = classes.map(c => c.id === editingClass.id ? classData : c)
    } else {
      updatedClasses = [...classes, classData]
    }

    setClasses(updatedClasses)
    localStorage.setItem('liveClasses', JSON.stringify(updatedClasses))
    resetClassForm()
  }

  const handleClassEdit = (classItem) => {
    setEditingClass(classItem)
    setClassFormData({
      title: classItem.title || '',
      description: classItem.description || '',
      date: classItem.date || '',
      time: classItem.time || '',
      timezone: classItem.timezone || 'Asia/Seoul',
      duration: classItem.duration || '',
      platform: classItem.platform || 'Zoom',
      meetingLink: classItem.meetingLink || '',
      instructor: classItem.instructor || '',
      maxParticipants: (classItem.maxParticipants || 20).toString(),
      registrationStart: classItem.registrationStart || '',
      registrationEnd: classItem.registrationEnd || ''
    })
    setShowClassForm(true)
  }

  const handleClassDelete = (id) => {
    if (window.confirm('이 클래스를 삭제하시겠습니까?')) {
      const updatedClasses = classes.filter(c => c.id !== id)
      setClasses(updatedClasses)
      localStorage.setItem('liveClasses', JSON.stringify(updatedClasses))
    }
  }

  const resetClassForm = () => {
    setClassFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      timezone: 'Asia/Seoul',
      duration: '',
      platform: 'Zoom',
      meetingLink: '',
      instructor: '',
      maxParticipants: '20',
      registrationStart: '',
      registrationEnd: ''
    })
    setShowClassForm(false)
    setEditingClass(null)
  }

  // File handlers (all files are free)
  const handleFileSubmit = async (e) => {
    e.preventDefault()

    const fileData = {
      ...fileFormData,
      type: 'file',
      downloads: editingFile?.downloads || 0,
      createdAt: editingFile?.createdAt || new Date().toISOString()
    }

    try {
      let response
      if (editingFile) {
        // Update existing file
        response = await apiRequest(apiEndpoint(`files/metadata/${editingFile.id}`), {
          method: 'PUT',
          body: JSON.stringify(fileData)
        })
      } else {
        // Create new file
        response = await apiRequest(apiEndpoint('files/metadata'), {
          method: 'POST',
          body: JSON.stringify(fileData)
        })
      }

      if (response.ok) {
        // Reload files from backend
        const filesResponse = await apiRequest(apiEndpoint('files/metadata'))
        if (filesResponse.ok) {
          const filesData = await filesResponse.json()
          setFiles(filesData.files || [])
        }
        resetFileForm()
      } else {
        const errorData = await response.json()
        alert(`파일 저장에 실패했습니다: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('File save error:', error)
      alert(`파일 저장에 실패했습니다: ${error.message}`)
    }
  }

  const handleFileEdit = (file) => {
    setEditingFile(file)
    setFileFormData({
      title: file.title || '',
      description: file.description || '',
      format: file.format || 'PDF',
      size: file.size || '',
      pages: file.pages || '',
      fileUrl: file.fileUrl || '',
      previewImage: file.previewImage || ''
    })
    setShowFileForm(true)
  }

  const handleFileDelete = async (id) => {
    if (!window.confirm('이 파일을 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await apiRequest(apiEndpoint(`files/metadata/${id}`), {
        method: 'DELETE'
      })

      if (response.ok) {
        // Reload files from backend
        const filesResponse = await apiRequest(apiEndpoint('files/metadata'))
        if (filesResponse.ok) {
          const filesData = await filesResponse.json()
          setFiles(filesData.files || [])
        }
      } else {
        const errorData = await response.json()
        alert(`파일 삭제에 실패했습니다: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('File delete error:', error)
      alert(`파일 삭제에 실패했습니다: ${error.message}`)
    }
  }

  const resetFileForm = () => {
    setFileFormData({
      title: '',
      description: '',
      format: 'PDF',
      size: '',
      pages: '',
      fileUrl: '',
      previewImage: ''
    })
    setShowFileForm(false)
    setEditingFile(null)
  }

  // Online Course handlers
  const handleCourseSubmit = async (e) => {
    e.preventDefault()

    const courseData = {
      ...courseFormData,
      price: courseFormData.type === 'paid' ? `$${courseFormData.price}` : 'Free',
      accessDuration: courseFormData.type === 'paid' ? parseInt(courseFormData.accessDuration) : null,
      students: editingCourse?.students || 0,
      createdAt: editingCourse?.createdAt || new Date().toISOString()
    }

    try {
      let response
      if (editingCourse) {
        // Update existing course
        response = await apiRequest(apiEndpoint(`courses/metadata/${editingCourse.id}`), {
          method: 'PUT',
          body: JSON.stringify(courseData)
        })
      } else {
        // Create new course
        response = await apiRequest(apiEndpoint('courses/metadata'), {
          method: 'POST',
          body: JSON.stringify(courseData)
        })
      }

      if (response.ok) {
        // Reload courses from backend
        const coursesResponse = await apiRequest(apiEndpoint('courses/metadata'))
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json()
          setOnlineCourses(coursesData.courses || [])
        }
        resetCourseForm()
      } else {
        const errorData = await response.json()
        alert(`코스 저장에 실패했습니다: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Course save error:', error)
      alert(`코스 저장에 실패했습니다: ${error.message}`)
    }
  }

  const handleCourseEdit = (course) => {
    setEditingCourse(course)
    setCourseFormData({
      title: course.title || '',
      description: course.description || '',
      type: course.type || 'free',
      price: course.type === 'paid' ? (course.price || '').replace('$', '') : '',
      accessDuration: course.accessDuration || 30,
      lessons: course.lessons || []
    })
    setShowCourseForm(true)
  }

  const handleCourseDelete = async (id) => {
    if (!window.confirm('이 온라인 코스를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await apiRequest(apiEndpoint(`courses/metadata/${id}`), {
        method: 'DELETE'
      })

      if (response.ok) {
        // Reload courses from backend
        const coursesResponse = await apiRequest(apiEndpoint('courses/metadata'))
        if (coursesResponse.ok) {
          const coursesData = await coursesResponse.json()
          setOnlineCourses(coursesData.courses || [])
        }
      } else {
        const errorData = await response.json()
        alert(`코스 삭제에 실패했습니다: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Course delete error:', error)
      alert(`코스 삭제에 실패했습니다: ${error.message}`)
    }
  }

  const resetCourseForm = () => {
    setCourseFormData({
      title: '',
      description: '',
      type: 'free',
      price: '',
      accessDuration: 30,
      lessons: []
    })
    setCurrentLessonForm({
      title: '',
      videoUrl: '',
      duration: '',
      files: []
    })
    setShowCourseForm(false)
    setEditingCourse(null)
  }

  const addQuestionToLesson = () => {
    if (currentQuestion.type === 'multiple-choice') {
      if (!currentQuestion.question.trim() || currentQuestion.options.some(opt => !opt.trim())) {
        alert('질문과 모든 선택지를 입력해주세요.')
        return
      }
    } else if (currentQuestion.type === 'matching') {
      if (currentQuestion.matchingPairs.some(pair => !pair.left.trim() || !pair.right.trim())) {
        alert('모든 매칭 항목을 입력해주세요.')
        return
      }
    }
  
    const newQuestion = {
      id: Date.now(),
      ...currentQuestion
    }
  
    setCurrentLessonForm({
      ...currentLessonForm,
      questions: [...(currentLessonForm.questions || []), newQuestion]
    })
  
    setCurrentQuestion({
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      matchingPairs: [{ left: '', right: '' }]
    })
    setShowQuestionForm(false)
  }
  
  const removeQuestionFromLesson = (questionId) => {
    setCurrentLessonForm({
      ...currentLessonForm,
      questions: currentLessonForm.questions.filter(q => q.id !== questionId)
    })
  }
  
  const addMatchingPair = () => {
    setCurrentQuestion({
      ...currentQuestion,
      matchingPairs: [...currentQuestion.matchingPairs, { left: '', right: '' }]
    })
  }
  
  const removeMatchingPair = (index) => {
    const newPairs = currentQuestion.matchingPairs.filter((_, i) => i !== index)
    setCurrentQuestion({
      ...currentQuestion,
      matchingPairs: newPairs.length > 0 ? newPairs : [{ left: '', right: '' }]
    })
  }
  
  const updateMatchingPair = (index, side, value) => {
    const newPairs = [...currentQuestion.matchingPairs]
    newPairs[index][side] = value
    setCurrentQuestion({
      ...currentQuestion,
      matchingPairs: newPairs
    })
  }
  
  const updateOption = (index, value) => {
    const newOptions = [...currentQuestion.options]
    newOptions[index] = value
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions
    })
  }

  const addLessonToCourse = () => {
    if (!currentLessonForm.title) {
      alert('레슨 제목을 입력하세요')
      return
    }
    if (editingLesson) {
      // Update existing lesson
      setCourseFormData({
        ...courseFormData,
        lessons: courseFormData.lessons.map(l => 
          l.id === editingLesson.id ? { ...currentLessonForm, id: editingLesson.id } : l
        )
      })
      setEditingLesson(null)
    } else {
      // Add new lesson
      const newLesson = {
        id: Date.now(),
        ...currentLessonForm
      }
      setCourseFormData({
        ...courseFormData,
        lessons: [...courseFormData.lessons, newLesson]
      })
    }
    setCurrentLessonForm({
      title: '',
      videoUrl: '',
      duration: '',
      files: []
    })
  }

  const handleLessonEdit = (lesson) => {
    setEditingLesson(lesson)
    setCurrentLessonForm({
      title: lesson.title || '',
      videoUrl: lesson.videoUrl || '',
      duration: lesson.duration || '',
      files: lesson.files || []
    })
  }

  const handleLessonCancel = () => {
    setEditingLesson(null)
    setCurrentLessonForm({
      title: '',
      videoUrl: '',
      duration: '',
      files: []
    })
  }

  const removeLessonFromCourse = (lessonId) => {
    if (window.confirm('이 레슨을 삭제하시겠습니까?')) {
      setCourseFormData({
        ...courseFormData,
        lessons: courseFormData.lessons.filter(l => l.id !== lessonId)
      })
    }
  }

  // Show login if not authenticated
  if (!adminSession) {
    return <AdminLogin onLogin={handleAdminLogin} />
  }

  // Calculate stats
  const totalClasses = classes.length
  const totalFiles = files.length
  const totalCourses = onlineCourses.length
  const totalRegistered = classes.reduce((sum, c) => sum + (c.registeredCount || 0), 0)
  const totalDownloads = files.reduce((sum, f) => sum + (f.downloads || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-primary-600 p-3 rounded-xl">
                <Shield className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">관리자 대시보드</h1>
                <p className="text-gray-300 text-sm mt-1">Administrative Control Panel</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors backdrop-blur-sm"
            >
              <LogOut className="h-5 w-5" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">라이브 클래스</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalClasses}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Video className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">파일</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalFiles}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">온라인 코스</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalCourses}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <PlayCircle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">총 등록수</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalRegistered}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Modern Design */}
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-1 p-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="h-5 w-5" />
                <span>대시보드</span>
              </button>
              <button
                onClick={() => setActiveTab('classes')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'classes'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Video className="h-5 w-5" />
                <span>라이브 클래스</span>
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'files'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <FileText className="h-5 w-5" />
                <span>파일</span>
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'courses'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <PlayCircle className="h-5 w-5" />
                <span>온라인 코스</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">최근 활동</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <Video className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-900">라이브 클래스</p>
                    <p className="text-sm text-gray-600">{totalClasses}개 클래스 활성</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-900">파일</p>
                    <p className="text-sm text-gray-600">{totalFiles}개 파일, {totalDownloads} 다운로드</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <PlayCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-900">온라인 코스</p>
                    <p className="text-sm text-gray-600">{totalCourses}개 코스 활성</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">빠른 작업</h2>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setActiveTab('classes')
                    setShowClassForm(true)
                  }}
                  className="w-full flex items-center justify-between p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Video className="h-5 w-5 text-primary-600" />
                    <span className="font-semibold text-gray-900">새 라이브 클래스 추가</span>
                  </div>
                  <Plus className="h-5 w-5 text-primary-600" />
                </button>
                <button
                  onClick={() => {
                    setActiveTab('files')
                    setShowFileForm(true)
                  }}
                  className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-gray-900">새 파일 추가</span>
                  </div>
                  <Plus className="h-5 w-5 text-green-600" />
                </button>
                <button
                  onClick={() => {
                    setActiveTab('courses')
                    setShowCourseForm(true)
                  }}
                  className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <PlayCircle className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-gray-900">새 온라인 코스 추가</span>
                  </div>
                  <Plus className="h-5 w-5 text-purple-600" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Classes Tab - Keep existing implementation but with modern styling */}
        {activeTab === 'classes' && (
          <>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">라이브 클래스 관리</h2>
              <button
                onClick={() => setShowClassForm(true)}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2 shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>새 클래스 추가</span>
              </button>
            </div>

            {/* Class Form Modal - Keep existing but with modern styling */}
            {showClassForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-t-2xl">
                    <h3 className="text-2xl font-bold">
                      {editingClass ? '클래스 수정' : '새 클래스 추가'}
                    </h3>
                    <button onClick={resetClassForm} className="text-white hover:text-gray-200 transition-colors">
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <form onSubmit={handleClassSubmit} className="p-6 space-y-4">
                    {/* Keep all existing form fields - same structure */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        클래스 제목 *
                      </label>
                      <input
                        type="text"
                        required
                        value={classFormData.title}
                        onChange={(e) => setClassFormData({ ...classFormData, title: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="예: 초급 영어 회화"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        설명 *
                      </label>
                      <textarea
                        required
                        rows="3"
                        value={classFormData.description}
                        onChange={(e) => setClassFormData({ ...classFormData, description: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="클래스 내용 및 목표 설명..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          클래스 날짜 *
                        </label>
                        <input
                          type="date"
                          required
                          value={classFormData.date}
                          onChange={(e) => setClassFormData({ ...classFormData, date: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          시간 *
                        </label>
                        <input
                          type="time"
                          required
                          value={classFormData.time}
                          onChange={(e) => setClassFormData({ ...classFormData, time: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        시간대 (Timezone) *
                      </label>
                      <select
                        required
                        value={classFormData.timezone}
                        onChange={(e) => setClassFormData({ ...classFormData, timezone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <optgroup label="한국/일본">
                          <option value="Asia/Seoul">한국 표준시 (KST) - Asia/Seoul</option>
                          <option value="Asia/Tokyo">일본 표준시 (JST) - Asia/Tokyo</option>
                        </optgroup>
                        <optgroup label="중국/대만">
                          <option value="Asia/Shanghai">중국 표준시 (CST) - Asia/Shanghai</option>
                          <option value="Asia/Taipei">대만 표준시 (TST) - Asia/Taipei</option>
                        </optgroup>
                        <optgroup label="미국">
                          <option value="America/New_York">동부 시간 (EST/EDT) - America/New_York</option>
                          <option value="America/Chicago">중부 시간 (CST/CDT) - America/Chicago</option>
                          <option value="America/Denver">산지 시간 (MST/MDT) - America/Denver</option>
                          <option value="America/Los_Angeles">태평양 시간 (PST/PDT) - America/Los_Angeles</option>
                        </optgroup>
                        <optgroup label="유럽">
                          <option value="Europe/London">영국 시간 (GMT/BST) - Europe/London</option>
                          <option value="Europe/Paris">중부유럽 시간 (CET/CEST) - Europe/Paris</option>
                        </optgroup>
                        <optgroup label="기타">
                          <option value="UTC">협정 세계시 (UTC)</option>
                          <option value="Australia/Sydney">호주 동부 시간 (AEST/AEDT) - Australia/Sydney</option>
                        </optgroup>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          등록 시작일 *
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={classFormData.registrationStart}
                          onChange={(e) => setClassFormData({ ...classFormData, registrationStart: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          등록 마감일 *
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={classFormData.registrationEnd}
                          onChange={(e) => setClassFormData({ ...classFormData, registrationEnd: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          소요 시간 *
                        </label>
                        <input
                          type="text"
                          required
                          value={classFormData.duration}
                          onChange={(e) => setClassFormData({ ...classFormData, duration: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="예: 60분"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          플랫폼 *
                        </label>
                        <select
                          required
                          value={classFormData.platform}
                          onChange={(e) => setClassFormData({ ...classFormData, platform: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="Zoom">Zoom</option>
                          <option value="Microsoft Teams">Microsoft Teams</option>
                          <option value="Google Meet">Google Meet</option>
                          <option value="Other">기타</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        미팅 링크 *
                      </label>
                      <input
                        type="url"
                        required
                        value={classFormData.meetingLink}
                        onChange={(e) => setClassFormData({ ...classFormData, meetingLink: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="https://zoom.us/j/..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          강사 *
                        </label>
                        <input
                          type="text"
                          required
                          value={classFormData.instructor}
                          onChange={(e) => setClassFormData({ ...classFormData, instructor: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="강사 이름"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          최대 인원 *
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={classFormData.maxParticipants}
                          onChange={(e) => setClassFormData({ ...classFormData, maxParticipants: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-4 pt-4 border-t">
                      <button
                        type="button"
                        onClick={resetClassForm}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-lg"
                      >
                        {editingClass ? '수정하기' : '생성하기'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Classes List */}
            {classes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((classItem) => (
                  <div key={classItem.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{classItem.title}</h3>
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2">{classItem.description}</p>
                    
                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(classItem.date).toLocaleDateString('ko-KR')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {classItem.time}
                          {classItem.timezone && (
                            <span className="ml-2 text-xs text-gray-500">
                              [{classItem.timezone.split('/')[1] || classItem.timezone}]
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{classItem.registeredCount || 0}/{classItem.maxParticipants} 등록됨</span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleClassEdit(classItem)}
                        className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>수정</span>
                      </button>
                      <button
                        onClick={() => handleClassDelete(classItem.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                <Video className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-xl text-gray-600">등록된 클래스가 없습니다</p>
                <p className="text-gray-500 mt-2">"새 클래스 추가" 버튼을 클릭하여 첫 번째 클래스를 생성하세요</p>
              </div>
            )}
          </>
        )}

        {/* Files Tab */}
        {activeTab === 'files' && (
          <>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">파일 관리</h2>
              <button
                onClick={() => setShowFileForm(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>새 파일 추가</span>
              </button>
            </div>

            {/* File Form Modal */}
            {showFileForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-2xl">
                    <h3 className="text-2xl font-bold">
                      {editingFile ? '파일 수정' : '새 파일 추가'}
                    </h3>
                    <button onClick={resetFileForm} className="text-white hover:text-gray-200 transition-colors">
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <form onSubmit={handleFileSubmit} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        파일 제목 *
                      </label>
                      <input
                        type="text"
                        required
                        value={fileFormData.title}
                        onChange={(e) => setFileFormData({ ...fileFormData, title: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="예: 기초 어휘 워크북"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        설명 *
                      </label>
                      <textarea
                        required
                        rows="3"
                        value={fileFormData.description}
                        onChange={(e) => setFileFormData({ ...fileFormData, description: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="자료에 대한 설명..."
                      />
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-sm text-green-800">
                        <strong>참고:</strong> 모든 파일은 무료로 제공됩니다.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          형식 *
                        </label>
                        <select
                          required
                          value={fileFormData.format}
                          onChange={(e) => setFileFormData({ ...fileFormData, format: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="PDF">PDF</option>
                          <option value="ZIP">ZIP</option>
                          <option value="ZIP (MP3 + PDF)">ZIP (MP3 + PDF)</option>
                          <option value="DOCX">DOCX</option>
                          <option value="PPTX">PPTX</option>
                          <option value="기타">기타</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          파일 크기 *
                        </label>
                        <input
                          type="text"
                          required
                          value={fileFormData.size}
                          onChange={(e) => setFileFormData({ ...fileFormData, size: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="2.5 MB"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          페이지 수
                        </label>
                        <input
                          type="text"
                          value={fileFormData.pages}
                          onChange={(e) => setFileFormData({ ...fileFormData, pages: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="예: 105 페이지 또는 25 슬라이드"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        파일 업로드
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-2">파일을 드래그하거나 클릭하여 업로드</p>
                        <input
                          type="file"
                          accept=".pdf,.zip,.docx,.pptx"
                          onChange={async (e) => {
                            const file = e.target.files[0]
                            if (file) {
                              const fileExtension = file.name.split('.').pop().toUpperCase()
                              const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
                              const detectedFormat = fileExtension === 'ZIP' ? 'ZIP' : 
                                                    fileExtension === 'PDF' ? 'PDF' :
                                                    fileExtension === 'DOCX' ? 'DOCX' :
                                                    fileExtension === 'PPTX' ? 'PPTX' : fileFormData.format
                              
                              // Show upload progress
                              setUploadProgress({
                                fileName: file.name,
                                progress: 0,
                                type: 'file'
                              })
                              
                              try {
                                const formData = new FormData()
                                formData.append('file', file)
                                
                                // Create XMLHttpRequest for progress tracking
                                const xhr = new XMLHttpRequest()
                                
                                xhr.upload.addEventListener('progress', (e) => {
                                  if (e.lengthComputable) {
                                    const percentComplete = Math.round((e.loaded / e.total) * 100)
                                    setUploadProgress(prev => ({
                                      ...prev,
                                      progress: percentComplete
                                    }))
                                  }
                                })
                                
                                xhr.addEventListener('load', async () => {
                                  if (xhr.status === 200) {
                                    const data = JSON.parse(xhr.responseText)
                                    if (data.success) {
                                      setFileFormData({
                                        ...fileFormData,
                                        format: detectedFormat,
                                        size: `${fileSizeMB} MB`,
                                        fileUrl: data.fileUrl,
                                        pages: data.pages || fileFormData.pages,
                                        previewImage: data.previewImage || fileFormData.previewImage
                                      })
                                      alert('파일이 성공적으로 업로드되었습니다!')
                                    } else {
                                      throw new Error(data.error || 'Upload failed')
                                    }
                                  } else {
                                    throw new Error('Upload failed')
                                  }
                                  setUploadProgress(null)
                                })
                                
                                xhr.addEventListener('error', () => {
                                  console.error('File upload error')
                                  alert('파일 업로드에 실패했습니다. 백엔드 서버가 실행 중인지 확인하세요.')
                                  setUploadProgress(null)
                                })
                                
                                xhr.open('POST', apiEndpoint('files/upload'))
                                addAuthHeaders(xhr)
                                xhr.send(formData)
                                
                              } catch (error) {
                                console.error('File upload error:', error)
                                alert(`파일 업로드에 실패했습니다: ${error.message}`)
                                setUploadProgress(null)
                              }
                            }
                          }}
                          className="hidden"
                          id="file-upload"
                        />
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                        >
                          파일 선택
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                          파일을 선택하면 자동으로 백엔드 서버에 업로드됩니다.
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        파일 URL (선택사항)
                      </label>
                      <input
                        type="url"
                        value={fileFormData.fileUrl}
                        onChange={(e) => setFileFormData({ ...fileFormData, fileUrl: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="https://example.com/files/document.pdf"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        파일 다운로드/열람을 위한 URL을 입력하세요 (백엔드 파일 서버 URL)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        미리보기 이미지 URL (선택사항)
                      </label>
                      <input
                        type="url"
                        value={fileFormData.previewImage}
                        onChange={(e) => setFileFormData({ ...fileFormData, previewImage: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="https://example.com/previews/document-preview.jpg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        파일의 첫 페이지/표지 이미지 URL (백엔드에서 자동 생성된 미리보기 이미지 URL)
                      </p>
                      {fileFormData.previewImage && (
                        <div className="mt-3">
                          <img 
                            src={fileFormData.previewImage} 
                            alt="미리보기" 
                            className="max-w-full h-32 object-cover rounded-lg border border-gray-300"
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-4 pt-4 border-t">
                      <button
                        type="button"
                        onClick={resetFileForm}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-lg"
                      >
                        {editingFile ? '수정하기' : '생성하기'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Files List */}
            {files.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {files.map((file) => (
                  <div key={file.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{file.title}</h3>
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-600">
                        무료
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2">{file.description}</p>
                    
                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div>형식: {file.format}</div>
                      {file.size && <div>크기: {file.size}</div>}
                      {file.pages && <div>페이지: {file.pages}</div>}
                      <div>접근 횟수: {file.downloads || 0}</div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleFileEdit(file)}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>수정</span>
                      </button>
                      <button
                        onClick={() => handleFileDelete(file.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-xl text-gray-600">등록된 파일이 없습니다</p>
                <p className="text-gray-500 mt-2">"새 파일 추가" 버튼을 클릭하여 첫 번째 파일을 생성하세요</p>
              </div>
            )}
          </>
        )}

        {/* Online Courses Tab */}
        {activeTab === 'courses' && (
          <>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">온라인 코스 관리</h2>
              <button
                onClick={() => setShowCourseForm(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 shadow-lg"
              >
                <Plus className="h-5 w-5" />
                <span>새 클래스 추가</span>
              </button>
            </div>

            {/* Course Form Modal */}
            {showCourseForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-2xl">
                    <h3 className="text-2xl font-bold">
                      {editingCourse ? '코스 수정' : '새 온라인 코스 추가'}
                    </h3>
                    <button onClick={resetCourseForm} className="text-white hover:text-gray-200 transition-colors">
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <form onSubmit={handleCourseSubmit} className="p-6 space-y-6">
  {/* Basic Course Info */}
  <div className="border-b pb-4">
    <h4 className="text-lg font-semibold mb-4">기본 정보</h4>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          코스 제목 *
        </label>
        <input
          type="text"
          required
          value={courseFormData.title}
          onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="예: 기초 영어 회화 코스"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          설명 *
        </label>
        <textarea
          required
          rows="3"
          value={courseFormData.description}
          onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="코스에 대한 설명..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            유형 *
          </label>
          <select
            required
            value={courseFormData.type}
            onChange={(e) => setCourseFormData({ ...courseFormData, type: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="free">무료</option>
            <option value="paid">유료</option>
          </select>
        </div>

        {courseFormData.type === 'paid' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                가격 ($) *
              </label>
              <input
                type="number"
                required={courseFormData.type === 'paid'}
                min="0"
                step="0.01"
                value={courseFormData.price}
                onChange={(e) => setCourseFormData({ ...courseFormData, price: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="9.99"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                접근 기간 (일) *
              </label>
              <input
                type="number"
                required={courseFormData.type === 'paid'}
                min="1"
                value={courseFormData.accessDuration}
                onChange={(e) => setCourseFormData({ ...courseFormData, accessDuration: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="30"
              />
              <p className="text-xs text-gray-500 mt-1">구매 후 접근 가능한 기간 (일 단위)</p>
            </div>
          </>
        )}
      </div>
    </div>
  </div>

  {/* Lessons/Chapters Management */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      코스 구조 (챕터 & 레슨) *
    </label>
    
    {/* Lesson List */}
    <div className="border border-gray-300 rounded-lg p-4 space-y-3 mb-3 max-h-96 overflow-y-auto bg-gray-50">
      {courseFormData.lessons && courseFormData.lessons.length > 0 ? (
        courseFormData.lessons.map((lesson, index) => (
          <div key={lesson.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex-grow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-gray-900">{lesson.title}</span>
                  {lesson.type === 'chapter' && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">챕터</span>
                  )}
                </div>
                {lesson.description && (
                  <p className="text-sm text-gray-600 ml-8 mb-2">{lesson.description}</p>
                )}
                {lesson.type !== 'chapter' && (
                  <div className="ml-8 space-y-1 text-xs text-gray-500">
                    {lesson.duration && <div>⏱️ {lesson.duration}</div>}
                    {lesson.videoUrl && <div className="truncate">🎥 {lesson.videoUrl.substring(0, 50)}...</div>}
                    {lesson.textContent && <div>📝 텍스트 콘텐츠 포함</div>}
                    {lesson.files && lesson.files.length > 0 && <div>📎 {lesson.files.length}개 파일</div>}
                    {lesson.questions && lesson.questions.length > 0 && <div>❓ {lesson.questions.length}개 문제</div>}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <button
                  type="button"
                  onClick={() => handleLessonEdit(lesson)}
                  className="text-blue-600 hover:text-blue-700 p-1"
                  title="수정"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeLessonFromCourse(lesson.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                  title="삭제"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-sm text-center py-4">레슨/챕터가 없습니다. 아래에서 추가하세요.</p>
      )}
    </div>

    {/* Add/Edit Lesson Form */}
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 space-y-3 bg-white">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-700">
          {editingLesson ? '레슨/챕터 수정' : '레슨/챕터 추가'}
        </h4>
        {editingLesson && (
          <button
            type="button"
            onClick={handleLessonCancel}
            className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
          >
            <X className="h-4 w-4" /> 취소
          </button>
        )}
      </div>

      {/* Lesson Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">타입</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCurrentLessonForm({ ...currentLessonForm, type: 'lesson' })}
            className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
              (currentLessonForm.type || 'lesson') === 'lesson'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            레슨 (콘텐츠)
          </button>
          <button
            type="button"
            onClick={() => setCurrentLessonForm({ ...currentLessonForm, type: 'chapter' })}
            className={`flex-1 px-4 py-2 rounded-lg border-2 transition-colors ${
              currentLessonForm.type === 'chapter'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            챕터 (구분자)
          </button>
        </div>
      </div>

      {/* Title */}
      <input
        type="text"
        value={currentLessonForm.title}
        onChange={(e) => setCurrentLessonForm({ ...currentLessonForm, title: e.target.value })}
        placeholder={currentLessonForm.type === 'chapter' ? '챕터 제목 (예: 1장 - 기초)' : '레슨 제목'}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
      />

      {/* Description */}
      <textarea
        value={currentLessonForm.description || ''}
        onChange={(e) => setCurrentLessonForm({ ...currentLessonForm, description: e.target.value })}
        placeholder="설명 (선택사항)"
        rows="2"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
      />

      {/* Content fields (only show for lessons, not chapters) */}
      {currentLessonForm.type !== 'chapter' && (
        <>
          {/* Duration */}
          <input
            type="text"
            value={currentLessonForm.duration}
            onChange={(e) => setCurrentLessonForm({ ...currentLessonForm, duration: e.target.value })}
            placeholder="소요시간 (예: 15분)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />

          {/* Text Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">텍스트 콘텐츠 (선택사항)</label>
            <textarea
              value={currentLessonForm.textContent || ''}
              onChange={(e) => setCurrentLessonForm({ ...currentLessonForm, textContent: e.target.value })}
              placeholder="레슨에 대한 텍스트 설명, 지침, 또는 강의 내용을 여기에 작성하세요..."
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>

{/* Video Upload Section */}
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <label className="block text-sm font-medium text-gray-700">
      비디오 소스 (선택사항)
    </label>
    <div className="flex space-x-2">
      <button
        type="button"
        onClick={() => setVideoSourceType('upload')}
        className={`px-3 py-1 text-xs rounded ${
          videoSourceType === 'upload'
            ? 'bg-purple-600 text-white'
            : 'bg-gray-200 text-gray-700'
        }`}
      >
        파일 업로드
      </button>
      <button
        type="button"
        onClick={() => setVideoSourceType('url')}
        className={`px-3 py-1 text-xs rounded ${
          videoSourceType === 'url'
            ? 'bg-purple-600 text-white'
            : 'bg-gray-200 text-gray-700'
        }`}
      >
        외부 URL
      </button>
    </div>
  </div>

  {videoSourceType === 'upload' ? (
    <div>
      <label className="block w-full">
        <span className="sr-only">비디오 파일 선택</span>
        <input
          type="file"
          accept="video/*"
          onChange={handleLessonVideoChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-semibold
            file:bg-purple-50 file:text-purple-700
            hover:file:bg-purple-100
            cursor-pointer"
        />
      </label>
      {uploadingLessonVideo && (
        <div className="mt-2 text-sm text-purple-600">
          업로드 중... {videoUploadProgress}%
        </div>
      )}
      {currentLessonForm.videoUrl && videoSourceType === 'upload' && (
        <div className="mt-2 text-sm text-green-600">
          ✓ 비디오 업로드 완료
        </div>
      )}
    </div>
  ) : (
    <div>
      <input
        type="url"
        value={currentLessonForm.videoUrl}
        onChange={(e) => setCurrentLessonForm({ ...currentLessonForm, videoUrl: e.target.value })}
        placeholder="YouTube, Vimeo, Google Drive 등의 비디오 URL"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
      />
      <p className="mt-1 text-xs text-gray-500">
        예: https://www.youtube.com/watch?v=... 또는 https://vimeo.com/...
      </p>
    </div>
  )}
</div>

{/* Interactive Questions Section */}
<div className="border-t pt-4">
  <div className="flex items-center justify-between mb-3">
    <label className="block text-sm font-medium text-gray-700">
      인터랙티브 문제 (선택사항)
    </label>
    <button
      type="button"
      onClick={() => setShowQuestionForm(!showQuestionForm)}
      className="text-sm px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      {showQuestionForm ? '취소' : '문제 추가'}
    </button>
  </div>

  {/* Question List */}
  {currentLessonForm.questions && currentLessonForm.questions.length > 0 && (
    <div className="space-y-2 mb-3">
      {currentLessonForm.questions.map((q, idx) => (
        <div key={q.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                  {q.type === 'multiple-choice' ? '객관식' : '매칭'}
                </span>
                <span className="text-sm font-medium text-gray-700">문제 {idx + 1}</span>
              </div>
              <p className="text-sm text-gray-600 truncate">{q.question || '매칭 문제'}</p>
            </div>
            <button
              type="button"
              onClick={() => removeQuestionFromLesson(q.id)}
              className="text-red-600 hover:text-red-700 ml-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )}

  {/* Question Form */}
  {showQuestionForm && (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">문제 유형</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCurrentQuestion({ ...currentQuestion, type: 'multiple-choice' })}
            className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors ${
              currentQuestion.type === 'multiple-choice'
                ? 'border-blue-500 bg-white text-blue-700'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            객관식
          </button>
          <button
            type="button"
            onClick={() => setCurrentQuestion({ ...currentQuestion, type: 'matching' })}
            className={`flex-1 px-3 py-2 rounded-lg border-2 transition-colors ${
              currentQuestion.type === 'matching'
                ? 'border-blue-500 bg-white text-blue-700'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            매칭
          </button>
        </div>
      </div>

      {currentQuestion.type === 'multiple-choice' ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">질문</label>
            <input
              type="text"
              value={currentQuestion.question}
              onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
              placeholder="질문을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">선택지</label>
            <div className="space-y-2">
              {currentQuestion.options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={currentQuestion.correctAnswer === idx}
                    onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: idx })}
                    className="text-blue-600"
                  />
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(idx, e.target.value)}
                    placeholder={`선택지 ${idx + 1}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">라디오 버튼으로 정답을 선택하세요</p>
          </div>
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">매칭 항목</label>
          <div className="space-y-2">
            {currentQuestion.matchingPairs.map((pair, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={pair.left}
                  onChange={(e) => updateMatchingPair(idx, 'left', e.target.value)}
                  placeholder="왼쪽 항목"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-400">↔</span>
                <input
                  type="text"
                  value={pair.right}
                  onChange={(e) => updateMatchingPair(idx, 'right', e.target.value)}
                  placeholder="오른쪽 항목"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {currentQuestion.matchingPairs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMatchingPair(idx)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addMatchingPair}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700"
          >
            + 매칭 항목 추가
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={addQuestionToLesson}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        문제 추가
      </button>
    </div>
  )}
</div>
        </>
      )}

      <button
        type="button"
        onClick={addLessonToCourse}
        className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium"
      >
        {editingLesson ? '레슨/챕터 수정' : '레슨/챕터 추가'}
      </button>
    </div>
  </div>

  {/* Submit Buttons */}
  <div className="flex justify-end space-x-4 pt-4 border-t">
    <button
      type="button"
      onClick={resetCourseForm}
      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
    >
      취소
    </button>
    <button
      type="submit"
      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-lg"
    >
      {editingCourse ? '수정하기' : '생성하기'}
    </button>
  </div>
</form>
                </div>
              </div>
            )}

            {/* Courses List */}
            {onlineCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {onlineCourses.map((course) => (
                  <div key={course.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{course.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        course.type === 'paid' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {course.type === 'paid' ? '유료' : '무료'}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2">{course.description}</p>
                    
                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div>레슨: {course.lessons?.length || 0}개</div>
                      {course.students && <div>수강생: {course.students}명</div>}
                      {course.type === 'paid' && <div className="font-semibold text-orange-600">가격: {course.price}</div>}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleCourseEdit(course)}
                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>수정</span>
                      </button>
                      <button
                        onClick={() => handleCourseDelete(course.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-lg">
                <PlayCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-xl text-gray-600">등록된 온라인 코스가 없습니다</p>
                <p className="text-gray-500 mt-2">"새 코스 추가" 버튼을 클릭하여 첫 번째 온라인 코스를 생성하세요</p>
              </div>
            )}
          </>
        )}
      </div>
      {/* Upload Progress Modal */}
      {uploadProgress && (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
      <div className="text-center mb-6">
        <Upload className="h-16 w-16 mx-auto text-primary-600 mb-4 animate-bounce" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {uploadProgress.converting ? '비디오 변환 중' : 
           uploadProgress.type === 'video' ? '비디오 업로드 중' : '파일 업로드 중'}
        </h3>
        <p className="text-gray-600 mb-1">{uploadProgress.fileName}</p>
        <p className="text-sm text-gray-500">
          {uploadProgress.converting 
            ? 'HLS 형식으로 변환하는 중입니다. 잠시만 기다려주세요...'
            : '페이지를 떠나지 마세요'
          }
        </p>
      </div>
      
      {!uploadProgress.converting && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>업로드 진행률</span>
            <span className="font-bold text-primary-600">{uploadProgress.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-600 h-4 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress.progress}%` }}
            />
          </div>
        </div>
      )}
      
      {uploadProgress.converting && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-4 rounded-full animate-pulse w-full" />
          </div>
        </div>
      )}
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-xs text-yellow-800 text-center">
          ⚠️ {uploadProgress.converting 
            ? '변환이 완료될 때까지 기다려주세요. 서버에서 처리 중입니다.'
            : '업로드가 완료될 때까지 이 페이지를 떠나지 마세요'
          }
        </p>
      </div>
    </div>
  </div>
)}
    </div>
  )
}
