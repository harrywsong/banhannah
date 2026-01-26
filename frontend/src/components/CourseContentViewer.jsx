import React, { useState } from 'react';
import { CheckCircle, XCircle, RefreshCw, FileText, Download, Play, Image as ImageIcon } from 'lucide-react';
import { triggerDownload } from '../utils/helpers';

// Protected Video Player Component
const ProtectedVideoPlayer = ({ data }) => {
  const { 
    url, 
    title, 
    disableControls = false,  // Default to false - allow normal controls
    preventRightClick = true, // Default to true - prevent right-click saving
    disableDownload = true,   // Default to true - hide download button
    disablePictureInPicture = false,
    uploadMode
  } = data;

  const handleContextMenu = (e) => {
    if (preventRightClick) {
      e.preventDefault();
      return false;
    }
  };

  // If no URL is provided, show error
  if (!url) {
    return (
      <div className="my-4">
        <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-lg font-medium mb-2">비디오를 찾을 수 없습니다</div>
            <div className="text-sm">비디오 URL이 설정되지 않았습니다</div>
          </div>
        </div>
        {title && (
          <p className="text-sm text-gray-600 mt-2">{title}</p>
        )}
      </div>
    );
  }

  // Build controlsList based on settings
  let controlsList = [];
  if (disableDownload) controlsList.push('nodownload');
  if (disableControls) {
    controlsList.push('nofullscreen', 'noremoteplayback');
  }

  return (
    <div className="my-4">
      <div
        className="relative bg-black rounded-lg overflow-hidden"
        onContextMenu={handleContextMenu}
      >
        {uploadMode === 'upload' ? (
          // Self-hosted video (more secure)
          <video
            src={url}
            controls={!disableControls} // Show controls unless explicitly disabled
            controlsList={controlsList.join(' ')}
            disablePictureInPicture={disablePictureInPicture}
            className="w-full aspect-video"
            onContextMenu={handleContextMenu}
            onError={(e) => {
              console.error('Video failed to load:', url, e);
            }}
            onLoadStart={() => {
              console.log('Video loading started:', url);
            }}
            onCanPlay={() => {
              console.log('Video can play:', url);
            }}
            // Allow normal interaction unless controls are disabled
            style={{
              userSelect: preventRightClick ? 'none' : 'auto',
              WebkitUserSelect: preventRightClick ? 'none' : 'auto'
            }}
            preload="metadata"
            crossOrigin="anonymous"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          // External link (YouTube, etc.)
          <div className="aspect-video">
            {url.includes('youtube.com') || url.includes('youtu.be') ? (
              <iframe
                src={url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen={!disableControls}
              />
            ) : (
              <video
                src={url}
                controls={!disableControls}
                controlsList={controlsList.join(' ')}
                disablePictureInPicture={disablePictureInPicture}
                className="w-full h-full"
                onContextMenu={handleContextMenu}
                onError={(e) => {
                  console.error('External video failed to load:', url, e);
                }}
                style={{
                  userSelect: preventRightClick ? 'none' : 'auto',
                  WebkitUserSelect: preventRightClick ? 'none' : 'auto'
                }}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        )}
        
        {/* Minimal security indicators */}
        {(preventRightClick || disableDownload || disableControls) && (
          <div className="absolute top-2 right-2 flex gap-1">
            {preventRightClick && (
              <div className="bg-blue-500/80 text-white text-xs px-2 py-1 rounded">
                🛡️ 보호됨
              </div>
            )}
            {disableControls && (
              <div className="bg-red-500/80 text-white text-xs px-2 py-1 rounded">
                🔒 제한됨
              </div>
            )}
          </div>
        )}
      </div>
      {title && (
        <p className="text-sm text-gray-600 mt-2">{title}</p>
      )}
    </div>
  );
};

// Multiple Choice Question Component
const MultipleChoiceQuestion = ({ data, onAnswer }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = () => {
    setShowResult(true);
    onAnswer(selectedAnswer === data.correctAnswer);
  };

  const handleReset = () => {
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const isCorrect = selectedAnswer === data.correctAnswer;

  return (
    <div className="my-6 p-6 bg-primary-50 rounded-xl border-2 border-primary-200">
      <div className="flex items-start gap-2 mb-4">
        <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
          ?
        </div>
        <h4 className="text-lg font-semibold text-neutral-900 flex-1">
          {data.question}
        </h4>
      </div>

      <div className="space-y-3 mb-4">
        {data.options.map((option, index) => (
          <label
            key={index}
            className={`block p-4 border-2 rounded-lg cursor-pointer transition ${showResult
              ? index === data.correctAnswer
                ? 'border-green-500 bg-green-50'
                : index === selectedAnswer
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 bg-white'
              : selectedAnswer === index
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-white hover:border-blue-300'
              }`}
          >
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="answer"
                checked={selectedAnswer === index}
                onChange={() => !showResult && setSelectedAnswer(index)}
                disabled={showResult}
                className="w-5 h-5"
              />
              <span className="flex-1">{option}</span>
              {showResult && index === data.correctAnswer && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              {showResult && index === selectedAnswer && index !== data.correctAnswer && (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
            </div>
          </label>
        ))}
      </div>

      {!showResult ? (
        <button
          onClick={handleSubmit}
          disabled={selectedAnswer === null}
          className="btn btn-primary w-full rounded-full py-3 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          답변 제출
        </button>
      ) : (
        <div>
          <div className={`p-4 rounded-lg mb-3 ${isCorrect ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'
            }`}>
            <div className="flex items-center gap-2 mb-2">
              {isCorrect ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="font-semibold text-green-800">Correct! Well done!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  <span className="font-semibold text-red-800">Incorrect. Try again!</span>
                </>
              )}
            </div>
            {data.explanation && (
              <p className="text-sm text-gray-700 mt-2">
                <strong>Explanation:</strong> {data.explanation}
              </p>
            )}
          </div>
          <button
            onClick={handleReset}
            className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-5 w-5" />
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

// Fill in the Blanks Question Component
const FillBlanksQuestion = ({ data, onAnswer }) => {
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);

  const correctAnswers = data.answers ? data.answers.split(',').map(a => a.trim().toLowerCase()) : [];
  const blanksCount = (data.sentence?.match(/___/g) || []).length;

  React.useEffect(() => {
    setAnswers(new Array(blanksCount).fill(''));
  }, [blanksCount]);

  if (!data.sentence || blanksCount === 0) {
    return (
      <div className="my-6 p-6 bg-red-50 rounded-xl border-2 border-red-200">
        <p className="text-red-600">빈칸 채우기 문제가 올바르게 설정되지 않았습니다.</p>
      </div>
    );
  }

  const parts = data.sentence.split('___');

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    const isCorrect = answers.every((answer, index) =>
      correctAnswers[index] && answer.toLowerCase().trim() === correctAnswers[index]
    );
    setShowResult(true);
    onAnswer(isCorrect);
  };

  const handleReset = () => {
    setAnswers(new Array(blanksCount).fill(''));
    setShowResult(false);
  };

  const isAnswerCorrect = (index) => {
    return correctAnswers[index] && answers[index]?.toLowerCase().trim() === correctAnswers[index];
  };

  return (
    <div className="my-6 p-6 bg-accent-50 rounded-xl border-2 border-accent-200">
      <h4 className="text-lg font-semibold text-neutral-900 mb-4">빈칸 채우기</h4>

      <div className="text-lg leading-relaxed mb-4">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <span>{part}</span>
            {index < parts.length - 1 && (
              <input
                type="text"
                value={answers[index] || ''}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                disabled={showResult}
                className={`inline-block mx-1 px-3 py-1 border-2 rounded min-w-[100px] ${showResult
                  ? isAnswerCorrect(index)
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : 'border-purple-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
                  }`}
                placeholder="답 입력"
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {!showResult ? (
        <button
          onClick={handleSubmit}
          disabled={answers.some(a => !a.trim()) || correctAnswers.length === 0}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          답안 확인
        </button>
      ) : (
        <div>
          <div className={`p-4 rounded-lg mb-3 ${answers.every((answer, index) => isAnswerCorrect(index))
            ? 'bg-green-100 border-2 border-green-500'
            : 'bg-red-100 border-2 border-red-500'
            }`}>
            <div className="flex items-center gap-2 mb-2">
              {answers.every((answer, index) => isAnswerCorrect(index)) ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="font-semibold text-green-800">정답입니다! 잘했어요!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  <span className="font-semibold text-red-800">일부 답이 틀렸습니다</span>
                </>
              )}
            </div>
            <div className="text-sm text-gray-700 mt-2">
              <strong>정답:</strong> {correctAnswers.join(', ')}
            </div>
            {data.explanation && (
              <p className="text-sm text-gray-700 mt-2">
                <strong>설명:</strong> {data.explanation}
              </p>
            )}
          </div>
          <button
            onClick={handleReset}
            className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
};

// Matching Question Component
const MatchingQuestion = ({ data, onAnswer }) => {
  const [matches, setMatches] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [rightItems, setRightItems] = useState([]);

  const leftItems = data.pairs.map((p, i) => ({ id: i, text: p.left }));

  // Initialize right items once and keep them stable
  React.useEffect(() => {
    if (rightItems.length === 0) {
      const shuffledRight = [...data.pairs.map((p, i) => ({ id: i, text: p.right }))];
      // Shuffle only once on mount
      for (let i = shuffledRight.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledRight[i], shuffledRight[j]] = [shuffledRight[j], shuffledRight[i]];
      }
      setRightItems(shuffledRight);
    }
  }, [data.pairs]);

  const handleLeftClick = (id) => {
    if (showResult) return;
    if (selectedLeft === id) {
      setSelectedLeft(null);
    } else {
      setSelectedLeft(id);
      if (selectedRight !== null) {
        setMatches({ ...matches, [id]: selectedRight });
        setSelectedLeft(null);
        setSelectedRight(null);
      }
    }
  };

  const handleRightClick = (id) => {
    if (showResult) return;
    if (selectedRight === id) {
      setSelectedRight(null);
    } else {
      setSelectedRight(id);
      if (selectedLeft !== null) {
        setMatches({ ...matches, [selectedLeft]: id });
        setSelectedLeft(null);
        setSelectedRight(null);
      }
    }
  };

  const handleSubmit = () => {
    const isCorrect = Object.keys(matches).length === data.pairs.length &&
      Object.entries(matches).every(([left, right]) => parseInt(left) === parseInt(right));
    setShowResult(true);
    onAnswer(isCorrect);
  };

  const handleReset = () => {
    setMatches({});
    setShowResult(false);
    setSelectedLeft(null);
    setSelectedRight(null);
  };

  const isMatchCorrect = (leftId) => {
    return matches[leftId] !== undefined && parseInt(matches[leftId]) === parseInt(leftId);
  };

  const clearMatch = (leftId) => {
    if (!showResult) {
      const newMatches = { ...matches };
      delete newMatches[leftId];
      setMatches(newMatches);
    }
  };

  return (
    <div className="my-6 p-6 bg-primary-50 rounded-xl border-2 border-primary-200">
      <h4 className="text-lg font-semibold text-gray-900 mb-2">
        {data.instruction || 'Match the items'}
      </h4>
      <p className="text-sm text-gray-600 mb-4">Click one item from each column to create a match</p>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Left Column */}
        <div className="space-y-2">
          {leftItems.map((item) => (
            <div key={item.id} className="relative">
              <button
                onClick={() => handleLeftClick(item.id)}
                disabled={showResult}
                className={`w-full p-3 border-2 rounded-lg text-left transition min-h-[60px] ${showResult
                  ? isMatchCorrect(item.id)
                    ? 'border-green-500 bg-green-50'
                    : matches[item.id] !== undefined
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 bg-white'
                  : selectedLeft === item.id
                    ? 'border-indigo-600 bg-indigo-100 ring-2 ring-indigo-300'
                    : matches[item.id] !== undefined
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 bg-white hover:border-indigo-300'
                  }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex-1 leading-tight">{item.text}</span>
                  {matches[item.id] !== undefined && !showResult && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearMatch(item.id);
                      }}
                      className="text-red-600 hover:text-red-800 text-xs flex-shrink-0 ml-2 mt-0.5"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </button>
              {matches[item.id] !== undefined && (
                <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 z-10">
                  <div className="bg-indigo-500 text-white px-2 py-1 rounded text-xs font-medium shadow-lg">
                    → {rightItems.find(r => r.id === matches[item.id])?.text}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-2">
          {rightItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleRightClick(item.id)}
              disabled={showResult}
              className={`w-full p-3 border-2 rounded-lg text-left transition min-h-[60px] ${showResult
                ? 'border-gray-300 bg-white'
                : selectedRight === item.id
                  ? 'border-indigo-600 bg-indigo-100 ring-2 ring-indigo-300'
                  : Object.values(matches).includes(item.id)
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300 bg-white hover:border-indigo-300'
                }`}
            >
              <span className="leading-tight">{item.text}</span>
            </button>
          ))}
        </div>
      </div>

      {!showResult ? (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(matches).length !== data.pairs.length}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          매칭 확인
        </button>
      ) : (
        <div>
          <div className={`p-4 rounded-lg mb-3 ${Object.entries(matches).every(([left, right]) => parseInt(left) === parseInt(right))
            ? 'bg-green-100 border-2 border-green-500'
            : 'bg-red-100 border-2 border-red-500'
            }`}>
            <div className="flex items-center gap-2">
              {Object.entries(matches).every(([left, right]) => parseInt(left) === parseInt(right)) ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="font-semibold text-green-800">완벽합니다! 모든 매칭이 정확해요!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  <span className="font-semibold text-red-800">일부 매칭이 틀렸습니다</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={handleReset}
            className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw className="h-5 w-5" />
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
};

// Main Course Viewer Component
export default function CourseContentViewer({ lesson, onQuizAnswer }) {
  const renderContent = (block, index) => {
    const { type, data } = block;

    switch (type) {
      case 'text':
        return (
          <div key={index} className="prose prose-neutral max-w-none mb-8">
            <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">{data}</p>
          </div>
        );

      case 'video':
        return (
          <div key={index}>
            <ProtectedVideoPlayer data={data} />
          </div>
        );

      case 'image':
        return (
          <div key={index} className="mb-8 group">
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-neutral-200">
              <img
                src={data.url}
                alt={data.caption || '강의 이미지'}
                className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-[1.02]"
              />
              {data.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md text-white px-6 py-3 text-sm">
                  {data.caption}
                </div>
              )}
            </div>
          </div>
        );

      case 'file':
        return (
          <div key={index} className="mb-8">
            <div className="flex items-center gap-4 p-5 bg-white border border-neutral-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="p-3 bg-primary-100 rounded-xl">
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-neutral-900">
                  {data.title || '파일 다운로드'}
                </p>
                <p className="text-sm text-neutral-600">클릭하여 다운로드 또는 보기</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    let downloadUrl;
                    
                    if (data.url) {
                      // Extract filename from the URL
                      // URL format is typically: /api/files/view/filename or /api/files/video/filename
                      const urlParts = data.url.split('/');
                      const filename = urlParts[urlParts.length - 1];
                      
                      // Construct proper download URL for course content
                      downloadUrl = `/files/download-content/${filename}`;
                    } else if (data.serverFilename) {
                      // Fallback to serverFilename if available
                      downloadUrl = `/files/download-content/${data.serverFilename}`;
                    } else {
                      throw new Error('파일 URL이 없습니다');
                    }
                    
                    console.log('Course file download - Original URL:', data.url, 'Download URL:', downloadUrl);
                    
                    await triggerDownload(downloadUrl, data.title || data.fileName || data.originalName);
                  } catch (error) {
                    console.error('Download failed:', error);
                    alert('다운로드에 실패했습니다: ' + error.message);
                  }
                }}
                className="btn btn-primary rounded-full px-6 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300"
              >
                <Download className="h-5 w-5" />
                다운로드
              </button>
            </div>
          </div>
        );

      case 'multiple-choice':
        return (
          <MultipleChoiceQuestion
            key={index}
            data={data}
            onAnswer={(isCorrect) => onQuizAnswer?.('multiple-choice', isCorrect)}
          />
        );

      case 'fill-blanks':
        return (
          <FillBlanksQuestion
            key={index}
            data={data}
            onAnswer={(isCorrect) => onQuizAnswer?.('fill-blanks', isCorrect)}
          />
        );

      case 'matching':
        return (
          <MatchingQuestion
            key={index}
            data={data}
            onAnswer={(isCorrect) => onQuizAnswer?.('matching', isCorrect)}
          />
        );

      default:
        return null;
    }
  };

  if (!lesson || !lesson.content || lesson.content.length === 0) {
    return (
      <div className="text-center py-16 bg-neutral-50 rounded-xl">
        <div className="inline-flex p-6 bg-primary-50 rounded-2xl mb-6">
          <FileText className="h-16 w-16 text-primary-400" />
        </div>
        <p className="text-lg text-neutral-600">이 레슨에는 아직 콘텐츠가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="space-y-6">
        {lesson.content.map((block, index) => renderContent(block, index))}
      </div>
    </div>
  );
}