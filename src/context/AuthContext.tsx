import { createContext, useEffect, useState, ReactNode, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
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
            setLoading(true);
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setProfile(null);
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfileDirect = async (userId: string, retries = 3): Promise<any> => {
        try {
            console.log(`[AuthContext] 📡 Fetching profile for UID: ${userId} (retries left: ${retries})`);
            setProfileError(null);

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

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
                setProfile(null);
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
            setProfile(null);
            return null;
        }
    };

    const fetchProfile = async (userId: string) => {
        // If same user and fetched recently (< 3 seconds), skip completely
        const now = Date.now();
        if (currentUserIdRef.current === userId && (now - lastProfileFetchRef.current) < 3000) {
            console.log("[AuthContext] ⏭️ Skipping duplicate profile fetch (fetched recently)");
            return profile;
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


    useEffect(() => {
        let mounted = true;
        let initialCheckDone = false;
        let lastEventTime = 0;

        // Initialize session on mount
        const initialize = async () => {
            console.log("[AuthContext] 🚀 Initializing auth state...");

            try {
                const { data: { session: currentSession }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("[AuthContext] ❌ Error getting session:", error.message);
                    setLoading(false);
                    return;
                }

                if (!mounted) return;

                console.log(`[AuthContext] 📦 Initial session: ${currentSession ? 'EXISTS' : 'NONE'}`);

                setSession(currentSession);
                setUser(currentSession?.user ?? null);

                if (currentSession?.user) {
                    console.log(`[AuthContext] 👤 Loading profile for: ${currentSession.user.email}`);
                    await fetchProfile(currentSession.user.id);
                } else {
                    setProfile(null);
                }

                initialCheckDone = true;
                setLoading(false);

            } catch (err) {
                console.error("[AuthContext] ❌ Initialize error:", err);
                if (mounted) setLoading(false);
            }
        };

        initialize();

        // Listen for auth changes (login/logout only, not initial session)
        console.log("[AuthContext] 🎧 Setting up auth state listener...");
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            // Skip INITIAL_SESSION event since we handle it manually above
            if (event === 'INITIAL_SESSION') {
                console.log("[AuthContext] ⏭️ Skipping INITIAL_SESSION (already handled)");
                return;
            }

            // Throttle rapid events (ignore events within 1 second of previous)
            const now = Date.now();
            if (event === 'SIGNED_IN' && (now - lastEventTime) < 1000) {
                console.log(`[AuthContext] 🚫 Throttling ${event} (too soon after previous event)`);
                return;
            }
            lastEventTime = now;

            console.log(`[AuthContext] 🔔 Auth event: ${event} [Tab: ${tabId}]`);

            if (!mounted) return;

            // Wait for initial check to complete before processing other events
            if (!initialCheckDone) {
                console.log("[AuthContext] ⏳ Waiting for initial check...");
                return;
            }

            setSession(newSession);
            setUser(newSession?.user ?? null);

            if (event === 'SIGNED_IN') {
                // SIGNED_IN triggered - could be from this tab or synced from another
                if (newSession?.user) {
                    console.log(`[AuthContext] ✅ SIGNED_IN: Fetching profile`);
                    sessionStorage.setItem('zwa_last_auth_tab', tabId);
                    await fetchProfile(newSession.user.id);
                }
            } else if (event === 'TOKEN_REFRESHED') {
                // Token refresh happens in background, only update if user changed
                if (newSession?.user && newSession.user.id !== currentUserIdRef.current) {
                    console.log(`[AuthContext] 🔄 TOKEN_REFRESHED: User changed, fetching profile`);
                    await fetchProfile(newSession.user.id);
                } else {
                    console.log(`[AuthContext] 🔄 TOKEN_REFRESHED: Same user, skipping profile fetch`);
                }
            } else if (event === 'SIGNED_OUT') {
                console.log("[AuthContext] 🚪 User signed out");
                setProfile(null);
                setProfileError(null);
                sessionStorage.removeItem('zwa_last_auth_tab');
            }
        });

        return () => {
            console.log("[AuthContext] 🧹 Cleanup");
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, profileError, logout, retryFetchProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
