import React, { useState } from 'react';
import { CheckCircle, XCircle, RefreshCw, FileText, Download, Play, Image as ImageIcon } from 'lucide-react';

// Protected Video Player Component
const ProtectedVideoPlayer = ({ data }) => {
  const { url, title, disableControls, preventRightClick, uploadMode } = data;

  const handleContextMenu = (e) => {
    if (preventRightClick) {
      e.preventDefault();
      return false;
    }
  };

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
            controls={!disableControls}
            controlsList={disableControls ? "nodownload nofullscreen noremoteplayback" : ""}
            disablePictureInPicture={disableControls}
            className="w-full aspect-video"
            onContextMenu={handleContextMenu}
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
                controlsList={disableControls ? "nodownload" : ""}
                className="w-full h-full"
                onContextMenu={handleContextMenu}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        )}
        {disableControls && (
          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            Protected Content
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
    <div className="my-6 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
      <div className="flex items-start gap-2 mb-4">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
          ?
        </div>
        <h4 className="text-lg font-semibold text-gray-900 flex-1">
          {data.question}
        </h4>
      </div>

      <div className="space-y-3 mb-4">
        {data.options.map((option, index) => (
          <label
            key={index}
            className={`block p-4 border-2 rounded-lg cursor-pointer transition ${
              showResult
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
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Answer
        </button>
      ) : (
        <div>
          <div className={`p-4 rounded-lg mb-3 ${
            isCorrect ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'
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

  const correctAnswers = data.answers.split(',').map(a => a.trim().toLowerCase());
  const blanksCount = (data.sentence.match(/___/g) || []).length;

  React.useEffect(() => {
    setAnswers(new Array(blanksCount).fill(''));
  }, [blanksCount]);

  const parts = data.sentence.split('___');

  const handleSubmit = () => {
    const isCorrect = answers.every((answer, index) => 
      answer.toLowerCase().trim() === correctAnswers[index]
    );
    setShowResult(true);
    onAnswer(isCorrect);
  };

  const handleReset = () => {
    setAnswers(new Array(blanksCount).fill(''));
    setShowResult(false);
  };

  const isAnswerCorrect = (index) => {
    return answers[index]?.toLowerCase().trim() === correctAnswers[index];
  };

  return (
    <div className="my-6 p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Fill in the Blanks</h4>
      
      <div className="text-lg leading-relaxed mb-4">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <span>{part}</span>
            {index < parts.length - 1 && (
              <input
                type="text"
                value={answers[index] || ''}
                onChange={(e) => {
                  const newAnswers = [...answers];
                  newAnswers[index] = e.target.value;
                  setAnswers(newAnswers);
                }}
                disabled={showResult}
                className={`inline-block mx-1 px-3 py-1 border-2 rounded ${
                  showResult
                    ? isAnswerCorrect(index)
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : 'border-purple-300 focus:ring-2 focus:ring-purple-500'
                }`}
                style={{ minWidth: '100px' }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {!showResult ? (
        <button
          onClick={handleSubmit}
          disabled={answers.some(a => !a.trim())}
          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Check Answers
        </button>
      ) : (
        <div>
          <div className={`p-4 rounded-lg mb-3 ${
            answers.every((answer, index) => isAnswerCorrect(index))
              ? 'bg-green-100 border-2 border-green-500'
              : 'bg-red-100 border-2 border-red-500'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {answers.every((answer, index) => isAnswerCorrect(index)) ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="font-semibold text-green-800">Perfect! All correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  <span className="font-semibold text-red-800">Some answers are incorrect</span>
                </>
              )}
            </div>
            <div className="text-sm text-gray-700 mt-2">
              <strong>Correct answers:</strong> {correctAnswers.join(', ')}
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

// Matching Question Component
const MatchingQuestion = ({ data, onAnswer }) => {
  const [matches, setMatches] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);

  const leftItems = data.pairs.map((p, i) => ({ id: i, text: p.left }));
  const rightItems = [...data.pairs.map((p, i) => ({ id: i, text: p.right }))].sort(() => Math.random() - 0.5);

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
    <div className="my-6 p-6 bg-indigo-50 rounded-lg border-2 border-indigo-200">
      <h4 className="text-lg font-semibold text-gray-900 mb-2">
        {data.instruction || 'Match the items'}
      </h4>
      <p className="text-sm text-gray-600 mb-4">Click one item from each column to create a match</p>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Left Column */}
        <div className="space-y-2">
          {leftItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleLeftClick(item.id)}
              disabled={showResult}
              className={`w-full p-3 border-2 rounded-lg text-left transition ${
                showResult
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
              <div className="flex items-center justify-between gap-2">
                <span className="flex-1">{item.text}</span>
                {matches[item.id] !== undefined && !showResult && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearMatch(item.id);
                    }}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
              {matches[item.id] !== undefined && (
                <div className="text-sm text-gray-600 mt-1">
                  → {rightItems.find(r => r.id === matches[item.id])?.text}
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-2">
          {rightItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleRightClick(item.id)}
              disabled={showResult}
              className={`w-full p-3 border-2 rounded-lg text-left transition ${
                showResult
                  ? 'border-gray-300 bg-white'
                  : selectedRight === item.id
                  ? 'border-indigo-600 bg-indigo-100 ring-2 ring-indigo-300'
                  : Object.values(matches).includes(item.id)
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-300 bg-white hover:border-indigo-300'
              }`}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>

      {!showResult ? (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(matches).length !== data.pairs.length}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Check Matches
        </button>
      ) : (
        <div>
          <div className={`p-4 rounded-lg mb-3 ${
            Object.entries(matches).every(([left, right]) => parseInt(left) === parseInt(right))
              ? 'bg-green-100 border-2 border-green-500'
              : 'bg-red-100 border-2 border-red-500'
          }`}>
            <div className="flex items-center gap-2">
              {Object.entries(matches).every(([left, right]) => parseInt(left) === parseInt(right)) ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="font-semibold text-green-800">Excellent! All matches correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  <span className="font-semibold text-red-800">Some matches are incorrect</span>
                </>
              )}
            </div>
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

// Main Course Viewer Component
export default function CourseContentViewer({ lesson, onQuizAnswer }) {
  const renderContentBlock = (block, index) => {
    const { type, data } = block;

    switch (type) {
      case 'text':
        return (
          <div key={index} className="prose max-w-none mb-6">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{data}</p>
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
          <div key={index} className="my-6">
            <img
              src={data.url}
              alt={data.title || 'Lesson image'}
              className="w-full rounded-lg shadow-lg"
            />
            {data.title && (
              <p className="text-sm font-semibold text-gray-700 mt-2">{data.title}</p>
            )}
            {data.caption && (
              <p className="text-sm text-gray-600 mt-1">{data.caption}</p>
            )}
          </div>
        );

      case 'file':
        return (
          <div key={index} className="my-6 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-gray-600" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {data.title || 'Download File'}
                </p>
                <p className="text-sm text-gray-600">Click to download or view</p>
              </div>
              <a
                href={data.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="h-5 w-5" />
                Download
              </a>
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
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">This lesson has no content yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{lesson.title}</h2>
        {lesson.description && (
          <p className="text-lg text-gray-600">{lesson.description}</p>
        )}
      </div>

      <div className="space-y-4">
        {lesson.content.map((block, index) => renderContentBlock(block, index))}
      </div>
    </div>
  );
}