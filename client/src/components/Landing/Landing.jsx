import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MAIN_QUEST_COUNT } from '../../data/quests/questMetadata';
import './Landing.css';

const NUM_CALCULATORS = 25;
const NUM_SKILLS = 29;

const FEATURES = [
    {
        icon: '⚡',
        title: 'Skill Calculators',
        description:
            `Calculate exactly how many actions you need to hit your goal. ${NUM_CALCULATORS} skill calculators with method selection, XP targets, and hiscores integration. Includes an endgame planner for Max Cape and 120 All.`,
    },
    {
        icon: '🐉',
        title: 'Boss Rare Hunter',
        description:
            'Enter your kills per hour, drop rate, and item value to calculate GP/hr and average time to drop. Compare multiple bosses and keep a history of your calculations.',
    },
    {
        icon: '📜',
        title: 'Quest Tracker',
        description:
            `${MAIN_QUEST_COUNT} RS3 quests with skill and quest requirement checking, quest point tracking, and alphabetical sorting. Each quest has a guide with numbered steps, color-coded skill chips, and progress checkboxes.`,
    },
];

const Landing = () => {
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) navigate('/dashboard', { replace: true });
    }, [user, loading, navigate]);

    const stats = [
        { value: String(NUM_CALCULATORS), label: 'Skill Calculators' },
        { value: String(MAIN_QUEST_COUNT), label: 'Quests Tracked' },
        { value: String(NUM_SKILLS), label: 'Skills Covered' },
    ];

    if (loading) return null;

    return (
        <div className="landing-page">
            {/* Hero */}
            <section className="landing-hero">
                <div className="hero-content">
                    <p className="hero-eyebrow">RuneScape 3 Toolkit</p>
                    <img src="/images/logos/Runehublogo.png" alt="RuneHub" className="hero-logo" />
                    <p className="hero-subtitle">
                        Skill calculators, boss rare-drop hunting, and quest tracking — built for every type of player.
                    </p>
                    <div className="hero-cta">
                        <Link to="/register" className="cta-primary">Create Free Account</Link>
                        <Link to="/login" className="cta-secondary">Log In</Link>
                    </div>
                </div>
            </section>

            {/* Stats strip */}
            <section className="landing-stats">
                {stats.map(s => (
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
