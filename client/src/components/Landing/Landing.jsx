import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Landing.css';

const STATS = [
    { value: '24', label: 'Skill Calculators' },
    { value: '24', label: 'Training Guides' },
    { value: '270', label: 'Quests Tracked' },
    { value: '29', label: 'Skills Covered' },
];

const FEATURES = [
    {
        icon: '⚡',
        title: 'Skill Calculators',
        description:
            'Calculate exactly how many actions you need to hit your goal. Supports all meaningful skills with method selection, XP targets, and character hiscores integration.',
    },
    {
        icon: '📖',
        title: 'Training Guides',
        description:
            'Step-by-step guides for P2P and Ironman players — organized by level range, not a wall of text. Covers all 25 skilling skills including Ranged.',
    },
    {
        icon: '📜',
        title: 'Quest Tracker',
        description:
            '270 RS3 quests with full skill and quest requirement checking. Each quest has a wiki-style guide with numbered steps, color-coded skill chips, and progress checkboxes.',
    },
];

const SECONDARY = [
    {
        icon: '👤',
        title: 'Character Tracking',
        description:
            'Link your RS3 hiscores username and track XP progress across every skill. See your Max Cape progression at a glance.',
    },
    {
        icon: '📅',
        title: 'Daily Tasks',
        description:
            'Keep on top of daily, weekly, and monthly in-game tasks with built-in reset tracking so nothing slips through the cracks.',
    },
];

const Landing = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, loading, navigate]);

    if (loading) return null;

    return (
        <div className="landing-page">
            {/* Hero */}
            <section className="landing-hero">
                <div className="hero-content">
                    <p className="hero-eyebrow">RuneScape 3 Toolkit</p>
                    <h1 className="hero-title">
                        RS3 <span className="hero-title-accent">Efficiency</span> Hub
                    </h1>
                    <p className="hero-subtitle">
                        Skill calculators, training guides, and quest tracking — built for every type of player.
                    </p>
                    <div className="hero-cta">
                        <Link to="/register" className="cta-primary">Create Free Account</Link>
                        <Link to="/login" className="cta-secondary">Log In</Link>
                    </div>
                </div>
            </section>

            {/* Stats strip */}
            <section className="landing-stats">
                {STATS.map(s => (
                    <div key={s.label} className="stat-item">
                        <span className="stat-value">{s.value}</span>
                        <span className="stat-label">{s.label}</span>
                    </div>
                ))}
            </section>

            {/* Main features */}
            <section className="landing-features">
                <h2 className="section-title">Everything you need in one place</h2>
                <div className="features-grid">
                    {FEATURES.map(f => (
                        <div key={f.title} className="feature-card">
                            <div className="feature-icon">{f.icon}</div>
                            <h3 className="feature-title">{f.title}</h3>
                            <p className="feature-desc">{f.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Secondary features */}
            <section className="landing-secondary">
                <div className="secondary-grid">
                    {SECONDARY.map(f => (
                        <div key={f.title} className="secondary-card">
                            <div className="secondary-icon">{f.icon}</div>
                            <div>
                                <h3 className="secondary-title">{f.title}</h3>
                                <p className="secondary-desc">{f.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="landing-cta-bottom">
                <h2 className="cta-bottom-title">Ready to play smarter?</h2>
                <p className="cta-bottom-sub">Free to use. No subscription required.</p>
                <Link to="/register" className="cta-primary cta-large">Get Started</Link>
            </section>
        </div>
    );
};

export default Landing;
