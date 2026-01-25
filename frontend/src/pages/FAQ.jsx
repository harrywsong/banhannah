import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FAQ() {
  const [openItems, setOpenItems] = useState({});

  const faqs = [
    {
      id: 1,
      question: '강의는 어떻게 수강할 수 있나요?',
      answer: '회원가입 후 원하는 강의를 선택하여 수강신청하시면 됩니다. 무료 강의는 바로 수강 가능하며, 유료 강의는 결제 후 수강하실 수 있습니다.'
    },
    {
      id: 2,
      question: '강의 자료는 다운로드할 수 있나요?',
      answer: '네, 강의와 관련된 자료들은 자료실에서 다운로드하실 수 있습니다. 로그인 후 자료실 메뉴를 이용해 주세요.'
    },
    {
      id: 3,
      question: '수강 기간은 얼마나 되나요?',
      answer: '강의별로 수강 기간이 다릅니다. 일반적으로 구매 후 30일간 수강 가능하며, 강의 상세 페이지에서 정확한 수강 기간을 확인하실 수 있습니다.'
    },
    {
      id: 4,
      question: '환불은 어떻게 하나요?',
      answer: '구매 후 7일 이내, 강의 진도율 10% 미만인 경우 환불 신청이 가능합니다. 연락 페이지를 통해 환불 신청해 주세요.'
    },
    {
      id: 5,
      question: '모바일에서도 수강할 수 있나요?',
      answer: '네, 모바일 브라우저를 통해 언제 어디서나 강의를 수강하실 수 있습니다. 반응형 웹으로 제작되어 모바일에서도 편리하게 이용 가능합니다.'
    },
    {
      id: 6,
      question: '강의 중 질문이 있으면 어떻게 하나요?',
      answer: '연락 페이지를 통해 질문을 남겨주시면 빠른 시일 내에 답변드리겠습니다. 또한 각 강의 페이지의 댓글 기능도 활용해 주세요.'
    }
  ];

  const toggleItem = (id) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">자주 묻는 질문</h1>
            <p className="text-xl opacity-90 font-light leading-relaxed">
              궁금하신 점을 빠르게 찾아보세요
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="card overflow-hidden hover:shadow-xl transition-all duration-300">
                  <button
                    onClick={() => toggleItem(faq.id)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-neutral-50 transition-colors"
                  >
                    <h3 className="text-lg font-semibold text-neutral-900 pr-4">{faq.question}</h3>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center transition-transform duration-300 ${openItems[faq.id] ? 'rotate-180' : ''}`}>
                      <ChevronDown className="h-5 w-5 text-primary-600" />
                    </div>
                  </button>

                  {openItems[faq.id] && (
                    <div className="px-6 pb-5 animate-fade-in">
                      <div className="pt-2 border-t border-neutral-100">
                        <p className="text-neutral-700 leading-relaxed mt-3">{faq.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Contact CTA */}
            <div className="card p-8 text-center mt-12 bg-gradient-to-br from-primary-50 to-white border-primary-100">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">더 궁금한 점이 있으신가요?</h2>
              <p className="text-neutral-600 mb-6 leading-relaxed">
                위에서 답을 찾지 못하셨다면 언제든지 연락해 주세요.
              </p>
              <a
                href="/contact"
                className="btn btn-primary btn-lg rounded-full px-8 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300"
              >
                문의하기
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}