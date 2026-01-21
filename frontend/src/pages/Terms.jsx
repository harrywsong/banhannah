export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">이용약관</h1>
          <p className="text-xl text-primary-100">최종 업데이트: {new Date().toLocaleDateString('ko-KR')}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-md p-8 md:p-12 space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. 약관 수락</h2>
            <p className="text-gray-700 leading-relaxed">
              이 웹사이트에 접근하고 사용함으로써, 귀하는 이 이용약관에 동의하고 구속됨을 수락합니다. 
              이 약관의 일부에 동의하지 않으시면 서비스를 사용하실 수 없습니다.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. 사용 라이선스</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              개인적이고 비상업적인 용도로만 웹사이트에서 자료를 임시로 다운로드할 수 있는 권한이 부여됩니다. 
              이것은 소유권의 양도가 아닌 라이선스의 부여이며, 이 라이선스 하에서 다음을 할 수 없습니다:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>자료 수정 또는 복사</li>
              <li>상업적 목적이나 공개 표시를 위해 자료 사용</li>
              <li>웹사이트에 포함된 소프트웨어의 역공학 시도</li>
              <li>자료에서 저작권 또는 소유권 표기 제거</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. 결제 조건</h2>
            <p className="text-gray-700 leading-relaxed">
              유료 자료에 대한 접근 권한을 받기 전에 모든 결제를 전액 완료해야 합니다. 
              가격은 사전 통지 없이 변경될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. 환불 정책</h2>
            <div className="text-gray-700 leading-relaxed space-y-4">
              <p className="text-lg font-semibold text-red-600 mb-2">
                모든 구매는 최종 판매이며 환불이 제공되지 않습니다.
              </p>
              <p>
                유료 자료와 라이브 클래스 모두 구매 후 환불이 불가능합니다. 구매하기 전에 자료 설명, 
                클래스 세부 정보, 일정 등을 신중히 검토해주시기 바랍니다.
              </p>
              <p className="pt-2">
                클래스를 놓치신 경우, 가능하면 녹화본을 제공해드릴 수 있습니다. 
                자세한 내용은 hwstestcontact@gmail.com으로 문의해주세요.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. 라이브 클래스 등록</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              라이브 클래스에 등록함으로써 다음에 동의하는 것입니다:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>예정된 시간에 클래스 참석</li>
              <li>세션 중 적절한 행동 지침 준수</li>
              <li>강사 및 다른 참가자의 지적 재산권 존중</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. 계정 책임</h2>
            <p className="text-gray-700 leading-relaxed">
              귀하는 계정 자격 증명의 기밀성을 유지하고 계정에서 발생하는 모든 활동에 대해 책임을 집니다. 
              계정의 무단 사용을 발견하시면 즉시 저에게 알려주세요.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. 책임의 제한</h2>
            <p className="text-gray-700 leading-relaxed">
              반혜나 교육 또는 공급업체는 웹사이트의 자료 사용 또는 사용 불가능으로 인해 발생하는 모든 손해 
              (데이터 또는 이익의 손실에 대한 손해를 포함하되 이에 국한되지 않음)에 대해 책임을 지지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. 연락처 정보</h2>
            <p className="text-gray-700 leading-relaxed">
              이 이용약관에 대한 질문이 있으시면 {' '}
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
