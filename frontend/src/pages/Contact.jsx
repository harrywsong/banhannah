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
      <section className="relative pt-20 pb-16 overflow-hidden bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm">
              <Mail className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">문의하기</h1>
            <p className="text-xl opacity-90 font-light leading-relaxed">
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
                      <p className="text-neutral-600 text-sm">info.banhannah@gmail.com</p>
                    </div>
                  </div>

                  <div className="card p-6 bg-primary-50 border-primary-100">
                    <h3 className="font-semibold text-primary-900 mb-2">운영 시간</h3>
                    <p className="text-primary-800 text-sm leading-relaxed">
                      평일: 09:00 - 18:00<br />
                      주말 및 공휴일: 휴무
                    </p>
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