import React, { useState } from 'react';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TimeInOutScreen from './src/screens/TimeInOutScreen';
import LeaveRequestScreen from './src/screens/LeaveRequestScreen';
import LeaveRequestFormScreen from './src/screens/LeaveRequestFormScreen';
import UndertimeRequestScreen from './src/screens/UndertimeRequestScreen';
import UndertimeRequestFormScreen from './src/screens/UndertimeRequestFormScreen';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [userName, setUserName] = useState('');
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  const handleLoginSuccess = (name: string, empId?: number, token?: string) => {
    setUserName(name);
    if (empId) setEmployeeId(empId);
    if (token) setAuthToken(token);
    setIsLoggedIn(true);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
    setEmployeeId(null);
    setAuthToken(null);
  };

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen);
  };

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentScreen === 'attendance') {
    return <TimeInOutScreen employeeId={employeeId} token={authToken} onBack={() => handleNavigate('dashboard')} />;
  }

  if (currentScreen === 'leave_request') {
    return <LeaveRequestScreen 
      token={authToken}
      onBack={() => handleNavigate('dashboard')} 
      onNavigateToForm={() => handleNavigate('leave_request_form')}
    />;
  }

  if (currentScreen === 'leave_request_form') {
    return <LeaveRequestFormScreen 
      token={authToken}
      employeeId={employeeId}
      onBack={() => handleNavigate('leave_request')}
      onSubmitSuccess={() => handleNavigate('leave_request')}
    />;
  }

  if (currentScreen === 'undertime_request') {
    return <UndertimeRequestScreen 
      token={authToken}
      onBack={() => handleNavigate('dashboard')} 
      onNavigateToForm={() => handleNavigate('undertime_request_form')}
    />;
  }

  if (currentScreen === 'undertime_request_form') {
    return <UndertimeRequestFormScreen 
      token={authToken}
      employeeId={employeeId}
      onBack={() => handleNavigate('undertime_request')}
      onSubmitSuccess={() => handleNavigate('undertime_request')}
    />;
  }

  return <DashboardScreen onLogout={handleLogout} onNavigate={handleNavigate} />;
}
