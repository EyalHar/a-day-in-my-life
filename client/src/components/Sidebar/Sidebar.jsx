import { NavLink, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import styles from './Sidebar.module.css';

const today = format(new Date(), 'yyyy-MM-dd');

const links = [
  { to: `/day/${today}`, label: 'היום', icon: '🏠', match: '/day' },
  { to: '/recipes', label: 'מתכונים', icon: '🍲', match: '/recipes' },
  { to: '/settings', label: 'הגדרות', icon: '⚙️', match: '/settings' },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span>📔</span>
        <span>יום בחיי</span>
      </div>
      <nav className={styles.nav}>
        {links.map((link) => {
          const isActive = location.pathname.startsWith(link.match);
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
            >
              <span className={styles.navIcon}>{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
