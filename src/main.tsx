import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// In development, clear any stale service workers or caches from previous turns
if (import.meta.env.DEV) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
  if ('caches' in window) {
    caches.keys().then((keys) => {
      for (const key of keys) {
        caches.delete(key);
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
