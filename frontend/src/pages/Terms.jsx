import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <section className="bg-white border-b border-neutral-200">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              홈으로 돌아가기
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">이용약관</h1>
              <p className="text-neutral-600 mt-1">최종 업데이트: 2024년 1월 25일</p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-8 md:p-12">
              
              <div className="prose prose-neutral max-w-none">
                <h2>제1조 (목적)</h2>
                <p>
                  이 약관은 반혜나 교육(이하 "회사")이 제공하는 온라인 교육 서비스(이하 "서비스")의 이용과 관련하여 
                  회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                </p>

                <h2>제2조 (정의)</h2>
                <ol>
                  <li><strong>"서비스"</strong>란 회사가 제공하는 온라인 교육 플랫폼 및 관련 서비스를 의미합니다.</li>
                  <li><strong>"이용자"</strong>란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
                  <li><strong>"회원"</strong>이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.</li>
                  <li><strong>"콘텐츠"</strong>란 서비스 내에서 제공되는 강의, 자료, 텍스트, 이미지, 동영상 등 모든 정보를 말합니다.</li>
                </ol>

                <h2>제3조 (약관의 효력 및 변경)</h2>
                <ol>
                  <li>이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.</li>
                  <li>회사는 합리적인 사유가 발생할 경우에는 이 약관을 변경할 수 있으며, 약관이 변경되는 경우 변경된 약관의 적용일자 및 변경사유를 명시하여 현행약관과 함께 서비스의 초기화면에 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</li>
                </ol>

                <h2>제4조 (회원가입)</h2>
                <ol>
                  <li>이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.</li>
                  <li>회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다:
                    <ul>
                      <li>가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                      <li>등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
                      <li>기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
                    </ul>
                  </li>
                </ol>

                <h2>제5조 (서비스의 제공 및 변경)</h2>
                <ol>
                  <li>회사는 회원에게 아래와 같은 서비스를 제공합니다:
                    <ul>
                      <li>온라인 강의 서비스</li>
                      <li>학습 자료 제공 서비스</li>
                      <li>학습 진도 관리 서비스</li>
                      <li>기타 회사가 추가 개발하거나 다른 회사와의 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스</li>
                    </ul>
                  </li>
                  <li>회사는 운영상, 기술상의 필요에 따라 제공하고 있는 전부 또는 일부 서비스를 변경할 수 있습니다.</li>
                </ol>

                <h2>제6조 (서비스의 중단)</h2>
                <ol>
                  <li>회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</li>
                  <li>회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여 배상하지 않습니다.</li>
                </ol>

                <h2>제7조 (회원의 의무)</h2>
                <ol>
                  <li>이용자는 다음 행위를 하여서는 안 됩니다:
                    <ul>
                      <li>신청 또는 변경시 허위 내용의 등록</li>
                      <li>타인의 정보 도용</li>
                      <li>회사가 게시한 정보의 변경</li>
                      <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                      <li>회사 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                      <li>회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                      <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
                    </ul>
                  </li>
                </ol>

                <h2>제8조 (저작권의 귀속 및 이용제한)</h2>
                <ol>
                  <li>회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에 귀속합니다.</li>
                  <li>이용자는 서비스를 이용함으로써 얻은 정보 중 회사에게 지적재산권이 귀속된 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안됩니다.</li>
                </ol>

                <h2>제9조 (개인정보보호)</h2>
                <p>
                  회사는 이용자의 개인정보 수집시 서비스제공을 위하여 필요한 범위에서 최소한의 개인정보를 수집합니다. 
                  개인정보의 수집 및 이용에 관한 자세한 사항은 개인정보처리방침을 참조하시기 바랍니다.
                </p>

                <h2>제10조 (회사의 의무)</h2>
                <ol>
                  <li>회사는 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며 이 약관이 정하는 바에 따라 지속적이고, 안정적으로 서비스를 제공하는데 최선을 다하여야 합니다.</li>
                  <li>회사는 이용자가 안전하게 인터넷 서비스를 이용할 수 있도록 이용자의 개인정보(신용정보 포함)보호를 위한 보안 시스템을 구축하여야 합니다.</li>
                </ol>

                <h2>제11조 (면책조항)</h2>
                <ol>
                  <li>회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</li>
                  <li>회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.</li>
                  <li>회사는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며 그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.</li>
                </ol>

                <h2>제12조 (분쟁해결)</h2>
                <ol>
                  <li>회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 피해보상처리기구를 설치·운영합니다.</li>
                  <li>회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다. 다만, 제소 당시 이용자의 주소 또는 거소가 분명하지 않거나 외국 거주자의 경우에는 민사소송법상의 관할법원에 제기합니다.</li>
                </ol>

                <div className="mt-12 p-6 bg-neutral-50 rounded-lg">
                  <h3 className="font-semibold text-neutral-900 mb-2">문의사항</h3>
                  <p className="text-neutral-600 text-sm">
                    이용약관에 대한 문의사항이 있으시면 <Link to="/contact" className="text-primary-600 hover:underline">문의하기</Link>를 통해 연락주시기 바랍니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}