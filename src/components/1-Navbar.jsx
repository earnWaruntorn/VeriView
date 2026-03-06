import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/Veriview.png';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/') {
      document.getElementById('search-section')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/', { state: { scrollToSearch: true } });
    }
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <a href="/" onClick={handleLogoClick}>
          <img src={logo} alt="VeriView Logo" />
        </a>
      </div>
    </nav>
  );
};

export default Navbar;