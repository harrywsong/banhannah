import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader, Mail } from 'lucide-react'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('')
  const token = searchParams.get('token')

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error')
        setMessage('유효하지 않은 인증 링크입니다.')
        return
      }

      try {
        const API_URL = 'https://api.banhannah.dpdns.org'
        const response = await fetch(`${API_URL}/api/auth/verify-email/${token}`, {
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setStatus('success')
          setMessage(data.message)
        } else {
          setStatus('error')
          setMessage(data.error || '이메일 인증에 실패했습니다.')
        }
      } catch (error) {
        setStatus('error')
        setMessage('서버와 연결할 수 없습니다. 다시 시도해주세요.')
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-xl p-8 text-center">
          {status === 'verifying' && (
            <>
              <Loader className="h-16 w-16 mx-auto text-primary-600 animate-spin mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">이메일 인증 중...</h2>
              <p className="text-gray-600">잠시만 기다려주세요.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">인증 완료!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
              >
                로그인하기
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">인증 실패</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  to="/login"
                  className="block w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
                >
                  로그인 페이지로
                </Link>
                <Link
                  to="/register"
                  className="block w-full border-2 border-primary-600 text-primary-600 px-6 py-3 rounded-lg hover:bg-primary-50 transition-colors font-semibold"
                >
                  다시 회원가입
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}