import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/hero.css';

function Hero() {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const textArray = ['Learn', 'Collaborate', 'Code', 'Grow'];
  
  useEffect(() => {
    const typingInterval = setInterval(() => {
      if (currentText.length < textArray[currentIndex].length) {
        setCurrentText(textArray[currentIndex].substring(0, currentText.length + 1));
      } else {
        // Pause at the end of the word
        setTimeout(() => {
          setCurrentText('');
          setCurrentIndex((prevIndex) => (prevIndex + 1) % textArray.length);
        }, 1500);
        clearInterval(typingInterval);
      }
    }, 100);
    
    return () => clearInterval(typingInterval);
  }, [currentText, currentIndex, textArray]);

  return (
    <section className="hero">
      <div className="container hero-container">
        <div className="hero-content">
          <h1 className="hero-title">
            Where Developers <span className="typing-text">{currentText}<span className="cursor">|</span></span>
          </h1>
          <p className="hero-subtitle">
            ZCoder is a collaborative platform that enhances your coding journey through 
            personalized learning, interactive challenges, and community support.
          </p>
          <div className="hero-buttons">
            <Link to="/signup" className="btn btn-primary">Get Started</Link>
            <a href="#features" className="btn btn-secondary">Learn More</a>
          </div>
        </div>
        <div className="hero-image">
          <div className="code-editor-mockup">
            <div className="code-editor-header">
              <div className="window-buttons">
                <span className="window-button red"></span>
                <span className="window-button yellow"></span>
                <span className="window-button green"></span>
              </div>
              <div className="file-name">main.js</div>
            </div>
            <div className="code-editor-body">
              <pre className="code-content">
                <code>
                  <span className="code-keyword">function</span> <span className="code-function">fibonacci</span>(<span className="code-param">n</span>) {'{'}
                  <br/>  <span className="code-keyword">if</span> (n {'<='} <span className="code-number">1</span>) <span className="code-keyword">return</span> n;
                  <br/>  <span className="code-keyword">return</span> fibonacci(n-<span className="code-number">1</span>) + fibonacci(n-<span className="code-number">2</span>);
                  <br/>{'}'}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-wave">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path fillOpacity="1" d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,213.3C672,213,768,203,864,202.7C960,203,1056,213,1152,208C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </section>
  );
}

export default Hero;