import '../styles/logo.css';

function Logo() {
  return (
    <div className="logo">
      <div className="logo-icon">
        <span className="code-bracket">{`{`}</span>
        <span className="code-letter">Z</span>
        <span className="code-bracket">{`}`}</span>
      </div>
    </div>
  );
}

export default Logo;