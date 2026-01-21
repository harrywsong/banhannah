import { Link } from 'react-router-dom'
import { BookOpen, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <BookOpen className="h-6 w-6 text-primary-400" />
              <span className="text-xl font-bold text-white">반혜나</span>
            </div>
            <p className="text-sm">
              고품질 교육과 혁신적인 학습 경험을 통해 어린 마음을 키웁니다.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">빠른 링크</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-primary-400 transition-colors">홈</Link></li>
              <li><Link to="/resources" className="hover:text-primary-400 transition-colors">자료</Link></li>
              <li><Link to="/live-classes" className="hover:text-primary-400 transition-colors">라이브 클래스</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary-400 transition-colors">대시보드</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">정보</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-primary-400 transition-colors">소개</Link></li>
              <li><Link to="/contact" className="hover:text-primary-400 transition-colors">연락처</Link></li>
              <li><Link to="/faqs" className="hover:text-primary-400 transition-colors">자주 묻는 질문</Link></li>
              <li><Link to="/privacy" className="hover:text-primary-400 transition-colors">개인정보처리방침</Link></li>
              <li><Link to="/terms" className="hover:text-primary-400 transition-colors">이용약관</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">연락처</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>hwstestcontact@gmail.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>123 Education St, Learning City</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} 반혜나. 모든 권리 보유.</p>
        </div>
      </div>
    </footer>
  )
}
