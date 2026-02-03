import { useState, useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { FirstRunSetup } from './components/FirstRunSetup';

export default function App() {
  const [showFirstRun, setShowFirstRun] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if first-run setup has been completed
    const firstRunComplete = localStorage.getItem('atlas-first-run-complete');
    
    if (!firstRunComplete) {
      setShowFirstRun(true);
    }
    
    setIsLoading(false);
  }, []);
  
  const handleFirstRunComplete = () => {
    setShowFirstRun(false);
  };
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
        <div className="text-cyan-400">Loading Atlas UX...</div>
      </div>
    );
  }
  
  if (showFirstRun) {
    return <FirstRunSetup onComplete={handleFirstRunComplete} />;
  }
  
  return <RouterProvider router={router} />;
}