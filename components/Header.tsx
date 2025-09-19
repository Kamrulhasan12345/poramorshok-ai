import React from "react";
import { View } from "../types";
import Icon from "./Icon";
import { useLanguage } from "../hooks/useLanguage";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../src/contexts/AuthContext";

interface HeaderProps {
	activeView: View;
	setActiveView: (view: View) => void;
	isScrolled: boolean;
	scrollDirection: "up" | "down";
}

const Header = React.forwardRef<HTMLHeadElement, HeaderProps>(
	({ activeView, setActiveView, isScrolled, scrollDirection }, ref) => {
		const { language, toggleLanguage, t } = useLanguage();
		const { theme, toggleTheme } = useTheme();
		const { user } = useAuth();

		const navItems: { id: View; labelKey: string; icon: string }[] = [
			{ id: "chatbot", labelKey: "aiAnalyzer", icon: "chat" },
			{ id: "tracker", labelKey: "healthTracker", icon: "heart" },
			{ id: "diet", labelKey: "dietPlanner", icon: "food" },
			{ id: "exercise", labelKey: "exercisePlanner", icon: "exercise" },
			{ id: "wallet", labelKey: "healthWallet", icon: "wallet" },
			{ id: "nearby", labelKey: "nearby", icon: "hospital" },
		];

		return (
			<header
				ref={ref}
				className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
					scrollDirection === "down" && isScrolled
						? "-translate-y-full"
						: "translate-y-0"
				}`}
			>
				<div
					className={`pt-4 transition-all duration-300 ${
						isScrolled
							? "bg-gray-100/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-200/80 dark:border-zinc-800/80"
							: "bg-transparent"
					}`}
				>
					<div className="max-w-7xl mx-auto px-4">
						<div
							className={`flex items-center justify-between transition-all duration-300 ${
								isScrolled ? "h-14" : "h-28"
							}`}
						>
							<div className="flex-1"></div>
							<div className="flex items-center gap-3">
								{/* Theme-aware logo icon */}
								<div
									className={`flex-shrink-0 relative overflow-hidden transition-all duration-300 ${
										isScrolled ? "h-8 w-8" : "h-12 w-12"
									}`}
								>
									<img
										src="/images/icon-black.png"
										alt="পরামর্শক AI Logo"
										className={`absolute top-0 left-0 w-full h-full object-contain transition-opacity duration-300 ${
											theme === "light" ? "opacity-100" : "opacity-0"
										}`}
									/>
									<img
										src="/images/main-icon.png"
										alt="পরামর্শক AI Logo"
										className={`absolute top-0 left-0 w-full h-full object-contain transition-opacity duration-300 ${
											theme === "dark" ? "opacity-100" : "opacity-0"
										}`}
									/>
								</div>

								{/* Theme-aware brand text with language-aware font */}
								<h1
									className={`font-bold transition-all duration-300 ${
										isScrolled ? "text-lg" : "text-xl"
									} text-gray-800 dark:text-gray-200`}
								>
									<span class="font-hind">পরামর্শক</span>{" "}
									<span class="font-inria">AI</span>
								</h1>
							</div>
							<div className="flex-1 flex items-center justify-end gap-2">
								<button
									onClick={toggleLanguage}
									className="px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 bg-gray-200/80 hover:bg-gray-300/80 text-gray-700 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 dark:text-gray-300"
									aria-label={`Switch to ${
										language === "en" ? "Bengali" : "English"
									}`}
								>
									{language === "en" ? "বাংলা" : "EN"}
								</button>
								<button
									onClick={toggleTheme}
									className="h-9 w-9 flex items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200 bg-gray-200/80 hover:bg-gray-300/80 text-gray-700 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 dark:text-gray-300"
									aria-label={`Switch to ${
										theme === "light" ? "dark" : "light"
									} mode`}
								>
									<Icon
										name={theme === "light" ? "moon" : "sun"}
										className="h-5 w-5"
									/>
								</button>
								{/* User/Login button */}
								<button
									onClick={() => setActiveView(user ? "settings" : "login")}
									className="h-9 w-9 flex items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200 bg-gray-200/80 hover:bg-gray-300/80 text-gray-700 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 dark:text-gray-300"
									aria-label={user ? t("settings") : t("login")}
									title={user ? user.email || t("settings") : t("login")}
								>
									<Icon name={user ? "user" : "login"} className="h-5 w-5" />
								</button>
								<button
									onClick={() => setActiveView("settings")}
									className="h-9 w-9 flex items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200 bg-gray-200/80 hover:bg-gray-300/80 text-gray-700 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 dark:text-gray-300"
									aria-label={t("settings")}
								>
									<Icon name="settings" className="h-5 w-5" />
								</button>
							</div>
						</div>

						{/* Segmented Control Navigation */}
						<div className="pb-3">
							<div className="p-1 bg-gray-200/70 dark:bg-zinc-900 rounded-lg grid grid-cols-3 sm:grid-cols-6 items-center justify-between gap-1">
								{navItems.map((item) => (
									<button
										key={item.id}
										onClick={() => setActiveView(item.id)}
										className={`w-full py-2 text-xs sm:text-sm font-semibold rounded-md transition-all duration-300 focus:outline-none flex flex-col items-center justify-center gap-1 ${
											activeView === item.id
												? "bg-white dark:bg-zinc-800 text-gray-800 dark:text-white shadow-sm"
												: "text-gray-500 dark:text-gray-400 hover:bg-gray-300/50 dark:hover:bg-zinc-800/50"
										}`}
									>
										<Icon name={item.icon} className="h-5 w-5" />
										<span>{t(item.labelKey)}</span>
									</button>
								))}
							</div>
						</div>
					</div>
				</div>
			</header>
		);
	}
);

Header.displayName = "Header";

export default Header;
