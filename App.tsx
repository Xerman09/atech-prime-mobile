import React, { useState } from 'react';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TimeInOutScreen from './src/screens/TimeInOutScreen';
import LeaveRequestScreen from './src/screens/LeaveRequestScreen';
import LeaveRequestFormScreen from './src/screens/LeaveRequestFormScreen';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [userName, setUserName] = useState('');

  const handleLoginSuccess = (name: string) => {
    setUserName(name);
    setIsLoggedIn(true);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
  };

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentScreen === 'attendance') {
    return <TimeInOutScreen onBack={() => handleNavigate('dashboard')} />;
  }

  if (currentScreen === 'leave_request') {
    return <LeaveRequestScreen 
      onBack={() => handleNavigate('dashboard')} 
      onNavigateToForm={() => handleNavigate('leave_request_form')}
    />;
  }

  if (currentScreen === 'leave_request_form') {
    return <LeaveRequestFormScreen 
      onBack={() => handleNavigate('leave_request')}
      onSubmitSuccess={() => handleNavigate('leave_request')}
    />;
  }

  return <DashboardScreen onLogout={handleLogout} onNavigate={handleNavigate} />;
}
