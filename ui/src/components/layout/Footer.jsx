// Footer.jsx
import React from 'react';
import './Footer.scss';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="iw-footer">
      <div className="iw-footer__content">
        <div className="iw-footer__copyright">
          &copy; {currentYear} Infrawatch. All rights reserved.
        </div>
        <div className="iw-footer__links">
          <a href="#" className="iw-footer__link">Privacy Policy</a>
          <a href="#" className="iw-footer__link">Terms of Service</a>
          <a href="#" className="iw-footer__link">Contact</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;