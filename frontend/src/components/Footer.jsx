export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">EduPlatform</h3>
            <p className="text-gray-400">
              온라인 교육의 새로운 기준을 제시합니다
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">링크</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/courses" className="hover:text-white">강의</a></li>
              <li><a href="/files" className="hover:text-white">자료실</a></li>
              <li><a href="/about" className="hover:text-white">소개</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">문의</h3>
            <p className="text-gray-400">
              Email: support@eduplatform.com<br />
              Tel: 02-1234-5678
            </p>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 EduPlatform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}