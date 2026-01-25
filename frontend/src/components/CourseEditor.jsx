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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const tempUrl = URL.createObjectURL(file);
    onChange({
      ...data,
      uploadMode: 'upload',
      file: file,
      url: tempUrl,
      fileName: file.name
    });
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
              className="hidden"
              id={`file-upload-${type}-${Date.now()}`}
            />
            <label
              htmlFor={`file-upload-${type}-${Date.now()}`}
              className="cursor-pointer"
            >
              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {type === 'video' && 'MP4, WebM, etc.'}
                {type === 'image' && 'PNG, JPG, GIF, etc.'}
                {type === 'file' && 'PDF, DOC, TXT, etc.'}
              </p>
            </label>
          </div>
          {data?.fileName && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
              <span>✓ {data.fileName}</span>
              <button
                type="button"
                onClick={() => onChange({ ...data, file: null, fileName: null, url: null })}
                className="text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {type === 'video' && (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={data?.disableControls || false}
              onChange={(e) => onChange({ ...data, disableControls: e.target.checked })}
              className="rounded"
            />
            Disable video controls (prevent seeking/downloading)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={data?.preventRightClick || false}
              onChange={(e) => onChange({ ...data, preventRightClick: e.target.checked })}
              className="rounded"
            />
            Prevent right-click on video
          </label>
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
      case 'image':
      case 'file':
        newBlock.data = { uploadMode: 'link', url: '', title: '' };
        break;
      case 'multiple-choice':
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