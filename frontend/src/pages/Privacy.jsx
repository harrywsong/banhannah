import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

export default function Privacy() {
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
              <Shield className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">개인정보처리방침</h1>
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
                <p className="text-lg text-neutral-700 mb-8">
                  반혜나 교육(이하 "회사")은 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고 
                  개인정보와 관련한 이용자의 고충을 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.
                </p>

                <h2>1. 개인정보의 처리목적</h2>
                <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
                
                <ul>
                  <li><strong>회원 가입 및 관리:</strong> 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지 목적</li>
                  <li><strong>서비스 제공:</strong> 콘텐츠 제공, 맞춤서비스 제공, 본인인증, 연령인증, 요금결제·정산</li>
                  <li><strong>고충처리:</strong> 민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보</li>
                  <li><strong>마케팅 및 광고에의 활용:</strong> 신규 서비스(제품) 개발 및 맞춤 서비스 제공, 이벤트 및 광고성 정보 제공 및 참여기회 제공, 인구통계학적 특성에 따른 서비스 제공 및 광고 게재, 서비스의 유효성 확인, 접속빈도 파악 또는 회원의 서비스 이용에 대한 통계</li>
                </ul>

                <h2>2. 개인정보의 처리 및 보유기간</h2>
                <ol>
                  <li>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</li>
                  <li>각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:
                    <ul>
                      <li><strong>회원 가입 및 관리:</strong> 회원 탈퇴 시까지 (다만, 다음의 사유에 해당하는 경우에는 해당 기간 종료 시까지)
                        <ul>
                          <li>관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사·조사 종료 시까지</li>
                          <li>서비스 이용에 따른 채권·채무관계 잔존 시에는 해당 채권·채무관계 정산 시까지</li>
                        </ul>
                      </li>
                      <li><strong>재화 또는 서비스 제공:</strong> 재화·서비스 공급완료 및 요금결제·정산 완료 시까지 (다만, 다음의 사유에 해당하는 경우에는 해당 기간 종료 시까지)
                        <ul>
                          <li>「전자상거래 등에서의 소비자 보호에 관한 법률」에 따른 표시·광고, 계약내용 및 이행 등에 관한 기록: 5년</li>
                          <li>「전자상거래 등에서의 소비자 보호에 관한 법률」에 따른 소비자의 불만 또는 분쟁처리에 관한 기록: 3년</li>
                          <li>「신용정보의 이용 및 보호에 관한 법률」에 따른 신용정보의 수집·처리 및 이용 등에 관한 기록: 3년</li>
                        </ul>
                      </li>
                    </ul>
                  </li>
                </ol>

                <h2>3. 처리하는 개인정보의 항목</h2>
                <p>회사는 다음의 개인정보 항목을 처리하고 있습니다:</p>
                
                <h3>필수항목</h3>
                <ul>
                  <li>이메일 주소</li>
                  <li>비밀번호</li>
                  <li>이름</li>
                  <li>서비스 이용 기록</li>
                  <li>접속 로그</li>
                  <li>쿠키</li>
                  <li>접속 IP 정보</li>
                </ul>

                <h3>선택항목</h3>
                <ul>
                  <li>프로필 사진</li>
                  <li>전화번호</li>
                </ul>

                <h2>4. 개인정보의 제3자 제공</h2>
                <p>회사는 정보주체의 개인정보를 개인정보의 처리목적에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.</p>

                <h2>5. 개인정보처리의 위탁</h2>
                <p>회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:</p>
                
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">위탁업체 및 위탁업무 내용</h4>
                  <ul>
                    <li><strong>이메일 발송 서비스:</strong> Gmail SMTP 서비스 (Google LLC)</li>
                    <li><strong>클라우드 서비스:</strong> 서버 호스팅 및 데이터 저장</li>
                  </ul>
                </div>

                <h2>6. 정보주체의 권리·의무 및 행사방법</h2>
                <p>이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다:</p>
                
                <ol>
                  <li>개인정보 처리현황 통지요구</li>
                  <li>개인정보 열람요구</li>
                  <li>개인정보 정정·삭제요구</li>
                  <li>개인정보 처리정지요구</li>
                </ol>

                <p>위의 권리 행사는 회사에 대해 개인정보보호법 시행령 제41조제1항에 따라 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체없이 조치하겠습니다.</p>

                <h2>7. 개인정보의 파기</h2>
                <p>회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
                
                <ul>
                  <li><strong>파기절차:</strong> 이용자가 입력한 정보는 목적 달성 후 별도의 DB에 옮겨져(종이의 경우 별도의 서류) 내부 방침 및 기타 관련 법령에 따라 일정기간 저장된 후 혹은 즉시 파기됩니다.</li>
                  <li><strong>파기방법:</strong> 
                    <ul>
                      <li>전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.</li>
                      <li>종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
                    </ul>
                  </li>
                </ul>

                <h2>8. 개인정보의 안전성 확보조치</h2>
                <p>회사는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다:</p>
                
                <ul>
                  <li><strong>개인정보 취급 직원의 최소화 및 교육:</strong> 개인정보를 취급하는 직원을 지정하고 담당자에 한정시켜 최소화하여 개인정보를 관리하는 대책을 시행하고 있습니다.</li>
                  <li><strong>정기적인 자체 감사:</strong> 개인정보 취급 관련 안정성 확보를 위해 정기적(분기 1회)으로 자체 감사를 실시하고 있습니다.</li>
                  <li><strong>내부관리계획의 수립 및 시행:</strong> 개인정보의 안전한 처리를 위하여 내부관리계획을 수립하고 시행하고 있습니다.</li>
                  <li><strong>개인정보의 암호화:</strong> 이용자의 개인정보는 비밀번호는 암호화되어 저장 및 관리되고 있어, 본인만이 알 수 있으며 중요한 데이터는 파일 및 전송 데이터를 암호화하거나 파일 잠금 기능을 사용하는 등의 별도 보안기능을 사용하고 있습니다.</li>
                  <li><strong>해킹 등에 대비한 기술적 대책:</strong> 회사는 해킹이나 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위하여 보안프로그램을 설치하고 주기적인 갱신·점검을 하며 외부로부터 접근이 통제된 구역에 시스템을 설치하고 기술적/물리적으로 감시 및 차단하고 있습니다.</li>
                  <li><strong>개인정보에 대한 접근 제한:</strong> 개인정보를 처리하는 데이터베이스시스템에 대한 접근권한의 부여,변경,말소를 통하여 개인정보에 대한 접근통제를 위하여 필요한 조치를 하고 있으며 침입차단시스템을 이용하여 외부로부터의 무단 접근을 통제하고 있습니다.</li>
                </ul>

                <h2>9. 개인정보보호책임자</h2>
                <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보보호책임자를 지정하고 있습니다:</p>
                
                <div className="bg-neutral-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">개인정보보호책임자</h4>
                  <ul>
                    <li><strong>성명:</strong> 반혜나</li>
                    <li><strong>직책:</strong> 대표</li>
                    <li><strong>연락처:</strong> info.banhannah@gmail.com</li>
                  </ul>
                </div>

                <h2>10. 개인정보 처리방침 변경</h2>
                <p>이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>

                <div className="mt-12 p-6 bg-neutral-50 rounded-lg">
                  <h3 className="font-semibold text-neutral-900 mb-2">문의사항</h3>
                  <p className="text-neutral-600 text-sm">
                    개인정보처리방침에 대한 문의사항이 있으시면 <Link to="/contact" className="text-primary-600 hover:underline">문의하기</Link>를 통해 연락주시기 바랍니다.
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