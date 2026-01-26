import { useState } from 'react';
import { apiClient } from '../api/client';
import { Mail, Send, Upload, X, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (images.length + files.length > 3) {
      setMessage({ type: 'error', text: '최대 3개의 이미지만 첨부할 수 있습니다.' });
      return;
    }

    const validFiles = [];
    const validPreviews = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: '이미지 파일만 첨부할 수 있습니다.' });
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: '각 이미지는 5MB 이하여야 합니다.' });
        continue;
      }

      validFiles.push(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        validPreviews.push({ file: file.name, url: reader.result });
        if (validPreviews.length === validFiles.length) {
          setImagePreviews([...imagePreviews, ...validPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }

    setImages([...images, ...validFiles]);
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('message', formData.message);

      images.forEach((image, index) => {
        formDataToSend.append(`image${index}`, image);
      });

      await apiClient.post('/contact/submit', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage({
        type: 'success',
        text: '문의가 성공적으로 접수되었습니다! 빠른 시일 내에 답변드리겠습니다.'
      });

      setFormData({ name: '', email: '', subject: '', message: '' });
      setImages([]);
      setImagePreviews([]);
    } catch (error) {
      console.error('Contact form error:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error || '문의 전송에 실패했습니다. 다시 시도해주세요.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="relative pt-12 pb-12 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-neutral-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/30 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/25">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
              문의하기
            </h1>
            <p className="text-lg text-slate-600 font-light leading-relaxed max-w-2xl mx-auto">
              궁금하신 점이 있으시면 언제든지 연락해주세요
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Contact Information */}
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-6">연락 정보</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">이메일</p>
                      <a 
                        href="mailto:info.banhannah@gmail.com"
                        className="text-primary-600 text-sm hover:text-primary-700 transition-colors"
                      >
                        info.banhannah@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                      <svg className="h-5 w-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">인스타그램</p>
                      <a 
                        href="https://www.instagram.com/banhanna_h/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-pink-600 text-sm hover:text-pink-700 transition-colors"
                      >
                        @banhanna_h
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3c2.753 0 5.07.59 6.975 1.69C20.88 5.79 21.796 7.24 21.796 8.8c0 .63-.084 1.24-.25 1.81-.166.57-.415 1.1-.745 1.59-.33.49-.745.94-1.245 1.35-.5.41-1.085.77-1.755 1.08-.67.31-1.425.55-2.265.72-.84.17-1.765.25-2.775.25-.84 0-1.65-.06-2.43-.18-.78-.12-1.52-.3-2.22-.54-.7-.24-1.36-.54-1.98-.9-.62-.36-1.2-.78-1.74-1.26-.54-.48-1.02-1.02-1.44-1.62-.42-.6-.75-1.26-.99-1.98-.24-.72-.36-1.5-.36-2.34 0-1.56.916-3.01 2.821-4.11C6.93 3.59 9.247 3 12 3zm0 1.5c-2.463 0-4.463.48-6 1.44-1.537.96-2.305 2.16-2.305 3.6 0 .66.096 1.26.288 1.8.192.54.468 1.02.828 1.44.36.42.804.78 1.332 1.08.528.3 1.14.54 1.836.72.696.18 1.476.27 2.34.27.864 0 1.644-.09 2.34-.27.696-.18 1.308-.42 1.836-.72.528-.3.972-.66 1.332-1.08.36-.42.636-.9.828-1.44.192-.54.288-1.14.288-1.8 0-1.44-.768-2.64-2.305-3.6-1.537-.96-3.537-1.44-6-1.44z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">카카오톡</p>
                      <a 
                        href="https://open.kakao.com/o/your-chat-room-id" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-yellow-600 text-sm hover:text-yellow-700 transition-colors"
                      >
                        오픈채팅방 참여
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="card p-6 md:p-8 hover:shadow-xl transition-shadow duration-300">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                        이름 *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                        이메일 *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-medium text-neutral-700 mb-1">
                        제목 *
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-1">
                        메시지 *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        placeholder="문의 내용을 작성해 주세요..."
                      />
                    </div>

                    {/* Image Upload Section */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        <ImageIcon className="inline h-4 w-4 mr-1" />
                        이미지 첨부 (선택, 최대 3개)
                      </label>

                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mb-3">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview.url}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border-2 border-neutral-200"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <p className="text-xs text-neutral-500 mt-1 truncate">{preview.file}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {images.length < 3 && (
                        <label className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-neutral-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                          <Upload className="h-5 w-5 text-neutral-400 mr-2" />
                          <span className="text-sm text-neutral-600">
                            이미지 선택 ({images.length}/3)
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      )}

                      <p className="text-xs text-neutral-500 mt-2">
                        JPG, PNG, GIF 등 이미지 파일만 가능 (각 파일 최대 5MB)
                      </p>
                    </div>

                    {/* Message Display */}
                    {message.text && (
                      <div className={`p-4 rounded-lg flex items-start gap-2 ${message.type === 'success'
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                        }`}>
                        {message.type === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        )}
                        <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'
                          }`}>
                          {message.text}
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full btn btn-primary btn-lg rounded-full px-8 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                          전송 중...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2 inline-block" />
                          문의 보내기
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}