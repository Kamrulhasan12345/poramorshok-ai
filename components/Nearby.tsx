import React, { useCallback, useMemo, useState } from "react";
import { Hospital } from "../types";
import { useLanguage } from "../hooks/useLanguage";
import { useSubscription } from "../hooks/useSubscription";
import Icon from "./Icon";
import {
	findNearbyHospitals,
	classifyMedicalSpecialties,
	getEmergencyAdvice,
} from "../services/geminiService";

const Nearby: React.FC = () => {
	const { language, t } = useLanguage();
	const { 
		subscriptionState, 
		updatePlan, 
		incrementNearbyUsage, 
		canUseNearby, 
		getRemainingNearbyUses 
	} = useSubscription();
	const [stage, setStage] = useState<"idle" | "locating" | "fetching">("idle");
	const [error, setError] = useState<string>("");
	const [hospitals, setHospitals] = useState<Hospital[]>([]);
	const [problem, setProblem] = useState<string>("");
	const [keywords, setKeywords] = useState<string[]>([]);
	const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
	const [advice, setAdvice] = useState<{
		steps: string[];
		cautions: string[];
		whenToCallEmergencyNow: string[];
	} | null>(null);

	const isBusy = stage !== "idle";

	const handleFind = useCallback(() => {
		// Check subscription access before proceeding
		if (!canUseNearby()) {
			setShowPlanModal(true);
			return;
		}

		setError("");
		setHospitals([]);
		setStage("locating");

		if (!navigator.geolocation) {
			setError(t("unableToFetchLocation"));
			setStage("idle");
			return;
		}

		navigator.geolocation.getCurrentPosition(
			async (pos) => {
				try {
					setStage("fetching");
					const { latitude, longitude } = pos.coords;

					// Derive specialties from problem description
					let derivedKeywords: string[] = [];
					if (problem.trim().length > 0) {
						derivedKeywords = await classifyMedicalSpecialties(
							problem,
							language
						);
						setKeywords(derivedKeywords);
						// Fetch emergency advice in parallel with Places/Gemini
						getEmergencyAdvice(problem, language).then((adv) => setAdvice(adv));
					}

					// Primary: call backend Google Places proxy
					let results: Hospital[] | null = null;
					try {
						const kw = encodeURIComponent(
							(derivedKeywords[0] || "").toString()
						);
						const query = kw ? `&keyword=${kw}` : "";
						const resp = await fetch(
							`http://localhost:8787/api/nearby-hospitals?lat=${latitude}&lon=${longitude}${query}`
						);
						if (resp.ok) {
							const data = await resp.json();
							// Map minimal fields; optionally enrich later with Gemini
							results = (data?.results || []).slice(0, 10).map((r: any) => ({
								name: r.name,
								address: r.vicinity || r.formatted_address || "",
								phone: undefined, // Nearby Search lacks phone; needs Place Details for phone
								ambulancePhone: undefined,
								latitude: r.geometry?.location?.lat ?? latitude,
								longitude: r.geometry?.location?.lng ?? longitude,
							}));
						}
					} catch (e) {
						// Backend may be down or key missing; fall back to Gemini direct flow
					}

					if (!results || results.length === 0) {
						const aiResults = await findNearbyHospitals(
							latitude,
							longitude,
							language
						);
						results = aiResults || [];
					}

					setHospitals(results);
					// Increment usage count after successful search
					incrementNearbyUsage();
				} catch (e) {
					setError(t("noHospitalsFound"));
				} finally {
					setStage("idle");
				}
			},
			(err) => {
				if (err.code === err.PERMISSION_DENIED) {
					setError(
						`${t("locationPermissionDenied")}\n${t("howToEnableLocation")}`
					);
				} else {
					setError(t("unableToFetchLocation"));
				}
				setStage("idle");
			}
		);
	}, [language, t, problem, canUseNearby, incrementNearbyUsage]);

	const statusText = useMemo(() => {
		if (stage === "locating") return t("findingYourLocation");
		if (stage === "fetching") return t("fetchingHospitals");
		return "";
	}, [stage, t]);

	const handleSelectPlan = (plan: 'basic' | 'pro') => {
		// For now, just show a message that payment is coming soon
		alert(t("paymentComingSoon"));
		// Uncommenting the line below would actually change the plan
		// updatePlan(plan);
		setShowPlanModal(false);
	};

	const PlanModal = () => {
		if (!showPlanModal) return null;

		return (
			<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
				<div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
					<div className="p-6 border-b dark:border-zinc-800">
						<div className="flex justify-between items-center">
							<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
								{t("chooseYourPlan")}
							</h2>
							<button
								onClick={() => setShowPlanModal(false)}
								className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-800"
								aria-label={t("cancel")}
							>
								<Icon name="plus" className="h-5 w-5 transform rotate-45" />
							</button>
						</div>
						<p className="text-gray-600 dark:text-gray-300 mt-2">
							{t("planSelectionDescription")}
						</p>
					</div>

					<div className="p-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Basic Plan */}
							<div className="border border-gray-200 dark:border-zinc-700 rounded-xl p-6 relative">
								<div className="flex items-center gap-2 mb-3">
									<Icon name="heart" className="h-6 w-6 text-teal-600" />
									<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
										{t("basicPlan")}
									</h3>
									{subscriptionState.plan === 'basic' && (
										<span className="bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 text-xs font-medium px-2 py-1 rounded-full">
											{t("currentPlan")}
										</span>
									)}
								</div>
								<div className="mb-4">
									<span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
										{t("free")}
									</span>
								</div>
								<div className="mb-6">
									<pre className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line font-sans">
										{t("basicPlanFeatures")}
									</pre>
								</div>
								<button
									onClick={() => handleSelectPlan('basic')}
									className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
								>
									{t("selectBasicPlan")}
								</button>
							</div>

							{/* Pro Plan */}
							<div className="border-2 border-teal-600 rounded-xl p-6 relative">
								<div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
									<span className="bg-teal-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
										<Icon name="crown" className="h-4 w-4" />
										Popular
									</span>
								</div>
								<div className="flex items-center gap-2 mb-3">
									<Icon name="star" className="h-6 w-6 text-teal-600" />
									<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
										{t("proPlan")}
									</h3>
									{subscriptionState.plan === 'pro' && (
										<span className="bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 text-xs font-medium px-2 py-1 rounded-full">
											{t("currentPlan")}
										</span>
									)}
								</div>
								<div className="mb-4">
									<span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
										$9.99
									</span>
									<span className="text-gray-600 dark:text-gray-400">/month</span>
								</div>
								<div className="mb-6">
									<pre className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line font-sans">
										{t("proPlanFeatures")}
									</pre>
								</div>
								<button
									onClick={() => handleSelectPlan('pro')}
									className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
								>
									{t("selectProPlan")}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	};

	const UsageIndicator = () => {
		if (subscriptionState.plan === 'pro') return null;

		const remaining = getRemainingNearbyUses();
		const total = subscriptionState.nearbyUsageLimit;

		return (
			<div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
				<div className="flex items-center gap-2 mb-2">
					<Icon name="info-circle" className="h-5 w-5 text-blue-600 dark:text-blue-400" />
					<span className="font-semibold text-blue-800 dark:text-blue-300">
						{t("nearbyUsageLimit")}
					</span>
				</div>
				<div className="text-sm text-blue-700 dark:text-blue-300">
					{remaining > 0 ? (
						<span>{t("usageRemaining", { remaining, limit: total })}</span>
					) : (
						<>
							<div className="mb-2">
								<span>{t("usageExhausted", { limit: total })}</span>
							</div>
							<button
								onClick={() => setShowPlanModal(true)}
								className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
							>
								<Icon name="crown" className="h-4 w-4" />
								{t("upgradeToPro")}
							</button>
						</>
					)}
				</div>
			</div>
		);
	};

	return (
		<>
			<div className="py-4">
				<UsageIndicator />
				
				<div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-5 mb-4">
					<div className="flex items-center gap-3 mb-2">
						<Icon name="hospital" className="h-6 w-6 text-teal-600" />
						<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
							{t("nearbyHospitalsTitle")}
						</h2>
						{subscriptionState.plan === 'pro' && (
							<span className="bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
								<Icon name="crown" className="h-3 w-3" />
								{t("proPlan")}
							</span>
						)}
					</div>
					<p className="text-gray-600 dark:text-gray-300 mb-4">
						{t("nearbyHospitalsDescription")}
					</p>

					<div className="mb-3">
						<input
							value={problem}
							onChange={(e) => setProblem(e.target.value)}
							placeholder={
								language === "bn"
									? "সমস্যা লিখুন, যেমন: বুক ব্যথা"
									: "Describe the issue, e.g., chest pain"
							}
							className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-100"
						/>
						{keywords.length > 0 && (
							<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
								{keywords.join(", ")}
							</p>
						)}
					</div>

					<div className="flex items-center gap-2">
						<button
							onClick={handleFind}
							disabled={isBusy || !canUseNearby()}
							className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
								isBusy || !canUseNearby()
									? "bg-gray-300 text-gray-600 cursor-not-allowed"
									: "bg-teal-600 hover:bg-teal-700 text-white"
							}`}
						>
							{!canUseNearby() && <Icon name="lock" className="h-5 w-5" />}
							<Icon name="search" className="h-5 w-5" />
							<span>{t("findNearbyHospitals")}</span>
						</button>
						{!canUseNearby() && (
							<button
								onClick={() => setShowPlanModal(true)}
								className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
							>
								<Icon name="crown" className="h-4 w-4" />
								{t("upgradeToPro")}
							</button>
						)}
						{statusText && (
							<span className="text-sm text-gray-600 dark:text-gray-400">
								{statusText}
							</span>
						)}
					</div>
					{error && (
						<div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 whitespace-pre-line">
							{error}
						</div>
					)}
				</div>

				{!error && hospitals.length === 0 && !isBusy && (
					<div className="text-sm text-gray-500 dark:text-gray-400">
						{t("planWillAppearHere")}
					</div>
				)}

				{advice && (
					<div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 mb-4">
						<div className="flex items-center gap-2 mb-2">
							<Icon name="info-circle" className="h-5 w-5 text-amber-500" />
							<p className="font-semibold text-gray-900 dark:text-gray-100">
								{language === "bn" ? "এখনই করণীয়" : "What to do now"}
							</p>
						</div>
						{advice.steps?.length > 0 && (
							<div className="mb-2">
								<p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
									{language === "bn" ? "ধাপসমূহ" : "Steps"}
								</p>
								<ol className="list-decimal ml-5 text-sm text-gray-700 dark:text-gray-300">
									{advice.steps.map((s, i) => (
										<li key={i} className="mt-0.5">
											{s}
										</li>
									))}
								</ol>
							</div>
						)}
						{advice.cautions?.length > 0 && (
							<div className="mb-2">
								<p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
									{language === "bn" ? "সতর্কতা" : "Cautions"}
								</p>
								<ul className="list-disc ml-5 text-sm text-gray-700 dark:text-gray-300">
									{advice.cautions.map((s, i) => (
										<li key={i} className="mt-0.5">
											{s}
										</li>
									))}
								</ul>
							</div>
						)}
						{advice.whenToCallEmergencyNow?.length > 0 && (
							<div>
								<p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
									{language === "bn"
										? "এখনই জরুরি নম্বরে কল করুন যদি"
										: "Call emergency now if"}
								</p>
								<ul className="list-disc ml-5 text-sm text-gray-700 dark:text-gray-300">
									{advice.whenToCallEmergencyNow.map((s, i) => (
										<li key={i} className="mt-0.5">
											{s}
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				)}

				{hospitals.length > 0 && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{hospitals.map((h, idx) => {
							const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
								`${h.latitude},${h.longitude}`
							)}`;
							return (
								<div
									key={`${h.name}-${idx}`}
									className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4"
								>
									<div className="flex items-start gap-3">
										<Icon name="hospital" className="h-6 w-6 text-teal-600" />
										<div className="flex-1">
											<p className="font-semibold text-gray-900 dark:text-gray-100">
												{h.name}
											</p>
											<p className="text-sm text-gray-600 dark:text-gray-300">
												{h.address}
											</p>
											<div className="mt-2 flex flex-wrap gap-2">
												{h.phone && (
													<a
														href={`tel:${h.phone}`}
														target="_self"
														className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 text-sm"
													>
														<Icon name="phone" className="h-4 w-4" />
														<span>{t("callHospital")}</span>
													</a>
												)}
												{h.ambulancePhone && (
													<a
														href={`tel:${h.ambulancePhone}`}
														target="_self"
														className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/40 text-red-800 dark:text-red-200 text-sm"
													>
														<Icon name="phone" className="h-4 w-4" />
														<span>{t("callAmbulance")}</span>
													</a>
												)}
												<a
													href={mapsUrl}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-sm"
												>
													<Icon name="search" className="h-4 w-4" />
													<span>{t("getDirections")}</span>
												</a>
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
			<PlanModal />
		</>
	);
};

export default Nearby;
