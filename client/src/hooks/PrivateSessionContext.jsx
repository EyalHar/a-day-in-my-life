import { createContext, useCallback, useContext, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setPrivateToken, clearPrivateToken } from '../api/client';

const PrivateSessionContext = createContext(null);

export function PrivateSessionProvider({ children }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const unlock = useCallback(
    (token) => {
      setPrivateToken(token);
      setIsUnlocked(true);
      setIsModalOpen(false);
      queryClient.invalidateQueries();
    },
    [queryClient]
  );

  const lock = useCallback(() => {
    clearPrivateToken();
    setIsUnlocked(false);
    queryClient.invalidateQueries();
  }, [queryClient]);

  const openUnlockModal = useCallback(() => setIsModalOpen(true), []);
  const closeUnlockModal = useCallback(() => setIsModalOpen(false), []);

  return (
    <PrivateSessionContext.Provider
      value={{ isUnlocked, unlock, lock, isModalOpen, openUnlockModal, closeUnlockModal }}
    >
      {children}
    </PrivateSessionContext.Provider>
  );
}

export function usePrivateSession() {
  const ctx = useContext(PrivateSessionContext);
  if (!ctx) throw new Error('usePrivateSession must be used within PrivateSessionProvider');
  return ctx;
}
