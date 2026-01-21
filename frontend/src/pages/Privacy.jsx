export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">개인정보처리방침</h1>
          <p className="text-xl text-primary-100">최종 업데이트: {new Date().toLocaleDateString('ko-KR')}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-md p-8 md:p-12 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. 수집하는 정보</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              계정을 만들거나, 구매를 하거나, 클래스에 등록하거나, 연락을 주실 때 직접 제공해주시는 정보를 수집합니다. 여기에는 다음이 포함됩니다:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>이름 및 이메일 주소</li>
              <li>결제 정보 (제3자 제공업체를 통해 안전하게 처리됨)</li>
              <li>계정 설정 및 선호도</li>
              <li>지원팀과의 통신 기록</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. 정보 사용 방법</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              수집한 정보는 다음 용도로 사용됩니다:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>서비스 제공 및 개선</li>
              <li>거래 처리 및 관련 정보 전송</li>
              <li>계정 및 서비스에 대한 업데이트 전송</li>
              <li>문의사항에 대한 응답 및 고객 지원 제공</li>
              <li>마케팅 커뮤니케이션 전송 (언제든지 수신 거부 가능)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. 데이터 보안</h2>
            <p className="text-gray-700 leading-relaxed">
              개인정보를 보호하기 위해 적절한 기술적 및 조직적 보안 조치를 구현하고 있습니다. 
              그러나 인터넷을 통한 전송 방법은 100% 안전하지 않으며, 절대적인 보안을 보장할 수 없습니다.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. 귀하의 권리</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              귀하는 다음의 권리를 가집니다:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>개인정보 접근 및 업데이트</li>
              <li>계정 및 데이터 삭제 요청</li>
              <li>마케팅 커뮤니케이션 수신 거부</li>
              <li>데이터 사본 요청</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. 연락처</h2>
            <p className="text-gray-700 leading-relaxed">
              이 개인정보처리방침에 대한 질문이 있으시면 {' '}
              <a href="mailto:hwstestcontact@gmail.com" className="text-primary-600 hover:text-primary-700">
                hwstestcontact@gmail.com
              </a>
              으로 연락주세요.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
