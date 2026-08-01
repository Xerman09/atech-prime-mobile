import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user_session');
        if (storedUser) {
          const { name, empId, token } = JSON.parse(storedUser);
          setUserName(name);
          if (empId) setEmployeeId(empId);
          if (token) setAuthToken(token);
          setIsLoggedIn(true);
        }
      } catch (e) {
        console.error('Failed to load session');
      } finally {
        setIsAppReady(true);
      }
    };
    checkLoginStatus();
  }, []);

  const handleLoginSuccess = async (name: string, empId?: number, token?: string, rememberMe?: boolean) => {
    setUserName(name);
    if (empId) setEmployeeId(empId);
    if (token) setAuthToken(token);
    
    if (rememberMe) {
      try {
        await AsyncStorage.setItem('user_session', JSON.stringify({ name, empId, token }));
      } catch (e) {
        console.error('Failed to save session');
      }
    }
    
    setIsLoggedIn(true);
    setCurrentScreen('dashboard');
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user_session');
    } catch (e) {
      console.error('Failed to clear session');
    }
    setIsLoggedIn(false);
    setUserName('');
    setEmployeeId(null);
    setAuthToken(null);
  };

  const handleNavigate = (screen: string) => {
    setCurrentScreen(screen);
  };

  if (!isAppReady) {
    return null; // or a splash screen
  }

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

  return <DashboardScreen userName={userName} onLogout={handleLogout} onNavigate={handleNavigate} />;
}
