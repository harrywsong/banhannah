import { BookOpen, Users, Award, Target } from 'lucide-react'

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">소개</h1>
          <p className="text-xl text-primary-100">고품질 교육 자료를 통해 학습자를 지원합니다</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-md p-8 md:p-12 space-y-8">
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">저의 목표</h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              모든 연령의 학습자에게 영감을 주고 힘을 실어주는 고품질 교육 자료를 제공하기 위해 노력하고 있습니다. 
              교육은 접근 가능하고, 매력적이며, 개인의 학습 요구에 맞춰져야 한다고 믿습니다.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">제공하는 서비스</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="flex items-start space-x-4">
                <BookOpen className="h-8 w-8 text-primary-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">교육 자료</h3>
                  <p className="text-gray-600">
                    학생과 교육자를 위한 워크시트, 가이드, 인터랙티브 콘텐츠를 포함한 다운로드 가능한 자료입니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Users className="h-8 w-8 text-primary-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">라이브 클래스</h3>
                  <p className="text-gray-600">
                    Zoom, Teams 등 다양한 플랫폼을 통해 경험 많은 강사와 함께하는 인터랙티브 온라인 세션입니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Award className="h-8 w-8 text-primary-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">고품질 콘텐츠</h3>
                  <p className="text-gray-600">
                    학습 결과를 향상시키기 위해 신중하게 선별되고 전문적으로 개발된 자료입니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Target className="h-8 w-8 text-primary-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">개인화된 학습</h3>
                  <p className="text-gray-600">
                    다양한 기술 수준과 학습 스타일에 맞춘 자료와 클래스입니다.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">저에 대해</h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              안녕하세요, 반혜나입니다. 저는 경험 많은 교육자이자 콘텐츠 개발자로서 의미 있는 학습 경험을 만들기 위해 열정적으로 노력하고 있습니다. 
              모든 자료와 클래스가 품질과 효과성에 대한 높은 기준을 충족하도록 최선을 다하고 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">연락처</h2>
            <p className="text-gray-700 leading-relaxed text-lg">
              질문이나 의견이 있으시면 언제든지 연락 주세요. {' '}
              <a href="/contact" className="text-primary-600 hover:text-primary-700 font-semibold">
                연락처 페이지
              </a>
              에서 연락하실 수 있습니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
