import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import MapPage from './pages/MapPage';
import AuthPage from './pages/AuthPage';
import ProfilePage from './pages/ProfilePage';
import ItemRequestPage from './pages/ItemRequestPage';
import AllItemRequestsPage from './pages/AllItemRequestsPage';
import ItemsPage from './pages/ItemsPage';
import POIsPage from './pages/POIsPage';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <div className="App">
              <Routes>
                <Route path="/" element={<MapPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/item-requests" element={<ItemRequestPage />} />
                <Route path="/item-requests/all" element={<AllItemRequestsPage />} />
                <Route path="/items" element={<ItemsPage />} />
                <Route path="/pois" element={<POIsPage />} />
              </Routes>
            </div>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
