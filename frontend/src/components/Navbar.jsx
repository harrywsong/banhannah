import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  BookOpen,
  FileText,
  MessageCircle,
  User,
  LogOut,
  Menu,
  X,
  Home,
  Star,
  HelpCircle,
  Settings,
  ChevronDown
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function Navbar() {
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
    setIsProfileOpen(false);
  };

  const isActive = (path) => location.pathname === path;

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  const navLinks = [
    { path: '/', label: '홈', icon: Home },
    { path: '/courses', label: '강의', icon: BookOpen },
    { path: '/files', label: '자료실', icon: FileText },
    { path: '/reviews', label: '후기', icon: Star },
    { path: '/faq', label: 'FAQ', icon: HelpCircle },
    { path: '/contact', label: '문의', icon: MessageCircle },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-neutral-200 glass">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center space-x-2 font-bold text-xl text-neutral-900 group"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 duration-200 shadow-md shadow-primary-500/30">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="tracking-tight">반혜나 교육</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(path)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                    }`}
                >
                  <Icon className="w-4 h-4 opacity-70" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center space-x-3">
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/dashboard"
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/dashboard')
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                      }`}
                  >
                    <Home className="w-4 h-4" />
                    <span>대시보드</span>
                  </Link>

                  {/* Profile Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center space-x-2 px-2 py-1.5 rounded-lg text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 transition-all duration-200 border border-transparent hover:border-neutral-200"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 border border-primary-200">
                        {user?.name?.[0] || <User className="w-4 h-4" />}
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl shadow-neutral-200/50 border border-neutral-100 py-1 z-50 animate-fade-in origin-top-right">
                        <div className="px-4 py-3 border-b border-neutral-100">
                          <p className="text-sm font-medium text-neutral-900 truncate">{user?.name}</p>
                          <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                        </div>

                        <div className="py-1">
                          <Link
                            to="/profile"
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <User className="w-4 h-4 text-neutral-500" />
                            <span>프로필 설정</span>
                          </Link>
                          {isAdmin && (
                            <Link
                              to="/admin"
                              className="flex items-center space-x-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <Settings className="w-4 h-4 text-neutral-500" />
                              <span>관리자 패널</span>
                            </Link>
                          )}
                        </div>

                        <div className="border-t border-neutral-100 my-1"></div>

                        <div className="py-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>로그아웃</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="btn btn-ghost btn-sm text-neutral-600"
                  >
                    로그인
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary btn-sm rounded-full px-4"
                  >
                    회원가입
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white md:hidden pt-20 pb-6 px-4 animate-fade-in overflow-y-auto">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl text-sm font-medium transition-all duration-200 border ${isActive(path)
                      ? 'bg-primary-50 text-primary-700 border-primary-100 shadow-sm'
                      : 'bg-neutral-50 text-neutral-600 border-transparent hover:bg-neutral-100'
                    }`}
                >
                  <Icon className="w-6 h-6 mb-2" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>

            <div className="border-t border-neutral-100 pt-4 mt-4">
              {isAuthenticated ? (
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 px-2 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                      {user?.name?.[0] || <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900">{user?.name}</div>
                      <div className="text-xs text-neutral-500">{user?.email}</div>
                    </div>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-neutral-50 text-neutral-700 hover:bg-neutral-100 transition-colors"
                  >
                    <Home className="w-5 h-5 text-neutral-500" />
                    <span>대시보드 바로가기</span>
                  </Link>

                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-neutral-50 text-neutral-700 hover:bg-neutral-100 transition-colors"
                  >
                    <User className="w-5 h-5 text-neutral-500" />
                    <span>프로필 설정</span>
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-neutral-50 text-neutral-700 hover:bg-neutral-100 transition-colors"
                    >
                      <Settings className="w-5 h-5 text-neutral-500" />
                      <span>관리자 패널</span>
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-colors mt-2"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>로그아웃</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-3 rounded-xl bg-neutral-100 text-neutral-700 font-medium hover:bg-neutral-200 transition-colors"
                  >
                    로그인
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-center px-4 py-3 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30"
                  >
                    회원가입
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
