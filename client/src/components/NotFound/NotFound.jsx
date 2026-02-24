import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './NotFound.css';

const NotFound = () => {
    const { user } = useAuth();

    return (
        <div className="not-found">
            <div className="not-found-code">404</div>
            <h1 className="not-found-title">Page Not Found</h1>
            <p className="not-found-sub">
                This page doesn't exist or may have been moved.
            </p>
            <div className="not-found-links">
                {user ? (
                    <>
                        <Link to="/dashboard" className="nf-btn-primary">Back to Dashboard</Link>
                        <Link to="/calculators" className="nf-btn-secondary">Calculators</Link>
                        <Link to="/guides" className="nf-btn-secondary">Guides</Link>
                    </>
                ) : (
                    <>
                        <Link to="/" className="nf-btn-primary">Go Home</Link>
                        <Link to="/login" className="nf-btn-secondary">Log In</Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default NotFound;
