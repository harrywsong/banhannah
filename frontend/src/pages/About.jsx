import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">소개</h1>
        
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-semibold mb-6">반혜나 교육 플랫폼에 오신 것을 환영합니다</h2>
          
          <div className="prose max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              저희 플랫폼은 고품질의 교육 콘텐츠를 제공하여 학습자들의 성장을 돕는 것을 목표로 합니다.
            </p>
            
            <h3 className="text-xl font-semibold mb-4">우리의 미션</h3>
            <p className="text-gray-700 mb-6">
              모든 학습자가 자신의 잠재력을 최대한 발휘할 수 있도록 최고의 교육 경험을 제공합니다.
            </p>
            
            <h3 className="text-xl font-semibold mb-4">제공 서비스</h3>
            <ul className="list-disc list-inside text-gray-700 mb-6">
              <li>전문가가 제작한 고품질 강의</li>
              <li>다양한 학습 자료 및 문서</li>
              <li>개인 맞춤형 학습 경험</li>
              <li>지속적인 학습 지원</li>
            </ul>
            
            <h3 className="text-xl font-semibold mb-4">연락처</h3>
            <p className="text-gray-700">
              궁금한 점이 있으시면 언제든지 연락 페이지를 통해 문의해 주세요.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}