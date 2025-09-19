import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../hooks/useLanguage";
import { useAuth } from "../src/contexts/AuthContext";
import Icon from "./Icon";

const fileToBase64 = (file: File): Promise<string> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = (error) => reject(error);
	});
};

const AboutSection: React.FC<{ title: string; children: React.ReactNode }> = ({
	title,
	children,
}) => (
	<div>
		<h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
			{title}
		</h4>
		<p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
			{children}
		</p>
	</div>
);

const DataManagementAction: React.FC<{
	title: string;
	description: string;
	icon: string;
	buttonText: string;
	onClick: () => void;
	variant?: "default" | "danger";
}> = ({
	title,
	description,
	icon,
	buttonText,
	onClick,
	variant = "default",
}) => {
	const buttonStyles = {
		default:
			"border-gray-300 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-teal-500",
		danger:
			"border-red-300 dark:border-red-600/50 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 focus:ring-red-500",
	};

	return (
		<div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50">
			<div className="flex items-start gap-4">
				<Icon
					name={icon}
					className="h-6 w-6 text-gray-500 dark:text-gray-400 mt-1 flex-shrink-0"
				/>
				<div>
					<h4 className="font-semibold text-gray-800 dark:text-gray-200">
						{title}
					</h4>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						{description}
					</p>
				</div>
			</div>
			<button
				onClick={onClick}
				className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors ${buttonStyles[variant]}`}
			>
				{buttonText}
			</button>
		</div>
	);
};

const Settings: React.FC<{ onNavigateToLogin?: () => void }> = ({
	onNavigateToLogin,
}) => {
	const { theme, toggleTheme, updateThemePreference } = useTheme();
	const { language, toggleLanguage, t, updateLanguagePreference } =
		useLanguage();
	const { user, session, signOut } = useAuth();
	const [teamImage, setTeamImage] = useState<string | null>(null);
	const teamImageInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const storedImage = localStorage.getItem("teamImage");
		if (storedImage) {
			setTeamImage(storedImage);
		}
	}, []);

	const handleLanguageToggle = async () => {
		await toggleLanguage();
		// Update language preference in database if user is logged in
		if (user?.id) {
			const newLang = language === "en" ? "bn" : "en";
			await updateLanguagePreference(user.id, newLang);
		}
	};

	const handleThemeToggle = async () => {
		toggleTheme();
		// Update theme preference in database if user is logged in
		if (user?.id) {
			const newTheme = theme === "light" ? "dark" : "light";
			await updateThemePreference(user.id, newTheme);
		}
	};

	const handleClearAllData = () => {
		if (window.confirm(t("confirmClearData"))) {
			const theme = localStorage.getItem("theme");
			const lang = localStorage.getItem("language");

			localStorage.clear();

			if (theme) localStorage.setItem("theme", theme);
			if (lang) localStorage.setItem("language", lang);

			window.location.reload();
		}
	};

	const handleClearChatHistory = () => {
		if (window.confirm(t("confirmClearChat"))) {
			localStorage.removeItem("chatHistory");
			window.location.reload();
		}
	};

	const handleDownloadAllData = () => {
		const allData: { [key: string]: any } = {};
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key) {
				try {
					allData[key] = JSON.parse(localStorage.getItem(key)!);
				} catch (e) {
					allData[key] = localStorage.getItem(key);
				}
			}
		}

		const blob = new Blob([JSON.stringify(allData, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "poramorshok-ai-data.json";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	const handleLogout = async () => {
		if (window.confirm(t("confirmLogout"))) {
			try {
				await signOut();
			} catch (error) {
				console.error("Error signing out:", error);
			}
		}
	};

	const handleTeamImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		if (event.target.files && event.target.files[0]) {
			try {
				const base64 = await fileToBase64(event.target.files[0]);
				setTeamImage(base64);
				localStorage.setItem("teamImage", base64);
			} catch (error) {
				console.error("Error uploading team image:", error);
			}
		}
	};

	const handleRemoveTeamImage = () => {
		setTeamImage(null);
		localStorage.removeItem("teamImage");
	};

	return (
		<div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up py-6">
			<div className="text-center">
				<h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
					{t("settings")}
				</h2>
			</div>

			{/* Account Section */}
			<div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl border border-gray-200/80 dark:border-gray-700/80">
				<h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
					{t("account")}
				</h3>
				{user && session ? (
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							{user.user_metadata?.avatar_url ? (
								<img
									src={user.user_metadata.avatar_url}
									alt={user.user_metadata?.full_name || user.email}
									className="h-12 w-12 rounded-full"
								/>
							) : (
								<div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
									<Icon name="user" className="h-7 w-7" />
								</div>
							)}
							<div>
								<p className="font-semibold text-gray-900 dark:text-gray-100">
									{user.user_metadata?.full_name ||
										user.user_metadata?.name ||
										user.email?.split("@")[0]}
								</p>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									{user.email}
								</p>
							</div>
						</div>
						<button
							onClick={handleLogout}
							className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
						>
							<Icon name="logout" className="h-5 w-5 mr-2" />
							{t("logout")}
						</button>
					</div>
				) : (
					<div className="flex items-center justify-between">
						<p className="text-gray-600 dark:text-gray-400">
							{t("notLoggedIn")}
						</p>
						<button
							onClick={onNavigateToLogin}
							className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
						>
							<Icon name="google" className="h-5 w-5 mr-2" />
							{t("login")}
						</button>
					</div>
				)}
			</div>

			{/* About App Section */}
			<div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl border border-gray-200/80 dark:border-gray-700/80">
				<h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
					{t("aboutAppTitle")}
				</h3>
				<div className="space-y-6">
					<AboutSection title={t("inspirationTitle")}>
						{t("inspirationText")}
					</AboutSection>
					<AboutSection title={t("storyTitle")}>{t("storyText")}</AboutSection>
					<AboutSection title={t("whatAppOffersTitle")}>
						{t("whatAppOffersText")}
					</AboutSection>
					<div>
						<h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
							{t("teamTitle")}
						</h4>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="md:col-span-1">
								{/* <input
									type="file"
									accept="image/*"
									ref={teamImageInputRef}
									onChange={handleTeamImageUpload}
									className="hidden"
								/> */}

								<div className="relative group">
									<img
										src="/images/team-image-resized.jpg"
										alt="Team Last Minute"
										className="w-full h-32 object-cover rounded-lg shadow-md"
									/>
								</div>
							</div>
							<div className="md:col-span-2">
								<p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
									{t("teamText")}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Appearance Section */}
			<div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl border border-gray-200/80 dark:border-gray-700/80">
				<h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
					{t("appearance")}
				</h3>
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<label
							htmlFor="theme-toggle"
							className="font-medium text-gray-700 dark:text-gray-300"
						>
							{t("theme")}
						</label>
						<button
							onClick={handleThemeToggle}
							className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
						>
							<Icon
								name={theme === "light" ? "moon" : "sun"}
								className="h-5 w-5"
							/>
							{theme === "light" ? "Dark" : "Light"}
						</button>
					</div>
					<div className="flex items-center justify-between">
						<label
							htmlFor="language-toggle"
							className="font-medium text-gray-700 dark:text-gray-300"
						>
							{t("language")}
						</label>
						<button
							onClick={handleLanguageToggle}
							className="px-3 py-1.5 rounded-full text-sm font-semibold transition-colors duration-200 bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
						>
							{language === "en" ? "বাংলা" : "English"}
						</button>
					</div>
				</div>
			</div>

			{/* Data Management Section */}
			<div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-xl border border-gray-200/80 dark:border-gray-700/80">
				<h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
					{t("dataManagement")}
				</h3>
				<p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
					{t("dataManagementDesc")}
				</p>
				<div className="space-y-3">
					<DataManagementAction
						title={t("downloadAllData")}
						description={t("downloadAllDataDesc")}
						icon="download"
						buttonText={t("download")}
						onClick={handleDownloadAllData}
					/>
					<DataManagementAction
						title={t("clearChatHistory")}
						description={t("clearChatHistoryDesc")}
						icon="chat"
						buttonText={t("clear")}
						onClick={handleClearChatHistory}
						variant="danger"
					/>
					<DataManagementAction
						title={t("clearAllData")}
						description={t("clearAllDataDesc")}
						icon="database"
						buttonText={t("clear")}
						onClick={handleClearAllData}
						variant="danger"
					/>
				</div>
			</div>
		</div>
	);
};

export default Settings;
