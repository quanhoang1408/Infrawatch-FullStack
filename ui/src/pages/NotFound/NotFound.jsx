import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.scss';

const NotFound = () => {
  return (
    <div className="not-found">
      <div className="not-found__content">
        <h1 className="not-found__code">404</h1>
        <h2 className="not-found__title">Page Not Found</h2>
        <p className="not-found__message">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="not-found__actions">
          <Link to="/" className="btn btn--primary">
            Go Home
          </Link>
          <button 
            onClick={() => window.history.back()} 
            className="btn btn--outline-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;