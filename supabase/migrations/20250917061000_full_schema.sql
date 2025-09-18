-- Poramorshok AI - Full Database Schema Migration
-- All tables, indexes, and RLS policies

-- 1. Users Table (id references auth.users.id)
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    language_preference VARCHAR(10) DEFAULT 'en' CHECK (language_preference IN ('en', 'bn')),
    theme_preference VARCHAR(10) DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- 2. Health Entries Table
DROP TABLE IF EXISTS health_entries CASCADE;
CREATE TABLE health_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
    height_cm DECIMAL(5,2) NOT NULL CHECK (height_cm > 50 AND height_cm < 300),
    weight_kg DECIMAL(5,2) NOT NULL CHECK (weight_kg > 10 AND weight_kg < 500),
    bmi DECIMAL(4,2) NOT NULL CHECK (bmi > 10 AND bmi < 60),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);
CREATE INDEX idx_health_entries_user_id ON health_entries(user_id);
CREATE INDEX idx_health_entries_date ON health_entries(date DESC);
CREATE INDEX idx_health_entries_user_date ON health_entries(user_id, date DESC);

-- 3. Chat Sessions Table
DROP TABLE IF EXISTS chat_sessions CASCADE;
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_name VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);

-- 4. Chat Messages Table
DROP TABLE IF EXISTS chat_messages CASCADE;
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX idx_chat_messages_text_search ON chat_messages USING gin(to_tsvector('english', message_text));

-- 5. Symptom Analyses Table
DROP TABLE IF EXISTS symptom_analyses CASCADE;
CREATE TABLE symptom_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    symptoms JSONB NOT NULL,
    causes JSONB NOT NULL,
    treatments JSONB NOT NULL,
    medications JSONB NOT NULL,
    mental_health_support JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_symptom_analyses_message_id ON symptom_analyses(message_id);
CREATE INDEX idx_symptom_analyses_symptoms ON symptom_analyses USING gin(symptoms);
CREATE INDEX idx_symptom_analyses_causes ON symptom_analyses USING gin(causes);

-- 6. Medical Records Table
DROP TABLE IF EXISTS medical_records CASCADE;
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    issue_date DATE NOT NULL,
    file_data TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size_bytes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_medical_records_user_id ON medical_records(user_id);
CREATE INDEX idx_medical_records_issue_date ON medical_records(issue_date DESC);

-- 7. Prescriptions Table
DROP TABLE IF EXISTS prescriptions CASCADE;
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_name VARCHAR(200) NOT NULL,
    issue_date DATE NOT NULL,
    file_data TEXT,
    file_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX idx_prescriptions_issue_date ON prescriptions(issue_date DESC);

-- 8. Prescription Drugs Table
DROP TABLE IF EXISTS prescription_drugs CASCADE;
CREATE TABLE prescription_drugs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    drug_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    reminder_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_prescription_drugs_prescription_id ON prescription_drugs(prescription_id);
CREATE INDEX idx_prescription_drugs_reminder_enabled ON prescription_drugs(reminder_enabled) WHERE reminder_enabled = true;

-- 9. Drug Reminder Times Table
DROP TABLE IF EXISTS drug_reminder_times CASCADE;
CREATE TABLE drug_reminder_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drug_id UUID NOT NULL REFERENCES prescription_drugs(id) ON DELETE CASCADE,
    reminder_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);
CREATE INDEX idx_drug_reminder_times_drug_id ON drug_reminder_times(drug_id);
CREATE INDEX idx_drug_reminder_times_active ON drug_reminder_times(is_active, reminder_time) WHERE is_active = true;

-- 10. Insurance Information Table
DROP TABLE IF EXISTS insurance_info CASCADE;
CREATE TABLE insurance_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_name VARCHAR(200) NOT NULL,
    policy_number VARCHAR(100) NOT NULL,
    contact_info TEXT,
    file_data TEXT,
    file_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);
CREATE INDEX idx_insurance_info_user_id ON insurance_info(user_id);

-- 11. Diet Plans Table
DROP TABLE IF EXISTS diet_plans CASCADE;
CREATE TABLE diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal VARCHAR(50) NOT NULL CHECK (goal IN ('weight-loss', 'maintain-weight', 'muscle-gain', 'weight-gain')),
    dietary_preference VARCHAR(50) NOT NULL CHECK (dietary_preference IN ('non-vegetarian', 'vegetarian', 'vegan')),
    summary TEXT NOT NULL,
    based_on_health_entry_id UUID REFERENCES health_entries(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_diet_plans_user_id ON diet_plans(user_id);
CREATE INDEX idx_diet_plans_goal ON diet_plans(goal);
CREATE INDEX idx_diet_plans_created_at ON diet_plans(created_at DESC);

-- 12. Diet Plan Days Table
DROP TABLE IF EXISTS diet_plan_days CASCADE;
CREATE TABLE diet_plan_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diet_plan_id UUID NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
    day_name VARCHAR(50) NOT NULL,
    daily_note TEXT,
    day_order INTEGER NOT NULL
);
CREATE INDEX idx_diet_plan_days_plan_id ON diet_plan_days(diet_plan_id);
CREATE INDEX idx_diet_plan_days_order ON diet_plan_days(diet_plan_id, day_order);

-- 13. Diet Plan Meals Table
DROP TABLE IF EXISTS diet_plan_meals CASCADE;
CREATE TABLE diet_plan_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diet_plan_day_id UUID NOT NULL REFERENCES diet_plan_days(id) ON DELETE CASCADE,
    meal_name VARCHAR(100) NOT NULL,
    meal_items JSONB NOT NULL,
    meal_order INTEGER NOT NULL
);
CREATE INDEX idx_diet_plan_meals_day_id ON diet_plan_meals(diet_plan_day_id);
CREATE INDEX idx_diet_plan_meals_order ON diet_plan_meals(diet_plan_day_id, meal_order);

-- 14. Exercise Plans Table
DROP TABLE IF EXISTS exercise_plans CASCADE;
CREATE TABLE exercise_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal VARCHAR(50) NOT NULL CHECK (goal IN ('weight-loss', 'maintain-weight', 'muscle-gain', 'weight-gain')),
    fitness_level VARCHAR(50) NOT NULL CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
    location VARCHAR(50) NOT NULL CHECK (location IN ('home', 'gym')),
    time_per_day VARCHAR(50) NOT NULL,
    advice TEXT NOT NULL,
    based_on_health_entry_id UUID REFERENCES health_entries(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_exercise_plans_user_id ON exercise_plans(user_id);
CREATE INDEX idx_exercise_plans_goal ON exercise_plans(goal);
CREATE INDEX idx_exercise_plans_fitness_level ON exercise_plans(fitness_level);
CREATE INDEX idx_exercise_plans_created_at ON exercise_plans(created_at DESC);

-- 15. Exercise Plan Days Table
DROP TABLE IF EXISTS exercise_plan_days CASCADE;
CREATE TABLE exercise_plan_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_plan_id UUID NOT NULL REFERENCES exercise_plans(id) ON DELETE CASCADE,
    day_name VARCHAR(50) NOT NULL,
    details TEXT,
    day_order INTEGER NOT NULL
);
CREATE INDEX idx_exercise_plan_days_plan_id ON exercise_plan_days(exercise_plan_id);
CREATE INDEX idx_exercise_plan_days_order ON exercise_plan_days(exercise_plan_id, day_order);

-- 16. Exercise Plan Exercises Table
DROP TABLE IF EXISTS exercise_plan_exercises CASCADE;
CREATE TABLE exercise_plan_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_plan_day_id UUID NOT NULL REFERENCES exercise_plan_days(id) ON DELETE CASCADE,
    exercise_name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    duration VARCHAR(50) NOT NULL,
    exercise_type VARCHAR(50) NOT NULL CHECK (exercise_type IN ('Cardio', 'Strength', 'Flexibility')),
    exercise_order INTEGER NOT NULL
);
CREATE INDEX idx_exercise_plan_exercises_day_id ON exercise_plan_exercises(exercise_plan_day_id);
CREATE INDEX idx_exercise_plan_exercises_order ON exercise_plan_exercises(exercise_plan_day_id, exercise_order);
CREATE INDEX idx_exercise_plan_exercises_type ON exercise_plan_exercises(exercise_type);

-- 17. Health Advice Table
DROP TABLE IF EXISTS health_advice CASCADE;
CREATE TABLE health_advice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR(10) NOT NULL CHECK (language IN ('en', 'bn')),
    dietary_advice JSONB NOT NULL,
    exercise_recommendations JSONB NOT NULL,
    lifestyle_suggestions JSONB NOT NULL,
    based_on_entries_count INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_health_advice_user_id ON health_advice(user_id);
CREATE INDEX idx_health_advice_language ON health_advice(language);
CREATE INDEX idx_health_advice_created_at ON health_advice(created_at DESC);

-- RLS Policies
-- Enable RLS for all user-owned tables
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

-- Users table: Only allow access to own row
CREATE POLICY "Users can access their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can delete their own profile" ON users FOR DELETE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
-- Add INSERT policy if needed

-- All user-owned tables: Only allow access to own data
CREATE POLICY "User can access own health entries" ON health_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User can modify own health entries" ON health_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User can delete own health entries" ON health_entries FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "User can insert own health entries" ON health_entries FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can access own chat sessions" ON chat_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User can modify own chat sessions" ON chat_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User can delete own chat sessions" ON chat_sessions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "User can insert own chat sessions" ON chat_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can access own chat messages" ON chat_messages FOR SELECT USING (auth.uid() = (SELECT user_id FROM chat_sessions WHERE id = session_id));
CREATE POLICY "User can modify own chat messages" ON chat_messages FOR UPDATE USING (auth.uid() = (SELECT user_id FROM chat_sessions WHERE id = session_id));
CREATE POLICY "User can delete own chat messages" ON chat_messages FOR DELETE USING (auth.uid() = (SELECT user_id FROM chat_sessions WHERE id = session_id));
CREATE POLICY "User can insert own chat messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM chat_sessions WHERE id = session_id));

CREATE POLICY "User can access own symptom analyses" ON symptom_analyses FOR SELECT USING (auth.uid() = (SELECT user_id FROM chat_sessions WHERE id = (SELECT session_id FROM chat_messages WHERE id = message_id)));
CREATE POLICY "User can modify own symptom analyses" ON symptom_analyses FOR UPDATE USING (auth.uid() = (SELECT user_id FROM chat_sessions WHERE id = (SELECT session_id FROM chat_messages WHERE id = message_id)));
CREATE POLICY "User can delete own symptom analyses" ON symptom_analyses FOR DELETE USING (auth.uid() = (SELECT user_id FROM chat_sessions WHERE id = (SELECT session_id FROM chat_messages WHERE id = message_id)));
CREATE POLICY "User can insert own symptom analyses" ON symptom_analyses FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM chat_sessions WHERE id = (SELECT session_id FROM chat_messages WHERE id = message_id)));

CREATE POLICY "User can access own medical records" ON medical_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User can modify own medical records" ON medical_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User can delete own medical records" ON medical_records FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "User can insert own medical records" ON medical_records FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can access own prescriptions" ON prescriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User can modify own prescriptions" ON prescriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User can delete own prescriptions" ON prescriptions FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "User can insert own prescriptions" ON prescriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can access own prescription drugs" ON prescription_drugs FOR SELECT USING (auth.uid() = (SELECT user_id FROM prescriptions WHERE id = prescription_id));
CREATE POLICY "User can modify own prescription drugs" ON prescription_drugs FOR UPDATE USING (auth.uid() = (SELECT user_id FROM prescriptions WHERE id = prescription_id));
CREATE POLICY "User can delete own prescription drugs" ON prescription_drugs FOR DELETE USING (auth.uid() = (SELECT user_id FROM prescriptions WHERE id = prescription_id));
CREATE POLICY "User can insert own prescription drugs" ON prescription_drugs FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM prescriptions WHERE id = prescription_id));

CREATE POLICY "User can access own drug reminder times" ON drug_reminder_times FOR SELECT USING (auth.uid() = (SELECT user_id FROM prescriptions WHERE id = (SELECT prescription_id FROM prescription_drugs WHERE id = drug_id)));
CREATE POLICY "User can modify own drug reminder times" ON drug_reminder_times FOR UPDATE USING (auth.uid() = (SELECT user_id FROM prescriptions WHERE id = (SELECT prescription_id FROM prescription_drugs WHERE id = drug_id)));
CREATE POLICY "User can delete own drug reminder times" ON drug_reminder_times FOR DELETE USING (auth.uid() = (SELECT user_id FROM prescriptions WHERE id = (SELECT prescription_id FROM prescription_drugs WHERE id = drug_id)));
CREATE POLICY "User can insert own drug reminder times" ON drug_reminder_times FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM prescriptions WHERE id = (SELECT prescription_id FROM prescription_drugs WHERE id = drug_id)));

CREATE POLICY "User can access own insurance info" ON insurance_info FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User can modify own insurance info" ON insurance_info FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User can delete own insurance info" ON insurance_info FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "User can insert own insurance info" ON insurance_info FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can access own diet plans" ON diet_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User can modify own diet plans" ON diet_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User can delete own diet plans" ON diet_plans FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "User can insert own diet plans" ON diet_plans FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can access own diet plan days" ON diet_plan_days FOR SELECT USING (auth.uid() = (SELECT user_id FROM diet_plans WHERE id = diet_plan_id));
CREATE POLICY "User can modify own diet plan days" ON diet_plan_days FOR UPDATE USING (auth.uid() = (SELECT user_id FROM diet_plans WHERE id = diet_plan_id));
CREATE POLICY "User can delete own diet plan days" ON diet_plan_days FOR DELETE USING (auth.uid() = (SELECT user_id FROM diet_plans WHERE id = diet_plan_id));
CREATE POLICY "User can insert own diet plan days" ON diet_plan_days FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM diet_plans WHERE id = diet_plan_id));

CREATE POLICY "User can access own diet plan meals" ON diet_plan_meals FOR SELECT USING (auth.uid() = (SELECT user_id FROM diet_plans WHERE id = (SELECT diet_plan_id FROM diet_plan_days WHERE id = diet_plan_day_id)));
CREATE POLICY "User can modify own diet plan meals" ON diet_plan_meals FOR UPDATE USING (auth.uid() = (SELECT user_id FROM diet_plans WHERE id = (SELECT diet_plan_id FROM diet_plan_days WHERE id = diet_plan_day_id)));
CREATE POLICY "User can delete own diet plan meals" ON diet_plan_meals FOR DELETE USING (auth.uid() = (SELECT user_id FROM diet_plans WHERE id = (SELECT diet_plan_id FROM diet_plan_days WHERE id = diet_plan_day_id)));
CREATE POLICY "User can insert own diet plan meals" ON diet_plan_meals FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM diet_plans WHERE id = (SELECT diet_plan_id FROM diet_plan_days WHERE id = diet_plan_day_id)));

CREATE POLICY "User can access own exercise plans" ON exercise_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User can modify own exercise plans" ON exercise_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User can delete own exercise plans" ON exercise_plans FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "User can insert own exercise plans" ON exercise_plans FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can access own exercise plan days" ON exercise_plan_days FOR SELECT USING (auth.uid() = (SELECT user_id FROM exercise_plans WHERE id = exercise_plan_id));
CREATE POLICY "User can modify own exercise plan days" ON exercise_plan_days FOR UPDATE USING (auth.uid() = (SELECT user_id FROM exercise_plans WHERE id = exercise_plan_id));
CREATE POLICY "User can delete own exercise plan days" ON exercise_plan_days FOR DELETE USING (auth.uid() = (SELECT user_id FROM exercise_plans WHERE id = exercise_plan_id));
CREATE POLICY "User can insert own exercise plan days" ON exercise_plan_days FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM exercise_plans WHERE id = exercise_plan_id));

CREATE POLICY "User can access own exercise plan exercises" ON exercise_plan_exercises FOR SELECT USING (auth.uid() = (SELECT user_id FROM exercise_plans WHERE id = (SELECT exercise_plan_id FROM exercise_plan_days WHERE id = exercise_plan_day_id)));
CREATE POLICY "User can modify own exercise plan exercises" ON exercise_plan_exercises FOR UPDATE USING (auth.uid() = (SELECT user_id FROM exercise_plans WHERE id = (SELECT exercise_plan_id FROM exercise_plan_days WHERE id = exercise_plan_day_id)));
CREATE POLICY "User can delete own exercise plan exercises" ON exercise_plan_exercises FOR DELETE USING (auth.uid() = (SELECT user_id FROM exercise_plans WHERE id = (SELECT exercise_plan_id FROM exercise_plan_days WHERE id = exercise_plan_day_id)));
CREATE POLICY "User can insert own exercise plan exercises" ON exercise_plan_exercises FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM exercise_plans WHERE id = (SELECT exercise_plan_id FROM exercise_plan_days WHERE id = exercise_plan_day_id)));

CREATE POLICY "User can access own health advice" ON health_advice FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User can modify own health advice" ON health_advice FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "User can delete own health advice" ON health_advice FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "User can insert own health advice" ON health_advice FOR INSERT WITH CHECK (auth.uid() = user_id);
