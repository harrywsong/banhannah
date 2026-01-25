import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  BookOpen, 
  User, 
  LogOut, 
  Settings,
  ChevronDown,
  Menu,
  X,
  Home,
  Info,
  MessageCircle,
  HelpCircle,
  Mail,
  GraduationCap,
  FileText,
  BarChart3
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isProfileOpen]);

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
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">반혜나</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:items-center md:space-x-8">
              <Link 
                to="/" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 flex items-center transition-colors"
              >
                <Home className="h-4 w-4 mr-1" />
                홈
              </Link>
              <Link 
                to="/about" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 flex items-center transition-colors"
              >
                <Info className="h-4 w-4 mr-1" />
                소개
              </Link>
              <Link 
                to="/reviews" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 flex items-center transition-colors"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                후기
              </Link>
              <Link 
                to="/faq" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 flex items-center transition-colors"
              >
                <HelpCircle className="h-4 w-4 mr-1" />
                FAQ
              </Link>
              <Link 
                to="/contact" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 flex items-center transition-colors"
              >
                <Mail className="h-4 w-4 mr-1" />
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
                    <GraduationCap className="h-4 w-4 mr-1" />
                    강의
                  </Link>
                  <Link
                    to="/files"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 flex items-center transition-colors"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    자료실
                  </Link>
                  
                  <div className="h-6 w-px bg-gray-300 mx-2"></div>
                  
                  <Link
                    to="/dashboard"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 flex items-center transition-colors"
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    대시보드
                  </Link>
                  
                  <div className="h-6 w-px bg-gray-300 mx-2"></div>
                  
                  {/* Profile Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 transition-colors"
                    >
                      <User className="h-5 w-5" />
                      <span className="hidden lg:block">{user?.name}</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border animate-in fade-in slide-in-from-top-2 duration-200">
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          내 프로필
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            관리자 패널
                          </Link>
                        )}
                        <hr className="my-1" />
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
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
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
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
                <Home className="h-4 w-4 mr-2" />
                홈
              </Link>
              <Link
                to="/about"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Info className="h-4 w-4 mr-2" />
                소개
              </Link>
              <Link
                to="/reviews"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                후기
              </Link>
              <Link
                to="/faq"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                FAQ
              </Link>
              <Link
                to="/contact"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md flex items-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Mail className="h-4 w-4 mr-2" />
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
                    <GraduationCap className="h-4 w-4 mr-2" />
                    강의
                  </Link>
                  <Link
                    to="/files"
                    className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    자료실
                  </Link>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    대시보드
                  </Link>
                  <Link
                    to="/profile"
                    className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md flex items-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    내 프로필
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md flex items-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
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
                    <LogOut className="h-4 w-4 mr-2" />
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