import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { WebRTCProvider } from "./contexts/WebRTCContext";
import AuthScreen from "./components/auth/AuthScreen";
import MainLayout from "./components/layout/MainLayout";

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <WebSocketProvider>
      <WebRTCProvider>
        <MainLayout />
      </WebRTCProvider>
    </WebSocketProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;