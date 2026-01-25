import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailNotVerified(false);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        setEmailNotVerified(true);
        setError(err.response.data.error);
      } else {
        setError(err.response?.data?.error || '로그인에 실패했습니다');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (response.ok) {
        alert('인증 이메일이 재발송되었습니다');
      }
    } catch (err) {
      alert('재발송에 실패했습니다');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4">
      <div className="absolute top-8 left-8">
        <Link to="/" className="flex items-center text-neutral-600 hover:text-neutral-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          홈으로
        </Link>
      </div>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-neutral-200/50 p-8 md:p-10 border border-neutral-100">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-neutral-900 tracking-tight">로그인</h2>
          <p className="text-neutral-500 mt-2 text-sm">교육 플랫폼 이용을 위해 로그인해주세요</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 rounded-lg p-4 flex items-start animate-fade-in">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-red-800 text-sm font-medium">{error}</p>
              {emailNotVerified && (
                <button
                  onClick={handleResendVerification}
                  className="text-primary-600 underline mt-2 text-xs hover:text-primary-700"
                >
                  인증 이메일 재발송
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              이메일
            </label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-neutral-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pl-10"
                placeholder="name@example.com"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-neutral-700">
                비밀번호
              </label>
              <a href="#" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                비밀번호 찾기
              </a>
            </div>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-neutral-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary btn-lg rounded-lg font-semibold text-base shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300 transform active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                로그인 중...
              </span>
            ) : '로그인'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-neutral-500">
          계정이 없으신가요?{' '}
          <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700 hover:underline">
            회원가입하기
          </Link>
        </p>
      </div>
    </div>
  );
}
