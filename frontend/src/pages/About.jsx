import { User } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="relative pt-12 pb-12 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-neutral-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-100/30 via-transparent to-transparent"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl mb-4 shadow-lg shadow-purple-500/25">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
              소개
            </h1>
            <p className="text-lg text-slate-600 font-light leading-relaxed max-w-2xl mx-auto">
              반혜나 교육 플랫폼에 오신 것을 환영합니다
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Welcome Card */}
            <div className="card p-8 md:p-10 mb-8 hover:shadow-xl transition-shadow duration-300">
              <p className="text-lg text-neutral-700 leading-relaxed mb-6">
                반혜나 교육 플랫폼에 오신 것을 환영합니다. 저희는 고품질의 교육 콘텐츠를 제공하여
                학습자들의 성장을 돕는 것을 목표로 합니다.
              </p>
            </div>

            {/* Mission Section */}
            <div className="card p-8 md:p-10 mb-8 border-l-4 border-primary-600 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <span className="text-primary-600">🎯</span> 우리의 미션
              </h2>
              <p className="text-neutral-700 leading-relaxed">
                모든 학습자가 자신의 잠재력을 최대한 발휘할 수 있도록 최고의 교육 경험을 제공합니다.
              </p>
            </div>

            {/* Services Section */}
            <div className="card p-8 md:p-10 hover:shadow-xl transition-shadow duration-300">
              <h2 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
                <span className="text-primary-600">✨</span> 제공 서비스
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: '📚', text: '전문가가 제작한 고품질 강의' },
                  { icon: '📄', text: '다양한 학습 자료 및 문서' },
                  { icon: '🎓', text: '개인 맞춤형 학습 경험' },
                  { icon: '💬', text: '지속적인 학습 지원' }
                ].map((service, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 rounded-lg bg-neutral-50 hover:bg-primary-50 hover:border-primary-100 border border-transparent transition-all duration-200"
                  >
                    <span className="text-2xl">{service.icon}</span>
                    <span className="text-neutral-700 pt-1">{service.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}