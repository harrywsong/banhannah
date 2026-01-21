import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

export default function FAQs() {
  const [openIndex, setOpenIndex] = useState(0)

  const faqs = [
    {
      question: '자료는 어떻게 다운로드하나요?',
      answer: '로그인 후 자료 페이지를 둘러보시고 원하는 자료를 찾으세요. 무료 자료는 즉시 다운로드할 수 있고, 유료 자료는 로그인 및 결제 후 다운로드할 수 있습니다.'
    },
    {
      question: '어떤 결제 방법을 받나요?',
      answer: '주요 신용카드, 체크카드, PayPal을 받습니다. 모든 결제는 안전한 결제 게이트웨이를 통해 처리됩니다.'
    },
    {
      question: '라이브 클래스는 어떻게 등록하나요?',
      answer: '라이브 클래스 페이지에서 예정된 세션을 확인하세요. 관심 있는 클래스에서 "지금 등록하기" 버튼을 클릭하세요. 등록하려면 로그인이 필요합니다. 등록 후 대시보드에서 미팅 세부 정보와 링크를 확인할 수 있습니다.'
    },
    {
      question: '환불 정책은 무엇인가요?',
      answer: '모든 구매는 최종 판매입니다. 유료 자료나 라이브 클래스에 대한 환불은 제공되지 않습니다. 구매하기 전에 자료 설명과 세부 정보를 신중히 검토해주시기 바랍니다.'
    },
    {
      question: '자료는 모든 연령에 적합한가요?',
      answer: '자료는 다양한 연령대와 기술 수준을 위해 설계되었습니다. 각 자료는 목표 청중과 난이도가 명확하게 표시되어 적합한 자료를 찾을 수 있도록 도와줍니다.'
    },
    {
      question: '구매한 자료는 어떻게 접근하나요?',
      answer: '구매한 모든 자료는 대시보드에서 확인할 수 있습니다. 로그인 후 "내 자료" 섹션으로 이동하여 언제든지 다운로드할 수 있습니다.'
    },
    {
      question: '라이브 클래스를 놓치면 어떻게 되나요?',
      answer: '라이브 클래스를 놓치신 경우, 가능하면 녹화본을 제공해드릴 수 있습니다. 또는 다음 가능한 세션에 등록하는 것을 도와드릴 수 있습니다. hwstestcontact@gmail.com으로 연락주세요.'
    },
    {
      question: '대량 구매 할인을 제공하나요?',
      answer: '네, 여러 자료를 구매하는 교육자나 기관을 위한 할인을 제공합니다. 맞춤 가격 및 대량 구매 옵션에 대해서는 hwstestcontact@gmail.com으로 연락주세요.'
    },
    {
      question: '자료를 다시 다운로드할 수 있나요?',
      answer: '네, 구매하신 자료는 계정이 활성화되어 있는 동안 언제든지 다시 다운로드할 수 있습니다. 대시보드의 "내 자료" 섹션에서 확인하실 수 있습니다.'
    },
    {
      question: '라이브 클래스 취소 정책은 무엇인가요?',
      answer: '라이브 클래스 등록은 최종 판매이며 환불이 불가능합니다. 클래스를 놓치신 경우, 가능하면 녹화본을 제공해드릴 수 있습니다. hwstestcontact@gmail.com으로 연락주세요.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">자주 묻는 질문</h1>
          <p className="text-xl text-primary-100">일반적인 질문에 대한 답변을 찾아보세요</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b last:border-b-0">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <span className="text-left font-semibold text-gray-900">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-primary-600 flex-shrink-0 ml-4" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                )}
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
