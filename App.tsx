import React, {
	useState,
	useCallback,
	useRef,
	useLayoutEffect,
	useEffect,
} from "react";
import { View } from "./types";
import Header from "./components/Header";
import Chatbot from "./components/Chatbot";
import HealthTracker from "./components/HealthTracker";
import DietPlanner from "./components/DietPlanner";
import ExercisePlanner from "./components/ExercisePlanner";
import HealthWallet from "./components/HealthWallet";
import Nearby from "./components/Nearby";
import Settings from "./components/Settings";
import LoginSignup from "./components/LoginSignup";
import FunFact from "./components/FunFact";
import useScroll from "./hooks/useScroll";
import { useUserPreferences } from "./hooks/useUserPreferences";
import { useReminders } from "./contexts/ReminderContext";
import { useAuth } from "./src/contexts/AuthContext";
import Icon from "./components/Icon";
import { useLanguage } from "./hooks/useLanguage";

const InAppReminder: React.FC = () => {
	const { activeInAppAlert, dismissInAppAlert } = useReminders();
	const { t } = useLanguage();

	if (!activeInAppAlert) return null;

	const { drugName, dosage, doctor } = activeInAppAlert;

	return (
		<div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md p-2 animate-fade-in-up">
			<div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-gray-200 dark:border-zinc-800 flex items-start gap-4 p-4">
				<div className="flex-shrink-0 h-10 w-10 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
					<Icon name="bell" className="h-6 w-6" />
				</div>
				<div className="flex-1">
					<p className="font-semibold text-gray-900 dark:text-gray-100">
						{t("reminderAlertTitle")}
					</p>
					<p className="text-sm text-gray-700 dark:text-gray-300">
						{t("reminderAlertText", { drug: `${drugName} (${dosage})` })}
					</p>
					<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
						{t("prescribingDoctor")}: {doctor}
					</p>
				</div>
				<button
					onClick={dismissInAppAlert}
					className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400"
					aria-label={t("cancel")}
				>
					<Icon name="plus" className="h-5 w-5 transform rotate-45" />
				</button>
			</div>
		</div>
	);
};

const App: React.FC = () => {
	const [activeView, setActiveView] = useState<View>("chatbot");
	const { user, session, loading } = useAuth();
	const headerRef = useRef<HTMLHeadElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const [headerHeight, setHeaderHeight] = useState(80); // Default header height as fallback
	const [isTransitioning, setIsTransitioning] = useState(false);
	const { isScrolled, scrollDirection } = useScroll(scrollRef);

	// Load user preferences when user logs in
	useUserPreferences();

	// Handle authentication state changes
	useEffect(() => {
		if (!loading) {
			// Only redirect if user logs in while on login page
			if (user && activeView === "login") {
				// If logged in and on login page, redirect to main app
				setActiveView("chatbot");
			}
			// Remove the forced redirect to login - let users use the app without auth
		}
	}, [user, loading, activeView]);

	useLayoutEffect(() => {
		const updateHeaderHeight = () => {
			if (headerRef.current) {
				const height = headerRef.current.getBoundingClientRect().height;
				setHeaderHeight(height);
			}
		};

		const observer = new ResizeObserver((entries) => {
			for (let entry of entries) {
				setHeaderHeight(entry.target.getBoundingClientRect().height);
			}
		});

		if (headerRef.current) {
			observer.observe(headerRef.current);
			// Initial height calculation
			updateHeaderHeight();
		}

		return () => observer.disconnect();
	}, []);

	// Recalculate header height when view changes (especially when returning from login)
	useLayoutEffect(() => {
		if (activeView !== "login" && headerRef.current) {
			setIsTransitioning(true);

			// Use requestAnimationFrame to ensure DOM is fully rendered
			const frameId = requestAnimationFrame(() => {
				if (headerRef.current) {
					const height = headerRef.current.getBoundingClientRect().height;
					setHeaderHeight(height);
					setIsTransitioning(false);
				}
			});

			return () => {
				cancelAnimationFrame(frameId);
				setIsTransitioning(false);
			};
		} else if (activeView === "login") {
			setIsTransitioning(false);
		}
	}, [activeView]);

	// Force recalculation when header visibility changes
	useLayoutEffect(() => {
		if (activeView !== "login" && headerRef.current && !isTransitioning) {
			// Double-check header height after a brief delay for DOM settling
			const timeoutId = setTimeout(() => {
				if (headerRef.current) {
					const rect = headerRef.current.getBoundingClientRect();
					const newHeight = rect.height;
					if (newHeight > 0 && Math.abs(newHeight - headerHeight) > 1) {
						setHeaderHeight(newHeight);
					}
				}
			}, 150);

			return () => clearTimeout(timeoutId);
		}
	}, [activeView, headerHeight, isTransitioning]);

	const renderView = useCallback(() => {
		// If still loading authentication, show a loading state
		if (loading) {
			return (
				<div className="flex items-center justify-center min-h-screen">
					<div className="text-center">
						<div className="animate-spin h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
						<p className="text-gray-600 dark:text-gray-400">Loading...</p>
					</div>
				</div>
			);
		}

		// Allow users to use the app without authentication
		switch (activeView) {
			case "wallet":
				return <HealthWallet key="wallet" />;
			case "nearby":
				return <Nearby key="nearby" />;
			case "settings":
				return (
					<Settings
						key="settings"
						onNavigateToLogin={() => setActiveView("login")}
					/>
				);
			case "login":
				return (
					<LoginSignup key="login" onBack={() => setActiveView("chatbot")} />
				);
			case "chatbot":
			default:
				return <Chatbot key="chatbot" />;
		}
	}, [activeView, user, loading]);

	return (
		<div className="bg-gray-100 dark:bg-zinc-950 font-sans text-gray-900 dark:text-gray-300">
			<InAppReminder />
			{activeView !== "login" && (
				<Header
					ref={headerRef}
					activeView={activeView}
					setActiveView={setActiveView}
					isScrolled={isScrolled}
					scrollDirection={scrollDirection}
				/>
			)}
			<div
				ref={scrollRef}
				className="h-screen overflow-y-auto"
				style={{
					paddingTop: activeView !== "login" ? `${headerHeight}px` : 0,
					transition: "padding-top 0.3s ease-in-out",
				}}
			>
				<main
					className={`px-4 pb-4 transition-all duration-300 ${
						activeView === "chatbot" ? "pb-24" : ""
					}`}
				>
					<div className="max-w-7xl mx-auto">{renderView()}</div>
					{activeView !== "login" && <FunFact />}
				</main>
			</div>
		</div>
	);
};

export default App;
