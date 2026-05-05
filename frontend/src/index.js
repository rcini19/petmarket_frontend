import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App/App';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import reportWebVitals from './reportWebVitals';

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', event => {
  // In production, send to error tracking service like Sentry
  // For now, silently handle to prevent console spam
  if (process.env.REACT_APP_ENVIRONMENT !== 'production') {
    console.error('Unhandled promise rejection:', event.reason);
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

