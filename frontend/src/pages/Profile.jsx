import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/client';
import { User, Mail, Lock, AlertCircle, CheckCircle, Shield, Settings } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Profile form
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });

  // Password form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await apiClient.put('/auth/profile', profileData);
      updateUser(response.data.user);
      setMessage({ type: 'success', text: response.data.message });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || '업데이트에 실패했습니다' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다' });
      setLoading(false);
      return;
    }

    try {
      await apiClient.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setMessage({ type: 'success', text: '비밀번호가 변경되었습니다' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || '비밀번호 변경에 실패했습니다' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="relative pt-12 pb-12 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-neutral-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100/30 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/25">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
              프로필 설정
            </h1>
            <p className="text-lg text-slate-600 font-light leading-relaxed max-w-2xl mx-auto">
              계정 정보를 관리하고 보안을 강화하세요
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Message Display */}
            {message.text && (
              <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                )}
                <p className="font-medium">{message.text}</p>
              </div>
            )}

            {/* Tabs */}
            <div className="card mb-6 overflow-hidden">
              <div className="flex border-b border-neutral-200">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors relative ${activeTab === 'profile'
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-neutral-600 hover:bg-neutral-50'
                    }`}
                >
                  <User className="inline h-5 w-5 mr-2" />
                  프로필 정보
                  {activeTab === 'profile' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`flex-1 px-6 py-4 font-semibold transition-colors relative ${activeTab === 'password'
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-neutral-600 hover:bg-neutral-50'
                    }`}
                >
                  <Shield className="inline h-5 w-5 mr-2" />
                  비밀번호 변경
                  {activeTab === 'password' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                  )}
                </button>
              </div>
            </div>

            {/* Profile Form */}
            {activeTab === 'profile' && (
              <div className="card p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">프로필 정보</h2>
                  <p className="text-neutral-600">기본 계정 정보를 수정할 수 있습니다</p>
                </div>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      <User className="inline h-4 w-4 mr-1" />
                      이름
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      <Mail className="inline h-4 w-4 mr-1" />
                      이메일
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary btn-lg rounded-full px-8 w-full shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 disabled:opacity-50"
                    >
                      {loading ? '저장 중...' : '변경사항 저장'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Password Form */}
            {activeTab === 'password' && (
              <div className="card p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">비밀번호 변경</h2>
                  <p className="text-neutral-600">보안을 위해 정기적으로 비밀번호를 변경하세요</p>
                </div>
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      <Lock className="inline h-4 w-4 mr-1" />
                      현재 비밀번호
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      <Lock className="inline h-4 w-4 mr-1" />
                      새 비밀번호
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">
                      <Lock className="inline h-4 w-4 mr-1" />
                      새 비밀번호 확인
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required
                      minLength={6}
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary btn-lg rounded-full px-8 w-full shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 disabled:opacity-50"
                    >
                      {loading ? '변경 중...' : '비밀번호 변경'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}