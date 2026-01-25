import { useState } from 'react';
import { Star, MessageSquare, User } from 'lucide-react';

export default function Reviews() {
  const [reviews] = useState([
    {
      id: 1,
      name: '김학생',
      rating: 5,
      comment: '정말 유익한 강의였습니다. 설명이 명확하고 이해하기 쉬웠어요.',
      course: '기초 프로그래밍',
      date: '2024-01-15'
    },
    {
      id: 2,
      name: '이수강',
      rating: 5,
      comment: '실무에 바로 적용할 수 있는 내용들이 많아서 도움이 되었습니다.',
      course: '웹 개발 심화',
      date: '2024-01-10'
    },
    {
      id: 3,
      name: '박학습',
      rating: 4,
      comment: '강의 자료가 잘 정리되어 있고, 질문에 대한 답변도 빨라서 좋았습니다.',
      course: '데이터베이스 기초',
      date: '2024-01-05'
    }
  ]);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">수강 후기</h1>
            <p className="text-xl opacity-90 font-light leading-relaxed">
              실제 수강생들의 생생한 경험을 확인해보세요
            </p>
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="card p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className="flex items-center mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${i < review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-neutral-300'
                            }`}
                        />
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-neutral-600 font-medium">{review.rating}/5</span>
                  </div>

                  <p className="text-neutral-700 mb-6 leading-relaxed italic">"{review.comment}"</p>

                  <div className="border-t border-neutral-100 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                        {review.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">{review.name}</p>
                        <p className="text-sm text-neutral-600">{review.course}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{review.date}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Card */}
            <div className="card p-8 md:p-10 text-center mt-12 bg-gradient-to-br from-primary-50 to-white border-primary-100">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">후기를 남겨주세요</h2>
              <p className="text-neutral-600 mb-6 leading-relaxed max-w-2xl mx-auto">
                수강하신 강의에 대한 솔직한 후기를 남겨주시면 다른 학습자들에게 큰 도움이 됩니다.
              </p>
              <button className="btn btn-primary btn-lg rounded-full px-8 shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-300">
                후기 작성하기
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}