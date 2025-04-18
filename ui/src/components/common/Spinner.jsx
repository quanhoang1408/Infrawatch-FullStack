import React from 'react';
// import './Spinner.scss';

const Spinner = ({ size = 'medium', centered = false }) => {
  const spinnerClasses = `spinner spinner--${size} ${centered ? 'spinner--centered' : ''}`;

  // Size mapping
  const sizeMap = {
    small: 16,
    medium: 24,
    large: 32
  };

  const spinnerSize = sizeMap[size] || sizeMap.medium;

  return (
    <div
      className={spinnerClasses}
      style={{
        display: 'inline-block',
        position: centered ? 'absolute' : 'relative',
        left: centered ? '50%' : 'auto',
        top: centered ? '50%' : 'auto',
        transform: centered ? 'translate(-50%, -50%)' : 'none',
        width: `${spinnerSize}px`,
        height: `${spinnerSize}px`
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: `${Math.max(2, spinnerSize / 8)}px solid rgba(0, 0, 0, 0.1)`,
          borderTopColor: '#2196F3',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}
      />

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Spinner;