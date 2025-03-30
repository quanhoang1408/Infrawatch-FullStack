// ErrorState.jsx
import React from 'react';
import PropTypes from 'prop-types';
import '../styles/components/ErrorState.scss';
import Button from './Button';

/**
 * Error state component for displaying error messages
 * @param {string} title - Error title
 * @param {string} message - Error message
 * @param {function} onRetry - Called when retry button is clicked
 * @param {string} className - Additional class names
 */
const ErrorState = ({
  title = 'An error occurred',
  message = 'Something went wrong. Please try again.',
  error,
  onRetry,
  retryText = 'Try Again',
  className = '',
  ...rest
}) => {
  const baseClass = 'iw-error-state';
  const classes = [baseClass, className].filter(Boolean).join(' ');

  // Format error message if provided
  const errorMessage = error?.message || error?.toString?.();

  return (
    <div className={classes} {...rest}>
      <div className={`${baseClass}__icon`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="currentColor"/>
        </svg>
      </div>
      <div className={`${baseClass}__title`}>{title}</div>
      <div className={`${baseClass}__message`}>{message}</div>
      {errorMessage && (
        <div className={`${baseClass}__details`}>
          {errorMessage}
        </div>
      )}
      {onRetry && (
        <div className={`${baseClass}__action`}>
          <Button
            variant="primary"
            onClick={onRetry}
          >
            {retryText}
          </Button>
        </div>
      )}
    </div>
  );
};

ErrorState.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onRetry: PropTypes.func,
  retryText: PropTypes.string,
  className: PropTypes.string
};

export default ErrorState;