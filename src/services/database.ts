import { supabase } from "../lib/supabase";
import { Database } from "../types/database";

type Tables = Database["public"]["Tables"];

// User Profile Service
export const userService = {
	async getProfile(userId: string) {
		console.log("🔧 [userService.getProfile] Checking for user:", userId);

		try {
			const { data, error } = await supabase
				.from("users")
				.select("*")
				.eq("id", userId)
				.single();

			if (error && error.code !== "PGRST116") {
				console.error("🔧 [userService.getProfile] Supabase error:", {
					message: error.message,
					code: error.code,
					details: error.details,
				});
				throw error;
			}

			console.log(
				"🔧 [userService.getProfile] Result:",
				data ? "Found" : "Not found"
			);
			return data;
		} catch (err) {
			console.error("🔧 [userService.getProfile] Exception:", err);
			throw err;
		}
	},

	async createProfile(profile: Tables["users"]["Insert"]) {
		console.log("🔧 [userService.createProfile] Starting with data:", profile);

		try {
			const { data, error } = await supabase
				.from("users")
				.insert([profile])
				.select()
				.single();

			if (error) {
				console.error("🔧 [userService.createProfile] Supabase error:", {
					message: error.message,
					code: error.code,
					details: error.details,
					hint: error.hint,
				});
				throw error;
			}

			console.log("🔧 [userService.createProfile] Success:", data);
			return data;
		} catch (err) {
			console.error("🔧 [userService.createProfile] Exception:", err);
			throw err;
		}
	},

	async updateProfile(userId: string, updates: Tables["users"]["Update"]) {
		const { data, error } = await supabase
			.from("users")
			.update(updates)
			.eq("id", userId)
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	async upsertProfile(profile: Tables["users"]["Insert"]) {
		const { data, error } = await supabase
			.from("users")
			.upsert([profile])
			.select()
			.single();

		if (error) throw error;
		return data;
	},
};

// Health Entries Service
export const healthService = {
	async getEntries(userId: string) {
		const { data, error } = await supabase
			.from("health_entries")
			.select("*")
			.eq("user_id", userId)
			.order("date", { ascending: false });

		if (error) throw error;
		return data;
	},

	async addEntry(entry: Tables["health_entries"]["Insert"]) {
		const { data, error } = await supabase
			.from("health_entries")
			.insert([entry])
			.select();

		if (error) throw error;
		return data[0];
	},

	async updateEntry(id: string, updates: Tables["health_entries"]["Update"]) {
		const { data, error } = await supabase
			.from("health_entries")
			.update(updates)
			.eq("id", id)
			.select();

		if (error) throw error;
		return data[0];
	},

	async deleteEntry(id: string) {
		const { error } = await supabase
			.from("health_entries")
			.delete()
			.eq("id", id);

		if (error) throw error;
	},
};

// Chat Service
export const chatService = {
	async getSessions(userId: string) {
		const { data, error } = await supabase
			.from("chat_sessions")
			.select(
				`
        *,
        chat_messages (
          *,
          symptom_analyses (*)
        )
      `
			)
			.eq("user_id", userId)
			.order("updated_at", { ascending: false });

		if (error) throw error;
		return data;
	},

	async createSession(userId: string, name?: string) {
		const { data, error } = await supabase
			.from("chat_sessions")
			.insert([{ user_id: userId, session_name: name }])
			.select();

		if (error) throw error;
		return data[0];
	},

	async addMessage(
		sessionId: string,
		message: Omit<Tables["chat_messages"]["Insert"], "session_id">
	) {
		const { data, error } = await supabase
			.from("chat_messages")
			.insert([{ ...message, session_id: sessionId }])
			.select();

		if (error) throw error;
		return data[0];
	},

	async addSymptomAnalysis(
		messageId: string,
		analysis: Omit<Tables["symptom_analyses"]["Insert"], "message_id">
	) {
		const { data, error } = await supabase
			.from("symptom_analyses")
			.insert([{ ...analysis, message_id: messageId }])
			.select();

		if (error) throw error;
		return data[0];
	},
};

// Medical Records Service
export const medicalRecordsService = {
	async getRecords(userId: string) {
		const { data, error } = await supabase
			.from("medical_records")
			.select("*")
			.eq("user_id", userId)
			.order("issue_date", { ascending: false });

		if (error) throw error;
		return data;
	},

	async addRecord(record: Tables["medical_records"]["Insert"]) {
		const { data, error } = await supabase
			.from("medical_records")
			.insert([record])
			.select();

		if (error) throw error;
		return data[0];
	},

	async deleteRecord(id: string) {
		const { error } = await supabase
			.from("medical_records")
			.delete()
			.eq("id", id);

		if (error) throw error;
	},
};

// Prescriptions Service
export const prescriptionsService = {
	async getPrescriptions(userId: string) {
		const { data, error } = await supabase
			.from("prescriptions")
			.select(
				`
        *,
        prescription_drugs (
          *,
          drug_reminder_times (*)
        )
      `
			)
			.eq("user_id", userId)
			.order("issue_date", { ascending: false });

		if (error) throw error;
		return data;
	},

	async addPrescription(
		prescription: Tables["prescriptions"]["Insert"],
		drugs: Tables["prescription_drugs"]["Insert"][]
	) {
		// Start a transaction
		const { data: prescriptionData, error: prescriptionError } = await supabase
			.from("prescriptions")
			.insert([prescription])
			.select();

		if (prescriptionError) throw prescriptionError;

		const prescriptionId = prescriptionData[0].id;

		// Add drugs
		const drugsWithPrescriptionId = drugs.map((drug) => ({
			...drug,
			prescription_id: prescriptionId,
		}));

		const { data: drugsData, error: drugsError } = await supabase
			.from("prescription_drugs")
			.insert(drugsWithPrescriptionId)
			.select();

		if (drugsError) throw drugsError;

		return { prescription: prescriptionData[0], drugs: drugsData };
	},

	async deletePrescription(id: string) {
		const { error } = await supabase
			.from("prescriptions")
			.delete()
			.eq("id", id);

		if (error) throw error;
	},
};

// Insurance Service
export const insuranceService = {
	async getInsurance(userId: string) {
		const { data, error } = await supabase
			.from("insurance_info")
			.select("*")
			.eq("user_id", userId)
			.single();

		if (error && error.code !== "PGRST116") throw error; // PGRST116 is "not found"
		return data;
	},

	async upsertInsurance(
		insurance:
			| Tables["insurance_info"]["Insert"]
			| Tables["insurance_info"]["Update"]
	) {
		const { data, error } = await supabase
			.from("insurance_info")
			.upsert(insurance as Tables["insurance_info"]["Insert"])
			.select();

		if (error) throw error;
		return data[0];
	},

	async deleteInsurance(userId: string) {
		const { error } = await supabase
			.from("insurance_info")
			.delete()
			.eq("user_id", userId);

		if (error) throw error;
	},
};

// Diet Plans Service
export const dietService = {
	async getPlans(userId: string) {
		const { data, error } = await supabase
			.from("diet_plans")
			.select(
				`
        *,
        diet_plan_days (
          *,
          diet_plan_meals (*)
        )
      `
			)
			.eq("user_id", userId)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data;
	},

	async addPlan(plan: Tables["diet_plans"]["Insert"], days: any[]) {
		// Add the diet plan
		const { data: planData, error: planError } = await supabase
			.from("diet_plans")
			.insert([plan])
			.select();

		if (planError) throw planError;

		const planId = planData[0].id;

		// Add days and meals
		for (const day of days) {
			const { data: dayData, error: dayError } = await supabase
				.from("diet_plan_days")
				.insert([
					{
						diet_plan_id: planId,
						day_name: day.day_name,
						daily_note: day.daily_note,
						day_order: day.day_order,
					},
				])
				.select();

			if (dayError) throw dayError;

			const dayId = dayData[0].id;

			// Add meals for this day
			const mealsWithDayId = day.meals.map((meal: any, index: number) => ({
				diet_plan_day_id: dayId,
				meal_name: meal.meal_name,
				meal_items: meal.meal_items,
				meal_order: index + 1,
			}));

			const { error: mealsError } = await supabase
				.from("diet_plan_meals")
				.insert(mealsWithDayId);

			if (mealsError) throw mealsError;
		}

		return planData[0];
	},
};

// Exercise Plans Service
export const exerciseService = {
	async getPlans(userId: string) {
		const { data, error } = await supabase
			.from("exercise_plans")
			.select(
				`
        *,
        exercise_plan_days (
          *,
          exercise_plan_exercises (*)
        )
      `
			)
			.eq("user_id", userId)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data;
	},

	async addPlan(plan: Tables["exercise_plans"]["Insert"], days: any[]) {
		// Add the exercise plan
		const { data: planData, error: planError } = await supabase
			.from("exercise_plans")
			.insert([plan])
			.select();

		if (planError) throw planError;

		const planId = planData[0].id;

		// Add days and exercises
		for (const day of days) {
			const { data: dayData, error: dayError } = await supabase
				.from("exercise_plan_days")
				.insert([
					{
						exercise_plan_id: planId,
						day_name: day.day_name,
						details: day.details,
						day_order: day.day_order,
					},
				])
				.select();

			if (dayError) throw dayError;

			const dayId = dayData[0].id;

			// Add exercises for this day
			const exercisesWithDayId = day.exercises.map(
				(exercise: any, index: number) => ({
					exercise_plan_day_id: dayId,
					exercise_name: exercise.exercise_name,
					description: exercise.description,
					duration: exercise.duration,
					exercise_type: exercise.exercise_type,
					exercise_order: index + 1,
				})
			);

			const { error: exercisesError } = await supabase
				.from("exercise_plan_exercises")
				.insert(exercisesWithDayId);

			if (exercisesError) throw exercisesError;
		}

		return planData[0];
	},
};

// Health Advice Service
export const healthAdviceService = {
	async getAdvice(userId: string, language: string) {
		const { data, error } = await supabase
			.from("health_advice")
			.select("*")
			.eq("user_id", userId)
			.eq("language", language)
			.order("created_at", { ascending: false })
			.limit(1)
			.single();

		if (error && error.code !== "PGRST116") throw error;
		return data;
	},

	async addAdvice(advice: Tables["health_advice"]["Insert"]) {
		const { data, error } = await supabase
			.from("health_advice")
			.insert([advice])
			.select();

		if (error) throw error;
		return data[0];
	},
};
