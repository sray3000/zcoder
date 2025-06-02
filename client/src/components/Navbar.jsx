import { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import '../styles/navbar.css';

function Navbar({ scrollY = 0 }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Apply navbar styling based on scroll position
  const navbarClass = scrollY > 50 ? 'navbar scrolled' : 'navbar';

  return (
    <nav className={navbarClass}>
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          <Logo />
          <span>ZCoder</span>
        </Link>

        <div className="navbar-links-container">
          <ul className={`navbar-links ${menuOpen ? 'active' : ''}`}>
            <li><a href="#features" onClick={() => setMenuOpen(false)}>Features</a></li>
            <li><a href="#about" onClick={() => setMenuOpen(false)}>About</a></li>
            <li><a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a></li>
            <li className="nav-button-container">
              <Link to="/login" className="btn btn-outline">Log In</Link>
              <Link to="/signup" className="btn btn-primary">Sign Up</Link>
            </li>
          </ul>
        </div>

        <button 
          className={`menu-toggle ${menuOpen ? 'active' : ''}`} 
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;