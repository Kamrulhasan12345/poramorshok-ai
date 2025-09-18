import { useEffect } from "react";
import { useAuth } from "../src/contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "./useLanguage";

/**
 * Custom hook to automatically load user preferences from database when user logs in
 * and sync them across devices
 */
export const useUserPreferences = () => {
	const { user } = useAuth();
	const { loadUserThemePreference } = useTheme();
	const { loadUserLanguagePreference } = useLanguage();

	useEffect(() => {
		const loadPreferences = async () => {
			if (user?.id) {
				try {
					console.log("Loading user preferences for user:", user.id);

					// Load theme and language preferences from database
					await Promise.all([
						loadUserThemePreference(user.id),
						loadUserLanguagePreference(user.id),
					]);

					console.log("User preferences loaded successfully");
				} catch (error) {
					console.error("Failed to load user preferences:", error);
				}
			}
		};

		loadPreferences();
	}, [user?.id, loadUserThemePreference, loadUserLanguagePreference]);
};