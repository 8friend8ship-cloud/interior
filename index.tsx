import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import FrontLanguageBotBridge from './FrontLanguageBotBridge';
import { InteriorEntryShell } from './components/InteriorEntryShell';

// AdSense is intentionally not installed globally on the estimator.
// Input, design, calculation, loading, and other critical-action surfaces must remain ad-free.
// Monetization may be added later only through an explicit reviewed slot on a non-critical public surface.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <InteriorEntryShell />
    <div id="interior-workspace">
      <App />
    </div>
    <FrontLanguageBotBridge appId="APP_INTERIOR" />
  </React.StrictMode>
);