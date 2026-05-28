import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFetch, API_BASE, JsonPane, Card, KV, field, fieldNum, Sections } from './WikiShared';
import './Wiki.css';

export function CreaturesList() {
    const { data, loading, error } = useFetch(`${API_BASE}/api/wiki-sandbox/creatures`);
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        if (!data) return [];
        return data.filter(c =>
            !search || c.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [data, search]);

    return (
        <div className="wiki-page">
            <div className="wiki-header">
                <div>
                    <h2>Bestiary</h2>
                    <p className="wiki-sub">Monsters, beasts, and slayer targets pulled from runescape.wiki.</p>
                </div>
                <Link to="/wiki" className="wiki-back">← Wiki home</Link>
            </div>

            <div className="wiki-toolbar">
                <input className="wiki-search" placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)} />
                <span className="wiki-count">{filtered.length} of {data?.length || 0}</span>
            </div>

            {loading && <p className="wiki-empty">Loading…</p>}
            {error && <p className="wiki-error">Error: {error}</p>}
            {!loading && data?.length === 0 && (
                <p className="wiki-empty">No creatures seeded yet. Visit the <Link to="/wiki-sandbox">sandbox</Link> to run a sync.</p>
            )}

            <div className="wiki-grid">
                {filtered.map(c => (
                    <Link key={c.id} to={`/wiki/creatures/${c.slug}`} className="wiki-card">
                        <div className="wiki-card-head">
                            <span className="wiki-card-title">{c.name}</span>
                            {c.combat_level != null && <span className="wiki-card-badge">CB {c.combat_level}</span>}
                        </div>
                        <div className="wiki-card-row">
                            {c.data?.race && <span>{c.data.race}</span>}
                            {c.lifepoints != null && <span>{c.lifepoints.toLocaleString()} LP</span>}
                            {c.slayer_level != null && <span>Slay <strong>{c.slayer_level}</strong></span>}
                        </div>
                        <div className="wiki-card-flags">
                            {c.aggressive && <span className="wiki-flag wiki-flag-warn">Aggressive</span>}
                            {c.poisonous && <span className="wiki-flag wiki-flag-warn">Poisonous</span>}
                            {c.members === false && <span className="wiki-flag">F2P</span>}
                            {c.members === true && <span className="wiki-flag wiki-flag-p2p">Members</span>}
                        </div>
                        {c.examine && <div className="wiki-card-examine">"{c.examine}"</div>}
                    </Link>
                ))}
            </div>
        </div>
    );
}

export function CreatureDetail() {
    const { slug } = useParams();
    const { data: c, loading, error } = useFetch(`${API_BASE}/api/wiki-sandbox/creatures/${slug}`);

    if (loading) return <div className="wiki-page"><p className="wiki-empty">Loading…</p></div>;
    if (error || !c) return <div className="wiki-page"><p className="wiki-error">Error: {error || 'Not found'}</p></div>;

    // Extract structured fields from the scraped data blob
    const race        = field(c, 'race');
    const npcId       = field(c, 'npc id', 'id');
    const release     = field(c, 'release', 'release date');
    const speed       = field(c, 'speed', 'attack speed');
    const maxSpec     = field(c, 'max_spec', 'max spec');

    const attackLvl   = fieldNum(c, 'attack');
    const magicLvl    = fieldNum(c, 'magic');
    const rangedLvl   = fieldNum(c, 'ranged');
    const defenceLvl  = fieldNum(c, 'defence');
    const armourLvl   = fieldNum(c, 'armour');

    const accMelee    = fieldNum(c, 'acc_melee', 'acc melee');
    const accMagic    = fieldNum(c, 'acc_magic', 'acc magic');
    const accRanged   = fieldNum(c, 'acc_ranged', 'acc ranged', 'acc_range');

    const affMelee    = fieldNum(c, 'aff_melee', 'aff melee');
    const affMagic    = fieldNum(c, 'aff_magic', 'aff magic');
    const affRanged   = fieldNum(c, 'aff_ranged', 'aff ranged', 'aff_range');

    const maxMelee    = fieldNum(c, 'max_melee', 'max melee');
    const maxMagic    = fieldNum(c, 'max_magic', 'max magic');
    const maxRanged   = fieldNum(c, 'max_ranged', 'max ranged', 'max_range');

    const xpCombat    = fieldNum(c, 'xp', 'experience');
    const xpHp        = fieldNum(c, 'hpxp', 'hp xp');
    const wepXp       = field(c, 'wepxp', 'weapon xp');

    return (
        <div className="wiki-page">
            <div className="wiki-header">
                <Link to="/wiki/creatures" className="wiki-back">← All creatures</Link>
            </div>

            <div className="wiki-detail-split">
                <div>
                    <CreatureHero c={c} race={race} />

                    <div className="cr-grid">
                        <CombatProfileCard
                            level={c.combat_level}
                            lifepoints={c.lifepoints}
                            speed={speed}
                            maxSpec={maxSpec}
                        />

                        <OffensiveCard attack={attackLvl} magic={magicLvl} ranged={rangedLvl} />

                        <DefensiveCard
                            defence={defenceLvl}
                            armour={armourLvl}
                            affMelee={affMelee}
                            affMagic={affMagic}
                            affRanged={affRanged}
                        />

                        <DamageCard
                            maxMelee={maxMelee}
                            maxMagic={maxMagic}
                            maxRanged={maxRanged}
                            accMelee={accMelee}
                            accMagic={accMagic}
                            accRanged={accRanged}
                        />

                        <XpRewardsCard xpCombat={xpCombat} xpHp={xpHp} wepXp={wepXp} />

                        {(c.slayer_level || c.slayer_experience) && (
                            <SlayerCard level={c.slayer_level} xp={c.slayer_experience} />
                        )}

                        <MetaCard race={race} npcId={npcId} release={release} examine={c.examine} />
                    </div>

                    <Sections row={c} only={['location', 'strategy', 'strategies', 'history', 'lore', 'about']} />

                    <DropsPlaceholder name={c.name} />

                    <a className="wiki-wiki-link" href={c.source_url} target="_blank" rel="noreferrer">
                        View on runescape.wiki ↗
                    </a>
                </div>

                <JsonPane data={c} />
            </div>
        </div>
    );
}

/* ----------- Detail-page components ----------- */

function CreatureHero({ c, race }) {
    return (
        <div className="cr-hero">
            <div className="cr-hero-img">{c.name.charAt(0)}</div>
            <div className="cr-hero-meta">
                <h2 className="cr-hero-name">{c.name}</h2>
                <div className="cr-hero-sub">
                    {race && <span>{race}</span>}
                    {c.combat_level != null && <span>· Combat level <strong>{c.combat_level}</strong></span>}
                    {c.lifepoints != null && <span>· {c.lifepoints.toLocaleString()} LP</span>}
                </div>
                {c.examine && <p className="cr-examine">"{c.examine}"</p>}
                <div className="cr-tags">
                    {c.members === true && <span className="wiki-tag wiki-tag-p2p">Members</span>}
                    {c.members === false && <span className="wiki-tag">F2P</span>}
                    {c.aggressive && <span className="wiki-tag wiki-tag-warn">Aggressive</span>}
                    {c.poisonous && <span className="wiki-tag wiki-tag-warn">Poisonous</span>}
                </div>
            </div>
        </div>
    );
}

function StatBar({ label, value, max, color }) {
    if (value == null) return null;
    const pct = max ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div className="cr-bar">
            <div className="cr-bar-row">
                <span className="cr-bar-label">{label}</span>
                <span className="cr-bar-value">{value.toLocaleString()}</span>
            </div>
            <div className="cr-bar-track">
                <div className="cr-bar-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
        </div>
    );
}

function CombatProfileCard({ level, lifepoints, speed, maxSpec }) {
    return (
        <Card title="Combat profile">
            <div className="cr-kv-list">
                {level != null && <KV label="Combat level" value={level} />}
                {lifepoints != null && <KV label="Lifepoints" value={lifepoints.toLocaleString()} accent="lp" />}
                {speed && <KV label="Attack speed" value={speed} />}
                {maxSpec && <KV label="Max special" value={maxSpec} />}
            </div>
        </Card>
    );
}

function OffensiveCard({ attack, magic, ranged }) {
    if (attack == null && magic == null && ranged == null) return null;
    const max = Math.max(attack || 0, magic || 0, ranged || 0, 99);
    return (
        <Card title="Offensive levels" accent="offense">
            <StatBar label="Attack" value={attack} max={max} color="#d97373" />
            <StatBar label="Magic"  value={magic}  max={max} color="#82a4d9" />
            <StatBar label="Ranged" value={ranged} max={max} color="#7bd982" />
        </Card>
    );
}

function DefensiveCard({ defence, armour, affMelee, affMagic, affRanged }) {
    if (defence == null && armour == null && affMelee == null && affMagic == null && affRanged == null) return null;
    return (
        <Card title="Defensive profile" accent="defense">
            {defence != null && <KV label="Defence level" value={defence} />}
            {armour != null && <KV label="Armour rating" value={armour.toLocaleString()} />}
            {(affMelee != null || affMagic != null || affRanged != null) && (
                <>
                    <div className="cr-section-label">Affinity (% damage taken)</div>
                    <div className="cr-aff-row">
                        <AffBlock label="Melee"  value={affMelee} color="#d97373" />
                        <AffBlock label="Magic"  value={affMagic} color="#82a4d9" />
                        <AffBlock label="Ranged" value={affRanged} color="#7bd982" />
                    </div>
                </>
            )}
        </Card>
    );
}

function AffBlock({ label, value, color }) {
    if (value == null) return null;
    return (
        <div className="cr-aff" style={{ borderColor: color }}>
            <span className="cr-aff-label">{label}</span>
            <span className="cr-aff-value">{value}%</span>
        </div>
    );
}

function DamageCard({ maxMelee, maxMagic, maxRanged, accMelee, accMagic, accRanged }) {
    if (maxMelee == null && maxMagic == null && maxRanged == null) return null;
    return (
        <Card title="Damage output" accent="damage">
            <div className="cr-section-label">Max hit per style</div>
            <div className="cr-dmg-row">
                <DmgBlock label="Melee"  value={maxMelee}  accuracy={accMelee}  color="#d97373" />
                <DmgBlock label="Magic"  value={maxMagic}  accuracy={accMagic}  color="#82a4d9" />
                <DmgBlock label="Ranged" value={maxRanged} accuracy={accRanged} color="#7bd982" />
            </div>
        </Card>
    );
}

function DmgBlock({ label, value, accuracy, color }) {
    if (value == null) return null;
    return (
        <div className="cr-dmg" style={{ borderColor: color }}>
            <span className="cr-dmg-label" style={{ color }}>{label}</span>
            <span className="cr-dmg-value">{value.toLocaleString()}</span>
            {accuracy != null && <span className="cr-dmg-acc">Accuracy {accuracy.toLocaleString()}</span>}
        </div>
    );
}

function XpRewardsCard({ xpCombat, xpHp, wepXp }) {
    if (!xpCombat && !xpHp && !wepXp) return null;
    return (
        <Card title="XP rewards per kill" accent="xp">
            {xpCombat != null && <KV label="Combat XP" value={xpCombat.toLocaleString()} />}
            {xpHp != null && <KV label="Constitution XP" value={xpHp.toLocaleString()} />}
            {wepXp && <KV label="Weapon XP" value={wepXp} />}
        </Card>
    );
}

function SlayerCard({ level, xp }) {
    return (
        <Card title="Slayer" accent="slayer">
            {level != null && <KV label="Slayer level" value={level} />}
            {xp != null && <KV label="Slayer XP" value={xp} />}
        </Card>
    );
}

function MetaCard({ race, npcId, release, examine }) {
    if (!race && !npcId && !release) return null;
    return (
        <Card title="Meta">
            {race && <KV label="Race" value={race} />}
            {npcId && <KV label="NPC ID" value={npcId} />}
            {release && <KV label="Released" value={release} />}
        </Card>
    );
}

function DropsPlaceholder({ name }) {
    return (
        <section className="cr-card cr-drops">
            <h3 className="cr-card-title">Drop table</h3>
            <p className="cr-empty-drops">
                Drop data isn't joined to the bestiary catalogue yet — we'd need to cross-reference with the existing
                ItemDrop table. <strong>Next step</strong>: link drops to <em>{name}</em> from the item catalogue so this
                section shows item / quantity / rarity / GE price.
            </p>
        </section>
    );
}
