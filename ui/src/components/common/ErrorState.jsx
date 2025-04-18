import React from 'react';
// import './ErrorState.scss';

const ErrorState = ({
  title = 'Something went wrong',
  message = 'An error occurred while fetching data. Please try again later.',
  error,
  retryAction
}) => {
  return (
    <div style={{
      padding: '24px',
      textAlign: 'center',
      backgroundColor: '#fff8f8',
      border: '1px solid #ffcdd2',
      borderRadius: '4px',
      margin: '16px 0'
    }}>
      <div style={{
        marginBottom: '16px',
        color: '#d32f2f'
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d32f2f', marginBottom: '8px' }}>{title}</h3>
      <p style={{ fontSize: '1rem', color: '#555', marginBottom: '16px' }}>{message}</p>

      {error && error.message && (
        <div style={{ padding: '8px', backgroundColor: '#ffebee', borderRadius: '4px', marginBottom: '16px' }}>
          <p style={{ margin: 0, color: '#c62828', fontSize: '0.875rem' }}>{error.message}</p>
        </div>
      )}

      {retryAction && (
        <div style={{ marginTop: '16px' }}>
          <button
            onClick={retryAction}
            style={{
              backgroundColor: '#d32f2f',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;