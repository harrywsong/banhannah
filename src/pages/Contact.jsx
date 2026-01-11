import { Mail, Phone, MapPin, Send } from 'lucide-react'
import { useState } from 'react'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Store contact form submission in localStorage
    const submissions = JSON.parse(localStorage.getItem('contactSubmissions') || '[]')
    const newSubmission = {
      ...formData,
      submittedAt: new Date().toISOString(),
      id: Date.now()
    }
    submissions.push(newSubmission)
    localStorage.setItem('contactSubmissions', JSON.stringify(submissions))
    
    // In production, this should send an actual email via backend API
    // Options:
    // 1. Backend API endpoint (recommended): POST /api/contact with email service (Nodemailer, SendGrid, etc.)
    // 2. Third-party service: EmailJS, Formspree, SendGrid, etc.
    // 
    // Example backend API call (uncomment when backend is ready):
    /*
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'hwstestcontact@gmail.com',
          subject: `[문의] ${formData.subject}`,
          name: formData.name,
          email: formData.email,
          message: formData.message
        })
      })
      
      if (!response.ok) {
        throw new Error('이메일 전송에 실패했습니다.')
      }
      
      // Success
      setSubmitted(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
      setTimeout(() => setSubmitted(false), 5000)
    } catch (error) {
      alert('메시지 전송 중 오류가 발생했습니다. 나중에 다시 시도해주세요.')
      console.error('Contact form error:', error)
    }
    */
    
    // For demo: Store submission and show success
    // TODO: Replace with actual email sending via backend API
    console.log('Contact form submitted (demo mode - email not actually sent):', newSubmission)
    console.log('Backend API integration needed to send email to: hwstestcontact@gmail.com')
    
    setSubmitted(true)
    setFormData({ name: '', email: '', subject: '', message: '' })
    
    // Clear success message after 5 seconds
    setTimeout(() => {
      setSubmitted(false)
    }, 5000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">연락하기</h1>
          <p className="text-xl text-primary-100">질문이나 의견이 있으시면 언제든지 연락 주세요.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">연락처</h2>
                <p className="text-gray-600 mb-6">
                  질문이나 도움이 필요하신가요? 언제든지 연락 주세요!
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <Mail className="h-6 w-6 text-primary-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">이메일</h3>
                    <a href="mailto:hwstestcontact@gmail.com" className="text-primary-600 hover:text-primary-700">
                      hwstestcontact@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Phone className="h-6 w-6 text-primary-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">카카오톡</h3>
                    <a 
                      href="https://open.kakao.com/o/[카카오톡오픈채팅링크]" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      오픈채팅으로 문의하기
                    </a>
                    <p className="text-xs text-gray-500 mt-1">카카오톡 오픈채팅 링크로 연결됩니다</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <MapPin className="h-6 w-6 text-primary-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">주소</h3>
                    <p className="text-gray-600">
                      123 Education Street<br />
                      Learning City, LC 12345
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">메시지 보내기</h2>
              
              {submitted && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  메시지를 주셔서 감사합니다! 곧 연락드리겠습니다.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    이름 *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="이름을 입력하세요"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    이메일 *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="이메일을 입력하세요"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    제목 *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="어떤 내용인지 알려주세요"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    메시지 *
                  </label>
                  <textarea
                    id="message"
                    rows="6"
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="메시지를 입력하세요..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Send className="h-5 w-5" />
                  <span>메시지 보내기</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
