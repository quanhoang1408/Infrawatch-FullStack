import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// For development environment, you might want to setup mock service worker here
// if (process.env.NODE_ENV === 'development') {
//   const { worker } = require('./mocks/browser');
//   worker.start();
// }

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);