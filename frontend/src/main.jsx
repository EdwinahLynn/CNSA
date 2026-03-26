import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Basic global reset
const style = document.createElement('style');
style.textContent = `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: system-ui, -apple-system, sans-serif; background: #0f0f1a; }`;
document.head.appendChild(style);

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>
);
