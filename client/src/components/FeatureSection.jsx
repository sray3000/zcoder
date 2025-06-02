import { useEffect, useRef } from 'react';
import '../styles/features.css';

function FeatureSection({ features }) {
  const featuresRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('feature-card-visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach((card) => {
      observer.observe(card);
    });

    return () => {
      featureCards.forEach((card) => {
        observer.unobserve(card);
      });
    };
  }, []);

  return (
    <section className="features-section" id="features" ref={featuresRef}>
      <div className="container">
        <h2 className="section-title">Why Choose ZCoder?</h2>
        <p className="section-subtitle">
          Our platform offers everything you need to enhance your coding skills and connect with peers
        </p>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div className="feature-card\" key={index}>
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeatureSection;