import { Link } from 'react-router-dom';
import { 
  HomeIcon, 
  InformationCircleIcon, 
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <AcademicCapIcon className="h-5 w-5 mr-2" />
              반혜나
            </h3>
            <p className="text-gray-300 text-sm">
              온라인 교육의 새로운 기준을 제시합니다
            </p>
          </div>
          
          <div>
            <h3 className="text-base font-semibold mb-3">페이지</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link to="/" className="hover:text-white flex items-center">
                  <HomeIcon className="h-4 w-4 mr-2" />
                  홈
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white flex items-center">
                  <InformationCircleIcon className="h-4 w-4 mr-2" />
                  소개
                </Link>
              </li>
              <li>
                <Link to="/reviews" className="hover:text-white flex items-center">
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                  후기
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white flex items-center">
                  <QuestionMarkCircleIcon className="h-4 w-4 mr-2" />
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  연락
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-3">학습</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link to="/courses" className="hover:text-white flex items-center">
                  <AcademicCapIcon className="h-4 w-4 mr-2" />
                  강의
                </Link>
              </li>
              <li>
                <Link to="/files" className="hover:text-white flex items-center">
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  자료실
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-3">연락처</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>
                <EnvelopeIcon className="h-4 w-4 inline mr-2" />
                info.banhannah@gmail.com
              </p>
              <p>
                <span className="inline-block w-4 h-4 mr-2">📷</span>
                <a 
                  href="https://www.instagram.com/banhyena" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  @banhyena
                </a>
              </p>
              <p>
                <span className="inline-block w-4 h-4 mr-2">💬</span>
                <a 
                  href="https://open.kakao.com/o/your-chat-room" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  카카오톡 오픈채팅
                </a>
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-6 pt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-400">
          <div className="flex flex-wrap items-center gap-4 mb-2 sm:mb-0">
            <p>&copy; 2024 반혜나. All rights reserved.</p>
            <Link to="/privacy-policy" className="hover:text-white">
              개인정보처리방침
            </Link>
            <Link to="/terms-of-service" className="hover:text-white">
              이용약관
            </Link>
            <span className="text-gray-500">|</span>
            <a 
              href="https://www.instagram.com/dngur.thd/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              Made by @dngur.thd
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}