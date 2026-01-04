import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header";

import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import MapPage from "./pages/MapPage";
import HistoryPage from "./pages/HistoryPage";
import AdminPage from "./pages/AdminPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

import { storage } from './utils/auth';
import "./App.css";

function App() {
  const ProtectedRoute = ({ children }) => {
    return storage.isAuthenticated() ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <div className="appShell">
        <Header />

        <div className="appContent">
          <Routes>
            {/* Landing page tanpa login */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/map" element={
              <ProtectedRoute>
                <MapPage />
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;