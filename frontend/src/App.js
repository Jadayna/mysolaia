import React from 'react';
import './App.css';
import { LanguageProvider, useT } from './i18n';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthScreen from './screens/AuthScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import AppShell from './components/AppShell';
import { initAnalytics } from './lib/analytics';

const Splash = () => (
  <div className="app-shell items-center justify-center min-h-screen flex bg-[#FAF6F0]">
    <img 
      src="/mysolaia-logo-4096.png" 
      alt="MySolaia" 
      className="w-52 object-contain animate-pulse" 
    />
  </div>
);

const Gate = () => {
  const { user, loading } = useAuth();
  // Lien de réinitialisation du mot de passe (?reset_token=...) : prioritaire
  const [resetToken] = React.useState(() => new URLSearchParams(window.location.search).get('reset_token'));
  if (resetToken) return <ResetPasswordScreen token={resetToken} />;
  if (loading) return <Splash />;
  if (!user) return <AuthScreen />;
  if (!user.onboarded) return <OnboardingScreen />;
  return <AppShell />;
};

function App() {
  // Umami est initialisé ici (niveau racine) pour suivre TOUS les visiteurs,
  // y compris la page d'accueil publique — pas seulement les utilisatrices connectées (AppShell).
  React.useEffect(() => {
    initAnalytics();
  }, []);
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