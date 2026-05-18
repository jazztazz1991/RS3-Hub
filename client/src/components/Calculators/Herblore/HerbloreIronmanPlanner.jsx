import { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Save chances for v1. Approximations — Botanist's mask only fires at the
// unfinished-making step and Scroll of Cleansing at the finished-mixing step.
// Heuristic application by name pattern is close enough for shopping-list
// planning; off by a couple percent from theoretical.
const SAVE_CHANCE_SCROLL = 0.125;   // Scroll of Cleansing → secondaries
const SAVE_CHANCE_MASK = 0.05;      // Botanist's mask → clean herbs at unfinished step

function isHerb(name) { return /^(Clean|Grimy) /i.test(name); }
function isVial(name) { return /vial/i.test(name); }

// Classify a node into a named group based on its name. Used to organize the
// inventory UI into collapsible sub-sections that map to the player's
// mental model (Extremes, Supers, Unfinished, Clean herbs, etc.).
function classifyGroup(name, type) {
    const n = name || '';
    if (type === 'target') return 'Final';
    if (/^Extreme /i.test(n)) return 'Extreme potions';
    if (/^Super /i.test(n)) return 'Super potions';
    if (/\(unfinished\)/i.test(n)) return 'Unfinished potions';
    if (/^Clean /i.test(n)) return 'Clean herbs';
    if (/^Grimy /i.test(n)) return 'Grimy herbs';
    if (/^Ground /i.test(n)) return 'Ground runes';
    if (/vial/i.test(n)) return 'Vials';
    if (type === 'leaf') return 'Secondaries';
    return 'Other intermediates';
}

// Display order for groups (top → bottom in the UI).
const GROUP_ORDER = [
    'Final',
    'Extreme potions',
    'Super potions',
    'Other intermediates',
    'Unfinished potions',
    'Ground runes',
    'Clean herbs',
    'Grimy herbs',
    'Secondaries',
    'Vials',
];

// Default-open state per group. Groups likely to have data the user already
// owns are open; deep prep tiers are collapsed.
const GROUP_DEFAULT_OPEN = {
    'Final': true,
    'Extreme potions': true,
    'Super potions': true,
    'Other intermediates': true,
    'Unfinished potions': false,
    'Ground runes': false,
    'Clean herbs': false,
    'Grimy herbs': true,
    'Secondaries': true,
    'Vials': true,
};

function fmtTime(seconds) {
    if (!seconds || !isFinite(seconds)) return '—';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.round(seconds % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function fmtNum(n) {
    if (n == null || !isFinite(n)) return '—';
    return Math.round(n).toLocaleString();
}

function parseBaseTicks(ticksText) {
    if (!ticksText) return 2;
    const m = String(ticksText).match(/^\s*(\d+)/);
    return m ? parseInt(m[1], 10) : 2;
}

// Banking overhead per action. RS3 standard backpack of 14 + ~3 ticks per
// trip = ~0.129s per action of banking. 1-tick brewing uses a portable
// well + Make-Each which integrates the banking, so no overhead in that mode.
// RS3 backpack default = 28 slots. Per-trip bank cost amortised across all
// 28 actions you can do between bank trips.
const BANK_TICKS_PER_TRIP = 3;
const INVENTORY_SIZE = 28;
function secondsPerActionWithBanking(ticks, oneTick) {
    const make = ticks * 0.6;
    if (oneTick) return make; // portable well rotation, no per-trip banking
    return make + (BANK_TICKS_PER_TRIP * 0.6 / INVENTORY_SIZE);
}

// Total seconds of Herblore actions needed to produce 1 unit of the target
// from scratch (assuming no inventory). Walks the tree summing each recipe
// node's executions × secondsPerActionWithBanking. Leaf gather time isn't
// included — leaves are gathered via other skills, not Herblore.
function computePerTargetTime(tree, oneTick) {
    if (!tree?.recipe) return 0;
    let total = 0;

    function walk(node, execsPerTarget) {
        if (!node?.recipe) return;
        const baseTicks = parseBaseTicks(node.recipe.ticks);
        const ticks = oneTick ? 1 : baseTicks;
        total += execsPerTarget * secondsPerActionWithBanking(ticks, oneTick);
        for (const mat of node.materials || []) {
            if (mat.child) {
                const childOutput = mat.child.recipe?.output_quantity || 1;
                walk(mat.child, execsPerTarget * mat.quantity / childOutput);
            }
            // leaves contribute no Herblore time
        }
    }

    const rootOutput = tree.recipe.output_quantity || 1;
    walk(tree, 1 / rootOutput);
    return total;
}

// Walk the tree once, producing:
//   nodes: deduped list of every distinct item (by canonical slug or name) with
//          { key, slug, name, image_url, type: 'target'|'intermediate'|'leaf', depth }
//   maxDepth: the deepest level reached (used for auto-detailed-mode)
function flattenTree(root) {
    if (!root) return { nodes: [], maxDepth: 0 };
    const seen = new Map();
    let maxDepth = 0;

    function visit(node, depth, isRoot) {
        if (!node) return;
        const key = node.item?.slug || node.name || node.slug;
        if (!key) return;
        maxDepth = Math.max(maxDepth, depth);

        // Classify. A node is a LEAF if it has no usable Herblore recipe;
        // INTERMEDIATE if it does have one (and isn't the root); TARGET if root.
        const hasRecipe = !!node.recipe;
        const type = isRoot
            ? 'target'
            : (hasRecipe && node.materials?.length ? 'intermediate' : 'leaf');

        const existing = seen.get(key);
        if (!existing) {
            seen.set(key, {
                key,
                slug: node.item?.slug || null,
                name: node.item?.name || node.name,
                image_url: node.item?.image_url || null,
                type,
                depth,
            });
        } else {
            // Prefer shallowest depth for ordering; keep image if newer node has one
            if (depth < existing.depth) existing.depth = depth;
            if (!existing.image_url && node.item?.image_url) existing.image_url = node.item.image_url;
            // If we ever see it both as intermediate and leaf in different paths, prefer intermediate
            if (existing.type === 'leaf' && type === 'intermediate') existing.type = 'intermediate';
        }

        // Recurse into materials. For leaves embedded as {leaf:true, item}, no recursion.
        for (const mat of node.materials || []) {
            if (mat.leaf) {
                const matKey = mat.item?.slug || mat.name;
                if (!matKey) continue;
                if (!seen.has(matKey)) {
                    seen.set(matKey, {
                        key: matKey,
                        slug: mat.item?.slug || null,
                        name: mat.item?.name || mat.name,
                        image_url: mat.item?.image_url || null,
                        type: 'leaf',
                        depth: depth + 1,
                    });
                }
                maxDepth = Math.max(maxDepth, depth + 1);
            } else if (mat.child) {
                visit(mat.child, depth + 1, false);
            }
        }
    }

    visit(root, 0, true);
    return { nodes: Array.from(seen.values()), maxDepth };
}

// Top-down inventory-absorbing walk. At each node, before propagating demand
// to its children, consume from inventory. Surplus inventory is wasted (no
// upstream credit — matches "warn but don't credit").
//
// Returns:
//   gatherList:  per-leaf-slug { quantity needed after inventory + saves }
//   surplus:     per-slug { quantity of unused inventory } (for warnings)
//   totalXp / targetXp / prepXp
function computePlan({ tree, targetQty, inventory, scrollCleansing, botanistMask }) {
    const emptyResult = {
        gatherList: new Map(),
        grossDemand: new Map(),
        surplus: new Map(),
        totalXp: 0,
        targetXp: 0,
        prepXp: 0,
    };
    if (!tree || !targetQty) return emptyResult;

    const remaining = {};
    for (const [k, v] of Object.entries(inventory || {})) {
        const n = Number(v) || 0;
        if (n > 0) remaining[k] = n;
    }

    const gatherList = new Map(); // slug -> { name, slug, image_url, quantity }
    // grossDemand = demand passed to this node from parents (post upstream
    // inventory absorption, pre this node's own absorption). Stable as the
    // user enters inventory at this node — denominator for display.
    const grossDemand = new Map();
    let totalXp = 0;
    let targetXp = 0;

    function walk(node, need, isRoot) {
        if (need <= 0 || !node) return;
        const slug = node.item?.slug || node.name;
        // Record GROSS demand before absorbing this node's inventory.
        grossDemand.set(slug, (grossDemand.get(slug) || 0) + need);
        // Absorb from inventory at this node
        const have = remaining[slug] || 0;
        const absorbed = Math.min(need, have);
        if (absorbed > 0) remaining[slug] = have - absorbed;
        const net = need - absorbed;
        if (net <= 0) return; // fully covered

        // Leaf: record gather demand and stop
        if (!node.recipe || !node.materials?.length) {
            const adjusted = applySaveChance(node, net, scrollCleansing, botanistMask);
            const key = slug;
            const existing = gatherList.get(key);
            if (existing) existing.quantity += adjusted;
            else gatherList.set(key, {
                key,
                slug: node.item?.slug || null,
                name: node.item?.name || node.name,
                image_url: node.item?.image_url || null,
                quantity: adjusted,
            });
            return;
        }

        // Intermediate / target: count XP and recurse
        const execs = net / (node.recipe.output_quantity || 1);
        const earned = (node.recipe.xp || 0) * execs;
        totalXp += earned;
        if (isRoot) targetXp += earned;

        for (const mat of node.materials) {
            const subNeed = mat.quantity * execs;
            if (mat.leaf) {
                const leafNode = {
                    item: mat.item,
                    name: mat.name,
                    recipe: null,
                    materials: [],
                };
                walk(leafNode, subNeed, false);
            } else if (mat.child) {
                walk(mat.child, subNeed, false);
            }
        }
    }

    walk(tree, targetQty, true);

    // Surplus = remaining > 0 means user had more than was demanded by the tree
    const surplus = new Map();
    for (const [slug, qty] of Object.entries(remaining)) {
        const initial = Number(inventory[slug]) || 0;
        if (qty > 0 && initial > 0) {
            surplus.set(slug, qty);
        }
    }

    // Ceil gather quantities so user always has at least enough
    for (const m of gatherList.values()) m.quantity = Math.ceil(m.quantity);
    // Round gross demands for display
    for (const [k, v] of grossDemand.entries()) grossDemand.set(k, Math.ceil(v));

    return { gatherList, grossDemand, surplus, totalXp, targetXp, prepXp: totalXp - targetXp };
}

function applySaveChance(node, qty, scrollCleansing, botanistMask) {
    const name = node.item?.name || node.name || '';
    if (scrollCleansing && !isHerb(name) && !isVial(name)) {
        return qty * (1 - SAVE_CHANCE_SCROLL);
    }
    if (botanistMask && isHerb(name)) {
        return qty * (1 - SAVE_CHANCE_MASK);
    }
    return qty;
}

export default function HerbloreIronmanPlanner() {
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [target, setTarget] = useState(null);
    const [tree, setTree] = useState(null);
    const [loadingTree, setLoadingTree] = useState(false);
    const [treeError, setTreeError] = useState(null);

    const [mode, setMode] = useState('quantity');
    const [quantity, setQuantity] = useState(100);
    const [hours, setHours] = useState(1);
    const [minutes, setMinutes] = useState(0);
    // 'target' = time at the final-step only (assumes prep is done).
    // 'fullChain' = total time including making every intermediate from scratch.
    const [timeScope, setTimeScope] = useState('target');

    const [oneTick, setOneTick] = useState(false);
    const [scrollCleansing, setScrollCleansing] = useState(false);
    const [botanistMask, setBotanistMask] = useState(false);

    const [inventory, setInventory] = useState({});

    // Detailed mode: shows ALL tree nodes as inventory inputs (target +
    // intermediates + leaves). Auto-toggled based on tree depth.
    const [detailedMode, setDetailedMode] = useState(false);
    const [userOverrodeDetailed, setUserOverrodeDetailed] = useState(false);

    // Search items by name
    useEffect(() => {
        if (search.length < 2) { setSearchResults([]); return; }
        let cancelled = false;
        const t = setTimeout(() => {
            const params = new URLSearchParams();
            params.set('q', search);
            params.set('limit', '15');
            fetch(`${API_BASE}/api/items?${params.toString()}`)
                .then(r => r.json())
                .then(d => { if (!cancelled) setSearchResults(d.results || []); })
                .catch(() => { if (!cancelled) setSearchResults([]); });
        }, 250);
        return () => { cancelled = true; clearTimeout(t); };
    }, [search]);

    // Load tree when target picked
    useEffect(() => {
        if (!target) { setTree(null); return; }
        let cancelled = false;
        setLoadingTree(true);
        setTreeError(null);
        fetch(`${API_BASE}/api/items/${target.slug}/recipe-tree?depth=5&skill=Herblore`)
            .then(async r => {
                if (!r.ok) {
                    const d = await r.json().catch(() => ({}));
                    throw new Error(d.message || `Failed (${r.status})`);
                }
                return r.json();
            })
            .then(d => { if (!cancelled) setTree(d); })
            .catch(err => { if (!cancelled) setTreeError(err.message); })
            .finally(() => { if (!cancelled) setLoadingTree(false); });
        return () => { cancelled = true; };
    }, [target]);

    // Reset inventory + detailed override when target changes
    useEffect(() => {
        setInventory({});
        setUserOverrodeDetailed(false);
    }, [target]);

    // Flatten tree to a deduped node list
    const flat = useMemo(() => flattenTree(tree), [tree]);

    // Auto-detect detailed mode based on tree depth (≥3 levels deep = complex)
    useEffect(() => {
        if (!flat.nodes.length || userOverrodeDetailed) return;
        setDetailedMode(flat.maxDepth >= 3);
    }, [flat.maxDepth, flat.nodes.length, userOverrodeDetailed]);

    // Per-target full-chain time (seconds of Herblore actions per 1 target unit).
    const perTargetTime = useMemo(
        () => computePerTargetTime(tree, oneTick),
        [tree, oneTick]
    );

    // Compute target quantity (from quantity input OR derived from time).
    // In time mode, the time scope determines which math to use.
    const targetQty = useMemo(() => {
        if (mode === 'quantity') return Math.max(0, quantity);
        if (!tree?.recipe?.ticks) return 0;
        const totalSeconds = (hours * 3600) + (minutes * 60);

        if (timeScope === 'fullChain') {
            if (!perTargetTime) return 0;
            return Math.floor(totalSeconds / perTargetTime);
        }
        // 'target' scope — only the final step
        const baseTicks = parseBaseTicks(tree.recipe.ticks);
        const actualTicks = oneTick ? 1 : baseTicks;
        const secondsPerAction = secondsPerActionWithBanking(actualTicks, oneTick);
        const outputPer = tree.recipe.output_quantity || 1;
        return Math.floor((totalSeconds / secondsPerAction) * outputPer);
    }, [mode, quantity, hours, minutes, oneTick, timeScope, tree, perTargetTime]);

    // Top-down inventory-absorbing plan
    const plan = useMemo(() => computePlan({
        tree,
        targetQty,
        inventory,
        scrollCleansing,
        botanistMask,
    }), [tree, targetQty, inventory, scrollCleansing, botanistMask]);

    // Time required (when in quantity mode). Same scope toggle controls
    // whether this is just final-step time or full-chain time.
    const timeRequiredSeconds = useMemo(() => {
        if (mode !== 'quantity' || !tree?.recipe?.ticks) return null;
        const have = Number(inventory[tree.item?.slug || tree.name]) || 0;
        const netTargetUnits = Math.max(0, targetQty - have);

        if (timeScope === 'fullChain') {
            // Full chain time ignores intermediate-level inventory for
            // simplicity (would need iterative solving otherwise). It does
            // account for any inventory at the target itself.
            return netTargetUnits * perTargetTime;
        }
        const netActions = netTargetUnits / (tree.recipe.output_quantity || 1);
        const baseTicks = parseBaseTicks(tree.recipe.ticks);
        const actualTicks = oneTick ? 1 : baseTicks;
        return secondsPerActionWithBanking(actualTicks, oneTick) * netActions;
    }, [mode, tree, targetQty, oneTick, inventory, timeScope, perTargetTime]);

    const handleInvChange = (key, val) => {
        setInventory(prev => {
            const next = { ...prev };
            if (val === '' || val === null) delete next[key];
            else next[key] = val;
            return next;
        });
    };

    // Group nodes by semantic class (Extreme potions, Super potions, etc.).
    // Returns: [{ name, nodes, isLeafGroup }] in display order.
    const semanticGroups = useMemo(() => {
        const map = new Map();
        for (const n of flat.nodes) {
            const groupName = classifyGroup(n.name, n.type);
            if (!map.has(groupName)) map.set(groupName, []);
            map.get(groupName).push(n);
        }
        const out = [];
        for (const name of GROUP_ORDER) {
            if (!map.has(name)) continue;
            const nodes = map.get(name).sort((a, b) => a.depth - b.depth || a.name.localeCompare(b.name));
            const isLeafGroup = nodes.every(n => n.type === 'leaf');
            out.push({ name, nodes, isLeafGroup });
        }
        // Catch any group not in GROUP_ORDER (defensive)
        for (const [name, nodes] of map.entries()) {
            if (GROUP_ORDER.includes(name)) continue;
            out.push({
                name,
                nodes: nodes.sort((a, b) => a.name.localeCompare(b.name)),
                isLeafGroup: nodes.every(n => n.type === 'leaf'),
            });
        }
        return out;
    }, [flat.nodes]);

    return (
        <div className="herblore-planner">
            <h3>Ironman Planner</h3>
            <p className="planner-sub">
                Pick a target potion, choose quantity or time, fill in what you already have,
                and get a flat list of what's left to gather.
            </p>

            {/* TARGET */}
            <div className="planner-section">
                <label className="planner-label">Target potion</label>
                {!target && (
                    <>
                        <input
                            className="planner-search"
                            placeholder="Search potions (e.g. Overload, Super restore)..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                        {searchResults.length > 0 && (
                            <ul className="planner-results">
                                {searchResults.map(r => (
                                    <li key={r.id} onClick={() => { setTarget(r); setSearch(''); setSearchResults([]); }}>
                                        {r.image_url && <img src={r.image_url} alt="" loading="lazy" />}
                                        <span>{r.name}</span>
                                        {r.members && <span className="planner-mem">M</span>}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
                {target && (
                    <div className="planner-target-pill">
                        {target.image_url && <img src={target.image_url} alt={target.name} />}
                        <span>{target.name}</span>
                        <button onClick={() => setTarget(null)}>Change</button>
                    </div>
                )}
                {loadingTree && <div className="planner-status">Loading recipe tree…</div>}
                {treeError && <div className="planner-error">Error: {treeError}</div>}
                {tree && tree.recipe && (
                    <div className="planner-recipe-summary">
                        {tree.recipe.skill} L{tree.recipe.level} · {tree.recipe.xp} XP ·
                        {' '}{tree.recipe.ticks || '— ticks'} ·
                        {' '}Makes {tree.recipe.output_quantity || 1} per action
                    </div>
                )}
            </div>

            {tree && (
                <>
                    {/* GOAL */}
                    <div className="planner-section">
                        <label className="planner-label">Goal</label>
                        <div className="planner-mode-toggle">
                            <button className={mode === 'quantity' ? 'active' : ''} onClick={() => setMode('quantity')}>By quantity</button>
                            <button className={mode === 'time' ? 'active' : ''} onClick={() => setMode('time')}>By time</button>
                        </div>
                        {mode === 'quantity' ? (
                            <div className="planner-input-row">
                                <label>Make</label>
                                <input type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 0)} />
                                <span>× {target?.name}</span>
                            </div>
                        ) : (
                            <div className="planner-input-row">
                                <label>For</label>
                                <input type="number" min="0" value={hours} onChange={e => setHours(parseInt(e.target.value) || 0)} />
                                <span>h</span>
                                <input type="number" min="0" max="59" value={minutes} onChange={e => setMinutes(parseInt(e.target.value) || 0)} />
                                <span>m</span>
                            </div>
                        )}

                        <div className="planner-time-scope">
                            <span className="planner-time-scope-label">Time scope:</span>
                            <div className="planner-mode-toggle">
                                <button
                                    className={timeScope === 'target' ? 'active' : ''}
                                    onClick={() => setTimeScope('target')}
                                    title="Time for the final-step action only — assumes all sub-potions and clean herbs are already prepped"
                                >From bank</button>
                                <button
                                    className={timeScope === 'fullChain' ? 'active' : ''}
                                    onClick={() => setTimeScope('fullChain')}
                                    title="Total time including every intermediate step (Extremes, Supers, Unfinished, cleaning herbs). Realistic for ironmen starting from raw herbs."
                                >From scratch</button>
                            </div>
                            <span className="planner-hint">
                                Includes ~3 ticks/inventory of banking unless 1-tick brewing is on.
                            </span>
                        </div>
                    </div>

                    {/* BOOSTS */}
                    <div className="planner-section">
                        <label className="planner-label">Boosts (optional)</label>
                        <div className="planner-checks">
                            <label>
                                <input type="checkbox" checked={oneTick} onChange={e => setOneTick(e.target.checked)} />
                                1-tick brewing (Portable well + Make-Each) — half time
                            </label>
                            <label>
                                <input type="checkbox" checked={scrollCleansing} onChange={e => setScrollCleansing(e.target.checked)} />
                                Scroll of Cleansing — 12.5% chance to save secondary
                            </label>
                            <label>
                                <input type="checkbox" checked={botanistMask} onChange={e => setBotanistMask(e.target.checked)} />
                                Botanist's mask — 5% chance to save clean herbs
                            </label>
                        </div>
                    </div>

                    {/* INVENTORY */}
                    <div className="planner-section">
                        <div className="planner-inv-header">
                            <label className="planner-label">Starting inventory</label>
                            <label className="planner-detailed-toggle">
                                <input
                                    type="checkbox"
                                    checked={detailedMode}
                                    onChange={e => { setDetailedMode(e.target.checked); setUserOverrodeDetailed(true); }}
                                />
                                Detailed inventory
                                <span className="planner-hint">(include partly-made potions + clean herbs)</span>
                            </label>
                        </div>
                        <p className="planner-sub planner-sub-small">
                            Type how many you already have. Defaults to 0.
                            {detailedMode && ' Anything entered for an intermediate skips making that step from scratch.'}
                        </p>

                        {(targetQty === 0 || semanticGroups.length === 0) ? (
                            <span className="planner-empty">
                                {mode === 'quantity'
                                    ? 'Set a quantity above to see materials.'
                                    : 'Set a non-zero time above to see materials.'}
                            </span>
                        ) : (
                            semanticGroups
                                // In non-detailed mode, only show leaf groups (gather-level).
                                .filter(g => detailedMode || g.isLeafGroup)
                                .map(group => (
                                    <InvGroup
                                        key={group.name}
                                        name={group.name}
                                        nodes={group.nodes}
                                        inventory={inventory}
                                        onChange={handleInvChange}
                                        plan={plan}
                                        targetQty={targetQty}
                                        target={target}
                                    />
                                ))
                        )}
                    </div>

                    {/* SHOPPING LIST */}
                    <div className="planner-section">
                        <label className="planner-label">Shopping list (what you still need to gather)</label>
                        {Array.from(plan.gatherList.values()).filter(m => m.quantity > 0).length === 0 ? (
                            <p className="planner-empty">Nothing to gather — your inventory covers the target.</p>
                        ) : (
                            <table className="planner-table">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Material</th>
                                        <th>To gather</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from(plan.gatherList.values())
                                        .filter(m => m.quantity > 0)
                                        .sort((a, b) => b.quantity - a.quantity)
                                        .map(m => (
                                            <tr key={m.key}>
                                                <td>{m.image_url && <img src={m.image_url} alt="" className="planner-row-image" />}</td>
                                                <td>{m.slug
                                                    ? <a href={`/items/${m.slug}`} target="_blank" rel="noreferrer">{m.name}</a>
                                                    : m.name}</td>
                                                <td className="planner-need">{fmtNum(m.quantity)}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        )}

                        {plan.surplus.size > 0 && (
                            <div className="planner-warn">
                                <strong>Heads up — surplus inventory:</strong>
                                <ul>
                                    {Array.from(plan.surplus.entries()).map(([slug, qty]) => {
                                        const node = flat.nodes.find(n => n.key === slug);
                                        return (
                                            <li key={slug}>
                                                {fmtNum(qty)} extra {node?.name || slug} — unused for this batch.
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* SUMMARY */}
                    <div className="planner-summary">
                        <div>
                            <span className="planner-summary-label">Total {target?.name}</span>
                            <span className="planner-summary-value">{fmtNum(targetQty)}</span>
                        </div>
                        <div className="planner-summary-tip">
                            <span className="planner-summary-label">
                                Total Herblore XP <span className="planner-info-icon">?</span>
                            </span>
                            <span className="planner-summary-value">{fmtNum(plan.totalXp)}</span>
                            <div className="planner-tooltip">
                                <div>From {target?.name}: <strong>{fmtNum(plan.targetXp)}</strong></div>
                                <div>From prep steps: <strong>{fmtNum(plan.prepXp)}</strong></div>
                                <div className="planner-tooltip-note">
                                    Excludes XP for any steps your inventory already covers.
                                </div>
                            </div>
                        </div>
                        <div>
                            <span className="planner-summary-label">{mode === 'quantity' ? 'Time required' : 'Quantity in window'}</span>
                            <span className="planner-summary-value">
                                {mode === 'quantity' ? fmtTime(timeRequiredSeconds) : fmtNum(targetQty)}
                            </span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// Collapsible inventory group. Uses native <details> so collapse state
// persists via DOM and doesn't require React state per group.
function InvGroup({ name, nodes, inventory, onChange, plan, targetQty, target }) {
    const defaultOpen = GROUP_DEFAULT_OPEN[name] ?? true;

    // Demand per node: gross demand passed from the upstream tree. Stable
    // as the user types — independent of this node's own inventory entry.
    const demandFor = (n) => {
        if (n.type === 'target') return targetQty;
        return plan.grossDemand.get(n.key) || 0;
    };

    // Filter out nodes with 0 demand AND 0 inventory.
    const visible = nodes.filter(n => {
        if (n.type === 'target') return true;
        const have = Number(inventory[n.key]) || 0;
        return demandFor(n) > 0 || have > 0;
    });
    if (!visible.length) return null;

    // Count and total demand for the group header
    const totalDemand = visible.reduce((sum, n) => sum + demandFor(n), 0);

    return (
        <details className="planner-inv-group" open={defaultOpen}>
            <summary className="planner-inv-group-summary">
                <span className="planner-inv-group-name">{name}</span>
                <span className="planner-inv-group-count">
                    {visible.length} {visible.length === 1 ? 'item' : 'items'}
                    {totalDemand > 0 && ` · ${fmtNum(totalDemand)} total`}
                </span>
            </summary>
            <div className="planner-inv-grid">
                {visible.map(n => (
                    <InvRow
                        key={n.key}
                        node={n}
                        qty={inventory[n.key]}
                        onChange={onChange}
                        needTotal={demandFor(n)}
                        surplus={plan.surplus.get(n.key)}
                    />
                ))}
            </div>
        </details>
    );
}

function InvRow({ node, qty, onChange, needTotal, surplus }) {
    const hasSurplus = surplus != null && surplus > 0;
    return (
        <div className={`planner-inv-row ${hasSurplus ? 'planner-inv-row-surplus' : ''}`}>
            {node.image_url
                ? <img src={node.image_url} alt="" loading="lazy" />
                : <span className="planner-inv-image-placeholder">·</span>}
            <span className="planner-inv-name" title={node.name}>{node.name}</span>
            <input
                type="number"
                min="0"
                placeholder="0"
                value={qty ?? ''}
                onChange={e => onChange(node.key, e.target.value)}
            />
            {needTotal != null && (
                <span className="planner-inv-need">/ {fmtNum(needTotal)}</span>
            )}
            {needTotal == null && <span className="planner-inv-need"></span>}
        </div>
    );
}
