import { createContext, useEffect, useState, ReactNode, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: any;
    loading: boolean;
    profileError: string | null;
    logout: () => Promise<void>;
    retryFetchProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    profileError: null,
    logout: async () => { },
    retryFetchProfile: async () => { },
});

// Generate unique tab ID for multi-tab coordination
const generateTabId = () => `tab_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

// Timeout for profile fetching to prevent "infinite loading"
const PROFILE_FETCH_TIMEOUT = 15000; // 15 seconds

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const queryClient = useQueryClient();
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [profileError, setProfileError] = useState<string | null>(null);

    // Tab coordination
    const [tabId] = useState(() => {
        let id = sessionStorage.getItem('zwa_tab_id');
        if (!id) {
            id = generateTabId();
            sessionStorage.setItem('zwa_tab_id', id);
        }
        console.log('[AuthContext] 🆔 Tab ID:', id);
        return id;
    });

    // Profile fetch coordination
    const lastProfileFetchRef = useRef<number>(0);
    const currentUserIdRef = useRef<string | null>(null);

    const logout = async () => {
        try {
            console.log('[AuthContext] 🚪 Logging out (Optimistic)...');

            // 0. Update UI immediately to prevent "Infinite Loading"
            setLoading(false); // Ensure loading is false so App redirects to /auth
            setSession(null);
            setUser(null);
            setProfile(null);
            setProfileError(null);
            currentUserIdRef.current = null;

            // 1. Clear caches
            console.log('[AuthContext] 🗑️ Clearing local cache...');
            queryClient.clear();
            sessionStorage.clear();

            // 2. Sign out from Supabase (Background)
            // We don't await this to block the UI, just let it happen
            try {
                await supabase.auth.signOut();
                console.log('[AuthContext] ✅ Supabase session terminated');
            } catch (supaError) {
                console.warn('[AuthContext] ⚠️ Supabase signOut warning (ignored):', supaError);
            }

        } catch (error) {
            console.error("[AuthContext] ❌ Logout error:", error);
            // Even if error, force state clear
            setSession(null);
            setUser(null);
            setLoading(false);
        }
    };

    const fetchProfileDirect = async (userId: string, retries = 3): Promise<any> => {
        try {
            console.log(`[AuthContext] 📡 Fetching profile for UID: ${userId} (retries left: ${retries})`);
            setProfileError(null);

            // Wrap Supabase call in a timeout promise
            const fetchPromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timed out')), PROFILE_FETCH_TIMEOUT)
            );

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

            if (error) {
                console.error("[AuthContext] ❌ Error fetching profile:", error.message);

                if (retries > 0) {
                    console.log(`[AuthContext] 🔄 Retrying... (${retries} attempts left)`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return fetchProfileDirect(userId, retries - 1);
                }

                const errorMsg = `Impossible de charger votre profil: ${error.message}`;
                console.error("[AuthContext] 🚨 All retries exhausted:", errorMsg);
                setProfileError(errorMsg);
                // Don't clear profile if we already have one, might be a temporary glitch
                return null;
            }

            if (data) {
                console.log("[AuthContext] ✅ Profile loaded:", data.full_name || data.email);
                setProfile(data);
                setProfileError(null);
                lastProfileFetchRef.current = Date.now();
                return data;
            }

            return null;
        } catch (err: any) {
            console.error("[AuthContext] ❌ Unexpected error in fetchProfile:", err.message || err);

            if (retries > 0) {
                console.log(`[AuthContext] 🔄 Retrying after error... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return fetchProfileDirect(userId, retries - 1);
            }

            const errorMsg = `Erreur inattendue: ${err.message || 'Veuillez réessayer'}`;
            console.error("[AuthContext] 🚨 All retries exhausted after exception:", errorMsg);
            setProfileError(errorMsg);
            // Don't completely kill the session for a temporary network error if we can help it
            // But we do need to stop loading
            setLoading(false);
            return null;
        }
    };

    const fetchProfile = async (userId: string) => {
        const now = Date.now();
        if (currentUserIdRef.current === userId && (now - lastProfileFetchRef.current) < 3000) {
            console.log("[AuthContext] ⏭️ Skipping duplicate profile fetch (fetched recently)");
            return; // Just skip, don't return stale profile
        }

        currentUserIdRef.current = userId;
        return await fetchProfileDirect(userId);
    };

    const retryFetchProfile = async () => {
        if (user?.id) {
            console.log("[AuthContext] 🔄 Manual retry requested");
            setLoading(true);
            setProfileError(null);
            // Force immediate fetch (bypass debounce)
            lastProfileFetchRef.current = 0;
            await fetchProfile(user.id);
            setLoading(false);
        }
    };

    // Refs to access latest state in event listeners without re-binding
    const sessionRef = useRef(session);
    const userRef = useRef(user);
    const profileRef = useRef(profile);

    // Keep refs updated
    useEffect(() => {
        sessionRef.current = session;
        userRef.current = user;
        profileRef.current = profile;
    }, [session, user, profile]);

    // Keep session alive and check on visibility change
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                console.log('[AuthContext] 👁️ App became visible (waking up)');

                // 1. Check network status
                if (!navigator.onLine) {
                    console.warn('[AuthContext] ⚠️ App woke up but is OFFLINE');
                    return;
                }

                // 2. Refresh session if needed
                const { data: { session: currentSession }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('[AuthContext] ❌ Error refreshing session on wake:', error);
                } else if (currentSession) {
                    // Update connection state?
                    if (currentSession.access_token !== sessionRef.current?.access_token) {
                        console.log('[AuthContext] 🔄 Token refreshed on wake');
                        setSession(currentSession);
                        setUser(currentSession.user);
                    } else {
                        console.log('[AuthContext] ✅ Session matches active session');
                    }
                } else {
                    console.log('[AuthContext] ⚠️ No active session on wake');
                }
            }
        };

        const handleOnline = () => {
            console.log('[AuthContext] 🌐 App is ONLINE');
            // Could retry fetch here if needed
            if (userRef.current?.id && !profileRef.current) {
                retryFetchProfile();
            }
        };

        const handleOffline = () => {
            console.log('[AuthContext] 🔌 App is OFFLINE');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []); // Empty dependency array = stable listeners!

    useEffect(() => {
        let mounted = true;

        // BroadcastChannel for multi-tab sync
        const authChannel = new BroadcastChannel('zwa_auth_sync');

        authChannel.onmessage = async (event) => {
            console.log(`[AuthContext] 📡 Received broadcast event: ${event.data.type} from tab ${event.data.tabId}`);

            // Ignore messages from this tab to prevent loops
            if (event.data.tabId === tabId) return;

            if (event.data.type === 'LOGOUT') {
                console.log("[AuthContext] 🚪 detected logout from another tab, clearing local session");
                setSession(null);
                setUser(null);
                setProfile(null);
                setLoading(false);
            }

            if (event.data.type === 'PROFILE_UPDATED' && event.data.userId === user?.id) {
                console.log("[AuthContext] 👤 detected profile update from another tab, reloading");
                await fetchProfileDirect(event.data.userId); // Force reload
            }
        };

        console.log("[AuthContext] 🎧 Setting up auth state listener...");

        // Single unified auth listener handles EVERYTHING (initial session + updates + broadcasts)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            console.log(`[AuthContext] 🔔 Auth event: ${event} [Tab: ${tabId}]`);

            if (!mounted) return;

            // Track previous state for broadcast decisions
            const previousUser = user?.id;

            if (newSession?.user) {
                // User is authenticated - set session and user first
                setSession(newSession);
                setUser(newSession.user);

                // CRITICAL FIX: Wait for profile before turning off loading
                // This prevents BottomNav from rendering with wrong role
                if (newSession.user.id !== currentUserIdRef.current) {
                    console.log(`[AuthContext] 👤 New user detected, fetching profile...`);
                    await fetchProfile(newSession.user.id);
                } else if (!profile) {
                    console.log(`[AuthContext] 👤 Missing profile for existing user, fetching...`);
                    await fetchProfile(newSession.user.id);
                }

                // Only turn off loading AFTER profile is loaded
                setLoading(false);
            } else {
                // No user - handle logout
                setSession(null);
                setUser(null);

                if (event === 'SIGNED_OUT') {
                    console.log("[AuthContext] 🚪 User signed out");

                    // Broadcast logout to other tabs if we were previously logged in
                    if (previousUser) {
                        const storedSession = localStorage.getItem('zwa-auth-token');

                        // Only broadcast if session is truly gone (not a refresh race)
                        if (!storedSession) {
                            console.log(`[AuthContext] 📤 Broadcasting LOGOUT for user ${previousUser}`);
                            authChannel.postMessage({ type: 'LOGOUT', tabId });
                        } else {
                            console.warn(`[AuthContext] ⚠️ SIGNED_OUT event but token exists. Skipping broadcast (likely refresh race).`);
                        }
                    }

                    setProfile(null);
                    setProfileError(null);
                    currentUserIdRef.current = null;
                    sessionStorage.removeItem('zwa_last_auth_tab');
                }

                setLoading(false);
            }
        });

        return () => {
            console.log("[AuthContext] 🧹 Cleanup");
            mounted = false;
            subscription.unsubscribe();
            authChannel.close();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, profileError, logout, retryFetchProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
