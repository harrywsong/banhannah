// frontend/src/components/FileViewer.jsx - In-browser file viewer
import { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export default function FileViewer({ file, onClose }) {
  const [zoom, setZoom] = useState(100);

  const canPreview = () => {
    const previewableFormats = ['PDF', 'DOCX', 'PPTX', 'XLSX', 'TXT'];
    return previewableFormats.includes(file.format);
  };

  const getViewerUrl = () => {
    const baseUrl = `/api/files/view/${file.filename}`;
    
    // For PDF, use browser's built-in viewer
    if (file.format === 'PDF') {
      return baseUrl;
    }
    
    // For Office documents, use Google Docs Viewer
    if (['DOCX', 'PPTX', 'XLSX'].includes(file.format)) {
      const fullUrl = `${window.location.origin}${baseUrl}`;
      return `https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`;
    }
    
    return baseUrl;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{file.title}</h2>
          <p className="text-sm text-gray-400">
            {file.format} • {(file.fileSize / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {file.format === 'PDF' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="p-2 hover:bg-gray-700 rounded"
                title="축소"
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <span className="text-sm">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="p-2 hover:bg-gray-700 rounded"
                title="확대"
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <button
                onClick={() => setZoom(100)}
                className="p-2 hover:bg-gray-700 rounded"
                title="원본 크기"
              >
                <Maximize2 className="h-5 w-5" />
              </button>
            </div>
          )}
          
          <a
            href={file.downloadUrl}
            download
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            <Download className="h-5 w-5" />
            다운로드
          </a>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded"
            title="닫기"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Viewer Content */}
      <div className="flex-1 overflow-auto bg-gray-800">
        {canPreview() ? (
          <div className="h-full flex items-center justify-center p-4">
            {file.format === 'PDF' ? (
              <iframe
                src={`${getViewerUrl()}#zoom=${zoom}`}
                className="w-full h-full bg-white"
                title={file.title}
              />
            ) : (
              <iframe
                src={getViewerUrl()}
                className="w-full h-full bg-white"
                title={file.title}
              />
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-white">
              <p className="text-xl mb-4">이 파일 형식은 미리보기를 지원하지 않습니다</p>
              <p className="text-gray-400 mb-6">
                {file.format} 파일은 다운로드하여 확인해주세요
              </p>
              <a
                href={file.downloadUrl}
                download
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                <Download className="h-5 w-5" />
                파일 다운로드
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}