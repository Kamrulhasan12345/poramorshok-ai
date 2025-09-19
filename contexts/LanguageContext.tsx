import React, {
	createContext,
	useState,
	useEffect,
	ReactNode,
	useMemo,
	useCallback,
} from "react";
import { useAuth } from "../src/contexts/AuthContext";
import { userService } from "../src/services/database";

type Language = "en" | "bn";

interface LanguageContextType {
	language: Language;
	toggleLanguage: () => void;
	t: (key: string, options?: { [key: string]: string | number }) => string;
	updateLanguagePreference: (userId: string, lang: Language) => Promise<void>;
	loadUserLanguagePreference: (userId: string) => Promise<void>;
}

// Basic translations to make the app functional.
const translations: { [lang in Language]: { [key: string]: string } } = {
	en: {
		aiAnalyzer: "AI Analyzer",
		healthTracker: "Tracker",
		dietPlanner: "Diet Plan",
		exercisePlanner: "Exercise",
		healthWallet: "Wallet",
		nearby: 'Nearby',
		settings: "Settings",
		nearbyHospitalsTitle: "Nearby Hospitals",
		nearbyHospitalsDescription: "Find emergency medical services near your current location.",
		findNearbyHospitals: "Find Nearby Hospitals",
		findingYourLocation: "Finding your location...",
		fetchingHospitals: "Fetching nearby hospitals...",
		locationPermissionDenied: "Location Permission Denied",
		howToEnableLocation: "To use this feature, please enable location services in your browser settings for this site.",
		unableToFetchLocation: "Unable to retrieve your location. Please ensure location services are enabled and try again.",
		noHospitalsFound: "No hospitals found near your location, or the service is unavailable. Please try again later.",
		callHospital: "Call Hospital",
		callAmbulance: "Call Ambulance",
		getDirections: "Get Directions",
		reminderAlertTitle: "Medication Reminder",
		reminderAlertText: "Time to take your {drug}.",
		prescribingDoctor: "Prescribed by",
		cancel: "Cancel",
		mentalHealthSupport: "Mental Health Support",
		aiAnalysisDisclaimer:
			"Here is an analysis based on the symptoms you provided. Please remember, this is not a medical diagnosis.",
		unknownError: "An unknown error occurred.",
		aiProcessError: "Sorry, I encountered an error processing your request:",
		downloadChat: "Download Chat",
		downloading: "Downloading...",
		symptomAnalyzerTitle: "AI Symptom Analyzer",
		conversation: "Conversation",
		symptomAnalyzerDescription:
			"Describe your symptoms, and our AI will provide potential causes and suggestions. This is not a substitute for professional medical advice.",
		identifiedSymptoms: "Identified Symptoms",
		potentialCauses: "Potential Causes",
		suggestedTreatments: "Suggested Treatments",
		possibleMedications: "Possible Medications",
		errorLabel: "Error",
		symptomInputPlaceholder: 'e.g., "I have a headache and a slight fever..."',
		sendMessage: "Send Message",
		disclaimerTitle: "Disclaimer",
		disclaimerText:
			"The information provided by পরামর্শক AI is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.",
		thinking: "Thinking...",
		loadingChatHistory: "Loading chat history...",
		chatHistoryNotSaved: "Chat history won't be saved",
		loginToSaveChat:
			"Log in to save your conversations and access them across devices.",
		dietPlansNotSaved: "Diet plans won't be saved",
		loginToSavePlans:
			"Log in to save your diet plans and access them across devices.",
		savedDietPlans: "Saved Diet Plans",
		noSavedPlans: "No saved diet plans yet.",
		exercisePlansNotSaved: "Exercise plans won't be saved",
		savedExercisePlans: "Saved Exercise Plans",
		noSavedExercisePlans: "No saved exercise plans yet.",
		funFactError: "Could not fetch a fun fact at the moment.",
		funHealthFact: "Fun Health Fact!",
		yourProfile: "Your Profile",
		profileInfo:
			"This information helps in personalizing your plans. It's stored only on your device.",
		ageLabel: "Age",
		agePlaceholder: "Enter your age in years",
		addNewEntry: "Add New Entry",
		downloadImage: "Download Image",
		weightLabel: "Weight",
		weightPlaceholder: "e.g., 70.5",
		heightLabel: "Height",
		heightUnitToggle: "Use {unit}",
		heightPlaceholder: "e.g., 175",
		feetPlaceholder: "ft",
		inchesPlaceholder: "in",
		yourBmiIs: "Your calculated BMI is",
		ageRequiredError: "Please enter your age in the profile section first.",
		addEntryButton: "Add Entry",
		latestWeight: "Latest Weight",
		latestBmi: "Latest BMI",
		trendsTitle: "Your Health Trends",
		noChartData: "No Data to Display",
		addEntryForChart: "Add a new entry to see your progress chart.",
		aiGeneratedAdvice: "AI-Generated Advice",
		fetchAdviceError: "Could not fetch AI advice.",
		dietaryAdvice: "Dietary Advice",
		exerciseRecommendations: "Exercise Recommendations",
		lifestyleSuggestions: "Lifestyle Suggestions",
		addEntryForAdvice: "Add a health entry to get personalized AI advice.",
		allDataTitle: "All Entries",
		dateLabel: "Date",
		noHealthEntries: "You haven't added any health entries yet.",
		bmiUnderweight: "Underweight",
		bmiNormal: "Normal",
		bmiOverweight: "Overweight",
		bmiObese: "Obese",
		bmiAnalysis: "BMI Analysis",
		bmiIndicatorText: "Your BMI indicates you are in the",
		bmiCategoryText: "category.",
		goalWeightLoss: "Weight Loss",
		goalMaintainWeight: "Maintain Weight",
		goalMuscleGain: "Muscle Gain",
		goalWeightGain: "Weight Gain",
		prefNonVegetarian: "Non-Vegetarian",
		prefVegetarian: "Vegetarian",
		prefVegan: "Vegan",
		createYourPlan: "Create Your Diet Plan",
		healthGoalLabel: "Health Goal",
		dietaryPreferenceLabel: "Dietary Preference",
		usingLatestHealthData:
			"Using latest health data (Age: {age}, BMI: {bmi}) for personalization.",
		noHealthDataForExercise:
			"Add health data in the 'Tracker' tab for a personalized plan.",
		generating: "Generating...",
		generatePlan: "Generate Plan",
		your7DayPlan: "Your 7-Day Diet Plan",
		your7DayDietPlan: "Your 7-Day Diet Plan",
		image: "Image",
		plan: "Plan",
		planWillAppearHere: "Your plan will appear here.",
		selectGoalsForDiet: "Select your goals and generate a new diet plan.",
		planSummary: "Plan Summary",
		dailyNote: "Daily Note",
		fitnessBeginner: "Beginner",
		fitnessIntermediate: "Intermediate",
		fitnessAdvanced: "Advanced",
		locationHome: "Home",
		locationGym: "Gym",
		time30min: "30 minutes",
		time45min: "45 minutes",
		time60min: "60 minutes",
		noHealthDataError:
			"Health data is required to generate an exercise plan. Please add an entry in the Tracker tab.",
		createYourExercisePlan: "Create Your Exercise Plan",
		fitnessLevelLabel: "Your Fitness Level",
		locationLabel: "Exercise Location",
		timePerDayLabel: "Time Available Per Day",
		your7DayExercisePlan: "Your 7-Day Exercise Plan",
		personalizedAdviceTitle: "Personalized Advice",
		selectGoalsForExercise:
			"Select your goals and generate a new exercise plan.",
		walletTitle: "Health Wallet",
		walletDescription:
			"Securely store your medical records, prescriptions, and insurance details. All data is saved only on your device.",
		add: "Add",
		edit: "Edit",
		medicalRecords: "Medical Records",
		viewDocument: "View Document",
		deleteItem: "Delete item",
		noRecords: "No medical records added yet.",
		prescriptions: "Prescriptions",
		noPrescriptions: "No prescriptions added yet.",
		insuranceDetails: "Insurance Details",
		noInsurance: "No insurance details added yet.",
		save: "Save",
		confirmClearData:
			"Are you sure you want to clear all app data? This action cannot be undone.",
		confirmLogout: "Are you sure you want to log out?",
		clearAllData: "Clear App Data",
		dataManagement: "Data Management",
		dataManagementDesc: "Manage the data stored by this app in your browser.",
		login: "Log In",
		logout: "Log Out",
		account: "Account",
		loggedInAs: "Logged in as",
		appearance: "Appearance",
		theme: "Theme",
		language: "Language",
		downloadAllData: "Download All Data",
		downloadAllDataDesc: "Download all your app data as a single JSON file.",
		clearChatHistory: "Clear Chat History",
		clearChatHistoryDesc: "Permanently delete your conversation with the AI.",
		clearAllDataDesc: "Permanently remove all your data from this device.",
		confirmClearChat: "Are you sure you want to clear your chat history?",
		uploadTeamPicture: "Upload Team Picture",
		removePicture: "Remove Picture",
		// wallet form
		recordName: "Record Name",
		recordNamePlaceholder: "e.g., Blood Test Report",
		issueDate: "Issue Date",
		// prescribingDoctor: "Prescribing Doctor", // Already defined
		doctorPlaceholder: "e.g., Dr. Rahman",
		medicationsList: "Medications",
		drugName: "Drug Name",
		drugNamePlaceholder: "e.g., Paracetamol",
		dosage: "Dosage",
		dosagePlaceholder: "e.g., 500mg, 1 tablet twice a day",
		insuranceProvider: "Insurance Provider",
		providerPlaceholder: "e.g., Health Insurance Ltd.",
		policyNumber: "Policy Number",
		policyNumberPlaceholder: "e.g., HIL-12345",
		contactInfo: "Contact Info (Optional)",
		contactPlaceholder: "e.g., 16XXX or support@email.com",
		uploadOrTakePhoto: "Upload Document or Photo (Optional)",
		uploadFile: "Upload File",
		takePhoto: "Take Photo",
		addRecord: "Add Medical Record",
		addPrescription: "Add Prescription",
		editInsurance: "Edit Insurance Details",
		addInsurance: "Add Insurance Details",
		fieldRequired: "This field is required.",
		fileRequired: "A file is required for this record.",
		deleteConfirmation: "Are you sure you want to delete this item?",
		prescriptionRequiresOneDrug: "At least one valid drug entry is required.",
		photoOf: "{item} Photo",
		addDrug: "Add Another Drug",
		removeDrug: "Remove this drug",
		enableReminder: "Enable Reminder",
		notificationsBlocked:
			"Notification permission is blocked in your browser settings.",
		notificationPermissionNeeded: "Requires notification permission.",
		reminderTimes: "Reminder Times",
		addTime: "Add Time",
		removeTime: "Remove this time",
		// About App Section
		aboutAppTitle: "About the App",
		inspirationTitle: "Our Inspiration",
		inspirationText:
			"In many countries, patient records are scattered or paper-based, and people often don’t know what benefits or drugs they’re entitled to. This leads to huge delays in treatment and inefficient care. We saw an opportunity to change that.",
		storyTitle: "Our Story & Solution",
		storyText:
			"Born from a desire to bridge this gap, পরামর্শক AI started as a secure, mobile-first health identity. Our solution aggregates records, prescriptions, insurance, and telehealth into one simple, private wallet, empowering users to take control of their health information.",
		whatAppOffersTitle: "What This App Offers",
		whatAppOffersText:
			"A comprehensive suite of tools to manage your well-being:\n• AI Symptom Analyzer: Get instant, AI-powered insights on your health concerns.\n• Health Tracker: Log your vitals, track your progress with beautiful charts, and get personalized advice.\n• Diet & Exercise Planners: Receive custom 7-day plans tailored to your specific goals and health data.\n• Health Wallet: Securely store all your medical documents, prescriptions, and insurance info in one place, on your device.",
		teamTitle: "Meet the Team",
		teamText:
			"Developed with passion by Team Last Minute. We are dedicated to building accessible, user-centric technology that makes a real-world impact on people's health and lives.",
		// Login/Signup
		signUp: "Sign Up",
		signIn: "Sign In",
		back: "Back",
		loginDescription: "Welcome back! Please sign in to your account.",
		signUpDescription: "Create a new account to get started.",
		continueWithGoogle: "Continue with Google",
		signUpWithGoogle: "Sign up with Google",
		or: "or",
		fullName: "Full Name",
		enterYourName: "Enter your full name",
		emailAddress: "Email Address",
		enterYourEmail: "Enter your email address",
		password: "Password",
		enterYourPassword: "Enter your password",
		confirmPassword: "Confirm Password",
		confirmYourPassword: "Confirm your password",
		createAccount: "Create Account",
		signingIn: "Signing in...",
		creatingAccount: "Creating account...",
		dontHaveAccount: "Don't have an account?",
		alreadyHaveAccount: "Already have an account?",
		invalidEmail: "Please enter a valid email address.",
		passwordMinLength: "Password must be at least 6 characters long.",
		passwordMinLength8: "Password must be at least 8 characters long.",
		passwordStrengthRequirement:
			"Password must contain at least one uppercase letter, one lowercase letter, and one number.",
		nameMinLength: "Name must be at least 2 characters long.",
		passwordMismatch: "Passwords do not match.",
		passwordsMatch: "Passwords match!",
		passwordStrength: "Password strength",
		atLeast8Characters: "At least 8 characters",
		oneUppercase: "One uppercase letter",
		oneLowercase: "One lowercase letter",
		oneNumber: "One number",
		unexpectedError: "An unexpected error occurred",
		notLoggedIn: "You are not logged in.",
	},
	bn: {
		// Bengali translations
		aiAnalyzer: "এআই বিশ্লেষক",
		healthTracker: "ট্র্যাকার",
		dietPlanner: "ডায়েট প্ল্যান",
		exercisePlanner: "ব্যায়াম",
		healthWallet: "ওয়ালেট",
		nearby: 'কাছাকাছি',
		settings: "সেটিংস",
		nearbyHospitalsTitle: "কাছাকাছি হাসপাতাল",
		nearbyHospitalsDescription: "আপনার বর্তমান অবস্থানের কাছাকাছি জরুরি চিকিৎসা পরিষেবা খুঁজুন।",
		findNearbyHospitals: "কাছাকাছি হাসপাতাল খুঁজুন",
		findingYourLocation: "আপনার অবস্থান খোঁজা হচ্ছে...",
		fetchingHospitals: "কাছাকাছি হাসপাতাল আনা হচ্ছে...",
		locationPermissionDenied: "অবস্থানের অনুমতি দেওয়া হয়নি",
		howToEnableLocation: "এই বৈশিষ্ট্যটি ব্যবহার করতে, দয়া করে আপনার ব্রাউজার সেটিংসে এই সাইটের জন্য অবস্থান পরিষেবা সক্রিয় করুন।",
		unableToFetchLocation: "আপনার অবস্থান পুনরুদ্ধার করা সম্ভব হয়নি। দয়া করে অবস্থান পরিষেবা সক্রিয় আছে কিনা তা নিশ্চিত করে আবার চেষ্টা করুন।",
		noHospitalsFound: "আপনার অবস্থানের কাছাকাছি কোনো হাসপাতাল পাওয়া যায়নি, অথবা পরিষেবাটি উপলব্ধ নয়। অনুগ্রহ করে পরে আবার চেষ্টা করুন।",
		callHospital: "হাসপাতালে কল করুন",
		callAmbulance: "অ্যাম্বুলেন্সে কল করুন",
		getDirections: "দিকনির্দেশ পান",
		reminderAlertTitle: "ঔষধের অনুস্মারক",
		reminderAlertText: "আপনার {drug} নেওয়ার সময় হয়েছে।",
		prescribingDoctor: "লিখেছেন",
		cancel: "বাতিল করুন",
		mentalHealthSupport: "মানসিক স্বাস্থ্য সহায়তা",
		aiAnalysisDisclaimer:
			"আপনার দেওয়া লক্ষণগুলির উপর ভিত্তি করে এখানে একটি বিশ্লেষণ দেওয়া হলো। দয়া করে মনে রাখবেন, এটি কোনও ডাক্তারি تشخیص নয়।",
		unknownError: "একটি অজানা ত্রুটি ঘটেছে।",
		aiProcessError:
			"দুঃখিত, আপনার অনুরোধ প্রক্রিয়া করার সময় একটি ত্রুটি ঘটেছে:",
		downloadChat: "চ্যাট ডাউনলোড করুন",
		downloading: "ডাউনলোড হচ্ছে...",
		symptomAnalyzerTitle: "এআই বিশ্লেষক",
		conversation: "কথোপকথন",
		symptomAnalyzerDescription:
			"আপনার লক্ষণগুলি বর্ণনা করুন, এবং আমাদের এআই সম্ভাব্য কারণ এবং পরামর্শ দেবে। এটি পেশাদার চিকিৎসা পরামর্শের বিকল্প নয়।",
		identifiedSymptoms: "শনাক্তকৃত লক্ষণ",
		potentialCauses: "সম্ভাব্য কারণ",
		suggestedTreatments: "প্রস্তাবিত চিকিৎসা",
		possibleMedications: "সম্ভাব্য ঔষধ",
		errorLabel: "ত্রুটি",
		symptomInputPlaceholder: 'যেমন, "আমার মাথাব্যথা এবং সামান্য জ্বর আছে..."',
		sendMessage: "বার্তা পাঠান",
		disclaimerTitle: "দাবিত্যাগ",
		disclaimerText:
			"পরামর্শক AI দ্বারা প্রদত্ত তথ্য শুধুমাত্র তথ্যগত উদ্দেশ্যে এবং পেশাদার চিকিৎসা পরামর্শ, রোগ নির্ণয় বা চিকিৎসার বিকল্প নয়। যেকোনো চিকিৎসা সংক্রান্ত প্রশ্ন থাকলে সর্বদা আপনার চিকিৎসক বা অন্য যোগ্য স্বাস্থ্য প্রদানকারীর পরামর্শ নিন।",
		thinking: "ভাবছে...",
		loadingChatHistory: "চ্যাট ইতিহাস লোড হচ্ছে...",
		chatHistoryNotSaved: "চ্যাট ইতিহাস সংরক্ষিত হবে না",
		loginToSaveChat:
			"আপনার কথোপকথন সংরক্ষণ করতে এবং সব ডিভাইসে অ্যাক্সেস করতে লগ ইন করুন।",
		dietPlansNotSaved: "ডায়েট প্ল্যান সংরক্ষিত হবে না",
		loginToSavePlans:
			"আপনার ডায়েট প্ল্যান সংরক্ষণ করতে এবং সব ডিভাইসে অ্যাক্সেস করতে লগ ইন করুন।",
		savedDietPlans: "সংরক্ষিত ডায়েট প্ল্যান",
		noSavedPlans: "এখনও কোনো ডায়েট প্ল্যান সংরক্ষিত নেই।",
		exercisePlansNotSaved: "ব্যায়াম প্ল্যান সংরক্ষিত হবে না",
		savedExercisePlans: "সংরক্ষিত ব্যায়াম প্ল্যান",
		noSavedExercisePlans: "এখনও কোনো ব্যায়াম প্ল্যান সংরক্ষিত নেই।",
		funFactError: "এই মুহূর্তে একটি মজার তথ্য আনা সম্ভব হচ্ছে না।",
		funHealthFact: "মজার স্বাস্থ্য তথ্য!",
		yourProfile: "আপনার প্রোফাইল",
		profileInfo:
			"এই তথ্য আপনার পরিকল্পনা ব্যক্তিগতকরণে সহায়তা করে। এটি শুধুমাত্র আপনার ডিভাইসে সংরক্ষিত থাকে।",
		ageLabel: "বয়স",
		agePlaceholder: "আপনার বয়স বছরে লিখুন",
		addNewEntry: "নতুন এন্ট্রি যোগ করুন",
		downloadImage: "ছবি ডাউনলোড করুন",
		weightLabel: "ওজন",
		weightPlaceholder: "যেমন, ৭০.৫",
		heightLabel: "উচ্চতা",
		heightUnitToggle: "{unit} ব্যবহার করুন",
		heightPlaceholder: "যেমন, ১৭৫",
		feetPlaceholder: "ফুট",
		inchesPlaceholder: "ইঞ্চি",
		yourBmiIs: "আপনার গণনাকৃত BMI হলো",
		ageRequiredError: "দয়া করে প্রথমে প্রোফাইল বিভাগে আপনার বয়স লিখুন।",
		addEntryButton: "এন্ট্রি যোগ করুন",
		latestWeight: "সর্বশেষ ওজন",
		latestBmi: "সর্বশেষ BMI",
		trendsTitle: "আপনার স্বাস্থ্য প্রবণতা",
		noChartData: "প্রদর্শনের জন্য কোনও ডেটা নেই",
		addEntryForChart: "আপনার অগ্রগতির চার্ট দেখতে একটি নতুন এন্ট্রি যোগ করুন।",
		aiGeneratedAdvice: "এআই-জেনারেটেড পরামর্শ",
		fetchAdviceError: "এআই পরামর্শ আনা যায়নি।",
		dietaryAdvice: "খাদ্যতালিকা সংক্রান্ত পরামর্শ",
		exerciseRecommendations: "ব্যায়ামের সুপারিশ",
		lifestyleSuggestions: "জীবনযাত্রার পরামর্শ",
		addEntryForAdvice:
			"ব্যক্তিগতকৃত এআই পরামর্শ পেতে একটি স্বাস্থ্য এন্ট্রি যোগ করুন।",
		allDataTitle: "সমস্ত এন্ট্রি",
		dateLabel: "তারিখ",
		noHealthEntries: "আপনি এখনও কোনও স্বাস্থ্য এন্ট্রি যোগ করেননি।",
		bmiUnderweight: "কম ওজন",
		bmiNormal: "স্বাভাবিক",
		bmiOverweight: "অতিরিক্ত ওজন",
		bmiObese: "স্থূল",
		bmiAnalysis: "BMI বিশ্লেষণ",
		bmiIndicatorText: "আপনার BMI নির্দেশ করে যে আপনি",
		bmiCategoryText: "বিভাগে আছেন।",
		goalWeightLoss: "ওজন কমানো",
		goalMaintainWeight: "ওজন বজায় রাখা",
		goalMuscleGain: "পেশী গঠন",
		goalWeightGain: "ওজন বাড়ানো",
		prefNonVegetarian: "আমিষভোজী",
		prefVegetarian: "নিরামিষভোজী",
		prefVegan: "ভেগান",
		createYourPlan: "আপনার ডায়েট প্ল্যান তৈরি করুন",
		healthGoalLabel: "স্বাস্থ্য লক্ষ্য",
		dietaryPreferenceLabel: "খাদ্য পছন্দ",
		usingLatestHealthData:
			"ব্যক্তিগতকরণের জন্য সর্বশেষ স্বাস্থ্য ডেটা (বয়স: {age}, BMI: {bmi}) ব্যবহার করা হচ্ছে।",
		noHealthDataForExercise:
			"একটি ব্যক্তিগতকৃত পরিকল্পনার জন্য 'ট্র্যাকার' ট্যাবে স্বাস্থ্য ডেটা যোগ করুন।",
		generating: "তৈরি হচ্ছে...",
		generatePlan: "প্ল্যান তৈরি করুন",
		your7DayPlan: "আপনার ৭-দিনের ডায়েট প্ল্যান",
		your7DayDietPlan: "আপনার ৭-দিনের ডায়েট প্ল্যান",
		image: "ছবি",
		plan: "প্ল্যান",
		planWillAppearHere: "আপনার পরিকল্পনা এখানে প্রদর্শিত হবে।",
		selectGoalsForDiet:
			"আপনার লক্ষ্য নির্বাচন করুন এবং একটি নতুন ডায়েট প্ল্যান তৈরি করুন।",
		planSummary: "পরিকল্পনার সারসংক্ষেপ",
		dailyNote: "দৈনিক নোট",
		fitnessBeginner: "শিক্ষানবিস",
		fitnessIntermediate: "মধ্যবর্তী",
		fitnessAdvanced: "উন্নত",
		locationHome: "বাড়ি",
		locationGym: "জিম",
		time30min: "৩০ মিনিট",
		time45min: "৪৫ মিনিট",
		time60min: "৬০ মিনিট",
		noHealthDataError:
			"ব্যায়াম পরিকল্পনা তৈরির জন্য স্বাস্থ্য ডেটা প্রয়োজন। দয়া করে ট্র্যাকার ট্যাবে একটি এন্ট্রি যোগ করুন।",
		createYourExercisePlan: "আপনার ব্যায়াম পরিকল্পনা তৈরি করুন",
		fitnessLevelLabel: "আপনার ফিটনেস স্তর",
		locationLabel: "ব্যায়ামের স্থান",
		timePerDayLabel: "প্রতিদিন উপলব্ধ সময়",
		your7DayExercisePlan: "আপনার ৭-দিনের ব্যায়াম পরিকল্পনা",
		personalizedAdviceTitle: "ব্যক্তিগত পরামর্শ",
		selectGoalsForExercise:
			"আপনার লক্ষ্য নির্বাচন করুন এবং একটি নতুন ব্যায়াম পরিকল্পনা তৈরি করুন।",
		walletTitle: "হেলথ ওয়ালেট",
		walletDescription:
			"আপনার মেডিকেল রেকর্ড, প্রেসক্রিপশন এবং বীমার বিবরণ নিরাপদে সংরক্ষণ করুন। সমস্ত ডেটা শুধুমাত্র আপনার ডিভাইসে সংরক্ষিত থাকে।",
		add: "যোগ করুন",
		edit: "সম্পাদনা",
		medicalRecords: "মেডিকেল রেকর্ডস",
		viewDocument: "ডকুমেন্ট দেখুন",
		deleteItem: "আইটেম মুছুন",
		noRecords: "এখনও কোনও মেডিকেল রেকর্ড যোগ করা হয়নি।",
		prescriptions: "প্রেসক্রিপশন",
		noPrescriptions: "এখনও কোনও প্রেসক্রিপশন যোগ করা হয়নি।",
		insuranceDetails: "বীমার বিবরণ",
		noInsurance: "এখনও কোনও বীমার বিবরণ যোগ করা হয়নি।",
		save: "সংরক্ষণ করুন",
		confirmClearData:
			"আপনি কি সমস্ত অ্যাপ ডেটা মুছে ফেলতে নিশ্চিত? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।",
		confirmLogout: "আপনি কি লগ আউট করতে নিশ্চিত?",
		clearAllData: "অ্যাপ ডেটা সাফ করুন",
		dataManagement: "ডেটা ম্যানেজমেন্ট",
		dataManagementDesc:
			"আপনার ব্রাউজারে এই অ্যাপ দ্বারা সংরক্ষিত ডেটা পরিচালনা করুন।",
		login: "লগ ইন করুন",
		logout: "লগ আউট করুন",
		account: "অ্যাকাউন্ট",
		loggedInAs: "হিসাবে লগ ইন করেছেন",
		appearance: "অ্যাপিয়ারেন্স",
		theme: "থিম",
		language: "ভাষা",
		downloadAllData: "সমস্ত ডেটা ডাউনলোড করুন",
		downloadAllDataDesc:
			"আপনার সমস্ত অ্যাপ ডেটা একটি JSON ফাইল হিসাবে ডাউনলোড করুন।",
		clearChatHistory: "চ্যাট ইতিহাস সাফ করুন",
		clearChatHistoryDesc: "AI এর সাথে আপনার কথোপকথন স্থায়ীভাবে মুছুন।",
		clearAllDataDesc: "এই ডিভাইস থেকে আপনার সমস্ত ডেটা স্থায়ীভাবে সরান।",
		confirmClearChat: "আপনি কি আপনার চ্যাট ইতিহাস সাফ করতে নিশ্চিত?",
		uploadTeamPicture: "টিমের ছবি আপলোড করুন",
		removePicture: "ছবি সরান",
		recordName: "রেকর্ডের নাম",
		recordNamePlaceholder: "যেমন, রক্ত পরীক্ষার রিপোর্ট",
		issueDate: "ইস্যু তারিখ",
		// prescribingDoctor: "ডাক্তারের নাম", // Already defined
		doctorPlaceholder: "যেমন, ডঃ রহমান",
		medicationsList: "ঔষধের তালিকা",
		drugName: "ঔষধের নাম",
		drugNamePlaceholder: "যেমন, প্যারাসিটামল",
		dosage: "ডোজ",
		dosagePlaceholder: "যেমন, ৫০০ মিলিগ্রাম, দিনে ১টি ট্যাবলেট দুইবার",
		insuranceProvider: "বীমা প্রদানকারী",
		providerPlaceholder: "যেমন, হেলথ ইন্স্যুরেন্স লিমিটেড",
		policyNumber: "পলিসি নম্বর",
		policyNumberPlaceholder: "যেমন, HIL-12345",
		contactInfo: "যোগাযোগের তথ্য (ঐচ্ছিক)",
		contactPlaceholder: "যেমন, 16XXX বা support@email.com",
		uploadOrTakePhoto: "ডকুমেন্ট বা ছবি আপলোড করুন (ঐচ্ছিক)",
		uploadFile: "ফাইল আপলোড করুন",
		takePhoto: "ছবি তুলুন",
		addRecord: "মেডিকেল রেকর্ড যোগ করুন",
		addPrescription: "প্রেসক্রিপশন যোগ করুন",
		editInsurance: "বীমার বিবরণ সম্পাদনা করুন",
		addInsurance: "বীমার বিবরণ যোগ করুন",
		fieldRequired: "এই ক্ষেত্রটি আবশ্যক।",
		fileRequired: "এই রেকর্ডের জন্য একটি ফাইল প্রয়োজন।",
		deleteConfirmation: "আপনি কি এই আইটেমটি মুছে ফেলতে নিশ্চিত?",
		prescriptionRequiresOneDrug: "অন্তত একটি বৈধ ঔষধের এন্ট্রি প্রয়োজন।",
		photoOf: "{item} এর ছবি",
		addDrug: "আরেকটি ঔষধ যোগ করুন",
		removeDrug: "এই ঔষধটি সরান",
		enableReminder: "অনুস্মারক সক্রিয় করুন",
		notificationsBlocked:
			"আপনার ব্রাউজার সেটিংসে নোটিফিকেশন অনুমতি ব্লক করা আছে।",
		notificationPermissionNeeded: "নোটিফিকেশন অনুমতি প্রয়োজন।",
		reminderTimes: "অনুস্মারকের সময়",
		addTime: "সময় যোগ করুন",
		removeTime: "এই সময়টি সরান",
		// About App Section
		aboutAppTitle: "অ্যাপ সম্পর্কে",
		inspirationTitle: "আমাদের অনুপ্রেরণা",
		inspirationText:
			"অনেক দেশে রোগীর রেকর্ডগুলি বিক্ষিপ্ত বা কাগজ-ভিত্তিক, এবং মানুষ প্রায়ই জানে না যে তারা কোন সুবিধা বা ওষুধের অধিকারী। এর ফলে চিকিৎসায় ব্যাপক বিলম্ব হয় এবং যত্ন অদক্ষ হয়ে পড়ে। আমরা এটি পরিবর্তন করার একটি সুযোগ দেখেছি।",
		storyTitle: "আমাদের গল্প এবং সমাধান",
		storyText:
			"এই ব্যবধান দূর করার ইচ্ছা থেকে জন্ম নেওয়া, পরামর্শক AI একটি সুরক্ষিত, মোবাইল-প্রথম স্বাস্থ্য পরিচয় হিসাবে শুরু হয়েছিল। আমাদের সমাধান রেকর্ড, প্রেসক্রিপশন, বীমা এবং টেলিহেলথকে একটি সহজ, ব্যক্তিগত ওয়ালেটে একত্রিত করে, ব্যবহারকারীদের তাদের স্বাস্থ্য তথ্যের নিয়ন্ত্রণ নিতে সক্ষম করে।",
		whatAppOffersTitle: "এই অ্যাপটি কী অফার করে",
		whatAppOffersText:
			"আপনার সুস্থতা পরিচালনা করার জন্য একটি جامع স্যুট:\n• এআই বিশ্লেষক: আপনার স্বাস্থ্য উদ্বেগ সম্পর্কে তাত্ক্ষণিক, এআই-চালিত অন্তর্দৃষ্টি পান।\n• স্বাস্থ্য ট্র্যাকার: আপনার অত্যাবশ্যকীয় বিষয়গুলি লগ করুন, সুন্দর চার্ট দিয়ে আপনার অগ্রগতি ট্র্যাক করুন এবং ব্যক্তিগতকৃত পরামর্শ পান।\n• ডায়েট এবং ব্যায়াম পরিকল্পনাকারী: আপনার নির্দিষ্ট লক্ষ্য এবং স্বাস্থ্য ডেটার জন্য কাস্টম ৭-দিনের পরিকল্পনা গ্রহণ করুন।\n• স্বাস্থ্য ওয়ালেট: আপনার সমস্ত মেডিকেল নথি, প্রেসক্রিপশন এবং বীমা তথ্য এক জায়গায়, আপনার ডিভাইসে নিরাপদে সংরক্ষণ করুন।",
		teamTitle: "টিমের সাথে দেখা করুন",
		teamText:
			"টিম লাস্ট মিনিট দ্বারা আবেগের সাথে বিকশিত। আমরা অ্যাক্সেসযোগ্য, ব্যবহারকারী-কেন্দ্রিক প্রযুক্তি তৈরিতে নিবেদিত যা মানুষের স্বাস্থ্য এবং জীবনে একটি বাস্তব-বিশ্বের প্রভাব ফেলে।",
		// Login/Signup
		signUp: "সাইন আপ",
		signIn: "সাইন ইন",
		back: "পিছনে",
		loginDescription: "স্বাগতম! আপনার অ্যাকাউন্টে সাইন ইন করুন।",
		signUpDescription: "শুরু করতে একটি নতুন অ্যাকাউন্ট তৈরি করুন।",
		continueWithGoogle: "গুগল দিয়ে চালিয়ে যান",
		signUpWithGoogle: "গুগল দিয়ে সাইন আপ করুন",
		or: "অথবা",
		fullName: "পূর্ণ নাম",
		enterYourName: "আপনার পূর্ণ নাম লিখুন",
		emailAddress: "ইমেইল ঠিকানা",
		enterYourEmail: "আপনার ইমেইল ঠিকানা লিখুন",
		password: "পাসওয়ার্ড",
		enterYourPassword: "আপনার পাসওয়ার্ড লিখুন",
		confirmPassword: "পাসওয়ার্ড নিশ্চিত করুন",
		confirmYourPassword: "আপনার পাসওয়ার্ড নিশ্চিত করুন",
		createAccount: "অ্যাকাউন্ট তৈরি করুন",
		signingIn: "সাইন ইন করা হচ্ছে...",
		creatingAccount: "অ্যাকাউন্ট তৈরি করা হচ্ছে...",
		dontHaveAccount: "অ্যাকাউন্ট নেই?",
		alreadyHaveAccount: "ইতিমধ্যে অ্যাকাউন্ট আছে?",
		invalidEmail: "অনুগ্রহ করে একটি বৈধ ইমেইল ঠিকানা লিখুন।",
		passwordMinLength: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।",
		passwordMinLength8: "পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।",
		passwordStrengthRequirement:
			"পাসওয়ার্ডে কমপক্ষে একটি বড় হাতের অক্ষর, একটি ছোট হাতের অক্ষর এবং একটি সংখ্যা থাকতে হবে।",
		nameMinLength: "নাম কমপক্ষে ২ অক্ষরের হতে হবে।",
		passwordMismatch: "পাসওয়ার্ড মিলছে না।",
		passwordsMatch: "পাসওয়ার্ড মিলে গেছে!",
		passwordStrength: "পাসওয়ার্ডের শক্তি",
		atLeast8Characters: "কমপক্ষে ৮ অক্ষর",
		oneUppercase: "একটি বড় হাতের অক্ষর",
		oneLowercase: "একটি ছোট হাতের অক্ষর",
		oneNumber: "একটি সংখ্যা",
		unexpectedError: "একটি অপ্রত্যাশিত ত্রুটি ঘটেছে",
		notLoggedIn: "আপনি লগ ইন করেননি।",
	},
};

export const LanguageContext = createContext<LanguageContextType | undefined>(
	undefined
);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const { user } = useAuth();
	const [language, setLanguage] = useState<Language>(() => {
		const storedLang =
			typeof window !== "undefined"
				? (localStorage.getItem("language") as Language | null)
				: "en";
		return storedLang && ["en", "bn"].includes(storedLang) ? storedLang : "en";
	});

	useEffect(() => {
		localStorage.setItem("language", language);
	}, [language]);

	// Load user's language preference when user logs in
	useEffect(() => {
		if (user) {
			loadUserLanguagePreference(user.id);
		}
	}, [user]);

	const toggleLanguage = useCallback(async () => {
		const newLang = language === "en" ? "bn" : "en";
		setLanguage(newLang);
		
		// Update in database if user is authenticated
		if (user) {
			try {
				await updateLanguagePreference(user.id, newLang);
			} catch (error) {
				console.error('Failed to update language preference in database:', error);
			}
		}
	}, [language, user]);

	const updateLanguagePreference = useCallback(
		async (userId: string, lang: Language) => {
			try {
				await userService.updateProfile(userId, { language_preference: lang });
				console.log("Language preference updated in database:", lang);
			} catch (error) {
				console.error(
					"Failed to update language preference in database:",
					error
				);
			}
		},
		[]
	);

	const loadUserLanguagePreference = useCallback(async (userId: string) => {
		try {
			const profile = await userService.getProfile(userId);
			if (
				profile?.language_preference &&
				["en", "bn"].includes(profile.language_preference)
			) {
				setLanguage(profile.language_preference as Language);
			}
		} catch (error) {
			console.error("Failed to load user language preference:", error);
		}
	}, []);

	const t = useCallback(
		(key: string, options?: { [key: string]: string | number }): string => {
			let text =
				translations[language]?.[key] || translations["en"][key] || key;
			if (options) {
				Object.keys(options).forEach((optKey) => {
					text = text.replace(
						new RegExp(`\\{${optKey}\\}`, "g"),
						String(options[optKey])
					);
				});
			}
			return text;
		},
		[language]
	);

	// Expose loadUserLanguagePreference for AuthContext integration
	const value = useMemo(
		() => ({
			language,
			toggleLanguage,
			t,
			updateLanguagePreference,
			loadUserLanguagePreference,
		}),
		[
			language,
			toggleLanguage,
			t,
			updateLanguagePreference,
			loadUserLanguagePreference,
		]
	);

	return (
		<LanguageContext.Provider value={value}>
			{children}
		</LanguageContext.Provider>
	);
};
