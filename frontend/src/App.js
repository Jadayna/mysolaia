import React from 'react';
import './App.css';
import { LanguageProvider, useT } from './i18n';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthScreen from './screens/AuthScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import AppShell from './components/AppShell';

const Splash = () => (
  <div className="app-shell items-center justify-center" style={{ display: 'flex' }}>
    <h1 className="font-display text-[40px]" style={{ color: 'var(--gold)' }}>MySolaia</h1>
  </div>
);

const Gate = () => {
  const { user, loading } = useAuth();
  if (loading) return <Splash />;
  if (!user) return <AuthScreen />;
  if (!user.onboarded) return <OnboardingScreen />;
  return <AppShell />;
};

function App() {
  return (
    <div className="App">
      <LanguageProvider>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </LanguageProvider>
    </div>
  );
}

export default App;
