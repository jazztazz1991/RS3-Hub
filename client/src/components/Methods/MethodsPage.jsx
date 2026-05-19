import { useMemo } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import SkillIcon from '../Common/SkillIcon';
import MethodsTab from '../Guides/MethodsTab';
import './MethodsPage.css';

// Skills with data available today. Order matters for the dropdown.
// Add a skill here once it has either curated JSON in
// server/data/skillMethods/<skill>.json OR auto-derive support
// (recipes with that skill in the Items DB).
const AVAILABLE_SKILLS = [
    { slug: 'mining',   name: 'Mining',   note: 'Curated' },
    { slug: 'herblore', name: 'Herblore', note: 'Auto-derived from recipes' },
];

export default function MethodsPage() {
    const { skill: slugParam } = useParams();
    const navigate = useNavigate();

    // Resolve slug → canonical skill name (PascalCase) the API expects.
    const current = useMemo(
        () => AVAILABLE_SKILLS.find(s => s.slug === slugParam?.toLowerCase()),
        [slugParam]
    );

    // Unknown / missing skill → redirect to the first available
    if (!current) {
        return <Navigate to={`/methods/${AVAILABLE_SKILLS[0].slug}`} replace />;
    }

    return (
        <div className="methods-page">
            <div className="methods-page-header">
                <div className="methods-page-title">
                    <SkillIcon skillName={current.name} className="methods-page-icon" />
                    <h1>{current.name} Methods</h1>
                </div>
                <div className="methods-page-switcher">
                    <label>Skill</label>
                    <select
                        value={current.slug}
                        onChange={e => navigate(`/methods/${e.target.value}`)}
                    >
                        {AVAILABLE_SKILLS.map(s => (
                            <option key={s.slug} value={s.slug}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            <p className="methods-page-sub">
                Training methods for {current.name} with XP/hr, gp/hr from live GE prices,
                and recommendations per account type.{' '}
                <span className="methods-page-source">{current.note}.</span>
            </p>

            <MethodsTab skill={current.name} />
        </div>
    );
}
