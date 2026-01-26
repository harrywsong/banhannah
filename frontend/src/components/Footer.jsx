import { Link } from 'react-router-dom';
import { BookOpen, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-neutral-900 text-neutral-300 border-t border-neutral-800">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-900/20">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">반혜나 교육</span>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed">
              고품질 교육 콘텐츠로 학습자의 성장을 돕는<br />온라인 교육 플랫폼입니다.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4">빠른 링크</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/courses" className="text-sm hover:text-primary-400 transition-colors">
                  강의
                </Link>
              </li>
              <li>
                <Link to="/files" className="text-sm hover:text-primary-400 transition-colors">
                  자료실
                </Link>
              </li>
              <li>
                <Link to="/reviews" className="text-sm hover:text-primary-400 transition-colors">
                  후기
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-sm hover:text-primary-400 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-white mb-4">지원</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/contact" className="text-sm hover:text-primary-400 transition-colors">
                  문의하기
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm hover:text-primary-400 transition-colors">
                  소개
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm hover:text-primary-400 transition-colors">
                  이용약관
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm hover:text-primary-400 transition-colors">
                  개인정보처리방침
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-white mb-4">연락처</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-neutral-500" />
                <a 
                  href="mailto:info.banhannah@gmail.com"
                  className="text-sm hover:text-primary-400 transition-colors"
                >
                  이메일: info.banhannah@gmail.com
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-neutral-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <a 
                  href="https://www.instagram.com/banhanna_h/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm hover:text-primary-400 transition-colors"
                >
                  인스타그램: @banhanna_h
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-neutral-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3c2.753 0 5.07.59 6.975 1.69C20.88 5.79 21.796 7.24 21.796 8.8c0 .63-.084 1.24-.25 1.81-.166.57-.415 1.1-.745 1.59-.33.49-.745.94-1.245 1.35-.5.41-1.085.77-1.755 1.08-.67.31-1.425.55-2.265.72-.84.17-1.765.25-2.775.25-.84 0-1.65-.06-2.43-.18-.78-.12-1.52-.3-2.22-.54-.7-.24-1.36-.54-1.98-.9-.62-.36-1.2-.78-1.74-1.26-.54-.48-1.02-1.02-1.44-1.62-.42-.6-.75-1.26-.99-1.98-.24-.72-.36-1.5-.36-2.34 0-1.56.916-3.01 2.821-4.11C6.93 3.59 9.247 3 12 3zm0 1.5c-2.463 0-4.463.48-6 1.44-1.537.96-2.305 2.16-2.305 3.6 0 .66.096 1.26.288 1.8.192.54.468 1.02.828 1.44.36.42.804.78 1.332 1.08.528.3 1.14.54 1.836.72.696.18 1.476.27 2.34.27.864 0 1.644-.09 2.34-.27.696-.18 1.308-.42 1.836-.72.528-.3.972-.66 1.332-1.08.36-.42.636-.9.828-1.44.192-.54.288-1.14.288-1.8 0-1.44-.768-2.64-2.305-3.6-1.537-.96-3.537-1.44-6-1.44z"/>
                </svg>
                <a 
                  href="https://open.kakao.com/o/your-chat-room-id" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm hover:text-primary-400 transition-colors"
                >
                  카카오톡: 오픈채팅방
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-neutral-500">
          <p>
            © {currentYear} 반혜나 교육. All rights reserved.
          </p>
          <p className="mt-2 md:mt-0">
            <a 
              href="https://www.instagram.com/dngur.thd/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-primary-400 transition-colors"
            >
              Made by: @dngur.thd
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
