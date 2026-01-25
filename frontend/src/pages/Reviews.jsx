import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Star } from 'lucide-react';

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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">수강 후기</h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < review.rating
                          ? 'text-yellow-500 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-600">{review.rating}/5</span>
              </div>
              
              <p className="text-gray-700 mb-4">"{review.comment}"</p>
              
              <div className="border-t pt-4">
                <p className="font-semibold text-gray-900">{review.name}</p>
                <p className="text-sm text-gray-600">{review.course}</p>
                <p className="text-xs text-gray-500 mt-1">{review.date}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">후기를 남겨주세요</h2>
          <p className="text-gray-600 mb-6">
            수강하신 강의에 대한 솔직한 후기를 남겨주시면 다른 학습자들에게 큰 도움이 됩니다.
          </p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            후기 작성하기
          </button>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}