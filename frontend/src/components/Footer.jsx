import React from 'react';

const Footer = () => {
  return (
    <footer className="institutional-footer-bar">
      <div className="footer-bar-container">
        <div className="footer-bar-left">
          <span className="footer-crest-tag">🏛️ Campus Gig Portal</span>
          <span className="footer-dot">•</span>
          <span className="footer-desc">Verified Collegiate Co-Curricular Registry</span>
        </div>

        <div className="footer-bar-right">
          <span>© {new Date().getFullYear()} University Division of Student Affairs</span>
          <span className="footer-dot">•</span>
          <span className="footer-link-text">Non-Monetary Academic Credit</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
