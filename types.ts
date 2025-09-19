export type View =
	| "chatbot"
	| "tracker"
	| "diet"
	| "exercise"
	| "wallet"
	| "settings"
	| "login"
	| "nearby"
	| "subscription";

export interface User {
	id: string;
	name: string;
	email: string;
	avatar: string;
	subscriptionPlan?: "basic" | "pro";
}

export interface SymptomAnalysis {
	symptoms: string[];
	causes: string[];
	treatments: string[];
	medications: string[];
	mentalHealthSupport?: string[];
}

export interface ChatMessage {
	sender: "user" | "ai";
	text: string;
	analysis?: SymptomAnalysis;
}

export interface HealthEntry {
	date: string;
	age: number;
	height: number;
	weight: number;
	bmi: number;
}

export interface HealthAdvice {
	dietaryAdvice: string[];
	exerciseRecommendations: string[];
	lifestyleSuggestions: string[];
}

export type DietGoal =
	| "weight-loss"
	| "maintain-weight"
	| "muscle-gain"
	| "weight-gain";
export type DietaryPreference = "non-vegetarian" | "vegetarian" | "vegan";

export interface DietPlanRequest {
	goal: DietGoal;
	preference: DietaryPreference;
	healthData: HealthEntry | null;
}

export interface Meal {
	name: string;
	items: string[];
}

export interface DailyDiet {
	day: string;
	meals: Meal[];
	dailyNote: string;
}

export interface DietPlan {
	summary: string;
	plan: DailyDiet[];
}

export interface Exercise {
	name: string;
	description: string;
	duration: string;
	type: "Cardio" | "Strength" | "Flexibility";
}

export interface DailyExercisePlan {
	day: string;
	details: string;
	exercises: Exercise[];
}

export interface ExercisePlan {
	advice: string;
	plan: DailyExercisePlan[];
}

export type FitnessLevel = "beginner" | "intermediate" | "advanced";
export type ExerciseLocation = "home" | "gym";

export interface ExercisePlanRequest {
	goal: DietGoal;
	healthData: HealthEntry | null;
	fitnessLevel: FitnessLevel;
	location: ExerciseLocation;
	timePerDay: string;
}

// Health Wallet Types
export interface MedicalRecord {
	id: string;
	name: string;
	date: string;
	fileData: string; // base64
	fileType: string;
}

export interface Drug {
	id: string;
	name: string;
	dosage: string;
	reminderEnabled?: boolean;
	reminderTimes?: string[];
}

export interface Prescription {
	id: string;
	doctor: string;
	date: string;
	drugs: Drug[];
	fileData?: string; // base64
	fileType?: string;
}

export interface Insurance {
	id: string;
	provider: string;
	policyNumber: string;
	contact: string;
	fileData?: string; // base64
	fileType?: string;
}

export interface InAppAlertInfo {
	drugName: string;
	dosage: string;
	doctor: string;
}

export interface Hospital {
	name: string;
	address: string;
	phone?: string;
	ambulancePhone?: string;
	latitude: number;
	longitude: number;
}
