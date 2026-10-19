'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { SessionUser } from '@/lib/session';

type SessionState = {
    user: SessionUser | null;
    ready: boolean;
    reload: () => Promise<void>;
    logout: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<SessionUser | null>(null);
    const [ready, setReady] = useState(false);

    const reload = useCallback(async () => {
        try {
            const response = await fetch('/api/auth/session', { cache: 'no-store' });
            const data = await response.json();
            setUser(data.user ?? null);
        } catch {
            setUser(null);
        } finally {
            setReady(true);
        }
    }, []);

    const logout = useCallback(async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
    }, []);

    useEffect(() => {
        let active = true;
        fetch('/api/auth/session', { cache: 'no-store' })
            .then((response) => response.json())
            .then((data) => {
                if (active) setUser(data.user ?? null);
            })
            .catch(() => {
                if (active) setUser(null);
            })
            .finally(() => {
                if (active) setReady(true);
            });
        return () => {
            active = false;
        };
    }, []);

    const value = useMemo(() => ({ user, ready, reload, logout }), [user, ready, reload, logout]);

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
    const context = useContext(SessionContext);
    if (!context) throw new Error('useSession must be used inside SessionProvider');
    return context;
}
