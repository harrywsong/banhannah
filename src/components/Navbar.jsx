// src/components/Navbar.jsx
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, BookOpen, User, LogOut, FileText, Video, ChevronDown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const navigate = useNavigate()
  const { user, logout, isAdmin } = useAuth()
  const userMenuRef = useRef(null)

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsOpen(false)
    setShowUserMenu(false)
  }

  // Get profile picture from localStorage
  const profilePicture = user ? localStorage.getItem(`profilePicture_${user.id}`) : null

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-2.5 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
              반혜나
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link 
              to="/" 
              className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
            >
              홈
            </Link>
            <Link 
              to="/about" 
              className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
            >
              소개
            </Link>
            <Link 
              to="/resources" 
              className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
            >
              자료
            </Link>
            <Link 
              to="/live-classes" 
              className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
            >
              라이브 클래스
            </Link>
            <Link 
              to="/faqs" 
              className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
            >
              FAQ
            </Link>
            <Link 
              to="/contact" 
              className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
            >
              문의하기
            </Link>
            
            {/* Separator */}
            <div className="h-6 w-px bg-gray-300 mx-2"></div>
            
            {user && (
              <Link 
                to="/dashboard" 
                className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200 font-medium"
              >
                대시보드
              </Link>
            )}
            
            {user ? (
              <div className="flex items-center space-x-3 ml-2 pl-3 border-l border-gray-200">
                {/* User Menu Dropdown */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                      {profilePicture ? (
                        <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        user.name.charAt(0)
                      )}
                    </div>
                    <span className="text-gray-700 font-medium">{user.name}님</span>
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        to="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors flex items-center space-x-2"
                      >
                        <User className="h-4 w-4" />
                        <span>내 프로필</span>
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors flex items-center space-x-2"
                      >
                        <FileText className="h-4 w-4" />
                        <span>대시보드</span>
                      </Link>
                      <div className="border-t border-gray-200 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>로그아웃</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="ml-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-2.5 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl font-semibold"
              >
                <User className="h-4 w-4" />
                <span>로그인</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-gray-100 mt-2 pt-4">
            <div className="flex flex-col space-y-1">
              <Link 
                to="/" 
                className="px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium" 
                onClick={() => setIsOpen(false)}
              >
                홈
              </Link>
              <Link 
                to="/about" 
                className="px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium" 
                onClick={() => setIsOpen(false)}
              >
                소개
              </Link>
              <Link 
                to="/resources" 
                className="px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium" 
                onClick={() => setIsOpen(false)}
              >
                자료
              </Link>
              <Link 
                to="/live-classes" 
                className="px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium" 
                onClick={() => setIsOpen(false)}
              >
                라이브 클래스
              </Link>
              <Link 
                to="/faqs" 
                className="px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium" 
                onClick={() => setIsOpen(false)}
              >
                FAQ
              </Link>
              <Link 
                to="/contact" 
                className="px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium" 
                onClick={() => setIsOpen(false)}
              >
                문의하기
              </Link>
              
              <div className="border-t border-gray-200 my-2"></div>
              
              {user && (
                <>
                  <Link 
                    to="/dashboard" 
                    className="px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium" 
                    onClick={() => setIsOpen(false)}
                  >
                    대시보드
                  </Link>
                  <Link 
                    to="/profile" 
                    className="px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors font-medium" 
                    onClick={() => setIsOpen(false)}
                  >
                    내 프로필
                  </Link>
                </>
              )}
              
              {user ? (
                <>
                  <div className="px-4 py-3 flex items-center space-x-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold overflow-hidden">
                      {profilePicture ? (
                        <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        user.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{user.name}님, 안녕하세요</div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="mx-4 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors text-center font-medium"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="mx-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all text-center font-semibold shadow-lg"
                  onClick={() => setIsOpen(false)}
                >
                  로그인
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}