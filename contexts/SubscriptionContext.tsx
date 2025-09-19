import React, {
	createContext,
	useState,
	useEffect,
	ReactNode,
	useContext,
	useMemo,
	useCallback,
} from "react";

export type SubscriptionPlan = "basic" | "pro";

interface SubscriptionState {
	plan: SubscriptionPlan;
	nearbyUsageCount: number;
	nearbyUsageResetDate: string; // ISO date string for when the usage count resets
}

interface SubscriptionContextType {
	subscriptionState: SubscriptionState;
	canUseNearby: boolean;
	nearbyUsageRemaining: number;
	upgradeRequired: boolean;
	useNearbyService: () => boolean; // Returns true if usage was allowed, false if blocked
	resetUsageCount: () => void;
	upgradeToPro: () => void;
	downgradeToBasic: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
	undefined
);

const NEARBY_USAGE_LIMIT = 5; // Basic plan limit per month

const getMonthResetDate = (): string => {
	const now = new Date();
	const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
	return nextMonth.toISOString();
};

const isUsageExpired = (resetDate: string): boolean => {
	return new Date() >= new Date(resetDate);
};

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>(
		{
			plan: "basic",
			nearbyUsageCount: 0,
			nearbyUsageResetDate: getMonthResetDate(),
		}
	);

	// Load subscription state from localStorage on mount
	useEffect(() => {
		try {
			const storedSubscription = localStorage.getItem("subscription");
			if (storedSubscription) {
				const parsed = JSON.parse(storedSubscription);

				// Check if usage period has expired and reset if needed
				if (isUsageExpired(parsed.nearbyUsageResetDate)) {
					setSubscriptionState({
						...parsed,
						nearbyUsageCount: 0,
						nearbyUsageResetDate: getMonthResetDate(),
					});
				} else {
					setSubscriptionState(parsed);
				}
			}
		} catch (error) {
			console.error("Failed to load subscription from localStorage", error);
			localStorage.removeItem("subscription");
		}
	}, []);

	// Save subscription state to localStorage whenever it changes
	useEffect(() => {
		try {
			localStorage.setItem("subscription", JSON.stringify(subscriptionState));
		} catch (error) {
			console.error("Failed to save subscription to localStorage", error);
		}
	}, [subscriptionState]);

	const canUseNearby = useMemo(() => {
		if (subscriptionState.plan === "pro") {
			return true;
		}

		// Check if usage period has expired
		if (isUsageExpired(subscriptionState.nearbyUsageResetDate)) {
			return true; // Will be reset on next usage
		}

		return subscriptionState.nearbyUsageCount < NEARBY_USAGE_LIMIT;
	}, [subscriptionState]);

	const nearbyUsageRemaining = useMemo(() => {
		if (subscriptionState.plan === "pro") {
			return Infinity;
		}

		if (isUsageExpired(subscriptionState.nearbyUsageResetDate)) {
			return NEARBY_USAGE_LIMIT;
		}

		return Math.max(0, NEARBY_USAGE_LIMIT - subscriptionState.nearbyUsageCount);
	}, [subscriptionState]);

	const upgradeRequired = useMemo(() => {
		return subscriptionState.plan === "basic" && !canUseNearby;
	}, [subscriptionState.plan, canUseNearby]);

	const useNearbyService = useCallback((): boolean => {
		if (subscriptionState.plan === "pro") {
			return true; // Pro users have unlimited access
		}

		// Check if usage period has expired and reset if needed
		if (isUsageExpired(subscriptionState.nearbyUsageResetDate)) {
			setSubscriptionState((prev) => ({
				...prev,
				nearbyUsageCount: 1,
				nearbyUsageResetDate: getMonthResetDate(),
			}));
			return true;
		}

		// Check if user has remaining usage
		if (subscriptionState.nearbyUsageCount < NEARBY_USAGE_LIMIT) {
			setSubscriptionState((prev) => ({
				...prev,
				nearbyUsageCount: prev.nearbyUsageCount + 1,
			}));
			return true;
		}

		return false; // Usage limit exceeded
	}, [subscriptionState]);

	const resetUsageCount = useCallback(() => {
		setSubscriptionState((prev) => ({
			...prev,
			nearbyUsageCount: 0,
			nearbyUsageResetDate: getMonthResetDate(),
		}));
	}, []);

	const upgradeToPro = useCallback(() => {
		setSubscriptionState((prev) => ({
			...prev,
			plan: "pro",
		}));
	}, []);

	const downgradeToBasic = useCallback(() => {
		setSubscriptionState((prev) => ({
			...prev,
			plan: "basic",
		}));
	}, []);

	const value = useMemo(
		() => ({
			subscriptionState,
			canUseNearby,
			nearbyUsageRemaining,
			upgradeRequired,
			useNearbyService,
			resetUsageCount,
			upgradeToPro,
			downgradeToBasic,
		}),
		[
			subscriptionState,
			canUseNearby,
			nearbyUsageRemaining,
			upgradeRequired,
			useNearbyService,
			resetUsageCount,
			upgradeToPro,
			downgradeToBasic,
		]
	);

	return (
		<SubscriptionContext.Provider value={value}>
			{children}
		</SubscriptionContext.Provider>
	);
};

export const useSubscription = (): SubscriptionContextType => {
	const context = useContext(SubscriptionContext);
	if (context === undefined) {
		throw new Error(
			"useSubscription must be used within a SubscriptionProvider"
		);
	}
	return context;
};
