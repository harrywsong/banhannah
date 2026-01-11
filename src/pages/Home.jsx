import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { BookOpen, Users, Award, PlayCircle, ArrowRight, CheckCircle, Star, MessageCircle } from 'lucide-react'
import { useReviews } from '../contexts/ReviewsContext'

export default function Home() {
  const { reviews } = useReviews()
  const [shuffledReviews, setShuffledReviews] = useState([])

  // Shuffle all reviews randomly when reviews change
  useEffect(() => {
    if (reviews.length === 0) {
      setShuffledReviews([])
      return
    }
    
    // Create a shuffled copy of all reviews using Fisher-Yates shuffle
    const shuffled = [...reviews]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    // Show unique reviews only (removed duplication to prevent showing same review twice)
    setShuffledReviews(shuffled)
  }, [reviews]) // Reshuffle when reviews change (not just length)

  const features = [
    {
      icon: <BookOpen className="h-12 w-12" />,
      title: '교육 자료',
      description: '워크시트, 가이드, 학습 자료를 포함한 무료 및 유료 교육 자료를 다운로드하세요.'
    },
    {
      icon: <Users className="h-12 w-12" />,
      title: '라이브 클래스',
      description: 'Zoom, Teams 등을 통해 전문 강사와 함께하는 인터랙티브 온라인 세션에 참여하세요.'
    },
    {
      icon: <Award className="h-12 w-12" />,
      title: '고품질 콘텐츠',
      description: '학습 경험을 향상시키기 위해 신중하게 선별된 자료입니다.'
    },
    {
      icon: <PlayCircle className="h-12 w-12" />,
      title: '유연한 접근',
      description: '어디서나 언제든지 모든 기기에서 자료와 클래스에 접근할 수 있습니다.'
    }
  ]

  const benefits = [
    '무료 및 유료 자료 옵션',
    '오프라인 사용을 위한 자료 다운로드',
    '라이브 인터랙티브 세션 등록',
    '학습 진행 상황 추적',
    '전문 강사 접근',
    '모바일 친화적 플랫폼'
  ]

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                학습을 모험으로 전환하세요
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-primary-100">
                다운로드 가능한 자료에 접근하고 전문 강사와 함께하는 라이브 클래스에 참여하세요. 오늘 학습 여정을 시작하세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/resources"
                  className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-colors inline-flex items-center justify-center space-x-2"
                >
                  <span>자료 둘러보기</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/register"
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors inline-flex items-center justify-center"
                >
                  시작하기
                </Link>
              </div>
            </div>
            <div className="relative">
              {/* PLACEHOLDER IMAGE - Replace with hero image */}
              <div className="bg-primary-400 rounded-2xl p-8 aspect-square flex items-center justify-center border-4 border-primary-300">
                <div className="text-center">
                  <PlayCircle className="h-24 w-24 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-semibold">[히어로 이미지 플레이스홀더]</p>
                  <p className="text-sm mt-2">매력적인 히어로 이미지로 교체하세요</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              우리 플랫폼을 선택하는 이유
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              최첨단 기능을 갖춘 포괄적인 학습 경험을 제공합니다
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="text-primary-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              {/* PLACEHOLDER IMAGE - Replace with benefits illustration */}
              <div className="bg-white rounded-2xl p-12 aspect-square flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <Users className="h-32 w-32 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-semibold text-gray-500">[혜택 이미지 플레이스홀더]</p>
                  <p className="text-sm text-gray-400 mt-2">혜택 일러스트로 교체하세요</p>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                성공에 필요한 모든 것
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                이 플랫폼은 학생과 학부모를 모두 고려하여 설계되었으며, 효과적인 학습을 위한 포괄적인 도구를 제공합니다.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section - Horizontal Scrolling */}
      {shuffledReviews.length > 0 && (
        <section className="py-20 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                이용 후기
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                실제 이용자들의 솔직한 후기를 확인하세요
              </p>
            </div>

            <div className="relative overflow-hidden">
              {/* Scrolling Container */}
              <div 
                className="flex space-x-6 overflow-x-auto"
              >
                {shuffledReviews.map((review, index) => (
                  <div
                    key={`${review.id}-${index}`}
                    className="bg-gray-50 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex-shrink-0"
                    style={{ width: '350px' }}
                  >
                    <div className="flex items-center mb-4">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">{review.rating}.0</span>
                    </div>
                    <p className="text-gray-700 mb-4 line-clamp-3">{review.comment}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{review.userName}</p>
                        <p className="text-sm text-gray-500">
                          {review.itemType === 'resource' || review.itemType === 'file' ? '자료' : review.itemType === 'course' ? '온라인 코스' : '클래스'} 리뷰
                        </p>
                      </div>
                      <MessageCircle className="h-5 w-5 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-primary-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            학습을 시작할 준비가 되셨나요?
          </h2>
          <p className="text-xl mb-8 text-primary-100">
            이미 우리와 함께 학습하고 있는 수천 명의 학생들과 함께하세요. 오늘 교육 여정을 시작하세요!
          </p>
          <Link
            to="/register"
            className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-colors inline-flex items-center space-x-2"
          >
            <span>무료 계정 만들기</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
