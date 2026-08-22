import { useState } from 'react';
import { ENTRY_TYPES } from '../../entryTypes';
import AddEntryForm from './AddEntryForm';
import styles from './AddEntryMenu.module.css';

export default function AddEntryMenu({ date }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  return (
    <>
      <div className={styles.fabWrapper}>
        {isOpen && (
          <div className={styles.menu}>
            {ENTRY_TYPES.map((t) => (
              <button
                key={t.value}
                className={styles.menuItem}
                data-testid={`entry-type-${t.value}`}
                onClick={() => {
                  setSelectedType(t.value);
                  setIsOpen(false);
                }}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        )}
        <button
          className={`${styles.fab} ${isOpen ? styles.fabOpen : ''}`}
          onClick={() => setIsOpen((v) => !v)}
          aria-label="הוספת פריט"
        >
          +
        </button>
      </div>

      {selectedType && (
        <AddEntryForm date={date} type={selectedType} onClose={() => setSelectedType(null)} />
      )}
    </>
  );
}
