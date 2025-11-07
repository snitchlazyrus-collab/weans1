import React from 'react';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import MainApp from './components/MainApp';

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
