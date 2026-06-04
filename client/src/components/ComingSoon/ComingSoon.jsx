import { Link } from 'react-router-dom';
import './ComingSoon.css';

const ComingSoon = () => (
    <div className="coming-soon-page">
        <div className="coming-soon-card">
            <div className="coming-soon-icon">🚧</div>
            <h1 className="coming-soon-title">Coming Soon</h1>
            <p className="coming-soon-desc">
                This feature is still in the works. Check back after launch.
            </p>
            <Link to="/calculators" className="coming-soon-btn">Go to Calculators</Link>
        </div>
    </div>
);

export default ComingSoon;
