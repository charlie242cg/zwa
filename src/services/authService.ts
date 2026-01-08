import { supabase } from '../lib/supabase';

export const authService = {
    async signUp(email: string, password: string, role: string, fullName: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: role,
                    full_name: fullName,
                },
            },
        });
        return { data, error };
    },

    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    },

    async signOut() {
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    async getSession() {
        const { data, error } = await supabase.auth.getSession();
        return { data, error };
    },
};
