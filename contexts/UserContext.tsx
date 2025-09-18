import React, {
	createContext,
	useState,
	useEffect,
	ReactNode,
	useContext,
	useMemo,
	useCallback,
} from "react";
import { User } from "../types";

interface UserContextType {
	user: User | null;
	isLoggedIn: boolean;
	login: (userData?: { name: string; email: string }) => void;
	logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// A mock user for demonstration purposes, as real Google Auth isn't possible here.
const MOCK_USER: User = {
	id: "123456789",
	name: "Zaryif Azfar",
	email: "zaryifs@gmail.com",
	avatar: "ICON_PLACEHOLDER",
};

export const UserProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		try {
			const storedUser = localStorage.getItem("user");
			if (storedUser) {
				setUser(JSON.parse(storedUser));
			}
		} catch (error) {
			console.error("Failed to load user from localStorage", error);
			localStorage.removeItem("user");
		}
	}, []);

	const login = useCallback((userData?: { name: string; email: string }) => {
		try {
			const userToSave = userData
				? {
						id: Date.now().toString(), // Generate unique ID
						name: userData.name,
						email: userData.email,
						avatar: "ICON_PLACEHOLDER",
				  }
				: MOCK_USER;

			localStorage.setItem("user", JSON.stringify(userToSave));
			setUser(userToSave);
		} catch (error) {
			console.error("Failed to save user to localStorage", error);
		}
	}, []);

	const logout = useCallback(() => {
		try {
			localStorage.removeItem("user");
			setUser(null);
		} catch (error) {
			console.error("Failed to remove user from localStorage", error);
		}
	}, []);

	const isLoggedIn = useMemo(() => !!user, [user]);

	const value = useMemo(
		() => ({ user, isLoggedIn, login, logout }),
		[user, isLoggedIn, login, logout]
	);

	return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextType => {
	const context = useContext(UserContext);
	if (context === undefined) {
		throw new Error("useUser must be used within a UserProvider");
	}
	return context;
};
