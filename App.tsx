import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TimeInOutScreen from './src/screens/TimeInOutScreen';
import LeaveRequestScreen from './src/screens/LeaveRequestScreen';
import LeaveRequestFormScreen from './src/screens/LeaveRequestFormScreen';
import UndertimeRequestScreen from './src/screens/UndertimeRequestScreen';
import UndertimeRequestFormScreen from './src/screens/UndertimeRequestFormScreen';
import BusinessTripRequestScreen from './src/screens/BusinessTripRequestScreen';
import BusinessTripRequestFormScreen from './src/screens/BusinessTripRequestFormScreen';
import CoeRequestScreen from './src/screens/CoeRequestScreen';
import CoeRequestFormScreen from './src/screens/CoeRequestFormScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PoliciesScreen from './src/screens/PoliciesScreen';
import { ThemeProvider } from './src/theme/ThemeContext';

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
    return (
      <ThemeProvider>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </ThemeProvider>
    );
  }

  if (currentScreen === 'attendance') {
    return (
      <ThemeProvider>
        <TimeInOutScreen employeeId={employeeId} token={authToken} onBack={() => handleNavigate('dashboard')} />
      </ThemeProvider>
    );
  }

  if (currentScreen === 'leave_request') {
    return (
      <ThemeProvider>
        <LeaveRequestScreen 
          token={authToken}
          onBack={() => handleNavigate('dashboard')} 
          onNavigateToForm={() => handleNavigate('leave_request_form')}
        />
      </ThemeProvider>
    );
  }

  if (currentScreen === 'leave_request_form') {
    return (
      <ThemeProvider>
        <LeaveRequestFormScreen 
          token={authToken}
          employeeId={employeeId}
          onBack={() => handleNavigate('leave_request')}
          onSubmitSuccess={() => handleNavigate('leave_request')}
        />
      </ThemeProvider>
    );
  }

  if (currentScreen === 'undertime_request') {
    return (
      <ThemeProvider>
        <UndertimeRequestScreen 
          token={authToken}
          onBack={() => handleNavigate('dashboard')} 
          onNavigateToForm={() => handleNavigate('undertime_request_form')}
        />
      </ThemeProvider>
    );
  }

  if (currentScreen === 'undertime_request_form') {
    return (
      <ThemeProvider>
        <UndertimeRequestFormScreen 
          token={authToken}
          employeeId={employeeId}
          onBack={() => handleNavigate('undertime_request')}
          onSubmitSuccess={() => handleNavigate('undertime_request')}
        />
      </ThemeProvider>
    );
  }

  if (currentScreen === 'business_trip_request') {
    return (
      <ThemeProvider>
        <BusinessTripRequestScreen 
          token={authToken}
          onBack={() => handleNavigate('dashboard')} 
          onNavigateToForm={() => handleNavigate('business_trip_request_form')}
        />
      </ThemeProvider>
    );
  }

  if (currentScreen === 'business_trip_request_form') {
    return (
      <ThemeProvider>
        <BusinessTripRequestFormScreen 
          token={authToken}
          employeeId={employeeId}
          onBack={() => handleNavigate('business_trip_request')}
          onSubmitSuccess={() => handleNavigate('business_trip_request')}
        />
      </ThemeProvider>
    );
  }

  if (currentScreen === 'coe_request') {
    return (
      <ThemeProvider>
        <CoeRequestScreen 
          token={authToken}
          onBack={() => handleNavigate('dashboard')} 
          onNavigateToForm={() => handleNavigate('coe_request_form')}
        />
      </ThemeProvider>
    );
  }

  if (currentScreen === 'coe_request_form') {
    return (
      <ThemeProvider>
        <CoeRequestFormScreen 
          token={authToken}
          employeeId={employeeId}
          onBack={() => handleNavigate('coe_request')}
          onSubmitSuccess={() => handleNavigate('coe_request')}
        />
      </ThemeProvider>
    );
  }

  if (currentScreen === 'profile') {
    return (
      <ThemeProvider>
        <ProfileScreen 
          token={authToken}
          employeeId={employeeId}
          userName={userName}
          onBack={() => handleNavigate('dashboard')} 
        />
      </ThemeProvider>
    );
  }

  if (currentScreen === 'policies') {
    return (
      <ThemeProvider>
        <PoliciesScreen 
          token={authToken}
          onBack={() => handleNavigate('dashboard')} 
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <DashboardScreen userName={userName} token={authToken} onLogout={handleLogout} onNavigate={handleNavigate} />
    </ThemeProvider>
  );
}
