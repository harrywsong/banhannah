import { Link } from 'react-router-dom';
import { BookOpen, Mail, Phone, MapPin } from 'lucide-react';

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
                <a href="#" className="text-sm hover:text-primary-400 transition-colors">
                  이용약관
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-primary-400 transition-colors">
                  개인정보처리방침
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-white mb-4">연락처</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-neutral-500" />
                <span className="text-sm hover:text-white transition-colors">info.banhannah@gmail.com</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-neutral-500 mt-0.5" />
                <div className="text-sm text-neutral-400">
                  <p>평일: 09:00 - 18:00</p>
                  <p>주말 및 공휴일: 휴무</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-neutral-500">
          <p>
            © {currentYear} 반혜나 교육. All rights reserved.
          </p>
          <p className="mt-2 md:mt-0">
            Designed for professional growth
          </p>
        </div>
      </div>
    </footer>
  );
}
