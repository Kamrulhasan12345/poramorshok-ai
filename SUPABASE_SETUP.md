# Supabase Integration Guide for Poramorshok AI

## Complete Setup & Implementation Guide

This guide provides step-by-step instructions to integrate Supabase with your Poramorshok AI application, including database setup, authentication, edge functions, triggers, and all necessary features.

## Table of Contents

1. [Prerequisites & Initial Setup](#prerequisites--initial-setup)
2. [Project Configuration](#project-configuration)
3. [Database Schema Implementation](#database-schema-implementation)
4. [Authentication Setup](#authentication-setup)
5. [Row Level Security (RLS)](#row-level-security-rls)
6. [Edge Functions](#edge-functions)
7. [Database Triggers](#database-triggers)
8. [Storage Configuration](#storage-configuration)
9. [Frontend Integration](#frontend-integration)
10. [Deployment & Production](#deployment--production)

---

## Prerequisites & Initial Setup

### 1. Create Supabase Account & Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project:
   - **Project Name**: `poramorshok-ai`
   - **Database Password**: Generate a strong password (save it securely)
   - **Region**: Choose closest to your users (e.g., `us-east-1`)

### 2. Install Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize project
supabase init

# Link to your remote project
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Install Dependencies

```bash
# Install Supabase client and dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-react
npm install --save-dev @supabase/functions-js

# Install additional utilities
npm install uuid react-query
```

---

## Project Configuration

### 1. Environment Variables

Create `.env.local` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Keys (for edge functions)
VITE_GEMINI_API_KEY=your-gemini-api-key

# Optional: Analytics & Monitoring
VITE_SUPABASE_PROJECT_REF=your-project-ref
```

### 2. Supabase Client Configuration

Create `src/lib/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
	auth: {
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: true,
	},
});

// For edge functions
export const supabaseAdmin = createClient<Database>(
	supabaseUrl,
	import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	}
);
```

---

## Database Schema Implementation

### 1. Create Migration Files

```bash
# Create initial migration
supabase migration new initial_schema

# Create additional migrations for specific features
supabase migration new add_triggers
supabase migration new add_rls_policies
supabase migration new add_indexes
```

### 2. Initial Schema Migration

Copy the complete schema from `DATABASE_SCHEMA.md` into:
`supabase/migrations/001_initial_schema.sql`

````sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create all tables (copy from DATABASE_SCHEMA.md)
-- ... [Complete schema here]

-- Run migration
```bash
supabase db push
````

### 3. Type Generation

```bash
# Generate TypeScript types from database
supabase gen types typescript --local > src/types/database.ts
```

---

## Authentication Setup

### 1. Configure Auth Providers

In Supabase Dashboard → Authentication → Providers:

**Google OAuth Setup:**

1. Enable Google provider
2. Add your OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
   - **Redirect URL**: `https://your-project-ref.supabase.co/auth/v1/callback`

**Email Authentication:**

1. Enable Email provider
2. Configure email templates (optional)

### 2. Auth Context Provider

Create `src/contexts/SupabaseAuthContext.tsx`:

```typescript
import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
	user: User | null;
	session: Session | null;
	loading: boolean;
	signIn: (email: string, password: string) => Promise<any>;
	signUp: (email: string, password: string, metadata?: any) => Promise<any>;
	signInWithGoogle: () => Promise<any>;
	signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Get initial session
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setUser(session?.user ?? null);
			setLoading(false);
		});

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setSession(session);
			setUser(session?.user ?? null);
			setLoading(false);
		});

		return () => subscription.unsubscribe();
	}, []);

	const signIn = async (email: string, password: string) => {
		return await supabase.auth.signInWithPassword({ email, password });
	};

	const signUp = async (email: string, password: string, metadata?: any) => {
		return await supabase.auth.signUp({
			email,
			password,
			options: {
				data: metadata,
			},
		});
	};

	const signInWithGoogle = async () => {
		return await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
			},
		});
	};

	const signOut = async () => {
		return await supabase.auth.signOut();
	};

	const value = {
		user,
		session,
		loading,
		signIn,
		signUp,
		signInWithGoogle,
		signOut,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
```

---

## Row Level Security (RLS)

### 1. Enable RLS and Create Policies

Create `supabase/migrations/002_rls_policies.sql`:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_drugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_reminder_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plan_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_plan_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_advice ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Health entries policies
CREATE POLICY "Users can view own health entries" ON health_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health entries" ON health_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health entries" ON health_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own health entries" ON health_entries FOR DELETE USING (auth.uid() = user_id);

-- Chat sessions policies
CREATE POLICY "Users can view own chat sessions" ON chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat sessions" ON chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat sessions" ON chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat sessions" ON chat_sessions FOR DELETE USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can view own chat messages" ON chat_messages
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM chat_sessions WHERE id = session_id)
  );
CREATE POLICY "Users can insert own chat messages" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM chat_sessions WHERE id = session_id)
  );

-- Symptom analyses policies
CREATE POLICY "Users can view own symptom analyses" ON symptom_analyses
  FOR SELECT USING (
    auth.uid() = (
      SELECT cs.user_id FROM chat_sessions cs
      JOIN chat_messages cm ON cs.id = cm.session_id
      WHERE cm.id = message_id
    )
  );

-- Medical records policies
CREATE POLICY "Users can view own medical records" ON medical_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own medical records" ON medical_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own medical records" ON medical_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own medical records" ON medical_records FOR DELETE USING (auth.uid() = user_id);

-- Prescriptions policies
CREATE POLICY "Users can view own prescriptions" ON prescriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own prescriptions" ON prescriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own prescriptions" ON prescriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own prescriptions" ON prescriptions FOR DELETE USING (auth.uid() = user_id);

-- Prescription drugs policies
CREATE POLICY "Users can view own prescription drugs" ON prescription_drugs
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM prescriptions WHERE id = prescription_id)
  );
CREATE POLICY "Users can insert own prescription drugs" ON prescription_drugs
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM prescriptions WHERE id = prescription_id)
  );
CREATE POLICY "Users can update own prescription drugs" ON prescription_drugs
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM prescriptions WHERE id = prescription_id)
  );
CREATE POLICY "Users can delete own prescription drugs" ON prescription_drugs
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM prescriptions WHERE id = prescription_id)
  );

-- Drug reminder times policies
CREATE POLICY "Users can view own drug reminder times" ON drug_reminder_times
  FOR SELECT USING (
    auth.uid() = (
      SELECT p.user_id FROM prescriptions p
      JOIN prescription_drugs pd ON p.id = pd.prescription_id
      WHERE pd.id = drug_id
    )
  );
CREATE POLICY "Users can insert own drug reminder times" ON drug_reminder_times
  FOR INSERT WITH CHECK (
    auth.uid() = (
      SELECT p.user_id FROM prescriptions p
      JOIN prescription_drugs pd ON p.id = pd.prescription_id
      WHERE pd.id = drug_id
    )
  );
CREATE POLICY "Users can update own drug reminder times" ON drug_reminder_times
  FOR UPDATE USING (
    auth.uid() = (
      SELECT p.user_id FROM prescriptions p
      JOIN prescription_drugs pd ON p.id = pd.prescription_id
      WHERE pd.id = drug_id
    )
  );
CREATE POLICY "Users can delete own drug reminder times" ON drug_reminder_times
  FOR DELETE USING (
    auth.uid() = (
      SELECT p.user_id FROM prescriptions p
      JOIN prescription_drugs pd ON p.id = pd.prescription_id
      WHERE pd.id = drug_id
    )
  );

-- Insurance info policies
CREATE POLICY "Users can view own insurance info" ON insurance_info FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insurance info" ON insurance_info FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own insurance info" ON insurance_info FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own insurance info" ON insurance_info FOR DELETE USING (auth.uid() = user_id);

-- Diet plans policies
CREATE POLICY "Users can view own diet plans" ON diet_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own diet plans" ON diet_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own diet plans" ON diet_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own diet plans" ON diet_plans FOR DELETE USING (auth.uid() = user_id);

-- Diet plan days policies
CREATE POLICY "Users can view own diet plan days" ON diet_plan_days
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM diet_plans WHERE id = diet_plan_id)
  );
CREATE POLICY "Users can insert own diet plan days" ON diet_plan_days
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM diet_plans WHERE id = diet_plan_id)
  );
CREATE POLICY "Users can update own diet plan days" ON diet_plan_days
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM diet_plans WHERE id = diet_plan_id)
  );
CREATE POLICY "Users can delete own diet plan days" ON diet_plan_days
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM diet_plans WHERE id = diet_plan_id)
  );

-- Diet plan meals policies
CREATE POLICY "Users can view own diet plan meals" ON diet_plan_meals
  FOR SELECT USING (
    auth.uid() = (
      SELECT dp.user_id FROM diet_plans dp
      JOIN diet_plan_days dpd ON dp.id = dpd.diet_plan_id
      WHERE dpd.id = diet_plan_day_id
    )
  );
CREATE POLICY "Users can insert own diet plan meals" ON diet_plan_meals
  FOR INSERT WITH CHECK (
    auth.uid() = (
      SELECT dp.user_id FROM diet_plans dp
      JOIN diet_plan_days dpd ON dp.id = dpd.diet_plan_id
      WHERE dpd.id = diet_plan_day_id
    )
  );
CREATE POLICY "Users can update own diet plan meals" ON diet_plan_meals
  FOR UPDATE USING (
    auth.uid() = (
      SELECT dp.user_id FROM diet_plans dp
      JOIN diet_plan_days dpd ON dp.id = dpd.diet_plan_id
      WHERE dpd.id = diet_plan_day_id
    )
  );
CREATE POLICY "Users can delete own diet plan meals" ON diet_plan_meals
  FOR DELETE USING (
    auth.uid() = (
      SELECT dp.user_id FROM diet_plans dp
      JOIN diet_plan_days dpd ON dp.id = dpd.diet_plan_id
      WHERE dpd.id = diet_plan_day_id
    )
  );

-- Exercise plans policies
CREATE POLICY "Users can view own exercise plans" ON exercise_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exercise plans" ON exercise_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exercise plans" ON exercise_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exercise plans" ON exercise_plans FOR DELETE USING (auth.uid() = user_id);

-- Exercise plan days policies
CREATE POLICY "Users can view own exercise plan days" ON exercise_plan_days
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM exercise_plans WHERE id = exercise_plan_id)
  );
CREATE POLICY "Users can insert own exercise plan days" ON exercise_plan_days
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM exercise_plans WHERE id = exercise_plan_id)
  );
CREATE POLICY "Users can update own exercise plan days" ON exercise_plan_days
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM exercise_plans WHERE id = exercise_plan_id)
  );
CREATE POLICY "Users can delete own exercise plan days" ON exercise_plan_days
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM exercise_plans WHERE id = exercise_plan_id)
  );

-- Exercise plan exercises policies
CREATE POLICY "Users can view own exercise plan exercises" ON exercise_plan_exercises
  FOR SELECT USING (
    auth.uid() = (
      SELECT ep.user_id FROM exercise_plans ep
      JOIN exercise_plan_days epd ON ep.id = epd.exercise_plan_id
      WHERE epd.id = exercise_plan_day_id
    )
  );
CREATE POLICY "Users can insert own exercise plan exercises" ON exercise_plan_exercises
  FOR INSERT WITH CHECK (
    auth.uid() = (
      SELECT ep.user_id FROM exercise_plans ep
      JOIN exercise_plan_days epd ON ep.id = epd.exercise_plan_id
      WHERE epd.id = exercise_plan_day_id
    )
  );
CREATE POLICY "Users can update own exercise plan exercises" ON exercise_plan_exercises
  FOR UPDATE USING (
    auth.uid() = (
      SELECT ep.user_id FROM exercise_plans ep
      JOIN exercise_plan_days epd ON ep.id = epd.exercise_plan_id
      WHERE epd.id = exercise_plan_day_id
    )
  );
CREATE POLICY "Users can delete own exercise plan exercises" ON exercise_plan_exercises
  FOR DELETE USING (
    auth.uid() = (
      SELECT ep.user_id FROM exercise_plans ep
      JOIN exercise_plan_days epd ON ep.id = epd.exercise_plan_id
      WHERE epd.id = exercise_plan_day_id
    )
  );

-- Health advice policies
CREATE POLICY "Users can view own health advice" ON health_advice FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own health advice" ON health_advice FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health advice" ON health_advice FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own health advice" ON health_advice FOR DELETE USING (auth.uid() = user_id);
```

---

## Edge Functions

### 1. Setup Edge Functions

```bash
# Create edge functions directory
supabase functions new symptom-analyzer
supabase functions new diet-planner
supabase functions new exercise-planner
supabase functions new health-advisor
supabase functions new file-processor
```

### 2. Symptom Analyzer Function

Create `supabase/functions/symptom-analyzer/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

interface SymptomRequest {
	symptoms: string;
	language: "en" | "bn";
	userId: string;
}

serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	try {
		const { symptoms, language, userId }: SymptomRequest = await req.json();

		const apiKey = Deno.env.get("GEMINI_API_KEY");
		if (!apiKey) {
			throw new Error("GEMINI_API_KEY not configured");
		}

		// Create the prompt for Gemini
		const prompt = `
    Analyze the following health symptoms and provide a structured response in ${
			language === "bn" ? "Bengali" : "English"
		}:
    
    Symptoms: ${symptoms}
    
    Please provide your analysis in the following JSON format:
    {
      "symptoms": ["list of identified symptoms"],
      "causes": ["potential causes"],
      "treatments": ["suggested treatments"],
      "medications": ["possible medications"],
      "mentalHealthSupport": ["mental health suggestions if applicable"]
    }
    
    Important: 
    - Provide general health information only
    - Recommend consulting healthcare professionals
    - Do not provide specific medical diagnoses
    - Keep suggestions practical and safe
    `;

		// Call Gemini API
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					contents: [
						{
							parts: [
								{
									text: prompt,
								},
							],
						},
					],
				}),
			}
		);

		if (!response.ok) {
			throw new Error(`Gemini API error: ${response.status}`);
		}

		const data = await response.json();
		const generatedText = data.candidates[0]?.content?.parts[0]?.text;

		// Parse the JSON response from Gemini
		let analysis;
		try {
			// Extract JSON from the response (Gemini might include extra text)
			const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				analysis = JSON.parse(jsonMatch[0]);
			} else {
				throw new Error("No valid JSON found in response");
			}
		} catch (parseError) {
			// Fallback: create structured response from text
			analysis = {
				symptoms: [symptoms],
				causes: ["Unable to parse detailed analysis"],
				treatments: ["Consult with a healthcare professional"],
				medications: ["As prescribed by a doctor"],
				mentalHealthSupport: [],
			};
		}

		return new Response(JSON.stringify({ success: true, analysis }), {
			headers: {
				...corsHeaders,
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		console.error("Error in symptom-analyzer:", error);
		return new Response(
			JSON.stringify({
				success: false,
				error: error.message || "Internal server error",
			}),
			{
				status: 500,
				headers: {
					...corsHeaders,
					"Content-Type": "application/json",
				},
			}
		);
	}
});
```

### 3. Diet Planner Function

Create `supabase/functions/diet-planner/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

interface DietPlanRequest {
	goal: string;
	preference: string;
	healthData: {
		age: number;
		height: number;
		weight: number;
		bmi: number;
	} | null;
	language: "en" | "bn";
	userId: string;
}

serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	try {
		const { goal, preference, healthData, language, userId }: DietPlanRequest =
			await req.json();

		const apiKey = Deno.env.get("GEMINI_API_KEY");
		if (!apiKey) {
			throw new Error("GEMINI_API_KEY not configured");
		}

		// Create comprehensive prompt for diet planning
		const healthInfo = healthData
			? `Age: ${healthData.age}, Height: ${healthData.height}cm, Weight: ${healthData.weight}kg, BMI: ${healthData.bmi}`
			: "No health data provided";

		const prompt = `
    Create a personalized 7-day diet plan in ${
			language === "bn" ? "Bengali" : "English"
		} with the following requirements:
    
    Goal: ${goal}
    Dietary Preference: ${preference}
    Health Information: ${healthInfo}
    
    Please provide a comprehensive diet plan in the following JSON format:
    {
      "summary": "Overall plan summary and key benefits",
      "plan": [
        {
          "day": "Day 1",
          "dailyNote": "Special note or tip for this day",
          "meals": [
            {
              "name": "Breakfast",
              "items": ["food item 1", "food item 2", "food item 3"]
            },
            {
              "name": "Lunch", 
              "items": ["food item 1", "food item 2", "food item 3"]
            },
            {
              "name": "Dinner",
              "items": ["food item 1", "food item 2", "food item 3"]
            },
            {
              "name": "Snacks",
              "items": ["snack 1", "snack 2"]
            }
          ]
        }
        // ... continue for all 7 days
      ]
    }
    
    Guidelines:
    - Consider the user's health metrics for calorie requirements
    - Align with the specified goal (weight loss, maintenance, muscle gain, weight gain)
    - Respect dietary preferences (vegetarian, vegan, non-vegetarian)
    - Include variety across days
    - Provide practical, achievable meal options
    - Include portion guidance when relevant
    `;

		// Call Gemini API
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					contents: [
						{
							parts: [
								{
									text: prompt,
								},
							],
						},
					],
				}),
			}
		);

		if (!response.ok) {
			throw new Error(`Gemini API error: ${response.status}`);
		}

		const data = await response.json();
		const generatedText = data.candidates[0]?.content?.parts[0]?.text;

		// Parse the JSON response
		let dietPlan;
		try {
			const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				dietPlan = JSON.parse(jsonMatch[0]);
			} else {
				throw new Error("No valid JSON found in response");
			}
		} catch (parseError) {
			throw new Error("Failed to parse diet plan response");
		}

		return new Response(JSON.stringify({ success: true, dietPlan }), {
			headers: {
				...corsHeaders,
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		console.error("Error in diet-planner:", error);
		return new Response(
			JSON.stringify({
				success: false,
				error: error.message || "Internal server error",
			}),
			{
				status: 500,
				headers: {
					...corsHeaders,
					"Content-Type": "application/json",
				},
			}
		);
	}
});
```

### 4. Deploy Edge Functions

```bash
# Set environment variables
supabase secrets set GEMINI_API_KEY=your_gemini_api_key

# Deploy all functions
supabase functions deploy symptom-analyzer
supabase functions deploy diet-planner
supabase functions deploy exercise-planner
supabase functions deploy health-advisor
supabase functions deploy file-processor
```

---

## Database Triggers

### 1. Automatic Timestamps and BMI Calculation

Create `supabase/migrations/003_triggers.sql`:

```sql
-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_info_updated_at BEFORE UPDATE ON insurance_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate BMI automatically
CREATE OR REPLACE FUNCTION calculate_bmi()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate BMI: weight(kg) / (height(m))^2
    NEW.bmi = NEW.weight_kg / POWER(NEW.height_cm / 100.0, 2);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply BMI calculation trigger
CREATE TRIGGER calculate_bmi_trigger BEFORE INSERT OR UPDATE ON health_entries
    FOR EACH ROW EXECUTE FUNCTION calculate_bmi();

-- Function to create user profile after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, email, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'ICON_PLACEHOLDER')
  );
  RETURN new;
END;
$$ language plpgsql security definer;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to clean up user data on account deletion
CREATE OR REPLACE FUNCTION public.handle_user_delete()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.users WHERE id = old.id;
  RETURN old;
END;
$$ language plpgsql security definer;

-- Trigger for user deletion cleanup
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_user_delete();
```

### 2. Notification Triggers

```sql
-- Function to handle reminder notifications
CREATE OR REPLACE FUNCTION notify_medication_reminder()
RETURNS trigger AS $$
DECLARE
    user_record RECORD;
    prescription_record RECORD;
BEGIN
    -- Get user and prescription info
    SELECT u.*, p.doctor_name INTO user_record, prescription_record
    FROM users u
    JOIN prescriptions p ON p.user_id = u.id
    JOIN prescription_drugs pd ON pd.prescription_id = p.id
    WHERE pd.id = NEW.drug_id;

    -- Send notification (this would integrate with your notification system)
    PERFORM pg_notify(
        'medication_reminder',
        json_build_object(
            'user_id', user_record.id,
            'user_email', user_record.email,
            'drug_name', (SELECT drug_name FROM prescription_drugs WHERE id = NEW.drug_id),
            'dosage', (SELECT dosage FROM prescription_drugs WHERE id = NEW.drug_id),
            'doctor', prescription_record.doctor_name,
            'reminder_time', NEW.reminder_time
        )::text
    );

    RETURN NEW;
END;
$$ language plpgsql security definer;

-- Trigger for medication reminders
CREATE TRIGGER medication_reminder_trigger
    AFTER INSERT OR UPDATE ON drug_reminder_times
    FOR EACH ROW EXECUTE FUNCTION notify_medication_reminder();
```

---

## Storage Configuration

### 1. Setup Storage Buckets

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
('medical-records', 'medical-records', false),
('prescription-images', 'prescription-images', false),
('insurance-cards', 'insurance-cards', false),
('profile-avatars', 'profile-avatars', true);

-- Create storage policies
CREATE POLICY "Users can upload own medical records" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'medical-records' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own medical records" ON storage.objects
FOR SELECT USING (
  bucket_id = 'medical-records' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own medical records" ON storage.objects
FOR DELETE USING (
  bucket_id = 'medical-records' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Similar policies for other buckets...
```

### 2. File Upload Service

Create `src/services/fileUpload.ts`:

```typescript
import { supabase } from "../lib/supabase";

export const uploadFile = async (
	file: File,
	bucket: string,
	path: string
): Promise<string> => {
	const { data, error } = await supabase.storage
		.from(bucket)
		.upload(path, file, {
			cacheControl: "3600",
			upsert: false,
		});

	if (error) {
		throw new Error(`Upload failed: ${error.message}`);
	}

	const { data: urlData } = supabase.storage
		.from(bucket)
		.getPublicUrl(data.path);

	return urlData.publicUrl;
};

export const deleteFile = async (
	bucket: string,
	path: string
): Promise<void> => {
	const { error } = await supabase.storage.from(bucket).remove([path]);

	if (error) {
		throw new Error(`Delete failed: ${error.message}`);
	}
};
```

---

## Frontend Integration

### 1. Database Service Layer

Create `src/services/database.ts`:

```typescript
import { supabase } from "../lib/supabase";
import { Database } from "../types/database";

type Tables = Database["public"]["Tables"];

// Health Entries
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
		message: Tables["chat_messages"]["Insert"]
	) {
		const { data, error } = await supabase
			.from("chat_messages")
			.insert([{ ...message, session_id: sessionId }])
			.select();

		if (error) throw error;
		return data[0];
	},

	async analyzeSymptoms(symptoms: string, language: "en" | "bn") {
		const { data, error } = await supabase.functions.invoke(
			"symptom-analyzer",
			{
				body: { symptoms, language },
			}
		);

		if (error) throw error;
		return data.analysis;
	},
};

// Diet Planning Service
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

	async generatePlan(request: any) {
		const { data, error } = await supabase.functions.invoke("diet-planner", {
			body: request,
		});

		if (error) throw error;
		return data.dietPlan;
	},
};

// Similar services for other features...
```

### 2. React Query Integration

Create `src/hooks/useSupabaseQuery.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from "react-query";
import { healthService, chatService, dietService } from "../services/database";
import { useAuth } from "../contexts/SupabaseAuthContext";

export const useHealthEntries = () => {
	const { user } = useAuth();

	return useQuery(
		["health-entries", user?.id],
		() => healthService.getEntries(user!.id),
		{ enabled: !!user }
	);
};

export const useAddHealthEntry = () => {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	return useMutation(
		(entry: any) => healthService.addEntry({ ...entry, user_id: user!.id }),
		{
			onSuccess: () => {
				queryClient.invalidateQueries(["health-entries", user?.id]);
			},
		}
	);
};

export const useChatSessions = () => {
	const { user } = useAuth();

	return useQuery(
		["chat-sessions", user?.id],
		() => chatService.getSessions(user!.id),
		{ enabled: !!user }
	);
};

// More hooks for other features...
```

---

## Deployment & Production

### 1. Environment Setup

```bash
# Production environment variables
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### 2. Database Migrations

```bash
# Run all migrations
supabase db push

# Verify migrations
supabase db diff

# Create backup before production deployment
supabase db dump --file backup.sql
```

### 3. Performance Optimization

```sql
-- Additional indexes for production
CREATE INDEX CONCURRENTLY idx_health_entries_bmi ON health_entries(bmi);
CREATE INDEX CONCURRENTLY idx_chat_messages_search ON chat_messages USING gin(to_tsvector('english', message_text));
CREATE INDEX CONCURRENTLY idx_prescriptions_doctor ON prescriptions(doctor_name);

-- Analyze tables for query optimization
ANALYZE;
```

### 4. Monitoring Setup

```typescript
// Add to your main app file
import { supabase } from "./lib/supabase";

// Monitor connection status
supabase.auth.onAuthStateChange((event, session) => {
	console.log("Auth event:", event, session);

	// Log authentication events
	if (event === "SIGNED_IN") {
		console.log("User signed in:", session?.user?.email);
	} else if (event === "SIGNED_OUT") {
		console.log("User signed out");
	}
});

// Error tracking
window.addEventListener("unhandledrejection", (event) => {
	if (event.reason?.message?.includes("supabase")) {
		console.error("Supabase error:", event.reason);
		// Send to your error tracking service
	}
});
```

## Next Steps

1. **Complete the setup** by following each section in order
2. **Test thoroughly** in development before deploying to production
3. **Set up monitoring** and error tracking
4. **Implement backups** and disaster recovery procedures
5. **Scale gradually** based on user growth and usage patterns

This comprehensive setup will give you a fully functional, secure, and scalable backend for your Poramorshok AI application using Supabase and PostgreSQL.
