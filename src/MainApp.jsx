import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import LoadingScreen from './shared/LoadingScreen';
import LoginView from './views/LoginView';
import Navbar from './layout/Navbar';
import Navigation from './layout/Navigation';
import AlertBanner from './layout/AlertBanner';
import HomeView from './views/HomeView';
import AttendanceView from './views/AttendanceView';
import BreaksView from './views/BreaksView';
import CoachingView from './views/CoachingView';
import InfractionsView from './views/InfractionsView';
import MemosView from './views/MemosView';
import MyDocumentsView from './views/MyDocumentsView';
import SnitchView from './views/SnitchView';
import SchedulesView from './views/SchedulesView';
import ClientsView from './views/ClientsView';
import UsersView from './views/UsersView';
import MediaView from './views/MediaView';
import LocationStatusIndicator from './components/shared/LocationStatusIndicator';

const MainApp = () => {
  const { loading, error, success } = useApp();
  const { currentUser, view, setView } = useAuth();
  const [activeBreak, setActiveBreak] = useState(null);

  if (loading) {
    return <LoadingScreen />;
  }

  if (view === 'login' || !currentUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto p-4">
        <AlertBanner error={error} success={success} />
        <Navigation currentUser={currentUser} setView={setView} />

        {/* Render views based on current view state */}
        {view === 'home' && <HomeView activeBreak={activeBreak} setActiveBreak={setActiveBreak} />}
        {view === 'attendance' && <AttendanceView />}
        {view === 'breaks' && <BreaksView activeBreak={activeBreak} setActiveBreak={setActiveBreak} />}
        {view === 'coaching' && currentUser.role === 'admin' && <CoachingView />}
        {view === 'infractions' && currentUser.role === 'admin' && <InfractionsView />}
        {view === 'memos' && currentUser.role === 'admin' && <MemosView />}
        {view === 'my-docs' && currentUser.role !== 'admin' && <MyDocumentsView />}
        {view === 'snitch' && <SnitchView />}
        {view === 'schedules' && currentUser.role === 'admin' && <SchedulesView />}
        {view === 'clients' && currentUser.role === 'admin' && <ClientsView />}
        {view === 'users' && currentUser.role === 'admin' && <UsersView />}
        {view === 'media' && <MediaView />}
        {currentUser && currentUser.role !== 'admin' && (
        <LocationStatusIndicator />
      </div>
    </div>
  );
};

export default MainApp;
