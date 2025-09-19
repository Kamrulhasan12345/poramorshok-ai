import React, { useCallback, useMemo, useState } from "react";
import { Hospital } from "../types";
import { useLanguage } from "../hooks/useLanguage";
import Icon from "./Icon";
import {
	findNearbyHospitals,
	classifyMedicalSpecialties,
	getEmergencyAdvice,
} from "../services/geminiService";

const Nearby: React.FC = () => {
	const { language, t } = useLanguage();
	const [stage, setStage] = useState<"idle" | "locating" | "fetching">("idle");
	const [error, setError] = useState<string>("");
	const [hospitals, setHospitals] = useState<Hospital[]>([]);
	const [problem, setProblem] = useState<string>("");
	const [keywords, setKeywords] = useState<string[]>([]);
	const [advice, setAdvice] = useState<{
		steps: string[];
		cautions: string[];
		whenToCallEmergencyNow: string[];
	} | null>(null);

	const isBusy = stage !== "idle";

	const handleFind = useCallback(() => {
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
	}, [language, t, problem]);

	const statusText = useMemo(() => {
		if (stage === "locating") return t("findingYourLocation");
		if (stage === "fetching") return t("fetchingHospitals");
		return "";
	}, [stage, t]);

	return (
		<div className="py-4">
			<div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-5 mb-4">
				<div className="flex items-center gap-3 mb-2">
					<Icon name="hospital" className="h-6 w-6 text-teal-600" />
					<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
						{t("nearbyHospitalsTitle")}
					</h2>
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
						disabled={isBusy}
						className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
							isBusy
								? "bg-gray-300 text-gray-600 cursor-not-allowed"
								: "bg-teal-600 hover:bg-teal-700 text-white"
						}`}
					>
						<Icon name="search" className="h-5 w-5" />
						<span>{t("findNearbyHospitals")}</span>
					</button>
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
	);
};

export default Nearby;
