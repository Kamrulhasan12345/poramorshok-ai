import React from "react";
import { useLanguage } from "../hooks/useLanguage";
import Icon from "./Icon";

interface PlanFeature {
	text: string;
	included: boolean;
}

interface Plan {
	name: string;
	price: string;
	priceDetail: string;
	description: string;
	features: PlanFeature[];
	buttonText: string;
	buttonStyle: string;
	popular?: boolean;
}

const SubscriptionPlans: React.FC = () => {
	const { language, t } = useLanguage();

	const plans: Plan[] = [
		{
			name: language === "bn" ? "বেসিক প্ল্যান" : "Basic Plan",
			price: language === "bn" ? "ফ্রি" : "Free",
			priceDetail: language === "bn" ? "চিরকালের জন্য" : "Forever",
			description:
				language === "bn"
					? "মৌলিক স্বাস্থ্য ট্র্যাকিং ও পরামর্শ পান"
					: "Get basic health tracking and consultation",
			features: [
				{
					text: language === "bn" ? "স্বাস্থ্য ট্র্যাকিং" : "Health Tracking",
					included: true,
				},
				{
					text: language === "bn" ? "ডায়েট প্ল্যানার" : "Diet Planner",
					included: true,
				},
				{
					text: language === "bn" ? "এক্সারসাইজ প্ল্যানার" : "Exercise Planner",
					included: true,
				},
				{
					text: language === "bn" ? "এআই পরামর্শ" : "AI Consultation",
					included: true,
				},
				{
					text: language === "bn" ? "মজার তথ্য" : "Fun Facts",
					included: true,
				},
				{
					text:
						language === "bn"
							? "নিকটস্থ হাসপাতাল (মাসে ৫ বার)"
							: "Nearby Hospitals (5 times/month)",
					included: true,
				},
			],
			buttonText: language === "bn" ? "বর্তমান প্ল্যান" : "Current Plan",
			buttonStyle: "bg-gray-200 text-gray-600 cursor-not-allowed",
		},
		{
			name: language === "bn" ? "প্রো প্ল্যান" : "Pro Plan",
			price: language === "bn" ? "৯৯৯ টাকা" : "BDT 999",
			priceDetail: language === "bn" ? "/মাস" : "/month",
			description:
				language === "bn"
					? "সব ফিচার আনলিমিটেড ব্যবহার করুন"
					: "Unlimited access to all features",
			features: [
				{
					text: language === "bn" ? "সব বেসিক ফিচার" : "All Basic Features",
					included: true,
				},
				{
					text:
						language === "bn"
							? "আনলিমিটেড নিকটস্থ হাসপাতাল"
							: "Unlimited Nearby Hospitals",
					included: true,
				},
				{
					text: language === "bn" ? "অগ্রাধিকার সাপোর্ট" : "Priority Support",
					included: true,
				},
				{
					text:
						language === "bn"
							? "বিজ্ঞাপন মুক্ত অভিজ্ঞতা"
							: "Ad-free Experience",
					included: true,
				},
				{
					text: language === "bn" ? "উন্নত রিপোর্ট" : "Advanced Reports",
					included: true,
				},
				{
					text:
						language === "bn"
							? "ব্যক্তিগত পরামর্শ"
							: "Personalized Recommendations",
					included: true,
				},
			],
			buttonText: language === "bn" ? "প্রো তে আপগ্রেড করুন" : "Upgrade to Pro",
			buttonStyle: "bg-teal-600 hover:bg-teal-700 text-white",
			popular: true,
		},
	];

	const handleSelectPlan = (planName: string) => {
		// TODO: Implement plan selection logic
		console.log("Selected plan:", planName);
		alert(
			language === "bn"
				? "পেমেন্ট সিস্টেম শীঘ্রই আসছে!"
				: "Payment system coming soon!"
		);
	};

	return (
		<div className="py-6">
			<div className="text-center mb-8">
				<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
					{language === "bn" ? "সাবস্ক্রিপশন প্ল্যান" : "Subscription Plans"}
				</h1>
				<p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
					{language === "bn"
						? "আপনার প্রয়োজন অনুযায়ী সঠিক প্ল্যান বেছে নিন এবং সর্বোচ্চ স্বাস্থ্য সেবা পান"
						: "Choose the right plan for your needs and get the best health care experience"}
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
				{plans.map((plan, index) => (
					<div
						key={index}
						className={`relative bg-white dark:bg-zinc-900 rounded-2xl shadow-lg border-2 p-8 ${
							plan.popular
								? "border-teal-500 dark:border-teal-400"
								: "border-gray-200 dark:border-zinc-800"
						}`}
					>
						{plan.popular && (
							<div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
								<span className="bg-teal-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
									{language === "bn" ? "জনপ্রিয়" : "Popular"}
								</span>
							</div>
						)}

						<div className="text-center mb-6">
							<h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
								{plan.name}
							</h3>
							<div className="mb-2">
								<span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
									{plan.price}
								</span>
								<span className="text-gray-600 dark:text-gray-400 ml-1">
									{plan.priceDetail}
								</span>
							</div>
							<p className="text-gray-600 dark:text-gray-300 text-sm">
								{plan.description}
							</p>
						</div>

						<div className="space-y-3 mb-8">
							{plan.features.map((feature, featureIndex) => (
								<div key={featureIndex} className="flex items-center gap-3">
									<Icon
										name={feature.included ? "check" : "close"}
										className={`h-5 w-5 ${
											feature.included ? "text-teal-500" : "text-gray-400"
										}`}
									/>
									<span
										className={`text-sm ${
											feature.included
												? "text-gray-700 dark:text-gray-300"
												: "text-gray-400 line-through"
										}`}
									>
										{feature.text}
									</span>
								</div>
							))}
						</div>

						<button
							onClick={() => handleSelectPlan(plan.name)}
							disabled={index === 0} // Basic plan is already active
							className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${plan.buttonStyle}`}
						>
							{plan.buttonText}
						</button>
					</div>
				))}
			</div>

			<div className="mt-12 text-center">
				<div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 max-w-2xl mx-auto">
					<div className="flex items-center justify-center gap-2 mb-3">
						<Icon
							name="info-circle"
							className="h-5 w-5 text-blue-600 dark:text-blue-400"
						/>
						<h4 className="font-semibold text-blue-900 dark:text-blue-100">
							{language === "bn"
								? "গুরুত্বপূর্ণ তথ্য"
								: "Important Information"}
						</h4>
					</div>
					<p className="text-blue-700 dark:text-blue-200 text-sm leading-relaxed">
						{language === "bn"
							? "বেসিক প্ল্যানে আপনি মাসে ৫ বার নিকটস্থ হাসপাতাল খুঁজে পেতে পারবেন। প্রো প্ল্যানে আপনি আনলিমিটেড ব্যবহার করতে পারবেন এবং আরও অনেক সুবিধা পাবেন।"
							: "With the Basic plan, you can find nearby hospitals 5 times per month. The Pro plan offers unlimited usage and many additional benefits."}
					</p>
				</div>
			</div>
		</div>
	);
};

export default SubscriptionPlans;
