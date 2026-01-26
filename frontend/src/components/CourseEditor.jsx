import React, { useState } from 'react';
import { Plus, Trash2, MoveUp, MoveDown, Type, Image, Film, FileText, HelpCircle, Upload, Link, X } from 'lucide-react';

// Question Type Components
const MultipleChoiceEditor = ({ data, onChange }) => {
  const addOption = () => {
    const newOptions = [...(data.options || []), ''];
    onChange({ ...data, options: newOptions });
  };

  const updateOption = (index, value) => {
    const newOptions = [...data.options];
    newOptions[index] = value;
    onChange({ ...data, options: newOptions });
  };

  const removeOption = (index) => {
    const newOptions = data.options.filter((_, i) => i !== index);
    onChange({ ...data, options: newOptions });
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={data.question || ''}
        onChange={(e) => onChange({ ...data, question: e.target.value })}
        placeholder="Enter your question"
        className="w-full px-3 py-2 border rounded-lg"
      />
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Options:</label>
        {(data.options || []).map((option, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="radio"
              name={`correct-${Date.now()}`}
              checked={data.correctAnswer === index}
              onChange={() => onChange({ ...data, correctAnswer: index })}
              className="mt-3"
            />
            <input
              type="text"
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <button
              type="button"
              onClick={() => removeOption(index)}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addOption}
          className="text-sm text-blue-600 hover:underline"
        >
          + Add Option
        </button>
      </div>

      <div>
        <label className="text-sm font-medium">Explanation (optional):</label>
        <textarea
          value={data.explanation || ''}
          onChange={(e) => onChange({ ...data, explanation: e.target.value })}
          placeholder="Explain the correct answer"
          className="w-full px-3 py-2 border rounded-lg mt-1"
          rows="2"
        />
      </div>
    </div>
  );
};

const FillInBlanksEditor = ({ data, onChange }) => {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Sentence (use ___ for blanks):</label>
        <textarea
          value={data.sentence || ''}
          onChange={(e) => onChange({ ...data, sentence: e.target.value })}
          placeholder="The cat ___ on the mat. It ___ very comfortable."
          className="w-full px-3 py-2 border rounded-lg mt-1"
          rows="3"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Correct Answers (comma-separated):</label>
        <input
          type="text"
          value={data.answers || ''}
          onChange={(e) => onChange({ ...data, answers: e.target.value })}
          placeholder="sat, was"
          className="w-full px-3 py-2 border rounded-lg mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">Enter answers in order of blanks</p>
      </div>

      <div>
        <label className="text-sm font-medium">Explanation (optional):</label>
        <textarea
          value={data.explanation || ''}
          onChange={(e) => onChange({ ...data, explanation: e.target.value })}
          placeholder="Explain the grammar or vocabulary"
          className="w-full px-3 py-2 border rounded-lg mt-1"
          rows="2"
        />
      </div>
    </div>
  );
};

const MatchingEditor = ({ data, onChange }) => {
  const addPair = () => {
    const newPairs = [...(data.pairs || []), { left: '', right: '' }];
    onChange({ ...data, pairs: newPairs });
  };

  const updatePair = (index, field, value) => {
    const newPairs = [...data.pairs];
    newPairs[index][field] = value;
    onChange({ ...data, pairs: newPairs });
  };

  const removePair = (index) => {
    const newPairs = data.pairs.filter((_, i) => i !== index);
    onChange({ ...data, pairs: newPairs });
  };

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={data.instruction || ''}
        onChange={(e) => onChange({ ...data, instruction: e.target.value })}
        placeholder="Match the words with their definitions"
        className="w-full px-3 py-2 border rounded-lg"
      />

      <div className="space-y-2">
        <label className="text-sm font-medium">Pairs to Match:</label>
        {(data.pairs || []).map((pair, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={pair.left}
              onChange={(e) => updatePair(index, 'left', e.target.value)}
              placeholder="Left side"
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <span className="py-2">↔</span>
            <input
              type="text"
              value={pair.right}
              onChange={(e) => updatePair(index, 'right', e.target.value)}
              placeholder="Right side"
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <button
              type="button"
              onClick={() => removePair(index)}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addPair}
          className="text-sm text-blue-600 hover:underline"
        >
          + Add Pair
        </button>
      </div>
    </div>
  );
};

// Media Upload Component
const MediaUploader = ({ type, data, onChange }) => {
  const [uploadMode, setUploadMode] = useState(data?.uploadMode || 'link');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [retryInfo, setRetryInfo] = useState(null);

  const handleFileUpload = async (e, retryCount = 0) => {
    const file = e.target?.files?.[0] || e; // Support both event and direct file
    if (!file) return;

    const maxRetries = 3;
    const isVideo = type === 'video' || file.type.startsWith('video/');
    
    setUploading(true);
    if (retryCount === 0) {
      setUploadProgress(0);
    }

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      // Import apiClient dynamically to avoid circular imports
      const { apiClient } = await import('../api/client.js');

      // Configure timeout based on file type and size
      const timeoutMs = isVideo ? Math.max(300000, file.size / 1000) : 60000; // 5min+ for videos, 1min for others
      
      console.log(`Starting upload attempt ${retryCount + 1}/${maxRetries + 1} for ${isVideo ? 'video' : 'file'} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);

      // Upload file to server with extended timeout for videos
      const response = await apiClient.post('/files/upload-content', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: timeoutMs,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      const uploadedFile = response.data.file;
      
      console.log('Upload successful:', uploadedFile);
      
      onChange({
        ...data,
        uploadMode: 'upload',
        file: file,
        url: uploadedFile.url,
        fileName: uploadedFile.originalName,
        fileSize: uploadedFile.size,
        serverFilename: uploadedFile.filename
      });
      
      setUploading(false);
      console.log('File upload completed and state updated');
    } catch (error) {
      console.error(`Upload attempt ${retryCount + 1} failed:`, error);
      
      // Check if this is a network error that might benefit from retry
      const isNetworkError = error.code === 'NETWORK_ERROR' || 
                            error.code === 'ECONNRESET' ||
                            error.message.includes('Network Error') ||
                            error.message.includes('timeout') ||
                            error.message.includes('CONNECTION_RESET') ||
                            (error.response && error.response.status >= 500);
      
      if (isNetworkError && retryCount < maxRetries) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
        console.log(`Retrying upload in ${retryDelay}ms... (attempt ${retryCount + 2}/${maxRetries + 1})`);
        
        // Show retry message to user
        const retryMessage = `업로드 중 연결이 끊어졌습니다. ${retryDelay / 1000}초 후 재시도합니다...`;
        setRetryInfo({
          attempt: retryCount + 2,
          total: maxRetries + 1,
          delay: retryDelay / 1000
        });
        
        // Update progress to show retry status
        setUploadProgress(prev => prev > 0 ? prev : 10); // Keep some progress visible
        
        setTimeout(() => {
          setRetryInfo(null);
          handleFileUpload(file, retryCount + 1);
        }, retryDelay);
        
        return; // Don't reset uploading state yet
      }
      
      // Final failure after all retries
      const errorMessage = isVideo 
        ? `동영상 업로드에 실패했습니다. 파일 크기가 너무 크거나 네트워크 연결이 불안정할 수 있습니다. (${retryCount + 1}/${maxRetries + 1} 시도 완료)`
        : `파일 업로드에 실패했습니다: ${error.response?.data?.error || error.message}`;
      
      alert(errorMessage);
      setUploading(false);
      setUploadProgress(0);
      setRetryInfo(null);
    }
  };

  const acceptTypes = {
    video: 'video/*',
    image: 'image/*',
    file: '.pdf,.doc,.docx,.txt'
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 border-b pb-2">
        <button
          type="button"
          onClick={() => setUploadMode('link')}
          className={`px-3 py-1 rounded text-sm ${
            uploadMode === 'link' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          <Link className="h-4 w-4 inline mr-1" />
          Link
        </button>
        <button
          type="button"
          onClick={() => setUploadMode('upload')}
          className={`px-3 py-1 rounded text-sm ${
            uploadMode === 'upload' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          <Upload className="h-4 w-4 inline mr-1" />
          Upload
        </button>
      </div>

      {uploadMode === 'link' ? (
        <div>
          <input
            type="url"
            value={data?.url || ''}
            onChange={(e) => onChange({ ...data, uploadMode: 'link', url: e.target.value })}
            placeholder={`Enter ${type} URL`}
            className="w-full px-3 py-2 border rounded-lg"
          />
          {type === 'video' && (
            <p className="text-xs text-amber-600 mt-1">
              ⚠️ Warning: Users may be able to access the video source directly
            </p>
          )}
        </div>
      ) : (
        <div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept={acceptTypes[type]}
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id={`file-upload-${type}-${Date.now()}`}
            />
            <label
              htmlFor={`file-upload-${type}-${Date.now()}`}
              className={`cursor-pointer ${uploading ? 'pointer-events-none' : ''}`}
            >
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                {uploading ? '업로드 중...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {type === 'video' && 'MP4, WebM, etc.'}
                {type === 'image' && 'PNG, JPG, GIF, etc.'}
                {type === 'file' && 'PDF, DOC, TXT, etc.'}
              </p>
            </label>
            
            {uploading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      retryInfo ? 'bg-yellow-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-600">{uploadProgress}% 완료</p>
                  {retryInfo && (
                    <p className="text-xs text-yellow-600">
                      재시도 중... ({retryInfo.attempt}/{retryInfo.total})
                    </p>
                  )}
                </div>
                {retryInfo && (
                  <p className="text-xs text-yellow-600 mt-1">
                    연결이 끊어져 {retryInfo.delay}초 후 재시도합니다
                  </p>
                )}
                {type === 'video' && !retryInfo && (
                  <p className="text-xs text-blue-600 mt-1">
                    💡 대용량 동영상은 업로드에 시간이 걸릴 수 있습니다
                  </p>
                )}
              </div>
            )}
          </div>
          {data?.fileName && !uploading && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
              <span>✓ {data.fileName}</span>
              {data.fileSize && (
                <span className="text-gray-500">
                  ({(data.fileSize / 1024 / 1024).toFixed(1)} MB)
                </span>
              )}
              <button
                type="button"
                onClick={() => onChange({ ...data, file: null, fileName: null, url: null, fileSize: null })}
                className="text-red-600 hover:underline ml-auto"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {type === 'video' && (
        <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 flex items-center gap-2">
            🎥 비디오 보안 설정
          </h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data?.preventRightClick !== false} // Default to true
                onChange={(e) => onChange({ ...data, preventRightClick: e.target.checked })}
                className="rounded"
              />
              <span className="font-medium">우클릭 방지</span>
              <span className="text-gray-600">(다운로드 메뉴 차단)</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data?.disableDownload !== false} // Default to true
                onChange={(e) => onChange({ ...data, disableDownload: e.target.checked })}
                className="rounded"
              />
              <span className="font-medium">다운로드 버튼 숨김</span>
              <span className="text-gray-600">(브라우저 다운로드 버튼 제거)</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data?.disablePictureInPicture || false}
                onChange={(e) => onChange({ ...data, disablePictureInPicture: e.target.checked })}
                className="rounded"
              />
              <span className="font-medium">화면 속 화면 비활성화</span>
              <span className="text-gray-600">(PIP 모드 차단)</span>
            </label>
            <hr className="border-blue-200" />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={data?.disableControls || false}
                onChange={(e) => onChange({ ...data, disableControls: e.target.checked })}
                className="rounded"
              />
              <span className="font-medium text-red-600">모든 컨트롤 비활성화</span>
              <span className="text-gray-600">(재생/일시정지, 탐색 등 모두 차단)</span>
            </label>
          </div>
          <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
            💡 <strong>권장:</strong> 우클릭 방지와 다운로드 버튼 숨김만 활성화하여 사용성과 보안의 균형을 맞추세요
          </div>
        </div>
      )}

      <input
        type="text"
        value={data?.title || ''}
        onChange={(e) => onChange({ ...data, title: e.target.value })}
        placeholder={`${type} title (optional)`}
        className="w-full px-3 py-2 border rounded-lg"
      />
      
      {type === 'image' && (
        <input
          type="text"
          value={data?.caption || ''}
          onChange={(e) => onChange({ ...data, caption: e.target.value })}
          placeholder="Caption (optional)"
          className="w-full px-3 py-2 border rounded-lg"
        />
      )}
    </div>
  );
};

// Main Course Editor
export default function EnglishCourseEditor({ lessons = [], onChange }) {
  const [editingLesson, setEditingLesson] = useState(null);

  const addLesson = () => {
    const newLesson = {
      id: Date.now(),
      title: 'New Lesson',
      description: '',
      content: []
    };
    onChange([...lessons, newLesson]);
    setEditingLesson(lessons.length);
  };

  const updateLesson = (index, updates) => {
    const updated = [...lessons];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const deleteLesson = (index) => {
    if (!confirm('Delete this lesson?')) return;
    onChange(lessons.filter((_, i) => i !== index));
    if (editingLesson === index) setEditingLesson(null);
  };

  const moveLesson = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= lessons.length) return;
    
    const updated = [...lessons];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
    setEditingLesson(newIndex);
  };

  const addContentBlock = (lessonIndex, type) => {
    const lesson = lessons[lessonIndex];
    let newBlock = { type, data: {} };
    
    switch(type) {
      case 'text':
        newBlock.data = '';
        break;
      case 'video':
        newBlock.data = { 
          uploadMode: 'link', 
          url: '', 
          title: '',
          disableControls: false,  // Allow normal controls by default
          preventRightClick: true, // Still prevent right-click saving
          disableDownload: true    // Prevent download but allow other controls
        };
        break;
      case 'image':
      case 'file':
        newBlock.data = { uploadMode: 'link', url: '', title: '' };
        break;
        newBlock.data = { question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' };
        break;
      case 'fill-blanks':
        newBlock.data = { sentence: '', answers: '', explanation: '' };
        break;
      case 'matching':
        newBlock.data = { instruction: '', pairs: [{ left: '', right: '' }] };
        break;
    }
    
    updateLesson(lessonIndex, {
      content: [...(lesson.content || []), newBlock]
    });
  };

  const updateContentBlock = (lessonIndex, blockIndex, data) => {
    const lesson = lessons[lessonIndex];
    const content = [...(lesson.content || [])];
    content[blockIndex] = { ...content[blockIndex], data };
    updateLesson(lessonIndex, { content });
  };

  const deleteContentBlock = (lessonIndex, blockIndex) => {
    const lesson = lessons[lessonIndex];
    const content = (lesson.content || []).filter((_, i) => i !== blockIndex);
    updateLesson(lessonIndex, { content });
  };

  const moveContentBlock = (lessonIndex, blockIndex, direction) => {
    const lesson = lessons[lessonIndex];
    const content = [...(lesson.content || [])];
    const newIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    
    if (newIndex < 0 || newIndex >= content.length) return;
    
    [content[blockIndex], content[newIndex]] = [content[newIndex], content[blockIndex]];
    updateLesson(lessonIndex, { content });
  };

  const renderContentEditor = (block, lessonIndex, blockIndex) => {
    const { type, data } = block;

    return (
      <div key={blockIndex} className="bg-white border rounded-lg p-4">
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
            {type === 'text' && <Type className="h-4 w-4" />}
            {type === 'video' && <Film className="h-4 w-4" />}
            {type === 'image' && <Image className="h-4 w-4" />}
            {type === 'file' && <FileText className="h-4 w-4" />}
            {(type === 'multiple-choice' || type === 'fill-blanks' || type === 'matching') && <HelpCircle className="h-4 w-4" />}
            {type.replace('-', ' ')}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => moveContentBlock(lessonIndex, blockIndex, 'up')}
              disabled={blockIndex === 0}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
            >
              <MoveUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => moveContentBlock(lessonIndex, blockIndex, 'down')}
              disabled={blockIndex === lessons[lessonIndex].content.length - 1}
              className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
            >
              <MoveDown className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => deleteContentBlock(lessonIndex, blockIndex)}
              className="p-1 hover:bg-red-100 rounded text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {type === 'text' && (
          <textarea
            value={data}
            onChange={(e) => updateContentBlock(lessonIndex, blockIndex, e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
            rows="4"
            placeholder="Enter lesson text..."
          />
        )}

        {(type === 'video' || type === 'image' || type === 'file') && (
          <MediaUploader
            type={type}
            data={data}
            onChange={(newData) => updateContentBlock(lessonIndex, blockIndex, newData)}
          />
        )}

        {type === 'multiple-choice' && (
          <MultipleChoiceEditor
            data={data}
            onChange={(newData) => updateContentBlock(lessonIndex, blockIndex, newData)}
          />
        )}

        {type === 'fill-blanks' && (
          <FillInBlanksEditor
            data={data}
            onChange={(newData) => updateContentBlock(lessonIndex, blockIndex, newData)}
          />
        )}

        {type === 'matching' && (
          <MatchingEditor
            data={data}
            onChange={(newData) => updateContentBlock(lessonIndex, blockIndex, newData)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto">
      <div className="flex justify-between items-center sticky top-0 bg-white z-10 pb-2">
        <h3 className="text-lg font-bold">Course Content</h3>
        <button
          type="button"
          onClick={addLesson}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Lesson
        </button>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-gray-500 mb-4">No lessons yet</p>
          <button
            type="button"
            onClick={addLesson}
            className="text-blue-600 hover:underline"
          >
            Create your first lesson
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson, lessonIndex) => (
            <div key={lesson.id} className="border rounded-lg">
              <div
                className={`p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${
                  editingLesson === lessonIndex ? 'bg-blue-50' : ''
                }`}
                onClick={() => setEditingLesson(editingLesson === lessonIndex ? null : lessonIndex)}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-500">#{lessonIndex + 1}</span>
                  <div>
                    <p className="font-semibold">{lesson.title}</p>
                    {lesson.description && (
                      <p className="text-sm text-gray-600">{lesson.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); moveLesson(lessonIndex, 'up'); }}
                    disabled={lessonIndex === 0}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                  >
                    <MoveUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); moveLesson(lessonIndex, 'down'); }}
                    disabled={lessonIndex === lessons.length - 1}
                    className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                  >
                    <MoveDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); deleteLesson(lessonIndex); }}
                    className="p-1 hover:bg-red-100 rounded text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {editingLesson === lessonIndex && (
                <div className="p-4 border-t bg-gray-50 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Lesson Title</label>
                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) => updateLesson(lessonIndex, { title: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <input
                        type="text"
                        value={lesson.description}
                        onChange={(e) => updateLesson(lessonIndex, { description: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium">Content Blocks</label>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => addContentBlock(lessonIndex, 'text')}
                          className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          <Type className="h-3 w-3 inline mr-1" />
                          Text
                        </button>
                        <button
                          type="button"
                          onClick={() => addContentBlock(lessonIndex, 'video')}
                          className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          <Film className="h-3 w-3 inline mr-1" />
                          Video
                        </button>
                        <button
                          type="button"
                          onClick={() => addContentBlock(lessonIndex, 'image')}
                          className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          <Image className="h-3 w-3 inline mr-1" />
                          Image
                        </button>
                        <button
                          type="button"
                          onClick={() => addContentBlock(lessonIndex, 'file')}
                          className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          <FileText className="h-3 w-3 inline mr-1" />
                          File
                        </button>
                        <button
                          type="button"
                          onClick={() => addContentBlock(lessonIndex, 'multiple-choice')}
                          className="text-xs px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
                        >
                          <HelpCircle className="h-3 w-3 inline mr-1" />
                          Quiz
                        </button>
                        <button
                          type="button"
                          onClick={() => addContentBlock(lessonIndex, 'fill-blanks')}
                          className="text-xs px-2 py-1 bg-pink-600 text-white rounded hover:bg-pink-700"
                        >
                          Fill
                        </button>
                        <button
                          type="button"
                          onClick={() => addContentBlock(lessonIndex, 'matching')}
                          className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          Match
                        </button>
                      </div>
                    </div>

                    {(!lesson.content || lesson.content.length === 0) ? (
                      <div className="text-center py-4 border-2 border-dashed rounded text-gray-500 text-sm">
                        Add content blocks to build your lesson
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {lesson.content.map((block, blockIndex) => 
                          renderContentEditor(block, lessonIndex, blockIndex)
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}