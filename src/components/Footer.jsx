import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaLinkedin, 
  FaGithub, 
  FaXTwitter, 
  FaArrowUp 
} from 'react-icons/fa6';
import { HiOutlineStatusOnline } from 'react-icons/hi';
import './Footer.css';
import vtsLogo from '../Images/vts_logo.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer-wrapper">
      <div className="footer-top-gradient"></div>
      
      <div className="footer-container">
        <div className="footer-main-grid">
          
          {/* BRAND SECTION */}
          <div className="footer-brand">
            <div className="footer-logo-box">
              <img src={vtsLogo} alt="VTS Logo" className="footer-logo-img" />
              <div className="footer-brand-text">
                <span className="footer-vts">VTS</span>
                <span className="footer-solutions">Virtual Technology Solutions</span>
              </div>
            </div>
            <p className="footer-tagline">
              Leading the digital transformation in agriculture through advanced intelligence and data-driven insights.
            </p>
            <div className="footer-socials">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-link" title="LinkedIn">
                <FaLinkedin />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-link" title="X (Twitter)">
                <FaXTwitter />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-link" title="GitHub">
                <FaGithub />
              </a>
            </div>
          </div>

          {/* QUICK LINKS */}
          <div className="footer-links-group">
            <h5 className="footer-title">Ecosystem</h5>
            <ul className="footer-nav">
              <li><Link to="/dashboard">Intelligence Hub</Link></li>
              <li><Link to="/reports">Operational Reports</Link></li>
              <li><Link to="/inventory">Inventory Assets</Link></li>
              <li><Link to="/settings">System Settings</Link></li>
            </ul>
          </div>

          {/* SUPPORT */}
          <div className="footer-links-group">
            <h5 className="footer-title">Assistance</h5>
            <ul className="footer-nav">
              <li><Link to="/help">Documentation</Link></li>
              <li><Link to="/contact">Technical Support</Link></li>
              <li><Link to="/faq">Enterprise FAQ</Link></li>
            </ul>
          </div>

          {/* CONTACT & STATUS */}
          <div className="footer-status-section">
            <h5 className="footer-title">Connection</h5>
            <div className="footer-contact-info">
              <p>precision@vts.com</p>
              <p>+92 (300) VTS-AGRO</p>
            </div>
            <div className="system-status">
              <div className="status-indicator">
                <span className="status-dot pulse"></span>
                <span className="status-text">All Systems Operational</span>
              </div>
              <HiOutlineStatusOnline className="status-icon" />
            </div>
          </div>

        </div>

        <div className="footer-divider"></div>

        <div className="footer-meta">
          <div className="footer-copyright">
            &copy; {currentYear} <span className="highlight">VTS</span>. Precision Engineering for Modern Farming.
          </div>
          
          <div className="footer-legal-links">
            <a href="#privacy">Privacy Protocol</a>
            <span className="meta-dot">•</span>
            <a href="#terms">Terms of Engagement</a>
          </div>

          <button className="back-to-top" onClick={scrollToTop} title="Back to Top">
            <FaArrowUp />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
