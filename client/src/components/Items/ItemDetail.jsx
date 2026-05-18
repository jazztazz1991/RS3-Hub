import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import './ItemDetail.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

function YesNo({ value }) {
    if (value === true) return <span className="yn-yes">Yes</span>;
    if (value === false) return <span className="yn-no">No</span>;
    return <span className="yn-unknown">—</span>;
}

function fmtCoins(n) {
    if (n == null) return '—';
    return n.toLocaleString() + ' coins';
}

function fmtNum(n) {
    if (n == null) return '—';
    return n.toLocaleString();
}

function fmtPct(f) {
    if (f == null) return '—';
    return (f * 100).toFixed(1) + '%';
}

// 3-state cyclic sort: null → asc → desc → null.
// columns: { [key]: (row) => sortValue }   — sortValue is null/undefined treated as last.
function useTableSort(columns) {
    const [sort, setSort] = useState({ key: null, direction: null });
    const toggle = (key) => {
        setSort(prev => {
            if (prev.key !== key) return { key, direction: 'asc' };
            if (prev.direction === 'asc') return { key, direction: 'desc' };
            return { key: null, direction: null };
        });
    };
    const sortRows = (rows) => {
        if (!sort.key || !sort.direction) return rows;
        const getVal = columns[sort.key];
        if (!getVal) return rows;
        const dir = sort.direction === 'asc' ? 1 : -1;
        return [...rows].sort((a, b) => {
            const va = getVal(a), vb = getVal(b);
            // null/undefined sort to the bottom regardless of direction
            if (va == null && vb == null) return 0;
            if (va == null) return 1;
            if (vb == null) return -1;
            if (typeof va === 'string' && typeof vb === 'string') {
                return va.localeCompare(vb) * dir;
            }
            return ((va > vb) - (va < vb)) * dir;
        });
    };
    const indicator = (key) => {
        if (sort.key !== key) return '↕';
        return sort.direction === 'asc' ? '▲' : '▼';
    };
    return { sort, toggle, sortRows, indicator };
}

function SortableTh({ label, sortKey, sortable, sort, onClick, indicator }) {
    if (!sortable) return <th>{label}</th>;
    const active = sort.key === sortKey && sort.direction != null;
    return (
        <th
            className={`idetail-th-sortable${active ? ' idetail-th-active' : ''}`}
            onClick={() => onClick(sortKey)}
        >
            {label} <span className="idetail-sort-indicator">{indicator(sortKey)}</span>
        </th>
    );
}

function Section({ title, children, empty }) {
    return (
        <section className="idetail-section">
            <h2 className="idetail-section-title">{title}</h2>
            {empty ? <p className="idetail-empty">Not yet available for this item.</p> : children}
        </section>
    );
}

function InfoboxRow({ label, children }) {
    return (
        <div className="idetail-infobox-row">
            <div className="idetail-infobox-label">{label}</div>
            <div className="idetail-infobox-value">{children}</div>
        </div>
    );
}

function Infobox({ item }) {
    return (
        <aside className="idetail-infobox">
            <div className="idetail-infobox-header">{item.name}</div>
            {item.image_url && (
                <div className="idetail-infobox-image">
                    <img src={item.image_url} alt={item.name} />
                </div>
            )}

            <div className="idetail-infobox-group">
                <InfoboxRow label="Release">{item.release_date || '—'}</InfoboxRow>
                <InfoboxRow label="Members"><YesNo value={item.members} /></InfoboxRow>
                <InfoboxRow label="Quest item"><YesNo value={item.quest_item} /></InfoboxRow>
            </div>

            <div className="idetail-infobox-group-header">Properties</div>
            <div className="idetail-infobox-group">
                <InfoboxRow label="Tradeable"><YesNo value={item.tradeable} /></InfoboxRow>
                <InfoboxRow label="Equipable"><YesNo value={item.equipable} /></InfoboxRow>
                <InfoboxRow label="Stackable"><YesNo value={item.stackable} /></InfoboxRow>
                <InfoboxRow label="Disassembly"><YesNo value={item.disassemblable} /></InfoboxRow>
                <InfoboxRow label="Noteable"><YesNo value={item.noteable} /></InfoboxRow>
                <InfoboxRow label="Destroy">{item.destroy_method || '—'}</InfoboxRow>
                <InfoboxRow label="Examine">{item.examine_text || '—'}</InfoboxRow>
            </div>

            {item.backpack_options?.length > 0 && (
                <>
                    <div className="idetail-infobox-group-header">Options</div>
                    <div className="idetail-infobox-group">
                        <InfoboxRow label="Backpack">{item.backpack_options.join(', ')}</InfoboxRow>
                    </div>
                </>
            )}

            <div className="idetail-infobox-group-header">Values</div>
            <div className="idetail-infobox-group">
                <InfoboxRow label="Value">{fmtCoins(item.ge_value)}</InfoboxRow>
                <InfoboxRow label="High alch">{fmtCoins(item.high_alch)}</InfoboxRow>
                <InfoboxRow label="Low alch">{fmtCoins(item.low_alch)}</InfoboxRow>
                {(item.on_death_value != null || item.on_death_cost != null) && (
                    <InfoboxRow label="On death">
                        <div>{item.on_death_reclaimable ? 'Reclaimable' : '—'}</div>
                        {item.on_death_value != null && <div>Value: {fmtNum(item.on_death_value)}</div>}
                        {item.on_death_cost != null && <div>Reclaim: {fmtNum(item.on_death_cost)}</div>}
                    </InfoboxRow>
                )}
                <InfoboxRow label="Weight">{item.weight_kg != null ? `${item.weight_kg} kg` : '—'}</InfoboxRow>
            </div>

            <div className="idetail-infobox-group-header">Grand Exchange</div>
            <div className="idetail-infobox-group">
                <InfoboxRow label="Price">{item.ge_price_current != null ? fmtCoins(item.ge_price_current) : '—'}</InfoboxRow>
                <InfoboxRow label="Buy limit">{fmtNum(item.ge_buy_limit)}</InfoboxRow>
                <InfoboxRow label="Volume">{fmtNum(item.ge_volume_current)}</InfoboxRow>
                {item.ge_price_synced_at && (
                    <InfoboxRow label="Updated">{new Date(item.ge_price_synced_at).toLocaleString()}</InfoboxRow>
                )}
            </div>
        </aside>
    );
}

function MaterialsList({ materials }) {
    if (!materials?.length) return <span className="idetail-empty-inline">—</span>;
    return (
        <ul className="idetail-mat-list">
            {materials.map((m, i) => (
                <li key={i}>
                    {m.quantity ? `${m.quantity} × ` : ''}
                    {m.name}
                    {m.cost != null && <span className="idetail-mat-cost"> ({fmtNum(m.cost)} gp)</span>}
                </li>
            ))}
        </ul>
    );
}

function CreationSection({ recipes }) {
    if (!recipes?.length) return <Section title="Creation" empty />;
    return (
        <Section title="Creation">
            {recipes.map((r, i) => (
                <div key={r.id || i} className="idetail-recipe">
                    {r.variant_label && <h4 className="idetail-recipe-variant">{r.variant_label}</h4>}
                    <table className="idetail-table">
                        <tbody>
                            {r.members_only != null && (
                                <tr><th>Members</th><td><YesNo value={r.members_only} /></td></tr>
                            )}
                            {r.ticks && (
                                <tr><th>Ticks</th><td>{r.ticks}</td></tr>
                            )}
                            {r.skill && (
                                <tr><th>{r.skill}</th><td>Level {r.level ?? '—'} · {r.xp ?? '—'} XP</td></tr>
                            )}
                            <tr><th>Materials</th><td><MaterialsList materials={r.materials} /></td></tr>
                            {r.total_cost != null && (
                                <tr><th>Total cost</th><td>{fmtNum(r.total_cost)} gp</td></tr>
                            )}
                            <tr><th>Output</th><td>{r.output_quantity || 1}</td></tr>
                        </tbody>
                    </table>
                </div>
            ))}
        </Section>
    );
}

function ProductsSection({ products }) {
    if (!products?.length) return <Section title="Products" empty />;
    return (
        <Section title="Products">
            <table className="idetail-table idetail-table-wide">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Skill</th>
                        <th>Level</th>
                        <th>XP</th>
                        <th>Materials</th>
                        <th>GE price</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((p, i) => (
                        <tr key={p.id || i}>
                            <td>
                                {p.output_quantity > 1 ? `${p.output_quantity} × ` : ''}
                                {p.output_item_slug
                                    ? <Link to={`/items/${p.output_item_slug}`}>{p.output_item_name}</Link>
                                    : p.output_item_name}
                            </td>
                            <td>{p.skill || '—'}</td>
                            <td>{p.level ?? '—'}</td>
                            <td>{p.xp ?? '—'}</td>
                            <td><MaterialsList materials={p.materials} /></td>
                            <td>{p.ge_price != null ? fmtNum(p.ge_price) : '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Section>
    );
}

function DisassemblySection({ disassembly }) {
    if (!disassembly) return <Section title="Disassembly" empty />;
    return (
        <Section title="Disassembly">
            <table className="idetail-table">
                <tbody>
                    {disassembly.category && (
                        <tr><th>Category</th><td>{disassembly.category}</td></tr>
                    )}
                    <tr><th>Disassembly XP</th><td>{disassembly.disassembly_xp ?? '—'}</td></tr>
                    <tr><th>Item quantity required</th><td>{disassembly.item_quantity_required ?? 1}</td></tr>
                    <tr><th>Base junk chance</th><td>{fmtPct(disassembly.junk_chance)}</td></tr>
                    <tr><th>Materials</th><td>
                        {disassembly.materials?.length ? (
                            <ul className="idetail-mat-list">
                                {disassembly.materials.map((m, i) => (
                                    <li key={i}>{m.name} — {m.chance_fraction || fmtPct(m.chance)}</li>
                                ))}
                            </ul>
                        ) : '—'}
                    </td></tr>
                </tbody>
            </table>
        </Section>
    );
}

function DropsSection({ drops }) {
    const { sort, toggle, sortRows, indicator } = useTableSort({
        level: (d) => d.source_level,
        quantity: (d) => d.quantity_min,
        rarity: (d) => d.rarity_chance, // smaller = rarer; asc puts rarest first
    });

    const groups = useMemo(() => {
        if (!drops?.length) return {};
        const out = {};
        for (const d of drops) {
            const key = d.variant || 'Drops';
            if (!out[key]) out[key] = [];
            out[key].push(d);
        }
        return out;
    }, [drops]);

    if (!drops?.length) return <Section title="Item sources" empty />;

    return (
        <Section title="Item sources">
            {Object.entries(groups).map(([variant, list]) => (
                <div key={variant}>
                    <h4 className="idetail-recipe-variant">{variant}</h4>
                    <table className="idetail-table idetail-table-wide">
                        <thead>
                            <tr>
                                <th>Source</th>
                                <SortableTh label="Level" sortKey="level" sortable sort={sort} onClick={toggle} indicator={indicator} />
                                <SortableTh label="Quantity" sortKey="quantity" sortable sort={sort} onClick={toggle} indicator={indicator} />
                                <SortableTh label="Rarity" sortKey="rarity" sortable sort={sort} onClick={toggle} indicator={indicator} />
                            </tr>
                        </thead>
                        <tbody>
                            {sortRows(list).map((d, i) => (
                                <tr key={d.id || i}>
                                    <td>{d.source_name}</td>
                                    <td>{d.source_level ?? '—'}</td>
                                    <td>
                                        {d.quantity_min == null
                                            ? '—'
                                            : d.quantity_min === d.quantity_max
                                                ? d.quantity_min
                                                : `${d.quantity_min}–${d.quantity_max}`}
                                        {d.noted ? ' (noted)' : ''}
                                    </td>
                                    <td>{d.rarity_text || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </Section>
    );
}

function ShopsSection({ shops }) {
    const { sort, toggle, sortRows, indicator } = useTableSort({
        stock: (s) => s.stock,
        sold: (s) => s.sold_price,
        bought: (s) => s.bought_price,
    });

    if (!shops?.length) return <Section title="Shop locations" empty />;

    return (
        <Section title="Shop locations">
            <table className="idetail-table idetail-table-wide">
                <thead>
                    <tr>
                        <th>Seller</th>
                        <th>Location</th>
                        <SortableTh label="Stock" sortKey="stock" sortable sort={sort} onClick={toggle} indicator={indicator} />
                        <SortableTh label="Sold at" sortKey="sold" sortable sort={sort} onClick={toggle} indicator={indicator} />
                        <SortableTh label="Bought at" sortKey="bought" sortable sort={sort} onClick={toggle} indicator={indicator} />
                    </tr>
                </thead>
                <tbody>
                    {sortRows(shops).map((s, i) => (
                        <tr key={s.id || i}>
                            <td>
                                {s.seller_name}
                                {s.requirements && <span className="idetail-shop-req"> ({s.requirements})</span>}
                            </td>
                            <td>{s.location || '—'}</td>
                            <td>{s.stock ?? '—'}</td>
                            <td>{s.sold_price != null ? fmtNum(s.sold_price) : '—'}</td>
                            <td>{s.bought_price != null ? fmtNum(s.bought_price) : '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Section>
    );
}

export default function ItemDetail() {
    const { slug } = useParams();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        fetch(`${API_BASE}/api/items/${slug}`, { credentials: 'include' })
            .then(async (res) => {
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.message || `Request failed (${res.status})`);
                }
                return res.json();
            })
            .then((data) => { if (!cancelled) setItem(data); })
            .catch((err) => { if (!cancelled) setError(err.message); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [slug]);

    if (loading) return <div className="idetail-loading">Loading item…</div>;
    if (error) return <div className="idetail-error">Error: {error}</div>;
    if (!item) return <div className="idetail-error">Item not found.</div>;

    return (
        <div className="idetail">
            <div className="idetail-header">
                <h1>{item.name}</h1>
                {item.description && <p className="idetail-description">{item.description}</p>}
            </div>

            <div className="idetail-body">
                <Infobox item={item} />

                <div className="idetail-main">
                    <CreationSection recipes={item.recipes} />
                    <ProductsSection products={item.products} />
                    <DisassemblySection disassembly={item.disassembly} />
                    <DropsSection drops={item.drops} />
                    <ShopsSection shops={item.shops} />
                </div>
            </div>
        </div>
    );
}
