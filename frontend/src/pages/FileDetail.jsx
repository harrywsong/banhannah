// src/pages/FileDetail.jsx - WITH PDF.js
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Download, FileText, Clock, Star, MessageCircle, X, Eye, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useReviews } from '../contexts/ReviewsContext'
import { apiEndpoint, apiRequest } from '../config/api'

import { API_URL } from '../config/api'
export default function FileDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { getReviewsByItemId, addReview, updateReview, getUserReview } = useReviews()
  const [file, setFile] = useState(null)
  const [reviews, setReviews] = useState([])
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [editingReview, setEditingReview] = useState(null)
  const [showViewer, setShowViewer] = useState(false)
  const [viewerError, setViewerError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const canvasRef = useRef(null);
  const [pdfState, setPdfState] = useState({
    pdfDoc: null,
    pageNum: 1,
    numPages: 0,
    scale: 1.5,
    rendering: false,
    rotation: 0
  });
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const loadFile = async () => {
      try {
        const response = await apiRequest(apiEndpoint(`files/metadata/${id}`))
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Loaded file from backend:', data.file)
          setFile(data.file)
        } else {
          const savedFiles = JSON.parse(localStorage.getItem('resourceFiles') || '[]')
          const foundFile = savedFiles.find(f => f.id === parseInt(id))
          if (foundFile) {
            console.log('✅ Loaded file from localStorage:', foundFile)
            setFile(foundFile)
          }
        }
      } catch (error) {
        console.error('❌ Error loading file:', error)
        const savedFiles = JSON.parse(localStorage.getItem('resourceFiles') || '[]')
        const foundFile = savedFiles.find(f => f.id === parseInt(id))
        if (foundFile) {
          setFile(foundFile)
        }
      }
    }

    loadFile()

    const itemReviews = getReviewsByItemId(parseInt(id), 'file')
    setReviews(itemReviews)

    const userReview = getUserReview(user.id, parseInt(id), 'file')
    if (userReview) {
      setEditingReview(userReview)
      setReviewForm({ rating: userReview.rating, comment: userReview.comment })
    }
  }, [id, user, navigate, getReviewsByItemId, getUserReview])

  // Auto-fit page when entering fullscreen or changing pages
useEffect(() => {
  if (isFullscreen && pdfState.pdfDoc) {
    // Small delay to ensure container has resized
    setTimeout(() => fitPageToScreen(), 100);
  }
}, [isFullscreen, pdfState.pageNum, pdfState.rotation]);

  // PDF.js rendering effect
useEffect(() => {
    // Only require a valid PDF URL and format here. Loading the PDF
    // should not depend on the canvas being mounted yet (avoids a
    // race where the effect returns before the canvas exists).
    if (!file?.displayUrl || file.format?.toLowerCase() !== 'pdf') {
      return;
    }

  const loadPDF = async () => {
    try {
      // Load PDF.js library dynamically
      const pdfjsLib = window.pdfjsLib;
      if (!pdfjsLib) {
        console.error('PDF.js not loaded');
        setViewerError('PDF 뷰어를 로드할 수 없습니다.');
        return;
      }

      // Set worker
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      console.log('📄 Loading PDF:', file.displayUrl);
      
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument(file.displayUrl);
      const pdf = await loadingTask.promise;
      
      console.log('✅ PDF loaded, pages:', pdf.numPages);
      
      setPdfState(prev => ({
        ...prev,
        pdfDoc: pdf,
        numPages: pdf.numPages
      }));
      
      setIsLoading(false);
      
    } catch (error) {
      console.error('❌ PDF load error:', error);
      setViewerError(`PDF를 로드할 수 없습니다: ${error.message}`);
      setIsLoading(false);
    }
  };

  loadPDF();
}, [file?.displayUrl, file?.format]);

// Keyboard shortcuts for PDF navigation
useEffect(() => {
  if (!showViewer || file?.format?.toLowerCase() !== 'pdf') return;
  
  const handleKeyPress = (e) => {
    // Prevent if user is typing in an input
    if (e.target.tagName === 'INPUT') return;
    
    switch(e.key) {
      case 'ArrowLeft':
      case 'PageUp':
        if (pdfState.pageNum > 1) {
          setPdfState(prev => ({ ...prev, pageNum: prev.pageNum - 1 }));
        }
        e.preventDefault();
        break;
      case 'ArrowRight':
      case 'PageDown':
      case ' ':
        if (pdfState.pageNum < pdfState.numPages) {
          setPdfState(prev => ({ ...prev, pageNum: prev.pageNum + 1 }));
        }
        e.preventDefault();
        break;
      case 'Home':
        setPdfState(prev => ({ ...prev, pageNum: 1 }));
        e.preventDefault();
        break;
      case 'End':
        setPdfState(prev => ({ ...prev, pageNum: pdfState.numPages }));
        e.preventDefault();
        break;
      case '+':
      case '=':
        setPdfState(prev => ({ ...prev, scale: Math.min(3, prev.scale + 0.25) }));
        e.preventDefault();
        break;
      case '-':
        setPdfState(prev => ({ ...prev, scale: Math.max(0.5, prev.scale - 0.25) }));
        e.preventDefault();
        break;
      case 'Escape':
        if (isFullscreen) {
          setIsFullscreen(false);
        }
        break;
    }
  };
  
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [showViewer, pdfState.pageNum, pdfState.numPages, pdfState.scale, isFullscreen, file?.format]);

// Render PDF page effect
useEffect(() => {
  if (!pdfState.pdfDoc || !canvasRef.current || pdfState.rendering) {
    return;
  }

  const renderPage = async () => {
    setPdfState(prev => ({ ...prev, rendering: true }));

    try {
      const page = await pdfState.pdfDoc.getPage(pdfState.pageNum);
      let viewport = page.getViewport({ scale: pdfState.scale, rotation: pdfState.rotation });

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Handle HiDPI screens by scaling the canvas backing store
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(viewport.width * ratio);
      canvas.height = Math.round(viewport.height * ratio);
      canvas.style.width = `${Math.round(viewport.width)}px`;
      canvas.style.height = `${Math.round(viewport.height)}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      console.log('✅ Page rendered:', pdfState.pageNum);

    } catch (error) {
      console.error('❌ Page render error:', error);
    } finally {
      setPdfState(prev => ({ ...prev, rendering: false }));
    }
  };

  renderPage();
}, [pdfState.pdfDoc, pdfState.pageNum, pdfState.scale, pdfState.rotation]);
  if (!user) {
    return null
  }

  const fitPageToScreen = () => {
    if (!pdfState.pdfDoc || !containerRef.current || !canvasRef.current) return;
    
    pdfState.pdfDoc.getPage(pdfState.pageNum).then(page => {
      const containerWidth = containerRef.current.clientWidth - 32; // minus padding
      const containerHeight = containerRef.current.clientHeight - 32;
      
      const viewport = page.getViewport({ scale: 1, rotation: pdfState.rotation });
      const scaleX = containerWidth / viewport.width;
      const scaleY = containerHeight / viewport.height;
      const newScale = Math.min(scaleX, scaleY) * 0.95; // 95% to add some margin
      
      setPdfState(prev => ({ ...prev, scale: newScale }));
    });
  };

  const incrementAccessCount = async () => {
    if (!file || !file.id) return

    try {
      const response = await apiRequest(apiEndpoint(`files/metadata/${file.id}/increment`), {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json()
        // Preserve any transient client-only fields (like displayUrl)
        setFile(prev => ({ ...data.file, displayUrl: prev?.displayUrl || data.file.displayUrl }))
      } else {
        setFile({ ...file, downloads: (file.downloads || 0) + 1 })
      }
    } catch (error) {
      console.error('❌ Error incrementing access count:', error)
      setFile(prev => ({ ...prev, downloads: (prev?.downloads || file?.downloads || 0) + 1 }))
    }
  }

  const extractFilename = (fileUrl) => {
    if (!fileUrl) return null;
    
    // Extract filename from various URL formats
    let filename;
    if (fileUrl.includes('/api/files/')) {
      const parts = fileUrl.split('/');
      filename = parts[parts.length - 1];
    } else if (fileUrl.includes('/')) {
      const parts = fileUrl.split('/');
      filename = parts[parts.length - 1];
    } else {
      filename = fileUrl;
    }
    
    // Decode once to get clean filename
    return decodeURIComponent(filename);
  };

  const buildFileUrl = (fileUrl, action = 'view') => {
    if (!fileUrl) return null;
    
    const cleanFilename = extractFilename(fileUrl);
    if (!cleanFilename) return null;
    
    // Encode properly for URL
    const encodedFilename = encodeURIComponent(cleanFilename);
    
    console.log('🔗 Building URL:', {
      original: fileUrl,
      clean: cleanFilename,
      encoded: encodedFilename,
      action
    });
    
    return `${API_URL}/api/files/${action}/${encodedFilename}`;
  };

  const handleDownload = () => {
    if (!file || !file.fileUrl) {
      alert('❌ 파일 URL이 설정되지 않았습니다.');
      return;
    }
    
    const downloadUrl = buildFileUrl(file.fileUrl, 'download');
    if (!downloadUrl) {
      alert('❌ 파일 URL 생성에 실패했습니다.');
      return;
    }
    
    console.log('📥 Starting download:', downloadUrl);
    
    // Create hidden link for download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.title || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Save to user's downloads
    const myResources = JSON.parse(localStorage.getItem(`resources_${user.id}`) || '[]');
    const fileToSave = {
      id: file.id,
      title: file.title,
      format: file.format,
      size: file.size,
      downloadedAt: new Date().toISOString()
    };
    
    if (!myResources.find(f => f.id === file.id)) {
      myResources.push(fileToSave);
      localStorage.setItem(`resources_${user.id}`, JSON.stringify(myResources));
    }

    incrementAccessCount();
  };

  const handleViewInBrowser = async () => {
    if (!file || !file.fileUrl) {
      alert('❌ 파일 URL이 설정되지 않았습니다.');
      return;
    }
    
    setViewerError(null);
    setIsLoading(true);
    
    const viewUrl = buildFileUrl(file.fileUrl, 'view');
    if (!viewUrl) {
      alert('❌ 파일 URL 생성에 실패했습니다.');
      setIsLoading(false);
      return;
    }
    
    console.log('👁️ Opening viewer with URL:', viewUrl);
    
    // Test if URL is accessible before showing viewer
    try {
      const testResponse = await fetch(viewUrl, {
        method: 'HEAD',
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      
      if (!testResponse.ok) {
        throw new Error(`File not accessible (${testResponse.status})`);
      }
      
      // URL is accessible, show viewer
      setFile(prev => ({ ...prev, displayUrl: viewUrl }));
      setShowViewer(true);
      incrementAccessCount();
      
      // Save to resources
      if (user) {
        const myResources = JSON.parse(localStorage.getItem(`resources_${user.id}`) || '[]');
        const fileToSave = {
          id: file.id,
          title: file.title,
          format: file.format,
          size: file.size,
          downloadedAt: new Date().toISOString()
        };
        
        if (!myResources.find(f => f.id === file.id)) {
          myResources.push(fileToSave);
          localStorage.setItem(`resources_${user.id}`, JSON.stringify(myResources));
        }
      }
    } catch (error) {
      console.error('❌ File access error:', error);
      setViewerError(`파일을 로드할 수 없습니다: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault()
    if (!user) {
      alert('로그인이 필요합니다')
      return
    }

    const myResources = JSON.parse(localStorage.getItem(`resources_${user.id}`) || '[]')
    const hasDownloaded = myResources.find(f => f.id === file.id)
    
    if (!hasDownloaded && !editingReview) {
      alert('리뷰를 작성하려면 먼저 파일을 다운로드하거나 브라우저에서 보기로 접근해야 합니다.')
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
        itemType: 'file',
        itemTitle: file.title,
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

  if (!file) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-xl text-gray-600">파일을 찾을 수 없습니다</p>
      </div>
    )
  }

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
            파일 목록으로 돌아가기
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* File Viewer - IMPROVED ERROR HANDLING */}
        {showViewer && (
          <div className={`bg-white rounded-xl shadow-md overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : 'mb-8'}`}>
            <div className="flex items-center justify-between p-3 border-b bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">{file.title}</h2>
              <div className="flex items-center gap-2">
                {file.format?.toLowerCase() === 'pdf' && (
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="text-gray-600 hover:text-gray-900 p-2 rounded hover:bg-gray-200 transition-colors"
                    title={isFullscreen ? "전체화면 종료" : "전체화면"}
                  >
                    {isFullscreen ? '⤓' : '⤢'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowViewer(false);
                    setViewerError(null);
                    setIsFullscreen(false);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-200 transition-colors"
                  title="뷰어 닫기"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {viewerError ? (
              <div className="p-8 text-center">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-red-500" />
                <p className="text-lg font-semibold text-gray-900 mb-2">파일 로드 실패</p>
                <p className="text-gray-600 mb-4">{viewerError}</p>
                <button
                  onClick={handleViewInBrowser}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
                >
                  다시 시도
                </button>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 200px)' }}>
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">파일 로딩 중...</p>
                </div>
              </div>
            ) : file.displayUrl && (
  <div className={`relative w-full bg-gray-900 ${isFullscreen ? 'h-screen' : ''}`} style={!isFullscreen ? { height: 'calc(100vh - 200px)', minHeight: '600px' } : {}}>
    {file.format?.toLowerCase() === 'pdf' ? (
      // PDF.js Canvas Renderer
      <div className="w-full h-full flex flex-col bg-gray-800">
        {/* PDF Controls */}
        <div className="bg-gray-900 px-4 py-2 flex items-center justify-between text-white flex-shrink-0 border-b border-gray-700">
          {/* Left Controls - Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (pdfState.pageNum > 1) {
                  setPdfState(prev => ({ ...prev, pageNum: prev.pageNum - 1 }));
                }
              }}
              disabled={pdfState.pageNum <= 1}
              className="px-3 py-1.5 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              ← 이전
            </button>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 rounded text-sm">
              <input
                type="number"
                min="1"
                max={pdfState.numPages}
                value={pdfState.pageNum}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= pdfState.numPages) {
                    setPdfState(prev => ({ ...prev, pageNum: page }));
                  }
                }}
                className="w-12 bg-gray-800 text-center rounded px-1 py-0.5 border border-gray-600 focus:outline-none focus:border-blue-500"
              />
              <span className="text-gray-400">/</span>
              <span>{pdfState.numPages}</span>
            </div>
            
            <button
              onClick={() => {
                if (pdfState.pageNum < pdfState.numPages) {
                  setPdfState(prev => ({ ...prev, pageNum: prev.pageNum + 1 }));
                }
              }}
              disabled={pdfState.pageNum >= pdfState.numPages}
              className="px-3 py-1.5 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              다음 →
            </button>
          </div>
          
          {/* Center Controls - View Mode */}
          <div className="flex items-center gap-2">
            <button
              onClick={fitPageToScreen}
              className="px-3 py-1.5 bg-gray-700 rounded hover:bg-gray-600 transition-colors text-sm font-medium"
              title="화면에 맞춤"
            >
              ⛶ 화면 맞춤
            </button>
            
            <button
              onClick={() => setPdfState(prev => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))}
              className="px-3 py-1.5 bg-gray-700 rounded hover:bg-gray-600 transition-colors text-lg"
              title="회전"
            >
              ↻
            </button>
          </div>

          {/* Right Controls - Zoom & Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPdfState(prev => ({ ...prev, scale: Math.max(0.5, prev.scale - 0.25) }))}
              className="px-3 py-1.5 bg-gray-700 rounded hover:bg-gray-600 text-lg font-bold transition-colors"
              title="축소"
            >
              −
            </button>
            
            <span className="px-2 text-sm font-medium text-gray-300 min-w-[4rem] text-center">
              {Math.round(pdfState.scale * 100)}%
            </span>
            
            <button
              onClick={() => setPdfState(prev => ({ ...prev, scale: Math.min(3, prev.scale + 0.25) }))}
              className="px-3 py-1.5 bg-gray-700 rounded hover:bg-gray-600 text-lg font-bold transition-colors"
              title="확대"
            >
              +
            </button>
            
            <div className="w-px h-6 bg-gray-600 mx-1"></div>
            
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-blue-600 rounded hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm font-medium"
              title="다운로드"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">다운로드</span>
            </button>
          </div>
        </div>

        {/* PDF Canvas */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto flex items-start justify-center bg-gray-800 p-4"
        >
          <canvas
            ref={canvasRef}
            className="shadow-2xl block mx-auto"
            style={{ background: '#ffffff', maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>
    ) : (
      // Regular iframe for other formats
      <iframe
        key={file.displayUrl || file.fileUrl}
        src={file.displayUrl || (file.fileUrl ? buildFileUrl(file.fileUrl, 'view') : '')}
        className="w-full h-full border-0"
        title={`${file.title} 뷰어`}
        onLoad={() => {
          console.log('✅ File loaded successfully');
          setIsLoading(false);
        }}
        onError={(e) => {
          console.error('❌ File load error:', e);
          setViewerError('파일을 로드할 수 없습니다. 다운로드하여 확인해주세요.');
        }}
      />
    )}
  </div>
)}
          </div>
        )}

        {/* Rest of the content... (keeping existing code) */}
        {!showViewer && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* File Header */}
              <div className="bg-white rounded-xl shadow-md p-8 mb-8">
                {/* File Preview - FIXED */}
<div className="relative h-64 rounded-lg mb-6 overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600">
  {file.previewImage ? (
    <img 
      src={buildFileUrl(file.previewImage, 'view')}  // ✅ Use buildFileUrl to get correct local URL
      alt={`${file.title} 미리보기`}
      className="w-full h-full object-cover"
      onError={(e) => {
        console.error('❌ Preview image failed to load:', buildFileUrl(file.previewImage, 'view'))
        e.target.style.display = 'none'
      }}
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center text-white">
        <FileText className="h-24 w-24 mx-auto mb-2 opacity-50" />
        <p className="text-lg font-semibold">[파일 미리보기]</p>
        <p className="text-sm opacity-75">미리보기 이미지가 설정되지 않았습니다</p>
      </div>
    </div>
  )}
  <div className="absolute top-4 right-4">
    <div className="bg-white text-green-600 px-4 py-2 rounded-full font-semibold">
      무료
    </div>
  </div>
</div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  {file.title}
                </h1>
                <p className="text-xl text-gray-600 mb-6">{file.description}</p>

                <div className="flex flex-wrap items-center gap-6 mb-6 text-gray-600">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>{file.format}</span>
                  </div>
                  {file.size && (
                    <div className="flex items-center space-x-2">
                      <Download className="h-5 w-5" />
                      <span>{file.size}</span>
                    </div>
                  )}
                  {file.pages && (
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>{file.pages}</span>
                    </div>
                  )}
                  <div>
                    <span>접근 횟수: {file.downloads?.toLocaleString() || 0}</span>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">파일 소개</h2>
                  <p className="text-gray-700 leading-relaxed">{file.fullDescription || file.description}</p>
                </div>
              </div>

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
                  {user && (
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
                          placeholder="이 파일에 대한 리뷰를 작성해주세요..."
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
                  <div className="text-3xl font-bold text-green-600 mb-2">무료</div>
                  <p className="text-gray-600">모든 파일은 무료로 제공됩니다</p>
                </div>

                <button
                  onClick={handleViewInBrowser}
                  disabled={isLoading}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors mb-3 flex items-center justify-center space-x-2 disabled:bg-primary-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>로딩 중...</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-5 w-5" />
                      <span>브라우저에서 보기</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownload}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors mb-4 flex items-center justify-center space-x-2"
                >
                  <Download className="h-5 w-5" />
                  <span>다운로드</span>
                </button>

                <div className="border-t mt-6 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">파일 정보:</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>형식:</span>
                      <span className="font-semibold">{file.format}</span>
                    </div>
                    {file.size && (
                      <div className="flex justify-between">
                        <span>크기:</span>
                        <span className="font-semibold">{file.size}</span>
                      </div>
                    )}
                    {file.pages && (
                      <div className="flex justify-between">
                        <span>페이지:</span>
                        <span className="font-semibold">{file.pages}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>접근 횟수:</span>
                      <span className="font-semibold">{file.downloads?.toLocaleString() || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}