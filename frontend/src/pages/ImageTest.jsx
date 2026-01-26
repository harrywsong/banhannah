import { useState } from 'react';

export default function ImageTest() {
  const [testResults, setTestResults] = useState([]);

  const testImage = async (url, description) => {
    const result = { url, description, status: 'testing' };
    setTestResults(prev => [...prev, result]);

    try {
      // Test 1: Direct image loading
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const imagePromise = new Promise((resolve, reject) => {
        img.onload = () => resolve('✅ Direct load success');
        img.onerror = () => reject('❌ Direct load failed');
      });
      
      img.src = url;
      const imageResult = await imagePromise;
      
      // Test 2: Fetch request
      const fetchResponse = await fetch(url, { method: 'HEAD' });
      const fetchResult = fetchResponse.ok ? '✅ Fetch success' : '❌ Fetch failed';
      
      result.status = `${imageResult} | ${fetchResult}`;
    } catch (error) {
      result.status = `❌ Error: ${error.message}`;
    }
    
    setTestResults(prev => prev.map(r => r.url === url ? result : r));
  };

  const runTests = () => {
    setTestResults([]);
    
    // Test the actual preview image
    testImage(
      'http://localhost:3002/api/files/preview/1769386682256_j61bgy_001281840025.jpg',
      'Actual preview image'
    );
    
    // Test a non-existent image
    testImage(
      'http://localhost:3002/api/files/preview/nonexistent.jpg',
      'Non-existent image'
    );
    
    // Test external image
    testImage(
      'https://via.placeholder.com/300x200',
      'External placeholder image'
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Image Loading Test</h1>
        
        <button
          onClick={runTests}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 mb-6"
        >
          Run Tests
        </button>
        
        <div className="space-y-4">
          {testResults.map((result, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold">{result.description}</h3>
              <p className="text-sm text-gray-600 break-all">{result.url}</p>
              <p className="mt-2">{result.status}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Direct Image Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-2">Direct IMG tag</h3>
              <img 
                src="http://localhost:3002/api/files/preview/1769386682256_j61bgy_001281840025.jpg"
                alt="Direct test"
                className="w-full h-32 object-cover"
                onLoad={() => console.log('Direct img loaded')}
                onError={() => console.log('Direct img failed')}
              />
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-2">External placeholder</h3>
              <img 
                src="https://via.placeholder.com/300x200"
                alt="Placeholder test"
                className="w-full h-32 object-cover"
                onLoad={() => console.log('Placeholder loaded')}
                onError={() => console.log('Placeholder failed')}
              />
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-2">Non-existent</h3>
              <img 
                src="http://localhost:3002/api/files/preview/nonexistent.jpg"
                alt="Non-existent test"
                className="w-full h-32 object-cover bg-red-100"
                onLoad={() => console.log('Non-existent loaded')}
                onError={() => console.log('Non-existent failed')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}