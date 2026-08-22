import { Navigate, Route, Routes } from 'react-router-dom';
import { format } from 'date-fns';
import Sidebar from './components/Sidebar/Sidebar';
import PrivateLock from './components/PrivateLock/PrivateLock';
import DayPage from './pages/DayPage/DayPage';
import RecipesPage from './pages/RecipesPage/RecipesPage';
import SettingsPage from './pages/SettingsPage/SettingsPage';
import styles from './App.module.css';

const today = format(new Date(), 'yyyy-MM-dd');

export default function App() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<Navigate to={`/day/${today}`} replace />} />
          <Route path="/day/:date" element={<DayPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <PrivateLock />
    </div>
  );
}
