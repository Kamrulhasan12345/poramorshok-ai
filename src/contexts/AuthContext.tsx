import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { User, Session } from "@supabase/supabase-js";
import { userService } from "../services/database";

interface AuthContextType {
	user: User | null;
	session: Session | null;
	loading: boolean;
	signIn: (email: string, password: string) => Promise<any>;
	signUp: (email: string, password: string, metadata?: any) => Promise<any>;
	signInWithGoogle: () => Promise<any>;
	signOut: () => Promise<any>;
	resetPassword: (email: string) => Promise<any>;
	updateProfile: (updates: any) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);

	// On mount, get initial session and listen for changes
	useEffect(() => {
		let isMounted = true;
		supabase.auth.getSession().then(({ data: { session } }) => {
			if (!isMounted) return;
			setSession(session);
			setUser(session?.user ?? null);
			setLoading(false);
			// Do NOT upsert profile here; only do it after SIGNED_IN event
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (!isMounted) return;
			setSession(session);
			setUser(session?.user ?? null);
			setLoading(false);
			if (event === "SIGNED_IN" && session?.user) {
				upsertUserProfile(session.user);
				// Remove OAuth fragments
				if (window.location.hash.includes("access_token")) {
					window.history.replaceState(null, "", window.location.pathname);
				}
			}
			if (event === "SIGNED_OUT") {
				setUser(null);
				setSession(null);
			}
		});
		return () => {
			isMounted = false;
			subscription.unsubscribe();
		};
	}, []);

	// Upsert user profile in users table (atomic, idempotent)
	const upsertUserProfile = async (user: User) => {
		const profileData = {
			id: user.id,
			email: user.email,
			name:
				user.user_metadata?.name ||
				user.user_metadata?.full_name ||
				user.email?.split("@")[0] ||
				"User",
			avatar_url: user.user_metadata?.avatar_url || null,
		};
		try {
			await userService.upsertProfile(profileData);
		} catch (error) {
			// Ignore unique constraint errors, log others
			if (error?.code !== "23505") {
				console.error("[AuthContext] Profile upsert error:", error);
			}
		}
	};

	// Auth actions
	const signIn = async (email: string, password: string) => {
		return await supabase.auth.signInWithPassword({ email, password });
	};

	const signUp = async (email: string, password: string, metadata?: any) => {
		return await supabase.auth.signUp({
			email,
			password,
			options: { data: metadata },
		});
	};

	const signInWithGoogle = async () => {
		return await supabase.auth.signInWithOAuth({
			provider: "google",
			options: { redirectTo: window.location.origin },
		});
	};

	const signOut = async () => {
		await supabase.auth.signOut();
		setUser(null);
		setSession(null);
	};

	const resetPassword = async (email: string) => {
		return await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${window.location.origin}/reset-password`,
		});
	};

	const updateProfile = async (updates: any) => {
		return await supabase.auth.updateUser({ data: updates });
	};

	const value = {
		user,
		session,
		loading,
		signIn,
		signUp,
		signInWithGoogle,
		signOut,
		resetPassword,
		updateProfile,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
