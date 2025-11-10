import { Link } from 'react-router-dom';

interface ButtonProps {
  children: React.ReactNode;
  to?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  style?: React.CSSProperties;
}

function Button({ children, to, onClick, style }: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    padding: '8px 16px',
    border: '1px solid #000',
    backgroundColor: '#ffffff',
    color: '#000',
    textDecoration: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'inline-block',
    ...style
  };

  if (to) {
    return (
      <Link to={to} style={baseStyle}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} style={baseStyle}>
      {children}
    </button>
  );
}

export default Button;