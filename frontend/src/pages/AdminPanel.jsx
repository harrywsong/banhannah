import { useState, useEffect } from 'react'
import AdminLogin from '../components/AdminLogin'
import { apiEndpoint, addAuthHeaders } from '../config/api'
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { Plus, Calendar, Clock, Video, Users, Edit, Trash2, X, FileText, Upload, PlayCircle, LogOut, BarChart3, Settings, Shield, Download, BookOpen, FileQuestion, ChevronUp, ChevronDown, RotateCcw, ImageIcon } from 'lucide-react'


export default function AdminPanel() {
  const { adminSession, adminLogout, isAdmin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('dashboard')
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
  const [uploadingLessonVideo, setUploadingLessonVideo] = useState(false)  // ← ADD THIS LINE
  const [videoUploadProgress, setVideoUploadProgress] = useState(0)        // ← ADD THIS LINE
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
    registrationEnd: '',
    previewImage: ''
  })
  const [classPreviewFile, setClassPreviewFile] = useState(null)
  const [classPreviewUrl, setClassPreviewUrl] = useState(null)

  const [fileFormData, setFileFormData] = useState({
    title: '',
    description: '',
    format: 'PDF',
    size: '',
    pages: '',
    fileUrl: '',
    previewImage: ''
  })
  const [filePreviewFile, setFilePreviewFile] = useState(null)
  const [filePreviewUrl, setFilePreviewUrl] = useState(null)

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
  chapterNumber: '',      // NEW: For chapter numbering (1, 2, 3)
  lessonNumber: '',       // NEW: For lesson numbering (1.1, 1.2)
  content: [],           // NEW: Array of content blocks
  duration: ''
})

  useEffect(() => {
    if (!adminSession) return

    const loadClasses = async () => {
      try {
        const response = await apiRequestAdmin(apiEndpoint('liveclasses/metadata'))
        if (response.ok) {
          const data = await response.json()
          setClasses(data.liveclasses || [])
        } else {
          console.error('Failed to load live classes')
        }
      } catch (error) {
        console.error('Error loading live classes:', error)
      }
    }

    const loadFiles = async () => {
      try {
        const response = await apiRequestAdmin(apiEndpoint('files/metadata'))
        if (response.ok) {
          const data = await response.json()
          setFiles(data.files || [])
        } else {
          console.error('Failed to load files')
        }
      } catch (error) {
        console.error('Error loading files:', error)
      }
    }

    const loadCourses = async () => {
      try {
        const response = await apiRequestAdmin(apiEndpoint('courses/metadata'))
        if (response.ok) {
          const data = await response.json()
          setOnlineCourses(data.courses || [])
        } else {
          console.error('Failed to load courses')
        }
      } catch (error) {
        console.error('Error loading courses:', error)
      }
    }

    loadClasses()
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

  const handleLogout = () => {
    adminLogout();
    console.log('✓ Admin logged out successfully');
  };

  // Admin API request helper with admin token
  const addAuthHeadersAdmin = (xhr) => {
    const token = localStorage.getItem('adminToken');
    
    xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
    
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
  };

  const apiRequestAdmin = async (url, options = {}) => {
  const token = localStorage.getItem('adminToken')
  
  const defaultHeaders = {
    'ngrok-skip-browser-warning': 'true',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  }
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }
  
  const isFormData = options.body instanceof FormData
  if (!isFormData && options.body) {
    defaultHeaders['Content-Type'] = 'application/json'
  }
  
  const mergedOptions = {
    ...options,
    credentials: 'include',
    headers: {
      ...defaultHeaders,
      ...options.headers
    }
  }
  
  try {
    console.log('Admin API Request:', { url, method: options.method || 'GET', hasToken: !!token })
    const response = await fetch(url, mergedOptions)
    
    // Log rate limit errors
    if (response.status === 429) {
      console.error('❌ Rate limit exceeded:', await response.text())
    }
    
    return response
  } catch (error) {
    console.error('Admin API request failed:', error)
    throw error
  }
}

    const handleClassSubmit = async (e) => {
    e.preventDefault()

    const classData = {
      ...classFormData,
      registeredCount: editingClass?.registeredCount || 0,
      maxParticipants: parseInt(classFormData.maxParticipants),
      createdAt: editingClass?.createdAt || new Date().toISOString()
    }

    try {
      let response
      if (editingClass) {
        response = await apiRequestAdmin(apiEndpoint(`liveclasses/metadata/${editingClass.id}`), {
          method: 'PUT',
          body: JSON.stringify(classData)
        })
      } else {
        response = await apiRequestAdmin(apiEndpoint('liveclasses/metadata'), {
          method: 'POST',
          body: JSON.stringify(classData)
        })
      }

      if (response.ok) {
        const classesResponse = await apiRequestAdmin(apiEndpoint('liveclasses/metadata'))
        if (classesResponse.ok) {
          const classesData = await classesResponse.json()
          setClasses(classesData.liveclasses || [])
        }
        resetClassForm()
        alert('클래스가 성공적으로 저장되었습니다!')
      } else {
        const errorData = await response.json()
        alert(`클래스 저장에 실패했습니다: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Class save error:', error)
      alert(`클래스 저장에 실패했습니다: ${error.message}`)
    }
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
      registrationEnd: classItem.registrationEnd || '',
      previewImage: classItem.previewImage || ''
    })
    setClassPreviewUrl(classItem.previewImage || null)
    setClassPreviewFile(null)
    setShowClassForm(true)
  }

  const handleClassDelete = async (id) => {
    if (!window.confirm('이 클래스를 삭제하시겠습니까?')) return

    try {
      const response = await apiRequestAdmin(apiEndpoint(`liveclasses/metadata/${id}`), {
        method: 'DELETE',
      })
      if (response.ok) {
        // Refresh list
        const res = await apiRequestAdmin(apiEndpoint('liveclasses/metadata'))
        if (res.ok) {
          const data = await res.json()
          setClasses(data.liveclasses || [])
        }
      } else {
        const err = await response.json()
        alert(`Failed: ${err.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error(error)
      alert(`Error: ${error.message}`)
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
      registrationEnd: '',
      previewImage: ''
    })
    setClassPreviewFile(null)
    setClassPreviewUrl(null)
    setShowClassForm(false)
    setEditingClass(null)
  }

  // File handlers (all files are free)
  const handleFileSubmit = async (e) => {
  e.preventDefault()

  // CRITICAL: Ensure previewImage is included in the data
  const fileData = {
      ...fileFormData,
      type: 'file',
      downloads: editingFile?.downloads || 0,
      previewImage: fileFormData.previewImage || null, // ← ENSURE THIS IS SET
      createdAt: editingFile?.createdAt || new Date().toISOString()
    }

    console.log('💾 Saving file with data:', fileData)

    try {
      let response
      if (editingFile) {
        response = await apiRequestAdmin(apiEndpoint(`files/metadata/${editingFile.id}`), {
          method: 'PUT',
          body: JSON.stringify(fileData)
        })
      } else {
        response = await apiRequestAdmin(apiEndpoint('files/metadata'), {
          method: 'POST',
          body: JSON.stringify(fileData)
        })
      }

      if (response.ok) {
        const filesResponse = await apiRequestAdmin(apiEndpoint('files/metadata'))
        if (filesResponse.ok) {
          const filesData = await filesResponse.json()
          setFiles(filesData.files || [])
        }
        resetFileForm()
        alert('파일이 성공적으로 저장되었습니다!')
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
    console.log('📝 Editing file:', {
      id: file.id,
      title: file.title,
      previewImage: file.previewImage
    })
    
    setEditingFile(file)
    setFileFormData({
      title: file.title || '',
      description: file.description || '',
      format: file.format || 'PDF',
      size: file.size || '',
      pages: file.pages || '',
      fileUrl: file.fileUrl || '',
      previewImage: file.previewImage || '' // ← CRITICAL
    })
    setFilePreviewUrl(file.previewImage || null)
    setFilePreviewFile(null)
    setShowFileForm(true)
  }

  const handleFileDelete = async (id) => {
    if (!window.confirm('이 파일을 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await apiRequestAdmin(apiEndpoint(`files/metadata/${id}`), {
        method: 'DELETE'
      })

      if (response.ok) {
        // Reload files from backend
        const filesResponse = await apiRequestAdmin(apiEndpoint('files/metadata'))
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
    setFilePreviewFile(null)
    setFilePreviewUrl(null)
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
        response = await apiRequestAdmin(apiEndpoint(`courses/metadata/${editingCourse.id}`), {
          method: 'PUT',
          body: JSON.stringify(courseData)
        })
      } else {
        // Create new course
        response = await apiRequestAdmin(apiEndpoint('courses/metadata'), {
          method: 'POST',
          body: JSON.stringify(courseData)
        })
      }

      if (response.ok) {
        // Reload courses from backend
        const coursesResponse = await apiRequestAdmin(apiEndpoint('courses/metadata'))
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
      const response = await apiRequestAdmin(apiEndpoint(`courses/metadata/${id}`), {
        method: 'DELETE'
      })

      if (response.ok) {
        // Reload courses from backend
        const coursesResponse = await apiRequestAdmin(apiEndpoint('courses/metadata'))
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
      description: '',
      type: 'lesson',
      duration: '',
      content: []
    })
    setShowCourseForm(false)
    setEditingCourse(null)
    setEditingLesson(null)
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
  if (!currentLessonForm.title?.trim()) {
    alert('레슨 제목을 입력하세요')
    return
  }
    
    // Ensure content array exists and has proper order
    const content = (currentLessonForm.content || []).map((block, index) => ({
      ...block,
      order: index
    }));
    
    if (editingLesson) {
      // Update existing lesson
      setCourseFormData({
        ...courseFormData,
        lessons: courseFormData.lessons.map(l => 
          l.id === editingLesson.id ? { ...currentLessonForm, id: editingLesson.id, content } : l
        )
      })
      setEditingLesson(null)
    } else {
      // Add new lesson
      const newLesson = {
        id: Date.now(),
        ...currentLessonForm,
        content
      }
      setCourseFormData({
        ...courseFormData,
        lessons: [...courseFormData.lessons, newLesson]
      })
    }
    
    // Reset form
    setCurrentLessonForm({
      title: '',
      description: '',
      type: 'lesson',
      duration: '',
      content: []
    })
  }

  const handleLessonEdit = (lesson) => {
    setEditingLesson(lesson)
    setCurrentLessonForm({
      title: lesson.title || '',
      description: lesson.description || '',
      type: lesson.type || 'lesson',
      duration: lesson.duration || '',
      content: lesson.content || []
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

  // Video upload handler for lessons
  const handleLessonVideoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      setUploadingLessonVideo(true)
      setVideoUploadProgress(0)

      const formData = new FormData()
      formData.append('video', file)
      
      // Add course ID if editing an existing course
      if (editingCourse && editingCourse.id) {
        formData.append('courseId', editingCourse.id)
      }
      
      // Add lesson ID if editing an existing lesson
      if (editingLesson && editingLesson.id) {
        formData.append('lessonId', editingLesson.id)
      }


      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100)
          setVideoUploadProgress(percentComplete)
        }
      })

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
if (data.success) {
  console.log('✓ Video uploaded successfully:', data);
  
  // CRITICAL: Extract videoId from the HLS URL for token-based playback
  let videoId = null;
  if (data.hlsUrl) {
    const hlsMatch = data.hlsUrl.match(/\/api\/videos\/hls\/([^\/]+)/);
    if (hlsMatch) {
      videoId = hlsMatch[1];
    }
  }
  
  // Update lesson form with video URL
  setCurrentLessonForm({
    ...currentLessonForm,
    videoUrl: data.hlsUrl || data.videoUrl,
    videoId: videoId // Store the videoId for later use
  });

  setUploadingLessonVideo(false);
  setVideoUploadProgress(0);
  alert('비디오가 성공적으로 업로드되었습니다!')
          } else {
            throw new Error(data.error || 'Upload failed')
          }
        } else {
          throw new Error('Upload failed')
        }
      })

      xhr.addEventListener('error', () => {
        console.error('Video upload error')
        alert('비디오 업로드에 실패했습니다.')
        setUploadingLessonVideo(false)
        setVideoUploadProgress(0)
      })

      xhr.open('POST', apiEndpoint('videos/upload'))
      addAuthHeadersAdmin(xhr)
      xhr.send(formData)

    } catch (error) {
      console.error('Video upload error:', error)
      alert(`비디오 업로드에 실패했습니다: ${error.message}`)
      setUploadingLessonVideo(false)
      setVideoUploadProgress(0)
    }
  }

const handleFilePreviewUpload = async (e) => {
  const file = e.target.files[0]
  if (!file) return

  // Validate it's an image
  if (!file.type.startsWith('image/')) {
    alert('이미지 파일만 업로드할 수 있습니다.')
    return
  }

  try {
    setUploadProgress({
      fileName: file.name,
      progress: 0,
      type: 'image'
    })

    const formData = new FormData()
    formData.append('preview', file)

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
          console.log('✅ Preview uploaded:', data.imageUrl)
          
          // CRITICAL FIX: Store only the filename, not the full URL
          const filename = data.fileName || data.imageUrl.split('/').pop()
          
          setFileFormData(prev => ({
            ...prev,
            previewImage: filename  // ✅ Just the filename
          }))
          setFilePreviewUrl(data.imageUrl)  // For immediate display
          setFilePreviewFile(file)
          
          alert('미리보기 이미지가 성공적으로 업로드되었습니다!')
        }
      } else {
        throw new Error('Upload failed')
      }
      setUploadProgress(null)
    })

    xhr.addEventListener('error', () => {
      alert('이미지 업로드에 실패했습니다.')
      setUploadProgress(null)
    })

    xhr.open('POST', apiEndpoint('files/upload-preview'))
    addAuthHeadersAdmin(xhr)
    xhr.send(formData)

  } catch (error) {
    console.error('Image upload error:', error)
    alert(`이미지 업로드에 실패했습니다: ${error.message}`)
    setUploadProgress(null)
  }
}
  // Handle class preview image upload
  const handleClassPreviewUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate image type
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100)
          setUploadProgress({
            fileName: file.name,
            progress: percentComplete,
            type: 'image'
          })
        }
      })

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText)
          if (data.success) {
            setClassFormData({
              ...classFormData,
              previewImage: data.fileUrl
            })
            setClassPreviewUrl(data.fileUrl)
            setClassPreviewFile(file)
            alert('미리보기 이미지가 성공적으로 업로드되었습니다!')
          }
        } else {
          throw new Error('Upload failed')
        }
        setUploadProgress(null)
      })

      xhr.addEventListener('error', () => {
        alert('이미지 업로드에 실패했습니다.')
        setUploadProgress(null)
      })

      xhr.open('POST', apiEndpoint('files/upload'))
      addAuthHeadersAdmin(xhr)
      xhr.send(formData)
    } catch (error) {
      console.error('Image upload error:', error)
      alert(`이미지 업로드에 실패했습니다: ${error.message}`)
      setUploadProgress(null)
    }
  }

  const handleCoursePreviewUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    try {
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        type: 'image'
      })

      const formData = new FormData()
      formData.append('preview', file)

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
            console.log('✅ Course preview uploaded:', data.imageUrl)
            
            // Update course form data
            setCourseFormData(prev => ({
              ...prev,
              previewImage: data.imageUrl
            }))
            
            alert('코스 미리보기 이미지가 성공적으로 업로드되었습니다!')
          }
        } else {
          throw new Error('Upload failed')
        }
        setUploadProgress(null)
      })

      xhr.addEventListener('error', () => {
        alert('이미지 업로드에 실패했습니다.')
        setUploadProgress(null)
      })

      xhr.open('POST', apiEndpoint('files/upload-preview'))
      addAuthHeadersAdmin(xhr)
      xhr.send(formData)

    } catch (error) {
      console.error('Course preview upload error:', error)
      alert(`이미지 업로드에 실패했습니다: ${error.message}`)
      setUploadProgress(null)
    }
  }


  // Show login if not authenticated
  if (!adminSession) {
    return <AdminLogin />
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
{/* Stats Cards - Enhanced */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
    <div className="flex items-center justify-between mb-4">
      <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
        <Video className="h-6 w-6" />
      </div>
      <div className="text-right">
        <p className="text-3xl font-bold">{totalClasses}</p>
        <p className="text-blue-100 text-sm">Total Classes</p>
      </div>
    </div>
    <div className="flex items-center justify-between text-sm">
      <span className="text-blue-100">라이브 클래스</span>
      <span className="bg-white/20 px-2 py-1 rounded">Active</span>
    </div>
  </div>

  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
    <div className="flex items-center justify-between mb-4">
      <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
        <FileText className="h-6 w-6" />
      </div>
      <div className="text-right">
        <p className="text-3xl font-bold">{totalFiles}</p>
        <p className="text-green-100 text-sm">Total Files</p>
      </div>
    </div>
    <div className="flex items-center justify-between text-sm">
      <span className="text-green-100">파일</span>
      <span className="bg-white/20 px-2 py-1 rounded">{totalDownloads} views</span>
    </div>
  </div>

  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
    <div className="flex items-center justify-between mb-4">
      <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
        <PlayCircle className="h-6 w-6" />
      </div>
      <div className="text-right">
        <p className="text-3xl font-bold">{totalCourses}</p>
        <p className="text-purple-100 text-sm">Total Courses</p>
      </div>
    </div>
    <div className="flex items-center justify-between text-sm">
      <span className="text-purple-100">온라인 코스</span>
      <span className="bg-white/20 px-2 py-1 rounded">Active</span>
    </div>
  </div>

  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
    <div className="flex items-center justify-between mb-4">
      <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
        <Users className="h-6 w-6" />
      </div>
      <div className="text-right">
        <p className="text-3xl font-bold">{totalRegistered}</p>
        <p className="text-orange-100 text-sm">Registrations</p>
      </div>
    </div>
    <div className="flex items-center justify-between text-sm">
      <span className="text-orange-100">총 등록수</span>
      <span className="bg-white/20 px-2 py-1 rounded">All time</span>
    </div>
  </div>
</div>

{/* Navigation Tabs - Enhanced */}
<div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
  <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
    <nav className="flex space-x-1 p-3">
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all relative ${
          activeTab === 'dashboard'
            ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg scale-105'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <BarChart3 className="h-5 w-5" />
        <span>Dashboard</span>
        {activeTab === 'dashboard' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-full" />
        )}
      </button>
      <button
        onClick={() => setActiveTab('classes')}
        className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all relative ${
          activeTab === 'classes'
            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <Video className="h-5 w-5" />
        <span>Live Classes</span>
        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
          activeTab === 'classes' ? 'bg-white/20' : 'bg-blue-100 text-blue-600'
        }`}>
          {totalClasses}
        </span>
        {activeTab === 'classes' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-full" />
        )}
      </button>
      <button
        onClick={() => setActiveTab('files')}
        className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all relative ${
          activeTab === 'files'
            ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg scale-105'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <FileText className="h-5 w-5" />
        <span>Files</span>
        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
          activeTab === 'files' ? 'bg-white/20' : 'bg-green-100 text-green-600'
        }`}>
          {totalFiles}
        </span>
        {activeTab === 'files' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-full" />
        )}
      </button>
      <button
        onClick={() => setActiveTab('courses')}
        className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all relative ${
          activeTab === 'courses'
            ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg scale-105'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <PlayCircle className="h-5 w-5" />
        <span>Online Courses</span>
        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
          activeTab === 'courses' ? 'bg-white/20' : 'bg-purple-100 text-purple-600'
        }`}>
          {totalCourses}
        </span>
        {activeTab === 'courses' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-t-full" />
        )}
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
{/* Class Form Modal - IMPROVED UI */}
            {showClassForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="sticky top-0 z-10 p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-2xl">
                    <h3 className="text-2xl font-bold">
                      {editingClass ? '클래스 수정' : '새 클래스 추가'}
                    </h3>
                    <button onClick={resetClassForm} className="text-white hover:text-gray-200 transition-colors">
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <form onSubmit={handleClassSubmit} className="p-6 space-y-6">
                    {/* Basic Info Section */}
                    <div className="border-b pb-6">
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Video className="h-5 w-5 text-blue-600" />
                        기본 정보
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            클래스 제목 *
                          </label>
                          <input
                            type="text"
                            required
                            value={classFormData.title}
                            onChange={(e) => setClassFormData({ ...classFormData, title: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="클래스 내용 및 목표 설명..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Schedule Section */}
                    <div className="border-b pb-6">
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        일정 설정
                      </h4>

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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            시간대 (Timezone) *
                          </label>
                          <select
                            required
                            value={classFormData.timezone}
                            onChange={(e) => setClassFormData({ ...classFormData, timezone: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                              <option value="America/New_York">동부 시간 (EST/EDT)</option>
                              <option value="America/Chicago">중부 시간 (CST/CDT)</option>
                              <option value="America/Denver">산지 시간 (MST/MDT)</option>
                              <option value="America/Los_Angeles">태평양 시간 (PST/PDT)</option>
                            </optgroup>
                            <optgroup label="유럽">
                              <option value="Europe/London">영국 시간 (GMT/BST)</option>
                              <option value="Europe/Paris">중부유럽 시간 (CET/CEST)</option>
                            </optgroup>
                            <optgroup label="기타">
                              <option value="UTC">협정 세계시 (UTC)</option>
                              <option value="Australia/Sydney">호주 동부 시간 (AEST/AEDT)</option>
                            </optgroup>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            소요 시간 *
                          </label>
                          <input
                            type="text"
                            required
                            value={classFormData.duration}
                            onChange={(e) => setClassFormData({ ...classFormData, duration: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="예: 60분"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Registration Period Section */}
                    <div className="border-b pb-6">
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        등록 기간
                      </h4>

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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Platform & Meeting Section */}
                    <div className="border-b pb-6">
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Settings className="h-5 w-5 text-blue-600" />
                        플랫폼 정보
                      </h4>

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              플랫폼 *
                            </label>
                            <select
                              required
                              value={classFormData.platform}
                              onChange={(e) => setClassFormData({ ...classFormData, platform: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                              <option value="Zoom">Zoom</option>
                              <option value="Microsoft Teams">Microsoft Teams</option>
                              <option value="Google Meet">Google Meet</option>
                              <option value="Other">기타</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              강사 *
                            </label>
                            <input
                              type="text"
                              required
                              value={classFormData.instructor}
                              onChange={(e) => setClassFormData({ ...classFormData, instructor: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="강사 이름"
                            />
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="https://zoom.us/j/..."
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Preview Image Section */}
                    <div className="border-b pb-6">
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-blue-600" />
                        미리보기 이미지
                      </h4>

                      <div className="space-y-4">
                        {classPreviewUrl && (
                          <div className="relative inline-block">
                            <img 
                              src={classPreviewUrl} 
                              alt="미리보기" 
                              className="max-w-full h-48 object-cover rounded-lg border-2 border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setClassPreviewUrl(null)
                                setClassPreviewFile(null)
                                setClassFormData({ ...classFormData, previewImage: '' })
                              }}
                              className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                          <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 mb-2">미리보기 이미지 업로드 (선택사항)</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleClassPreviewUpload}
                            className="hidden"
                            id="class-preview-upload"
                          />
                          <label
                            htmlFor="class-preview-upload"
                            className="cursor-pointer inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                          >
                            이미지 선택
                          </label>
                          <p className="text-xs text-gray-500 mt-2">
                            권장: 800x600px, JPG/PNG
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end space-x-4 pt-4">
                      <button
                        type="button"
                        onClick={resetClassForm}
                        className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg"
                      >
                        {editingClass ? '수정하기' : '생성하기'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          

{/* Classes List - Enhanced */}
{classes.length > 0 ? (
  <div className="space-y-4">
    {classes.map((classItem, index) => (
      <div 
        key={classItem.id} 
        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-300 group"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm font-bold">
                  {index + 1}
                </span>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {classItem.title}
                </h3>
              </div>
              <p className="text-gray-600 text-sm line-clamp-2 ml-11">
                {classItem.description}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => handleClassEdit(classItem)}
                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleClassDelete(classItem.id)}
                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ml-11">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">
                {new Date(classItem.date).toLocaleDateString('ko-KR')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">
                {classItem.time}
                {classItem.timezone && (
                  <span className="ml-1 text-xs text-gray-500">
                    [{classItem.timezone.split('/')[1] || classItem.timezone}]
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">
                {classItem.registeredCount || 0}/{classItem.maxParticipants}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Video className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{classItem.platform}</span>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
) : (
  <div className="text-center py-16 bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-200">
    <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
      <Video className="h-10 w-10 text-blue-500" />
    </div>
    <p className="text-xl font-semibold text-gray-900 mb-2">No classes yet</p>
    <p className="text-gray-500 mb-6">Create your first live class to get started</p>
    <button
      onClick={() => setShowClassForm(true)}
      className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
    >
      <Plus className="h-5 w-5" />
      <span>Add First Class</span>
    </button>
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
                                addAuthHeadersAdmin(xhr)
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
    미리보기 이미지 (선택사항)
  </label>
  
  {filePreviewUrl && (
    <div className="relative inline-block mb-3">
      <img 
        src={filePreviewUrl} 
        alt="미리보기" 
        className="max-w-full h-48 object-cover rounded-lg border-2 border-gray-300"
      />
      <button
        type="button"
        onClick={() => {
          setFilePreviewUrl(null)
          setFilePreviewFile(null)
          setFileFormData({ ...fileFormData, previewImage: '' })
        }}
        className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )}

  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
    <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
    <p className="text-sm text-gray-600 mb-2">미리보기 이미지 업로드</p>
    <input
      type="file"
      accept="image/*"
      onChange={handleFilePreviewUpload}
      className="hidden"
      id="file-preview-upload"
    />
    <label
      htmlFor="file-preview-upload"
      className="cursor-pointer inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
    >
      이미지 선택
    </label>
    <p className="text-xs text-gray-500 mt-2">
      권장: 800x600px, JPG/PNG (자동으로 업로드됩니다)
    </p>
  </div>
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

{/* Files List - Enhanced */}
{files.length > 0 ? (
  <div className="space-y-4">
    {files.map((file, index) => (
      <div 
        key={file.id} 
        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-green-300 group"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 text-sm font-bold">
                  {index + 1}
                </span>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                  {file.title}
                </h3>
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  Free
                </span>
              </div>
              <p className="text-gray-600 text-sm line-clamp-2 ml-11">
                {file.description}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => handleFileEdit(file)}
                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleFileDelete(file.id)}
                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ml-11">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{file.format}</span>
            </div>
            {file.size && (
              <div className="flex items-center gap-2 text-sm">
                <Download className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{file.size}</span>
              </div>
            )}
            {file.pages && (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{file.pages}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{file.downloads || 0} views</span>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
) : (
  <div className="text-center py-16 bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-200">
    <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
      <FileText className="h-10 w-10 text-green-500" />
    </div>
    <p className="text-xl font-semibold text-gray-900 mb-2">No files yet</p>
    <p className="text-gray-500 mb-6">Upload your first file to get started</p>
    <button
      onClick={() => setShowFileForm(true)}
      className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
    >
      <Plus className="h-5 w-5" />
      <span>Add First File</span>
    </button>
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
              {lesson.content && lesson.content.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {lesson.content.filter(b => b.type === 'video').length > 0 && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">
                      🎥 {lesson.content.filter(b => b.type === 'video').length}
                    </span>
                  )}
                  {lesson.content.filter(b => b.type === 'text').length > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                      📝 {lesson.content.filter(b => b.type === 'text').length}
                    </span>
                  )}
                  {lesson.content.filter(b => b.type === 'file').length > 0 && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                      📎 {lesson.content.filter(b => b.type === 'file').length}
                    </span>
                  )}
                  {lesson.content.filter(b => b.type === 'question').length > 0 && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                      ❓ {lesson.content.filter(b => b.type === 'question').length}
                    </span>
                  )}
                </div>
              )}
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
<div className="border-2 border-purple-200 rounded-xl p-6 space-y-4 bg-gradient-to-br from-purple-50 to-white shadow-sm">
  <div className="flex items-center justify-between mb-3">
    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
      {editingLesson ? (
        <>
          <Edit className="h-5 w-5 text-purple-600" />
          레슨/챕터 수정
        </>
      ) : (
        <>
          <Plus className="h-5 w-5 text-purple-600" />
          레슨/챕터 추가
        </>
      )}
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
  <label className="block text-sm font-medium text-gray-700 mb-2">타입 선택</label>
  <div className="grid grid-cols-2 gap-3">
    <button
      type="button"
      onClick={() => setCurrentLessonForm({ ...currentLessonForm, type: 'lesson', content: [] })}
      className={`group relative px-4 py-4 rounded-xl border-2 transition-all ${
        (currentLessonForm.type || 'lesson') === 'lesson'
          ? 'border-purple-500 bg-purple-50 shadow-md scale-105'
          : 'border-gray-300 hover:border-purple-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-2 justify-center">
        <FileText className={`h-5 w-5 ${
          (currentLessonForm.type || 'lesson') === 'lesson' ? 'text-purple-600' : 'text-gray-500'
        }`} />
        <span className={`font-semibold ${
          (currentLessonForm.type || 'lesson') === 'lesson' ? 'text-purple-700' : 'text-gray-700'
        }`}>
          레슨
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-1">비디오, 텍스트, 파일 포함</p>
    </button>
    <button
      type="button"
      onClick={() => setCurrentLessonForm({ ...currentLessonForm, type: 'chapter', content: [] })}
      className={`group relative px-4 py-4 rounded-xl border-2 transition-all ${
        currentLessonForm.type === 'chapter'
          ? 'border-blue-500 bg-blue-50 shadow-md scale-105'
          : 'border-gray-300 hover:border-blue-300 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-2 justify-center">
        <BookOpen className={`h-5 w-5 ${
          currentLessonForm.type === 'chapter' ? 'text-blue-600' : 'text-gray-500'
        }`} />
        <span className={`font-semibold ${
          currentLessonForm.type === 'chapter' ? 'text-blue-700' : 'text-gray-700'
        }`}>
          챕터
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-1">구분자 역할만</p>
    </button>
  </div>
</div>

  {/* Title */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      제목 *
    </label>
    <input
      type="text"
      value={currentLessonForm.title}
      onChange={(e) => setCurrentLessonForm({ ...currentLessonForm, title: e.target.value })}
      placeholder={currentLessonForm.type === 'chapter' ? '챕터 제목 (예: 1장 - 기초)' : '레슨 제목'}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
      required
    />
  </div>

  {/* Description */}
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      설명 (선택사항)
    </label>
    <textarea
      value={currentLessonForm.description || ''}
      onChange={(e) => setCurrentLessonForm({ ...currentLessonForm, description: e.target.value })}
      placeholder="레슨 또는 챕터에 대한 설명..."
      rows="2"
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
    />
  </div>

  {/* Content Builder (only for lessons, not chapters) */}
  {currentLessonForm.type !== 'chapter' && (
    <div className="border-t pt-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-semibold text-gray-900">
          콘텐츠 블록
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const newContent = [...(currentLessonForm.content || [])];
              newContent.push({
                id: Date.now(),
                type: 'video',
                order: newContent.length,
                data: { url: '' }
              });
              setCurrentLessonForm({ ...currentLessonForm, content: newContent });
            }}
            className="group flex items-center gap-1.5 text-xs px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm hover:shadow-md transition-all"
          >
            <Video className="h-3.5 w-3.5" />
            <span>비디오</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const newContent = [...(currentLessonForm.content || [])];
              newContent.push({
                id: Date.now(),
                type: 'text',
                order: newContent.length,
                data: { content: '' }
              });
              setCurrentLessonForm({ ...currentLessonForm, content: newContent });
            }}
            className="group flex items-center gap-1.5 text-xs px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transition-all"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>텍스트</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const newContent = [...(currentLessonForm.content || [])];
              newContent.push({
                id: Date.now(),
                type: 'file',
                order: newContent.length,
                data: { name: '', url: '' }
              });
              setCurrentLessonForm({ ...currentLessonForm, content: newContent });
            }}
            className="group flex items-center gap-1.5 text-xs px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm hover:shadow-md transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>파일</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const newContent = [...(currentLessonForm.content || [])];
              newContent.push({
                id: Date.now(),
                type: 'question',
                order: newContent.length,
                data: {
                  questionType: 'multiple-choice',
                  question: '',
                  options: ['', '', '', ''],
                  correctAnswer: 0
                }
              });
              setCurrentLessonForm({ ...currentLessonForm, content: newContent });
            }}
            className="group flex items-center gap-1.5 text-xs px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 shadow-sm hover:shadow-md transition-all"
          >
            <FileQuestion className="h-3.5 w-3.5" />
            <span>문제</span>
          </button>
        </div>
      </div>

      {/* Content Blocks List */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {(currentLessonForm.content || []).map((block, blockIndex) => (
          <div key={block.id} className="bg-white p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                {block.type === 'video' && <Video className="h-4 w-4 text-red-600" />}
                {block.type === 'text' && <FileText className="h-4 w-4 text-blue-600" />}
                {block.type === 'file' && <Download className="h-4 w-4 text-green-600" />}
                {block.type === 'question' && <FileQuestion className="h-4 w-4 text-orange-600" />}
                <span className="text-sm font-bold px-2.5 py-1 rounded-lg" style={{
                  backgroundColor: block.type === 'video' ? '#fef2f2' : 
                                  block.type === 'text' ? '#eff6ff' :
                                  block.type === 'file' ? '#f0fdf4' : '#fff7ed',
                  color: block.type === 'video' ? '#991b1b' :
                        block.type === 'text' ? '#1e40af' :
                        block.type === 'file' ? '#166534' : '#9a3412'
                }}>
                  {block.type === 'video' ? '비디오' :
                  block.type === 'text' ? '텍스트' :
                  block.type === 'file' ? '파일' : '문제'}
                </span>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">#{blockIndex + 1}</span>
              </div>
              <div className="flex items-center gap-1">
                {blockIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newContent = [...currentLessonForm.content];
                      [newContent[blockIndex - 1], newContent[blockIndex]] = 
                      [newContent[blockIndex], newContent[blockIndex - 1]];
                      newContent.forEach((c, i) => c.order = i);
                      setCurrentLessonForm({ ...currentLessonForm, content: newContent });
                    }}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="위로 이동"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                )}
                {blockIndex < currentLessonForm.content.length - 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const newContent = [...currentLessonForm.content];
                      [newContent[blockIndex], newContent[blockIndex + 1]] = 
                      [newContent[blockIndex + 1], newContent[blockIndex]];
                      newContent.forEach((c, i) => c.order = i);
                      setCurrentLessonForm({ ...currentLessonForm, content: newContent });
                    }}
                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="아래로 이동"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                )}
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('이 블록을 삭제하시겠습니까?')) {
                      const newContent = currentLessonForm.content.filter((_, i) => i !== blockIndex);
                      newContent.forEach((c, i) => c.order = i);
                      setCurrentLessonForm({ ...currentLessonForm, content: newContent });
                    }
                  }}
                  className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  title="삭제"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Video Block Editor */}
            {block.type === 'video' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-700">비디오 소스</label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setVideoSourceType('upload');
                        const newContent = [...currentLessonForm.content];
                        newContent[blockIndex] = { ...block, videoSourceType: 'upload' };
                        setCurrentLessonForm({ ...currentLessonForm, content: newContent });
                      }}
                      className={`text-xs px-2 py-1 rounded ${
                        (block.videoSourceType || videoSourceType) === 'upload'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      업로드
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVideoSourceType('url');
                        const newContent = [...currentLessonForm.content];
                        newContent[blockIndex] = { ...block, videoSourceType: 'url' };
                        setCurrentLessonForm({ ...currentLessonForm, content: newContent });
                      }}
                      className={`text-xs px-2 py-1 rounded ${
                        (block.videoSourceType || videoSourceType) === 'url'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      외부 URL
                    </button>
                  </div>
                </div>

                {(block.videoSourceType || videoSourceType) === 'upload' ? (
                  <div>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;

                        try {
                          setUploadingLessonVideo(true);
                          setVideoUploadProgress(0);

                          const formData = new FormData();
                          formData.append('video', file);

                          const xhr = new XMLHttpRequest();

                          xhr.upload.addEventListener('progress', (e) => {
                            if (e.lengthComputable) {
                              const percentComplete = Math.round((e.loaded / e.total) * 100);
                              setVideoUploadProgress(percentComplete);
                            }
                          });

                          xhr.addEventListener('load', async () => {
                            if (xhr.status === 200) {
                              const data = JSON.parse(xhr.responseText);
                              if (data.success) {
                                console.log('✓ Block video uploaded:', data);
                                
                                // Extract videoId from HLS URL
                                let videoId = null;
                                if (data.hlsUrl) {
                                  const hlsMatch = data.hlsUrl.match(/\/api\/videos\/hls\/([^\/]+)/);
                                  if (hlsMatch) {
                                    videoId = hlsMatch[1];
                                  }
                                }
                                
                                const newContent = [...currentLessonForm.content];
                                newContent[blockIndex] = {
                                  ...block,
                                  data: { 
                                    url: data.hlsUrl || data.videoUrl,
                                    videoId: videoId // Store videoId for token-based access
                                  }
                                };
                                setCurrentLessonForm({ ...currentLessonForm, content: newContent });
                                setUploadingLessonVideo(false);
                                setVideoUploadProgress(0);
                                alert('비디오가 성공적으로 업로드되었습니다!');
                              }
                            }
                          });

                          xhr.addEventListener('error', () => {
                            alert('비디오 업로드에 실패했습니다.');
                            setUploadingLessonVideo(false);
                            setVideoUploadProgress(0);
                          });

                          xhr.open('POST', apiEndpoint('videos/upload'))
                          addAuthHeadersAdmin(xhr)
                          xhr.send(formData)
                        } catch (error) {
                          console.error('Video upload error:', error);
                          alert(`비디오 업로드에 실패했습니다: ${error.message}`);
                          setUploadingLessonVideo(false);
                          setVideoUploadProgress(0);
                        }
                      }}
                      className="block w-full text-xs text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                    />
                    {uploadingLessonVideo && (
                      <div className="mt-2 text-xs text-purple-600">
                        업로드 중... {videoUploadProgress}%
                      </div>
                    )}
                    {block.data.url && (block.videoSourceType || videoSourceType) === 'upload' && (
                      <div className="mt-1 text-xs text-green-600">
                        ✓ 비디오 업로드 완료
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={block.data.url || ''}
                      onChange={(e) => {
                        const newContent = [...currentLessonForm.content];
                        newContent[blockIndex] = {
                          ...block,
                          data: { ...block.data, url: e.target.value }
                        };
                        setCurrentLessonForm({ ...currentLessonForm, content: newContent });
                      }}
                      placeholder="YouTube, Vimeo, Google Drive 등의 비디오 URL"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      예: https://www.youtube.com/watch?v=...
                    </p>
                  </div>
                )}
              </div>
            )}

{/* Text Block Editor */}
{block.type === 'text' && (
  <div className="space-y-2">
    <input
      type="text"
      value={block.data.title || ''}
      onChange={(e) => {
        const newContent = [...currentLessonForm.content];
        newContent[blockIndex] = {
          ...block,
          data: { ...block.data, title: e.target.value }
        };
        setCurrentLessonForm({ ...currentLessonForm, content: newContent });
      }}
      placeholder="섹션 제목 (예: 강의 내용, 학습 목표 등)"
      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 font-medium"
    />
    <textarea
      value={block.data.content || ''}
      onChange={(e) => {
        const newContent = [...currentLessonForm.content];
        newContent[blockIndex] = {
          ...block,
          data: { ...block.data, content: e.target.value }
        };
        setCurrentLessonForm({ ...currentLessonForm, content: newContent });
      }}
      placeholder="텍스트 콘텐츠를 입력하세요..."
      rows="4"
      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
    />
  </div>
)}

            {/* File Block Editor */}
            {block.type === 'file' && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={block.data.name || ''}
                  onChange={(e) => {
                    const newContent = [...currentLessonForm.content];
                    newContent[blockIndex] = {
                      ...block,
                      data: { ...block.data, name: e.target.value }
                    };
                    setCurrentLessonForm({ ...currentLessonForm, content: newContent });
                  }}
                  placeholder="파일 이름"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="url"
                  value={block.data.url || ''}
                  onChange={(e) => {
                    const newContent = [...currentLessonForm.content];
                    newContent[blockIndex] = {
                      ...block,
                      data: { ...block.data, url: e.target.value }
                    };
                    setCurrentLessonForm({ ...currentLessonForm, content: newContent });
                  }}
                  placeholder="파일 다운로드 URL"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                />
              </div>
            )}

            {/* Question Block Editor */}
            {block.type === 'question' && (
              <div className="space-y-2">
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newContent = [...currentLessonForm.content];
                      newContent[blockIndex] = {
                        ...block,
                        data: {
                          questionType: 'multiple-choice',
                          question: '',
                          options: ['', '', '', ''],
                          correctAnswer: 0
                        }
                      };
                      setCurrentLessonForm({ ...currentLessonForm, content: newContent });
                    }}
                    className={`text-xs px-2 py-1 rounded ${
                      block.data.questionType === 'multiple-choice'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    객관식
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newContent = [...currentLessonForm.content];
                      newContent[blockIndex] = {
                        ...block,
                        data: {
                          questionType: 'matching',
                          matchingPairs: [{ left: '', right: '' }]
                        }
                      };
                      setCurrentLessonForm({ ...currentLessonForm, content: newContent });
                    }}
                    className={`text-xs px-2 py-1 rounded ${
                      block.data.questionType === 'matching'
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    매칭
                  </button>
                </div>

                {block.data.questionType === 'multiple-choice' ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={block.data.question || ''}
                      onChange={(e) => {
                        const newContent = [...currentLessonForm.content];
                        newContent[blockIndex] = {
                          ...block,
                          data: { ...block.data, question: e.target.value }
                        };
                        setCurrentLessonForm({ ...currentLessonForm, content: newContent });
                      }}
                      placeholder="질문을 입력하세요"
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                    />
                    {(block.data.options || ['', '', '', '']).map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${block.id}`}
                          checked={block.data.correctAnswer === optionIndex}
                          onChange={() => {
                            const newContent = [...currentLessonForm.content];
                            newContent[blockIndex] = {
                              ...block,
                              data: { ...block.data, correctAnswer: optionIndex }
                            };
                            setCurrentLessonForm({ ...currentLessonForm, content: newContent });
                          }}
                          className="text-orange-600"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newContent = [...currentLessonForm.content];
                            const newOptions = [...(block.data.options || ['', '', '', ''])];
                            newOptions[optionIndex] = e.target.value;
                            newContent[blockIndex] = {
                              ...block,
                              data: { ...block.data, options: newOptions }
                            };
                            setCurrentLessonForm({ ...currentLessonForm, content: newContent });
                          }}
                          placeholder={`선택지 ${optionIndex + 1}`}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    ))}
                    <p className="text-xs text-gray-500">라디오 버튼으로 정답을 선택하세요</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(block.data.matchingPairs || [{ left: '', right: '' }]).map((pair, pairIndex) => (
                      <div key={pairIndex} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={pair.left}
                          onChange={(e) => {
                            const newContent = [...currentLessonForm.content];
                            const newPairs = [...(block.data.matchingPairs || [{ left: '', right: '' }])];
                            newPairs[pairIndex] = { ...pair, left: e.target.value };
                            newContent[blockIndex] = {
                              ...block,
                              data: { ...block.data, matchingPairs: newPairs }
                            };
                            setCurrentLessonForm({ ...currentLessonForm, content: newContent });
                          }}
                          placeholder="왼쪽 항목"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                        />
                        <span className="text-gray-400">↔</span>
                        <input
                          type="text"
                          value={pair.right}
                          onChange={(e) => {
                            const newContent = [...currentLessonForm.content];
                            const newPairs = [...(block.data.matchingPairs || [{ left: '', right: '' }])];
                            newPairs[pairIndex] = { ...pair, right: e.target.value };
                            newContent[blockIndex] = {
                              ...block,
                              data: { ...block.data, matchingPairs: newPairs }
                            };
                            setCurrentLessonForm({ ...currentLessonForm, content: newContent });
                          }}
                          placeholder="오른쪽 항목"
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-orange-500"
                        />
                        {pairIndex > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newContent = [...currentLessonForm.content];
                              const newPairs = block.data.matchingPairs.filter((_, i) => i !== pairIndex);
                              newContent[blockIndex] = {
                                ...block,
                                data: { ...block.data, matchingPairs: newPairs.length > 0 ? newPairs : [{ left: '', right: '' }] }
                              };
                              setCurrentLessonForm({ ...currentLessonForm, content: newContent });
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newContent = [...currentLessonForm.content];
                        const newPairs = [...(block.data.matchingPairs || []), { left: '', right: '' }];
                        newContent[blockIndex] = {
                          ...block,
                          data: { ...block.data, matchingPairs: newPairs }
                        };
                        setCurrentLessonForm({ ...currentLessonForm, content: newContent });
                      }}
                      className="text-xs text-orange-600 hover:text-orange-700"
                    >
                      + 매칭 항목 추가
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {currentLessonForm.content?.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          위의 버튼을 클릭하여 콘텐츠 블록을 추가하세요
        </div>
      )}

      {/* Duration field */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          소요시간 (선택사항)
        </label>
        <input
          type="text"
          value={currentLessonForm.duration || ''}
          onChange={(e) => setCurrentLessonForm({ ...currentLessonForm, duration: e.target.value })}
          placeholder="예: 15분"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
        />
      </div>
    </div>
  )}

  {/* Add/Update Lesson Button */}
  <button
    type="button"
    onClick={addLessonToCourse}
    disabled={!currentLessonForm.title?.trim()}
    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 font-semibold disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
  >
    {editingLesson ? (
      <>
        <Edit className="h-5 w-5" />
        <span>레슨/챕터 수정</span>
      </>
    ) : (
      <>
        <Plus className="h-5 w-5" />
        <span>레슨/챕터 추가</span>
      </>
    )}
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

{/* Courses List - Enhanced */}
{onlineCourses.length > 0 ? (
  <div className="space-y-4">
    {onlineCourses.map((course, index) => (
      <div 
        key={course.id} 
        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-300 group"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 text-sm font-bold">
                  {index + 1}
                </span>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                  {course.title}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  course.type === 'paid' 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {course.type === 'paid' ? 'Paid' : 'Free'}
                </span>
              </div>
              <p className="text-gray-600 text-sm line-clamp-2 ml-11">
                {course.description}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => handleCourseEdit(course)}
                className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                title="Edit"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleCourseDelete(course.id)}
                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ml-11">
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{course.lessons?.length || 0} lessons</span>
            </div>
            {course.students && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{course.students} students</span>
              </div>
            )}
            {course.type === 'paid' && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-orange-600 font-bold">{course.price}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
) : (
  <div className="text-center py-16 bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-200">
    <div className="bg-purple-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
      <PlayCircle className="h-10 w-10 text-purple-500" />
    </div>
    <p className="text-xl font-semibold text-gray-900 mb-2">No courses yet</p>
    <p className="text-gray-500 mb-6">Create your first online course to get started</p>
    <button
      onClick={() => setShowCourseForm(true)}
      className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
    >
      <Plus className="h-5 w-5" />
      <span>Add First Course</span>
    </button>
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
