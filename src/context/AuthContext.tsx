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

            // Update local state
            setSession(newSession);
            setUser(newSession?.user ?? null);

            if (newSession?.user) {
                // User is authenticated
                if (newSession.user.id !== currentUserIdRef.current) {
                    console.log(`[AuthContext] 👤 New user detected, fetching profile`);
                    await fetchProfile(newSession.user.id);
                } else {
                    // Same user, just check if we have profile data
                    if (!profile) {
                        console.log(`[AuthContext] 👤 Missing profile for existing user, fetching...`);
                        await fetchProfile(newSession.user.id);
                    }
                }
            } else {
                // No user - handle logout
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
            }

            // Always turn off loading after processing the event
            setLoading(false);
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
