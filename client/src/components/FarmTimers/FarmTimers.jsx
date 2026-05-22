import { useEffect, useMemo, useState } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import './FarmTimers.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

function fmtCountdown(ms) {
    if (ms <= 0) return 'Ready';
    const s = Math.floor(ms / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
}

export default function FarmTimers() {
    const { selectedCharacter } = useCharacter();
    const [kind, setKind] = useState('pof');
    const [animals, setAnimals] = useState([]);
    const [timers, setTimers] = useState([]);
    const [now, setNow] = useState(Date.now());
    const [showAdd, setShowAdd] = useState(false);

    const characterId = selectedCharacter?.id;

    // Live countdown tick
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        fetch(`${API_BASE}/api/farm-timers/animals?kind=${kind}`)
            .then(r => r.json())
            .then(setAnimals)
            .catch(() => setAnimals([]));
    }, [kind]);

    async function loadTimers() {
        if (!characterId) { setTimers([]); return; }
        try {
            const r = await fetch(`${API_BASE}/api/farm-timers?characterId=${characterId}`, { credentials: 'include' });
            if (r.ok) setTimers(await r.json());
        } catch { /* ignore */ }
    }
    useEffect(() => { loadTimers(); /* eslint-disable-next-line */ }, [characterId]);

    async function startTimer({ animalId, pen_label, started_stage }) {
        if (!characterId) return;
        await fetch(`${API_BASE}/api/farm-timers`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ characterId, animalId, pen_label, started_stage }),
        });
        setShowAdd(false);
        await loadTimers();
    }

    async function deleteTimer(id) {
        if (!confirm('Remove this timer?')) return;
        await fetch(`${API_BASE}/api/farm-timers/${id}`, { method: 'DELETE', credentials: 'include' });
        await loadTimers();
    }

    const grouped = useMemo(() => {
        const out = { pof: [], dino: [] };
        for (const t of timers) {
            const k = t.animal?.kind || 'pof';
            (out[k] = out[k] || []).push(t);
        }
        return out;
    }, [timers]);

    if (!characterId) {
        return (
            <div className="ft-page">
                <h2>Farm Timers</h2>
                <p className="ft-empty">Select a character to track farm timers.</p>
            </div>
        );
    }

    return (
        <div className="ft-page">
            <div className="ft-header">
                <h2>Farm Timers</h2>
                <span className="ft-char">{selectedCharacter.name}</span>
            </div>

            <div className="ft-tabs">
                <button className={kind === 'pof' ? 'active' : ''} onClick={() => setKind('pof')}>
                    Player-Owned Farm
                </button>
                <button className={kind === 'dino' ? 'active' : ''} onClick={() => setKind('dino')}>
                    Dino Island
                </button>
                <button className="ft-add" onClick={() => setShowAdd(true)}>+ Start timer</button>
            </div>

            {kind === 'dino' && animals.length === 0 && (
                <p className="ft-empty">Dino Island animal catalogue not seeded yet — coming in a later release.</p>
            )}

            {showAdd && (
                <AddTimerDialog
                    animals={animals.filter(a => a.kind === kind)}
                    onCancel={() => setShowAdd(false)}
                    onConfirm={startTimer}
                />
            )}

            <div className="ft-list">
                {(grouped[kind] || []).length === 0 && (
                    <p className="ft-empty">No active timers. Click "Start timer" to log a new one.</p>
                )}
                {(grouped[kind] || []).map(t => (
                    <TimerCard
                        key={t.id}
                        timer={t}
                        now={now}
                        onDelete={() => deleteTimer(t.id)}
                    />
                ))}
            </div>
        </div>
    );
}

function TimerCard({ timer, now, onDelete }) {
    const animal = timer.animal;
    const projected = timer.projected || [];

    const nextStage = projected.find(p => new Date(p.reaches_at).getTime() > now);
    const currentStage = timer.current_stage;
    const nextReachMs = nextStage ? new Date(nextStage.reaches_at).getTime() : null;
    const remaining = nextReachMs ? nextReachMs - now : 0;

    // Final stage time (Elder etc.) for overall progress
    const finalAt = projected.length ? new Date(projected[projected.length - 1].reaches_at).getTime() : null;
    const startedMs = new Date(timer.started_at).getTime();
    const totalSpan = finalAt ? finalAt - startedMs : 0;
    const elapsed = now - startedMs;
    const progressPct = totalSpan > 0 ? Math.min(100, Math.max(0, (elapsed / totalSpan) * 100)) : 100;

    return (
        <div className={`ft-card ${!nextStage ? 'ft-card-done' : ''}`}>
            <div className="ft-card-head">
                <div>
                    <div className="ft-card-title">{animal?.name || 'Unknown animal'}</div>
                    <div className="ft-card-sub">
                        {timer.pen_label && <span>{timer.pen_label} · </span>}
                        {animal?.pen_type}
                    </div>
                </div>
                <button className="ft-card-delete" onClick={onDelete} title="Remove">×</button>
            </div>

            <div className="ft-card-row">
                <span className="ft-card-now">Currently: <strong>{currentStage}</strong></span>
                {nextStage ? (
                    <span className="ft-card-next">
                        Next stage <strong>{nextStage.stage}</strong> in <strong className="ft-time">{fmtCountdown(remaining)}</strong>
                    </span>
                ) : (
                    <span className="ft-card-next ft-card-ready">Fully grown — check on it!</span>
                )}
            </div>

            <div className="ft-progress-track">
                <div className="ft-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>

            <div className="ft-stages">
                {projected.map((p, i) => {
                    const reached = new Date(p.reaches_at).getTime() <= now;
                    return (
                        <div key={i} className={`ft-stage ${reached ? 'reached' : ''}`}>
                            <span className="ft-stage-dot" />
                            <span className="ft-stage-name">{p.stage}</span>
                            <span className="ft-stage-at">
                                {new Date(p.reaches_at).toLocaleString(undefined, {
                                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                                })}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function AddTimerDialog({ animals, onCancel, onConfirm }) {
    const [animalId, setAnimalId] = useState(animals[0]?.id || '');
    const [penLabel, setPenLabel] = useState('');
    const [startedStage, setStartedStage] = useState('');

    const animal = animals.find(a => a.id === animalId);
    const stages = animal?.growth_stages || [];

    return (
        <div className="ft-dialog">
            <h3>Start a new timer</h3>
            <label>
                Animal
                <select value={animalId} onChange={e => setAnimalId(e.target.value)}>
                    {animals.map(a => (
                        <option key={a.id} value={a.id}>
                            {a.name}{a.farming_level ? ` (lvl ${a.farming_level})` : ''}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                Pen label (optional)
                <input
                    type="text"
                    placeholder="e.g. Small pen 1"
                    value={penLabel}
                    onChange={e => setPenLabel(e.target.value)}
                />
            </label>
            <label>
                Starting stage
                <select value={startedStage} onChange={e => setStartedStage(e.target.value)}>
                    <option value="">— Default (first stage) —</option>
                    {stages.map(s => (
                        <option key={s.stage} value={s.stage}>{s.stage}</option>
                    ))}
                </select>
            </label>
            <div className="ft-dialog-actions">
                <button className="ft-cancel" onClick={onCancel}>Cancel</button>
                <button onClick={() => onConfirm({ animalId, pen_label: penLabel, started_stage: startedStage })}>
                    Start
                </button>
            </div>
        </div>
    );
}
