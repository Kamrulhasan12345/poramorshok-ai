import React, { useState, useCallback, useEffect, useRef } from "react";
import * as htmlToImage from "html-to-image";
import {
	DietGoal,
	DietaryPreference,
	DietPlan,
	DietPlanRequest,
	HealthEntry,
} from "../types";
import { generateDietPlan } from "../services/geminiService";
import { dietService, healthService } from "../src/services/database";
import { useAuth } from "../src/contexts/AuthContext";
import Icon from "./Icon";
import Loader from "./Loader";
import Disclaimer from "./Disclaimer";
import { useLanguage } from "../hooks/useLanguage";
import { useTheme } from "../contexts/ThemeContext";

const DietPlanner: React.FC = () => {
	const [goal, setGoal] = useState<DietGoal>("maintain-weight");
	const [preference, setPreference] =
		useState<DietaryPreference>("non-vegetarian");
	const [plan, setPlan] = useState<DietPlan | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [latestHealthData, setLatestHealthData] = useState<HealthEntry | null>(
		null
	);
	const [savedPlans, setSavedPlans] = useState<any[]>([]);
	const [loadingPlans, setLoadingPlans] = useState(false);
	const [saving, setSaving] = useState(false);
	const planRef = useRef<HTMLDivElement>(null);
	const { language, t } = useLanguage();
	const { theme } = useTheme();
	const { user } = useAuth();

	const goalOptions: { value: DietGoal; labelKey: string }[] = [
		{ value: "weight-loss", labelKey: "goalWeightLoss" },
		{ value: "maintain-weight", labelKey: "goalMaintainWeight" },
		{ value: "muscle-gain", labelKey: "goalMuscleGain" },
		{ value: "weight-gain", labelKey: "goalWeightGain" },
	];

	const preferenceOptions: { value: DietaryPreference; labelKey: string }[] = [
		{ value: "non-vegetarian", labelKey: "prefNonVegetarian" },
		{ value: "vegetarian", labelKey: "prefVegetarian" },
		{ value: "vegan", labelKey: "prefVegan" },
	];

	// Load health data and saved diet plans
	useEffect(() => {
		const loadData = async () => {
			if (!user) {
				// For non-authenticated users, try localStorage fallback for health data
				try {
					const storedHistory = localStorage.getItem("healthHistory");
					if (storedHistory) {
						const history: HealthEntry[] = JSON.parse(storedHistory);
						if (history.length > 0) {
							setLatestHealthData(history[history.length - 1]);
						}
					}
				} catch (error) {
					console.error(
						"Failed to parse health history for diet planner",
						error
					);
				}
				return;
			}

			try {
				// Load latest health data from database
				const healthEntries = await healthService.getEntries(user.id);
				if (healthEntries && healthEntries.length > 0) {
					const latestEntry = healthEntries[0]; // Assuming they're ordered by date desc
					const heightInMeters = latestEntry.height_cm / 100;
					const bmi = latestEntry.weight_kg / (heightInMeters * heightInMeters);
					setLatestHealthData({
						id: latestEntry.id,
						date: latestEntry.date,
						weight: latestEntry.weight_kg,
						height: latestEntry.height_cm,
						age: latestEntry.age,
						bmi: bmi,
					});
				}

				// Load saved diet plans
				setLoadingPlans(true);
				const plans = await dietService.getPlans(user.id);
				setSavedPlans(plans || []);
			} catch (error) {
				console.error("Failed to load data from database:", error);
			} finally {
				setLoadingPlans(false);
			}
		};

		loadData();
	}, [user]);

	const handleDownload = useCallback(() => {
		if (!plan) return;

		let content = `# ${t("your7DayDietPlan")}\n\n`;
		content += `**${t("healthGoalLabel")}:** ${t(
			goalOptions.find((g) => g.value === goal)?.labelKey || ""
		)}\n`;
		content += `**${t("dietaryPreferenceLabel")}:** ${t(
			preferenceOptions.find((p) => p.value === preference)?.labelKey || ""
		)}\n\n`;
		content += `## ${t("planSummary")}\n${plan.summary}\n\n`;
		content += "---\n\n";

		plan.plan.forEach((dailyPlan) => {
			content += `## ${dailyPlan.day}\n\n`;
			content += `**${t("dailyNote")}:** ${dailyPlan.dailyNote}\n\n`;
			dailyPlan.meals.forEach((meal) => {
				content += `### ${meal.name}\n`;
				meal.items.forEach((item) => {
					content += `- ${item}\n`;
				});
				content += "\n";
			});
			content += "---\n\n";
		});

		const disclaimerText =
			language === "en"
				? "Disclaimer: The information provided by পরামর্শক AI is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition."
				: "দাবিত্যাগ: পরামর্শক AI দ্বারা প্রদত্ত তথ্য শুধুমাত্র তথ্যগত উদ্দেশ্যে এবং পেশাদার চিকিৎসা পরামর্শ, রোগ নির্ণয় বা চিকিৎসার বিকল্প নয়। যেকোনো চিকিৎসা সংক্রান্ত প্রশ্ন থাকলে সর্বদা আপনার চিকিৎসক বা অন্য যোগ্য স্বাস্থ্য প্রদানকারীর পরামর্শ নিন।";

		content += `\n\n_${disclaimerText}_`;

		const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "7-Day-Diet-Plan.md";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}, [plan, goal, preference, t, language, goalOptions, preferenceOptions]);

	const handleDownloadImage = useCallback(() => {
		const node = planRef.current;
		if (node === null) return;

		htmlToImage
			.toCanvas(node, {
				cacheBust: true,
				backgroundColor: theme === "dark" ? "#18181b" : "#ffffff",
				pixelRatio: 2,
				width: node.offsetWidth,
				height: node.scrollHeight,
			})
			.then((canvas) => {
				const ctx = canvas.getContext("2d");
				if (!ctx) return;

				// Watermark
				ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
				const fontSize = canvas.width / 60;
				ctx.font = `bold ${fontSize}px sans-serif`;
				ctx.textAlign = "right";
				ctx.textBaseline = "bottom";
				ctx.fillText(
					"পরামর্শক AI",
					canvas.width - fontSize,
					canvas.height - fontSize
				);

				// Download
				const link = document.createElement("a");
				link.download = "7-day-diet-plan.png";
				link.href = canvas.toDataURL("image/png");
				link.click();
			})
			.catch((err) => {
				console.error("oops, something went wrong!", err);
				alert("Sorry, could not download image.");
			});
	}, [theme]);

	const savePlanToDatabase = useCallback(
		async (dietPlan: DietPlan) => {
			if (!user || !dietPlan) return;

			try {
				setSaving(true);

				// Prepare plan data for database
				const planData = {
					user_id: user.id,
					goal: goal,
					dietary_preference: preference,
					summary: dietPlan.summary,
					based_on_health_entry_id: latestHealthData?.id,
					created_at: new Date().toISOString(),
				};

				// Prepare days data
				const daysData = dietPlan.plan.map((day, index) => ({
					day_name: day.day,
					daily_note: day.dailyNote,
					day_order: index + 1,
					meals: day.meals.map((meal, mealIndex) => ({
						meal_name: meal.name,
						meal_items: meal.items,
						meal_order: mealIndex + 1,
					})),
				}));

				// Save to database
				await dietService.addPlan(planData, daysData);

				// Reload saved plans
				const updatedPlans = await dietService.getPlans(user.id);
				setSavedPlans(updatedPlans || []);

				console.log("Diet plan saved successfully");
			} catch (error) {
				console.error("Failed to save diet plan:", error);
			} finally {
				setSaving(false);
			}
		},
		[user, goal, preference, latestHealthData]
	);

	const handleGeneratePlan = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			setIsLoading(true);
			setError(null);
			setPlan(null);

			const request: DietPlanRequest = {
				goal,
				preference,
				healthData: latestHealthData,
			};

			try {
				const newPlan = await generateDietPlan(request, language);
				setPlan(newPlan);

				// Save to database if user is logged in
				if (user) {
					await savePlanToDatabase(newPlan);
				}
			} catch (err) {
				const message = err instanceof Error ? err.message : t("unknownError");
				setError(message);
			} finally {
				setIsLoading(false);
			}
		},
		[goal, preference, latestHealthData, language, t, user, savePlanToDatabase]
	);

	return (
		<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up">
			<div className="lg:col-span-1 space-y-6">
				{/* User Notice for Non-Authenticated Users */}
				{!user && (
					<div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
						<div className="flex items-start gap-3">
							<div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
								<Icon name="user" className="h-5 w-5" />
							</div>
							<div>
								<p className="text-sm font-medium text-blue-800 dark:text-blue-300">
									{t("dietPlansNotSaved") || "Diet plans won't be saved"}
								</p>
								<p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
									{t("loginToSavePlans") ||
										"Log in to save your diet plans and access them across devices."}
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Saved Diet Plans for Authenticated Users */}
				{user && (
					<div className="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-xl border border-gray-200/80 dark:border-zinc-800/80">
						<h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
							{t("savedDietPlans") || "Saved Diet Plans"}
						</h3>
						{loadingPlans ? (
							<div className="flex items-center justify-center py-8">
								<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-500"></div>
								<span className="ml-3 text-gray-600 dark:text-gray-400 text-sm">
									Loading...
								</span>
							</div>
						) : savedPlans.length > 0 ? (
							<div className="space-y-3 max-h-64 overflow-y-auto">
								{savedPlans.map((savedPlan, index) => (
									<div
										key={savedPlan.id}
										className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
									>
										<div className="flex justify-between items-start">
											<div className="flex-1">
												<p className="text-sm font-medium text-gray-900 dark:text-gray-100">
													{savedPlan.goal
														.replace("-", " ")
														.replace(/\b\w/g, (l: string) =>
															l.toUpperCase()
														)}{" "}
													Plan
												</p>
												<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
													{new Date(savedPlan.created_at).toLocaleDateString()}
												</p>
											</div>
											<span className="text-xs px-2 py-1 bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 rounded-full">
												{savedPlan.dietary_preference}
											</span>
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
								{t("noSavedPlans") || "No saved diet plans yet."}
							</p>
						)}
					</div>
				)}

				{/* Generate Plan Form */}
				<div className="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-xl border border-gray-200/80 dark:border-zinc-800/80 sticky top-28 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
					<h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
						{t("createYourPlan")}
					</h3>
					<form onSubmit={handleGeneratePlan} className="space-y-4">
						<div>
							<label
								htmlFor="goal"
								className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
							>
								{t("healthGoalLabel")}
							</label>
							<select
								id="goal"
								value={goal}
								onChange={(e) => setGoal(e.target.value as DietGoal)}
								className="mt-1 block w-full rounded-md bg-gray-50 dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2.5"
							>
								{goalOptions.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{t(opt.labelKey)}
									</option>
								))}
							</select>
						</div>
						<div>
							<label
								htmlFor="preference"
								className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
							>
								{t("dietaryPreferenceLabel")}
							</label>
							<select
								id="preference"
								value={preference}
								onChange={(e) =>
									setPreference(e.target.value as DietaryPreference)
								}
								className="mt-1 block w-full rounded-md bg-gray-50 dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2.5"
							>
								{preferenceOptions.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{t(opt.labelKey)}
									</option>
								))}
							</select>
						</div>
						{latestHealthData?.age ? (
							<div className="p-3 bg-blue-50 dark:bg-blue-900/50 text-sm text-blue-800 dark:text-blue-300 flex items-start gap-2 rounded-md">
								<Icon name="info" className="h-5 w-5 mt-0.5 flex-shrink-0" />
								<span>
									{t("usingLatestHealthData", {
										age: latestHealthData.age,
										bmi: latestHealthData.bmi?.toFixed(2) || "N/A",
									})}
								</span>
							</div>
						) : (
							<div className="p-3 bg-yellow-50 dark:bg-yellow-900/50 text-sm text-yellow-800 dark:text-yellow-300 flex items-start gap-2 rounded-md">
								<Icon name="info" className="h-5 w-5 mt-0.5 flex-shrink-0" />
								<span>{t("noHealthDataForExercise")}</span>
							</div>
						)}
						<button
							type="submit"
							className="w-full bg-teal-500 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-teal-600 transition duration-200 disabled:opacity-60"
							disabled={isLoading || !latestHealthData?.age}
						>
							{isLoading ? t("generating") : t("generatePlan")}
						</button>
					</form>
				</div>
			</div>
			<div className="lg:col-span-2">
				<div className="p-1">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
							{t("your7DayPlan")}
						</h3>
						{plan && !isLoading && (
							<div className="flex items-center gap-2">
								<button
									onClick={handleDownloadImage}
									className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-zinc-700 shadow-sm text-sm leading-5 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
								>
									<Icon
										name="image-download"
										className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400"
									/>
									{t("image")}
								</button>
								<button
									onClick={handleDownload}
									className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-zinc-700 shadow-sm text-sm leading-5 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
								>
									<Icon
										name="download"
										className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400"
									/>
									{t("plan")}
								</button>
							</div>
						)}
					</div>

					{isLoading && (
						<div className="flex justify-center items-center h-64">
							<Loader />
						</div>
					)}
					{error && (
						<div className="text-center text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-500/30">
							<p>
								<strong>{t("errorLabel")}:</strong> {error}
							</p>
						</div>
					)}
					{!isLoading && !error && !plan && (
						<div className="text-center py-16 text-gray-500 dark:text-gray-400">
							<Icon
								name="plan"
								className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
							/>
							<p className="font-medium">{t("planWillAppearHere")}</p>
							<p className="text-sm mt-1">{t("selectGoalsForDiet")}</p>
						</div>
					)}
					{plan && (
						<div
							ref={planRef}
							className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800/80 p-4 sm:p-6 space-y-6"
						>
							<div>
								<h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
									{t("planSummary")}
								</h4>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									{plan.summary}
								</p>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
								{plan.plan.map((dailyPlan) => (
									<div
										key={dailyPlan.day}
										className="bg-gray-50/80 dark:bg-zinc-800/50 rounded-lg p-4 border border-gray-200/60 dark:border-zinc-800/60 flex flex-col"
									>
										<h4 className="font-bold text-gray-800 dark:text-gray-200 text-md mb-3">
											{dailyPlan.day}
										</h4>
										<div className="mb-4 pl-2 border-l-2 border-teal-200 dark:border-teal-700">
											<p className="text-xs text-gray-600 dark:text-gray-400 italic">
												"{dailyPlan.dailyNote}"
											</p>
										</div>
										<div className="space-y-4">
											{dailyPlan.meals.map((meal) => (
												<div key={meal.name}>
													<h5 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
														{meal.name}
													</h5>
													<ul className="list-disc list-outside pl-5 mt-1 text-sm text-gray-600 dark:text-gray-400 space-y-1">
														{meal.items.map((item, i) => (
															<li key={i}>{item}</li>
														))}
													</ul>
												</div>
											))}
										</div>
									</div>
								))}
							</div>
							<Disclaimer />
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default DietPlanner;
