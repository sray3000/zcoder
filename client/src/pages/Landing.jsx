import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import FeatureSection from '../components/FeatureSection';

function Landing() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      title: "Personalized Profiles",
      description: "Build your unique coding identity and connect with peers who share your interests",
      icon: "👤",
    },
    {
      title: "Collaborative Learning",
      description: "Share solutions, give feedback, and learn from others in a supportive community",
      icon: "👥",
    },
    {
      title: "Code Bookmarking",
      description: "Save and organize coding problems with tags for efficient reference and practice",
      icon: "🔖",
    },
    {
      title: "Interactive Rooms",
      description: "Join real-time chat spaces for peer discussion and collaborative problem-solving",
      icon: "💬",
    },
    {
      title: "Built-in Code Editor",
      description: "Practice coding with our integrated editor featuring real-time output and syntax highlighting",
      icon: "💻",
    },
    {
      title: "Efficient Practice",
      description: "Streamline your coding practice with accessible tools and saved resources",
      icon: "🚀",
    }
  ];

  return (
    <div className="landing-page">
      <Navbar scrollY={scrollY} />
      <Hero />
      <FeatureSection features={features} />
    </div>
  );
}

export default Landing;