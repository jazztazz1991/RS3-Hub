import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SIDEBAR_ITEMS } from '../../data/common/sidebarItems';
import './Sidebar.css';

const Sidebar = () => {
    const { user } = useAuth();
    const location = useLocation();
    const items = useMemo(() =>
        SIDEBAR_ITEMS.filter(item => !item.auth || user), [user]
    );
    const [collapsed, setCollapsed] = useState(() => {
        const stored = localStorage.getItem('sidebarCollapsed');
        return stored ? JSON.parse(stored) : false;
    });

    const toggle = () => {
        setCollapsed(prev => {
            const next = !prev;
            localStorage.setItem('sidebarCollapsed', JSON.stringify(next));
            return next;
        });
    };

    const isActive = (path) => {
        if (path === '/dashboard') return location.pathname === '/dashboard';
        return location.pathname.startsWith(path);
    };

    return (
        <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
            <nav className="sidebar-nav">
                {items.map(item => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`sidebar-item${isActive(item.path) ? ' active' : ''}`}
                        title={collapsed ? item.label : undefined}
                    >
                        <span className="sidebar-item-icon">{item.icon}</span>
                        <span className="sidebar-item-label">{item.label}</span>
                    </Link>
                ))}
            </nav>
            <button className="sidebar-toggle" onClick={toggle} aria-label="Toggle sidebar">
                {collapsed ? '\u276F' : '\u276E'}
            </button>
        </aside>
    );
};

export default Sidebar;
