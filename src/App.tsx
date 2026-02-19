import { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { OnboardingWizard } from './components/OnboardingWizard';
import { ActiveTenantProvider } from './lib/activeTenant';

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if onboarding has been completed
    const onboardingComplete = localStorage.getItem('atlas-onboarding-complete');
    
    if (!onboardingComplete) {
      setShowOnboarding(true);
    }
    
    setIsLoading(false);
  }, []);
  
  const handleOnboardingComplete = () => {
    localStorage.setItem('atlas-onboarding-complete', 'true');
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    // Still mark as complete but user can access settings later
    localStorage.setItem('atlas-onboarding-complete', 'true');
    localStorage.setItem('atlas-onboarding-skipped', 'true');
    setShowOnboarding(false);
  };
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin mx-auto mb-4"></div>
          <div className="text-cyan-400 text-lg font-semibold">Loading Atlas UX...</div>
          <div className="text-slate-500 text-sm mt-2">Initializing AI systems</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <ActiveTenantProvider>
        <RouterProvider router={router} />
      </ActiveTenantProvider>
      <OnboardingWizard 
        isOpen={showOnboarding} 
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    </div>
  );
}