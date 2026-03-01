import { useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { QUEST_DATA } from '../../data/quests/questData';
import './Landing.css';

const NUM_CALCULATORS = 25;
const NUM_GUIDES = 25;
const NUM_SKILLS = 29;

const FEATURES = (questCount) => [
    {
        icon: '⚡',
        title: 'Skill Calculators',
        description:
            `Calculate exactly how many actions you need to hit your goal. ${NUM_CALCULATORS} skill calculators with method selection, XP targets, and character hiscores integration. Archaeology calculator includes a material bank organized by zone.`,
    },
    {
        icon: '📖',
        title: 'Training Guides',
        description:
            `Step-by-step guides for P2P and Ironman players — organized by level range, not a wall of text. Covers all ${NUM_GUIDES} skilling skills including Ranged.`,
    },
    {
        icon: '📜',
        title: 'Quest Tracker',
        description:
            `${questCount} RS3 quests with full skill and quest requirement checking, quest point tracking, and wiki-style alphabetical sorting. Each quest has a guide with numbered steps, color-coded skill chips, and progress checkboxes. Sub-quests are tracked individually with RuneMetrics import support.`,
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

    const questCount = useMemo(
        () => QUEST_DATA.filter(q => !q.title.includes(': ')).length,
        []
    );

    const stats = useMemo(() => [
        { value: String(NUM_CALCULATORS), label: 'Skill Calculators' },
        { value: String(NUM_GUIDES), label: 'Training Guides' },
        { value: String(questCount), label: 'Quests Tracked' },
        { value: String(NUM_SKILLS), label: 'Skills Covered' },
    ], [questCount]);

    const features = useMemo(() => FEATURES(questCount), [questCount]);

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
                        Rune<span className="hero-title-accent">Hub</span>
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
                    {features.map(f => (
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
