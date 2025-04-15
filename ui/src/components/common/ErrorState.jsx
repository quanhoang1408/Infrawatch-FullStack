import React from 'react';
import './ErrorState.scss';

const ErrorState = ({ 
  title = 'Something went wrong', 
  message = 'An error occurred while fetching data. Please try again later.',
  error,
  retryAction
}) => {
  return (
    <div className="error-state">
      <div className="error-state__icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h3 className="error-state__title">{title}</h3>
      <p className="error-state__message">{message}</p>
      
      {error && error.message && (
        <div className="error-state__details">
          <p className="error-state__error-message">{error.message}</p>
        </div>
      )}
      
      {retryAction && (
        <div className="error-state__action">
          <button onClick={retryAction} className="btn btn--primary">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;