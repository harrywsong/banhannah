import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  BookOpenIcon, 
  UserIcon, 
  ArrowRightOnRectangleIcon, 
  Cog6ToothIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  InformationCircleIcon,
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpenIcon className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">반혜나</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:items-center md:space-x-8">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 flex items-center transition-colors"
              >
                <HomeIcon className="h-4 w-4 mr-1" />
                홈
              </Link>
              <Link 
                to="/about" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 flex items-center transition-colors"
              >
                <InformationCircleIcon className="h-4 w-4 mr-1" />
                소개
              </Link>
              <Link 
                to="/reviews" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 flex items-center transition-colors"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                후기
              </Link>
              <Link 
                to="/faq" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 flex items-center transition-colors"
              >
                <QuestionMarkCircleIcon className="h-4 w-4 mr-1" />
                FAQ
              </Link>
              <Link 
                to="/contact" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 flex items-center transition-colors"
              >
                <EnvelopeIcon className="h-4 w-4 mr-1" />
                연락
              </Link>
            </div>
          </div>

          {/* Right side navigation */}
          <div className="flex items-center space-x-1">
            {isAuthenticated ? (
              <>
                {/* Authenticated user navigation */}
                <div className="hidden md:flex md:items-center md:space-x-1">
                  <Link
                    to="/courses"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 flex items-center transition-colors"
                  >
                    <AcademicCapIcon className="h-4 w-4 mr-1" />
                    강의
                  </Link>
                  <Link
                    to="/files"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 flex items-center transition-colors"
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-1" />
                    자료실
                  </Link>
                  
                  <div className="h-6 w-px bg-gray-300 mx-2"></div>
                  
                  <Link
                    to="/dashboard"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 flex items-center transition-colors"
                  >
                    <ChartBarIcon className="h-4 w-4 mr-1" />
                    대시보드
                  </Link>
                  
                  <div className="h-6 w-px bg-gray-300 mx-2"></div>
                  
                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 transition-colors"
                    >
                      <UserIcon className="h-5 w-5" />
                      <span className="hidden lg:block">{user?.name}</span>
                      <ChevronDownIcon className="h-4 w-4" />
                    </button>
                    
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <UserIcon className="h-4 w-4 mr-2" />
                          내 프로필
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <Cog6ToothIcon className="h-4 w-4 mr-2" />
                            관리자 패널
                          </Link>
                        )}
                        <hr className="my-1" />
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                          로그아웃
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Guest navigation */}
                <div className="hidden md:flex md:items-center md:space-x-4">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 transition-colors"
                  >
                    로그인
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    회원가입
                  </Link>
                </div>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white shadow-lg">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                홈
              </Link>
              <Link
                to="/about"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <InformationCircleIcon className="h-4 w-4 mr-2" />
                소개
              </Link>
              <Link
                to="/reviews"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
                후기
              </Link>
              <Link
                to="/faq"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <QuestionMarkCircleIcon className="h-4 w-4 mr-2" />
                FAQ
              </Link>
              <Link
                to="/contact"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                연락
              </Link>
              
              {isAuthenticated ? (
                <>
                  <hr className="my-2" />
                  <Link
                    to="/courses"
                    className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <AcademicCapIcon className="h-4 w-4 mr-2" />
                    강의
                  </Link>
                  <Link
                    to="/files"
                    className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-2" />
                    자료실
                  </Link>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <ChartBarIcon className="h-4 w-4 mr-2" />
                    대시보드
                  </Link>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    내 프로필
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md flex items-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Cog6ToothIcon className="h-4 w-4 mr-2" />
                      관리자 패널
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-red-600 hover:bg-gray-50 rounded-md flex items-center"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <hr className="my-2" />
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    로그인
                  </Link>
                  <Link
                    to="/register"
                    className="block px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md mx-3"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    회원가입
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}