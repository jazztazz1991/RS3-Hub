import { Link } from 'react-router-dom';
import './LoginBanner.css';

const LoginBanner = ({ features }) => (
    <div className="login-banner">
        <div className="login-banner-content">
            <span className="login-banner-icon">{'\u{1F512}'}</span>
            <div className="login-banner-text">
                <strong>Create a free account</strong> to {features}.
            </div>
            <div className="login-banner-actions">
                <Link to="/login" className="login-banner-link">Log in</Link>
                <Link to="/register" className="login-banner-link register">Sign up</Link>
            </div>
        </div>
    </div>
);

export default LoginBanner;
