// frontend/src/components/CourseEditor.jsx - Course Content Editor
import { useState } from 'react';
import { Plus, Trash2, MoveUp, MoveDown, Type, Image as ImageIcon, Code, Film } from 'lucide-react';

export default function CourseEditor({ lessons = [], onChange }) {
  const [editingLesson, setEditingLesson] = useState(null);

  const addLesson = () => {
    const newLesson = {
      id: Date.now(),
      title: '새 레슨',
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
    if (!confirm('이 레슨을 삭제하시겠습니까?')) return;
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
    const newBlock = {
      type,
      data: type === 'text' ? '' : type === 'video' ? { videoId: '', title: '' } : {}
    };
    
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">강의 콘텐츠</h3>
        <button
          type="button"
          onClick={addLesson}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          레슨 추가
        </button>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-gray-500 mb-4">아직 레슨이 없습니다</p>
          <button
            type="button"
            onClick={addLesson}
            className="text-blue-600 hover:underline"
          >
            첫 레슨 추가하기
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
                      <label className="block text-sm font-medium mb-1">레슨 제목</label>
                      <input
                        type="text"
                        value={lesson.title}
                        onChange={(e) => updateLesson(lessonIndex, { title: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="레슨 제목"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">레슨 설명</label>
                      <input
                        type="text"
                        value={lesson.description}
                        onChange={(e) => updateLesson(lessonIndex, { description: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="레슨 설명"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium">콘텐츠 블록</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => addContentBlock(lessonIndex, 'text')}
                          className="text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-1"
                        >
                          <Type className="h-3 w-3" />
                          텍스트
                        </button>
                        <button
                          type="button"
                          onClick={() => addContentBlock(lessonIndex, 'video')}
                          className="text-xs px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center gap-1"
                        >
                          <Film className="h-3 w-3" />
                          동영상
                        </button>
                        <button
                          type="button"
                          onClick={() => addContentBlock(lessonIndex, 'code')}
                          className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                        >
                          <Code className="h-3 w-3" />
                          코드
                        </button>
                        <button
                          type="button"
                          onClick={() => addContentBlock(lessonIndex, 'image')}
                          className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                        >
                          <ImageIcon className="h-3 w-3" />
                          이미지
                        </button>
                      </div>
                    </div>

                    {(!lesson.content || lesson.content.length === 0) ? (
                      <div className="text-center py-4 border-2 border-dashed rounded text-gray-500 text-sm">
                        콘텐츠 블록을 추가하세요
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {lesson.content.map((block, blockIndex) => (
                          <div key={blockIndex} className="bg-white border rounded-lg p-3">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs font-semibold text-gray-500 uppercase">
                                {block.type}
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
                                  disabled={blockIndex === lesson.content.length - 1}
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

                            {block.type === 'text' && (
                              <textarea
                                value={block.data}
                                onChange={(e) => updateContentBlock(lessonIndex, blockIndex, e.target.value)}
                                className="w-full px-3 py-2 border rounded text-sm"
                                rows="4"
                                placeholder="텍스트 내용을 입력하세요"
                              />
                            )}

                            {block.type === 'video' && (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={block.data.videoId || ''}
                                  onChange={(e) => updateContentBlock(lessonIndex, blockIndex, { ...block.data, videoId: e.target.value })}
                                  className="w-full px-3 py-2 border rounded text-sm"
                                  placeholder="비디오 ID"
                                />
                                <input
                                  type="text"
                                  value={block.data.title || ''}
                                  onChange={(e) => updateContentBlock(lessonIndex, blockIndex, { ...block.data, title: e.target.value })}
                                  className="w-full px-3 py-2 border rounded text-sm"
                                  placeholder="비디오 제목 (선택)"
                                />
                              </div>
                            )}

                            {block.type === 'code' && (
                              <textarea
                                value={block.data}
                                onChange={(e) => updateContentBlock(lessonIndex, blockIndex, e.target.value)}
                                className="w-full px-3 py-2 border rounded text-sm font-mono bg-gray-900 text-gray-100"
                                rows="6"
                                placeholder="코드를 입력하세요"
                              />
                            )}

                            {block.type === 'image' && (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={block.data.url || ''}
                                  onChange={(e) => updateContentBlock(lessonIndex, blockIndex, { ...block.data, url: e.target.value })}
                                  className="w-full px-3 py-2 border rounded text-sm"
                                  placeholder="이미지 URL"
                                />
                                <input
                                  type="text"
                                  value={block.data.alt || ''}
                                  onChange={(e) => updateContentBlock(lessonIndex, blockIndex, { ...block.data, alt: e.target.value })}
                                  className="w-full px-3 py-2 border rounded text-sm"
                                  placeholder="대체 텍스트"
                                />
                                <input
                                  type="text"
                                  value={block.data.caption || ''}
                                  onChange={(e) => updateContentBlock(lessonIndex, blockIndex, { ...block.data, caption: e.target.value })}
                                  className="w-full px-3 py-2 border rounded text-sm"
                                  placeholder="캡션 (선택)"
                                />
                              </div>
                            )}
                          </div>
                        ))}
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