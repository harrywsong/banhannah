// src/pages/Profile.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Camera, Save, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiEndpoint, apiRequest } from '../config/api'

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: ''
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Password visibility toggles
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState(null)
  const [profilePicturePreview, setProfilePicturePreview] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    // Initialize form with user data
    setProfileForm({
      name: user.name || '',
      email: user.email || ''
    })

    // Load profile picture from user object
    if (user.profilePicture) {
      setProfilePicturePreview(user.profilePicture)
    }
  }, [user, navigate])

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: '이미지 크기는 5MB 이하여야 합니다.' })
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: '이미지 파일만 업로드할 수 있습니다.' })
        return
      }

      setProfilePicture(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })
    setLoading(true)
  
    try {
      // Check if email was changed
      const emailChanged = profileForm.email !== user.email
  
      // In production, this would call the backend API
      const response = await apiRequest(apiEndpoint('auth/profile'), {
        method: 'PUT',
        body: JSON.stringify({ 
          name: profileForm.name,
          email: profileForm.email
        })
      })
  
      if (response.ok) {
        const data = await response.json();
        
        // Save profile picture if changed
        if (profilePicture) {
          const formData = new FormData();
          formData.append('profilePicture', profilePicture);
          
          try {
            const uploadResponse = await apiRequest(apiEndpoint('auth/profile-picture'), {
              method: 'POST',
              body: formData
            });
            
            if (uploadResponse.ok) {
              const data = await uploadResponse.json();
              // Update user with new profile picture URL
              const updatedUser = { ...user, profilePicture: data.imageUrl };
              localStorage.setItem('user', JSON.stringify(updatedUser));
            }
          } catch (error) {
            console.error('Profile picture upload failed:', error);
          }
        }
        
        if (data.emailChanged) {
          // Email was changed - user needs to verify new email
          setMessage({ 
            type: 'success', 
            text: `새 이메일로 인증 링크가 전송되었습니다!\n\n${profileForm.email}을 확인하고 인증을 완료한 후 새 이메일로 로그인해주세요.\n\n(스팸 폴더도 확인해주세요)\n\n3초 후 자동으로 로그아웃됩니다.`
          });
          
          // Auto logout after 3 seconds
          setTimeout(() => {
            logout();
            navigate('/login');
          }, 3000);
        } else {
          // Name only changed or no email change
          const updatedUser = { 
            ...user, 
            name: profileForm.name,
            email: profileForm.email
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          if (data.token) {
            localStorage.setItem('token', data.token);
          }
          setMessage({ type: 'success', text: '프로필이 성공적으로 업데이트되었습니다!' })
          
          // Refresh page to update navbar
          setTimeout(() => {
            window.location.reload()
          }, 1500)
        }
      } else {
        const errorData = await response.json()
        setMessage({ type: 'error', text: errorData.error || '프로필 업데이트에 실패했습니다.' })
      }
    } catch (error) {
      console.error('Profile update error:', error)
      setMessage({ type: 'error', text: '프로필 업데이트 중 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' })
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: '비밀번호는 최소 6자 이상이어야 합니다.' })
      return
    }

    setLoading(true)

    try {
      const response = await apiRequest(apiEndpoint('auth/password'), {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      })

      if (response.ok) {
        setMessage({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다!' })
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        
        // Auto logout after 2 seconds
        setTimeout(() => {
          logout()
          navigate('/login')
        }, 2000)
      } else {
        const errorData = await response.json()
        setMessage({ type: 'error', text: errorData.error || '비밀번호 변경에 실패했습니다.' })
      }
    } catch (error) {
      console.error('Password change error:', error)
      setMessage({ type: 'error', text: '비밀번호 변경 중 오류가 발생했습니다.' })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">내 프로필</h1>
          <p className="text-xl text-primary-100">계정 정보를 관리하세요</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-md mb-8 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => {
                  setActiveTab('profile')
                  setMessage({ type: '', text: '' })
                }}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-primary-600 text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>프로필 정보</span>
                </div>
              </button>
              <button
                onClick={() => {
                  setActiveTab('password')
                  setMessage({ type: '', text: '' })
                }}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'password'
                    ? 'border-b-2 border-primary-600 text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Lock className="h-5 w-5" />
                  <span>비밀번호 변경</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </p>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold">
                    {profilePicturePreview ? (
                      <img src={profilePicturePreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <label
                    htmlFor="profile-picture"
                    className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 transition-colors shadow-lg"
                    title="프로필 사진 변경"
                  >
                    <Camera className="h-4 w-4" />
                  </label>
                  <input
                    type="file"
                    id="profile-picture"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">프로필 사진을 클릭하여 변경하세요</p>
                </div>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  이름 *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    id="name"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="이름을 입력하세요"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  이메일 *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="email"
                    id="email"
                    required
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="이메일을 입력하세요"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  이메일 변경 시 자동으로 로그아웃되며 새 이메일로 다시 로그인해야 합니다
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>저장 중...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span>변경사항 저장</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-xl shadow-md p-8">
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>보안 안내:</strong> 비밀번호를 변경하면 자동으로 로그아웃됩니다. 새 비밀번호로 다시 로그인해주세요.
                </p>
              </div>

              {/* Current Password */}
              <div>
                <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-2">
                  현재 비밀번호 *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    id="current-password"
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호 *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    id="new-password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="새 비밀번호를 입력하세요 (최소 6자)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                  새 비밀번호 확인 *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    id="confirm-password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="새 비밀번호를 다시 입력하세요"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {passwordForm.newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">비밀번호 강도:</span>
                    <span className={`font-semibold ${
                      passwordForm.newPassword.length >= 12 ? 'text-green-600' :
                      passwordForm.newPassword.length >= 8 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {passwordForm.newPassword.length >= 12 ? '강함' :
                       passwordForm.newPassword.length >= 8 ? '보통' :
                       '약함'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        passwordForm.newPassword.length >= 12 ? 'bg-green-600 w-full' :
                        passwordForm.newPassword.length >= 8 ? 'bg-yellow-600 w-2/3' :
                        'bg-red-600 w-1/3'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>변경 중...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="h-5 w-5" />
                      <span>비밀번호 변경</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}