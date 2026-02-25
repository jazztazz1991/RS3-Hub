import { Link } from 'react-router-dom';
import { SITE_LAST_UPDATED } from '../../data/common/changelog';
import './Footer.css';

function formatDate(iso) {
    const [year, month, day] = iso.split('-');
    return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

const Footer = () => (
    <footer className="site-footer">
        <div className="site-footer-inner">
            <span className="footer-updated">
                Last updated: <strong>{formatDate(SITE_LAST_UPDATED)}</strong>
            </span>
            <span className="footer-sep">·</span>
            <Link to="/changelog" className="footer-changelog-link">View Changelog</Link>
            <span className="footer-sep">·</span>
            <span className="footer-copy">RS3 Efficiency Hub — fan site, not affiliated with Jagex</span>
        </div>
    </footer>
);

export default Footer;
