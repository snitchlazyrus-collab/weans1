import React from 'react';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { INFRACTION_RULES } from './constants/infractionRules';
import MainApp from './components/MainApp';
import AutoCoachingDashboard from './components/views/AutoCoachingDashboard';


const App = () => {
  return (
    <AppProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </AppProvider>
  );
};


export default App;
