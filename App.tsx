import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TimeInOutScreen from './src/screens/TimeInOutScreen';
import AttendanceReportScreen from './src/screens/AttendanceReportScreen';
import AttendanceModificationRequestScreen from './src/screens/AttendanceModificationRequestScreen';
import AttendanceModificationFormScreen from './src/screens/AttendanceModificationFormScreen';
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
import MemosScreen from './src/screens/MemosScreen';
import TodoScreen from './src/screens/TodoScreen';
import AssignedAssetsScreen from './src/screens/AssignedAssetsScreen';
import EmployeeDocumentsScreen from './src/screens/EmployeeDocumentsScreen';
import { ThemeProvider } from './src/theme/ThemeContext';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [userName, setUserName] = useState('');
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [modificationDate, setModificationDate] = useState<string>('');

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user_session');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          let { name, empId, token } = parsed;

          // Check if 'name' was mistakenly saved as a token string
          const isTokenString = (str: string) => !str || str.startsWith('MS4') || (str.length > 30 && str.includes('.'));
          if (isTokenString(name)) {
            const userDataRaw = await AsyncStorage.getItem('user_data');
            if (userDataRaw) {
              try {
                const u = JSON.parse(userDataRaw);
                name = u.name || u.email || 'Workstation User';
                if (!empId && u.employee_id) empId = u.employee_id;
              } catch {
                name = 'Workstation User';
              }
            } else {
              name = 'Workstation User';
            }
          }

          // Fetch fresh profile from /api/auth/me to always get accurate name & permissions
          if (token) {
            setAuthToken(token);
            try {
              let meUrl = Platform.OS === 'web'
                ? `http://${window.location.hostname}/atech_prime/backend/public/api/auth/me`
                : `http://192.168.100.31/atech_prime/backend/public/api/auth/me`;
              const res = await fetch(meUrl, {
                cache: 'no-store',
                headers: { 
                  'Accept': 'application/json', 
                  'Authorization': `Bearer ${token}`,
                  'X-Authorization': `Bearer ${token}`
                }
              });
              if (res.status === 401) {
                console.warn('Session expired or unauthorized. Clearing stored session.');
                await AsyncStorage.removeItem('user_session');
                await AsyncStorage.removeItem('user_data');
                setAuthToken(null);
                setUserName('Workstation User');
                setEmployeeId(null);
                setIsLoggedIn(false);
                setIsAppReady(true);
                return;
              }
              if (res.ok) {
                const meData = await res.json();
                if (meData.name) name = meData.name;
                if (meData.employee_id) empId = meData.employee_id;
                await AsyncStorage.setItem('user_data', JSON.stringify({
                  id: meData.user_id,
                  name: meData.name,
                  email: meData.email,
                  role: meData.role,
                  employee_id: meData.employee_id,
                  company_name: meData.company?.name || 'ATECH PRIME',
                  company_plan: meData.company?.plan || 'ENTERPRISE',
                }));
              }
            } catch (e) {
              // Fallback to cached name if offline/network error
            }
          }

          if (token) {
            setUserName(name);
            if (empId) setEmployeeId(empId);
            await AsyncStorage.setItem('user_session', JSON.stringify({ name, empId, token }));
            setIsLoggedIn(true);
          } else {
            setIsLoggedIn(false);
          }
        }
      } catch (e) {
        console.error('Failed to load session');
      } finally {
        setIsAppReady(true);
      }
    };
    checkLoginStatus();
  }, []);

  const handleLoginSuccess = async (param1: any, param2?: any, param3?: any) => {
    let name = 'Workstation User';
    let empId: number | null = null;
    let token = '';

    if (typeof param1 === 'string' && typeof param2 === 'object' && param2 !== null) {
      // Called as onLoginSuccess(token, userPayload)
      token = param1;
      name = param2.name || param2.email || 'Workstation User';
      empId = param2.employee_id || param2.id || null;
    } else if (typeof param1 === 'object' && param1 !== null) {
      token = param1.token || '';
      name = param1.name || param1.email || 'Workstation User';
      empId = param1.employee_id || param1.id || null;
    } else {
      if (typeof param1 === 'string' && (param1.startsWith('MS4') || (param1.length > 30 && param1.includes('.')))) {
        token = param1;
        name = 'Workstation User';
      } else {
        name = param1 || 'Workstation User';
        token = param3 || '';
      }
      empId = param2 || null;
    }

    setUserName(name);
    setEmployeeId(empId);
    setAuthToken(token);
    
    try {
      await AsyncStorage.setItem('user_session', JSON.stringify({ name, empId, token }));
    } catch (e) {
      console.error('Failed to save session');
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

  if (currentScreen === 'attendance_report') {
    return (
      <ThemeProvider>
        <AttendanceReportScreen 
          token={authToken}
          onBack={() => handleNavigate('dashboard')} 
          onNavigateToModificationRequests={() => handleNavigate('attendance_modification_request')}
          onNavigateToForm={(date) => {
            setModificationDate(date);
            handleNavigate('attendance_modification_form');
          }}
        />
      </ThemeProvider>
    );
  }

  if (currentScreen === 'attendance_modification_request') {
    return (
      <ThemeProvider>
        <AttendanceModificationRequestScreen 
          token={authToken}
          onBack={() => handleNavigate('dashboard')}
          onNavigateToForm={() => handleNavigate('attendance_modification_form')}
        />
      </ThemeProvider>
    );
  }

  if (currentScreen === 'attendance_modification_form') {
    return (
      <ThemeProvider>
        <AttendanceModificationFormScreen 
          token={authToken}
          initialDate={modificationDate}
          onBack={() => handleNavigate('attendance_report')}
          onSubmitSuccess={() => handleNavigate('attendance_modification_request')}
        />
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
          onNavigateToAssets={() => handleNavigate('assets')}
          onNavigateToDocuments={() => handleNavigate('documents')}
        />
      </ThemeProvider>
    );
  }

  if (currentScreen === 'assets') {
    return (
      <ThemeProvider>
        <AssignedAssetsScreen 
          token={authToken}
          employeeId={employeeId}
          onBack={() => handleNavigate('dashboard')} 
        />
      </ThemeProvider>
    );
  }

  if (currentScreen === 'documents') {
    return (
      <ThemeProvider>
        <EmployeeDocumentsScreen 
          token={authToken}
          employeeId={employeeId}
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

  if (currentScreen === 'memos') {
    return (
      <ThemeProvider>
        <MemosScreen 
          token={authToken}
          onBack={() => handleNavigate('dashboard')} 
        />
      </ThemeProvider>
    );
  }

  if (currentScreen === 'todo') {
    return (
      <ThemeProvider>
        <TodoScreen 
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
