import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BookOpen, FileText, Award, Users, ArrowRight, CheckCircle, Star } from 'lucide-react';

export default function Home() {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: BookOpen,
      title: '전문 강의',
      description: '업계 전문가가 제작한 고품질 강의 콘텐츠'
    },
    {
      icon: FileText,
      title: '풍부한 자료',
      description: 'PDF, 동영상 등 다양한 학습 자료 제공'
    },
    {
      icon: Award,
      title: '수료 인증',
      description: '강의 완료 시 공식 수료증 발급'
    },
    {
      icon: Users,
      title: '학습 커뮤니티',
      description: '함께 학습하는 동료들과의 소통'
    }
  ];

  const stats = [
    { number: '1,000+', label: '수강생' },
    { number: '50+', label: '강의' },
    { number: '95%', label: '만족도' },
    { number: '24/7', label: '지원' }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-neutral-50 -z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-[0.03] -z-10"></div>

        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-primary-50 text-primary-700 mb-6 border border-primary-100">
              <span className="flex h-2 w-2 rounded-full bg-primary-600 mr-2"></span>
              새로운 학습 경험
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6 text-balance tracking-tight leading-tight">
              온라인 학습의
              <span className="text-primary-600"> 새로운 기준</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto leading-relaxed font-light">
              전문가가 만든 고품질 강의와 학습 자료로 당신의 꿈을 실현하세요.
              체계적인 커리큘럼이 당신을 기다립니다.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/courses"
                    className="btn btn-primary btn-lg rounded-full px-8 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300"
                  >
                    강의 둘러보기
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  <Link
                    to="/dashboard"
                    className="btn btn-outline btn-lg rounded-full px-8 border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50"
                  >
                    대시보드
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn btn-primary btn-lg rounded-full px-8 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300"
                  >
                    무료 시작하기
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  <Link
                    to="/courses"
                    className="btn btn-outline btn-lg rounded-full px-8 border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50"
                  >
                    강의 둘러보기
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-neutral-200 pt-12">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group hover:transform hover:-translate-y-1 transition-transform duration-300">
                  <div className="text-3xl font-bold text-neutral-900 mb-1 group-hover:text-primary-600 transition-colors">{stat.number}</div>
                  <div className="text-sm text-neutral-500 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white border-t border-neutral-100">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              왜 우리를 선택해야 할까요?
            </h2>
            <p className="text-lg text-neutral-600 font-light">
              체계적인 학습 시스템과 전문적인 콘텐츠로 효과적인 학습을 지원합니다
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card p-8 text-center hover:shadow-xl hover:border-primary-100 transition-all duration-300 group">
                <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary-600 transition-colors duration-300">
                  <feature.icon className="w-7 h-7 text-primary-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-3">{feature.title}</h3>
                <p className="text-neutral-500 leading-relaxed text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-24 bg-neutral-50 border-t border-neutral-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                수강생들의 이야기
              </h2>
              <p className="text-lg text-neutral-600 font-light">
                실제 수강생들이 경험한 학습의 변화를 확인해보세요
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: '김학생',
                  role: '웹 개발자',
                  content: '체계적인 커리큘럼과 실무 중심의 내용이 정말 도움이 되었습니다.',
                  rating: 5
                },
                {
                  name: '이수강',
                  role: '디자이너',
                  content: '강사님의 설명이 명확하고 질문에 대한 답변도 빨라서 만족합니다.',
                  rating: 5
                },
                {
                  name: '박학습',
                  role: '학생',
                  content: '초보자도 쉽게 따라할 수 있도록 단계별로 잘 구성되어 있어요.',
                  rating: 5
                }
              ].map((testimonial, index) => (
                <div key={index} className="card p-8 bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-neutral-700 mb-6 leading-relaxed italic">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500 font-bold">
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900 text-sm">{testimonial.name}</div>
                      <div className="text-xs text-neutral-500">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-neutral-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 to-neutral-900 opacity-90"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">
              지금 바로 시작하세요
            </h2>
            <p className="text-xl mb-10 text-neutral-300 font-light">
              무료 강의로 시작해서 전문가 수준까지 성장하세요. <br className="hidden sm:block" />
              당신의 성장을 응원합니다.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 mb-10 text-neutral-300 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary-400" />
                <span>무료 회원가입</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary-400" />
                <span>즉시 학습 시작</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary-400" />
                <span>수료증 발급</span>
              </div>
            </div>

            {!isAuthenticated && (
              <Link
                to="/register"
                className="inline-flex items-center bg-white text-neutral-900 px-8 py-4 rounded-full font-semibold hover:bg-neutral-100 transition-colors text-lg shadow-lg"
              >
                회원가입하고 시작하기
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
