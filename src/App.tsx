import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import GlobalLoader from './components/UI/GlobalLoader';
import { useLoading } from './context/LoadingContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Features from './pages/Features';
import Login from './pages/Login';
import Callback from './pages/Callback';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import TestCases from './pages/TestCases';
import SharedSteps from './pages/SharedSteps';

const AppContent: React.FC = () => {
  const { loading } = useLoading();

  return (
    <>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/features" element={<Features />} />
            <Route path="/login" element={<Login />} />
            <Route path="/callback" element={<Callback />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<Dashboard key={`dashboard-${Date.now()}`} />} />
              <Route path="projects" element={<Projects />} />
              <Route path="test-cases" element={<TestCases />} />
              <Route path="shared-steps" element={<SharedSteps />} />
              <Route path="test-runs" element={<div className="text-white">Test Runs - In Development</div>} />
              <Route path="test-plans" element={<div className="text-white">Test Plans - In Development</div>} />
              <Route path="reports" element={<div className="text-white">Reports - In Development</div>} />
              <Route path="settings" element={<div className="text-white">Settings - In Development</div>} />
            </Route>
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1F2937',
                color: '#F3F4F6',
                border: '1px solid #374151'
              }
            }}
          />
        </div>
      </Router>
      <GlobalLoader isVisible={loading.isLoading} message={loading.message} />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <LoadingProvider>
          <AppContent />
        </LoadingProvider>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;