// src/App.jsx - Updated with separate admin authentication

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { ReviewsProvider } from './contexts/ReviewsContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Resources from './pages/Resources';
import FileDetail from './pages/FileDetail';
import CourseDetail from './pages/CourseDetail';
import LiveClasses from './pages/LiveClasses';
import AdminPanel from './pages/AdminPanel';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import About from './pages/About';
import Contact from './pages/Contact';
import FAQs from './pages/FAQs';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Profile from './pages/Profile';

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        {/* Admin route with SEPARATE auth context - completely isolated */}
        <Route 
          path="/administrative" 
          element={
            <AdminAuthProvider>
              <AdminPanel />
            </AdminAuthProvider>
          } 
        />
        
        {/* All other routes with regular user auth + navbar/footer */}
        <Route 
          path="*" 
          element={
            <AuthProvider>
              <ReviewsProvider>
                <div className="min-h-screen flex flex-col">
                  <Navbar />
                  <main className="flex-grow">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/resources" element={<Resources />} />
                      <Route path="/files/:id" element={<FileDetail />} />
                      <Route path="/courses/:id" element={<CourseDetail />} />
                      <Route path="/live-classes" element={<LiveClasses />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/faqs" element={<FAQs />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/profile" element={<Profile />} />                    </Routes>
                  </main>
                  <Footer />
                </div>
              </ReviewsProvider>
            </AuthProvider>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;