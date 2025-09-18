# Poramorshok AI - Database Schema Documentation

## Overview

This document provides a comprehensive overview of the PostgreSQL database schema for Poramorshok AI, a multilingual health advisory application. The schema is designed to support user management, health tracking, AI-powered chat interactions, diet/exercise planning, and digital health wallet functionality.

## Database Technology

- **Primary Database**: PostgreSQL 15+
- **Cloud Platform**: Supabase (recommended)
- **Key Features**: JSONB support, UUID primary keys, Row Level Security (RLS), triggers, and edge functions

## Core Entity Relationships

```
Users (1) ──→ (∞) Health Entries
Users (1) ──→ (∞) Chat Sessions ──→ (∞) Chat Messages ──→ (0,1) Symptom Analyses
Users (1) ──→ (∞) Medical Records
Users (1) ──→ (∞) Prescriptions ──→ (∞) Prescription Drugs ──→ (∞) Drug Reminder Times
Users (1) ──→ (0,1) Insurance Info
Users (1) ──→ (∞) Diet Plans ──→ (∞) Diet Plan Days ──→ (∞) Diet Plan Meals
Users (1) ──→ (∞) Exercise Plans ──→ (∞) Exercise Plan Days ──→ (∞) Exercise Plan Exercises
Users (1) ──→ (∞) Health Advice
```

## Table Definitions

### 1. Users Table

**Purpose**: Core user authentication and profile management

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    language_preference VARCHAR(10) DEFAULT 'en' CHECK (language_preference IN ('en', 'bn')),
    theme_preference VARCHAR(10) DEFAULT 'light' CHECK (theme_preference IN ('light', 'dark')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### 2. Health Entries Table

**Purpose**: Track user's physical health metrics over time

```sql
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

-- Indexes
CREATE INDEX idx_health_entries_user_id ON health_entries(user_id);
CREATE INDEX idx_health_entries_date ON health_entries(date DESC);
CREATE INDEX idx_health_entries_user_date ON health_entries(user_id, date DESC);
```

### 3. Chat Sessions Table

**Purpose**: Organize chat conversations for better UX and data management

```sql
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_name VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
```

### 4. Chat Messages Table

**Purpose**: Store individual chat messages and AI responses

```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
-- Full-text search index
CREATE INDEX idx_chat_messages_text_search ON chat_messages USING gin(to_tsvector('english', message_text));
```

### 5. Symptom Analyses Table

**Purpose**: Store AI-generated symptom analysis results

```sql
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

-- Indexes
CREATE INDEX idx_symptom_analyses_message_id ON symptom_analyses(message_id);
-- JSONB indexes for searching within arrays
CREATE INDEX idx_symptom_analyses_symptoms ON symptom_analyses USING gin(symptoms);
CREATE INDEX idx_symptom_analyses_causes ON symptom_analyses USING gin(causes);
```

### 6. Medical Records Table

**Purpose**: Store uploaded medical documents and reports

```sql
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    issue_date DATE NOT NULL,
    file_data TEXT NOT NULL, -- base64 encoded or Supabase Storage URL
    file_type VARCHAR(100) NOT NULL,
    file_size_bytes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_medical_records_user_id ON medical_records(user_id);
CREATE INDEX idx_medical_records_issue_date ON medical_records(issue_date DESC);
```

### 7. Prescriptions Table

**Purpose**: Store prescription information from doctors

```sql
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_name VARCHAR(200) NOT NULL,
    issue_date DATE NOT NULL,
    file_data TEXT, -- optional prescription image
    file_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_prescriptions_user_id ON prescriptions(user_id);
CREATE INDEX idx_prescriptions_issue_date ON prescriptions(issue_date DESC);
```

### 8. Prescription Drugs Table

**Purpose**: Individual medications within prescriptions

```sql
CREATE TABLE prescription_drugs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    drug_name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    reminder_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_prescription_drugs_prescription_id ON prescription_drugs(prescription_id);
CREATE INDEX idx_prescription_drugs_reminder_enabled ON prescription_drugs(reminder_enabled) WHERE reminder_enabled = true;
```

### 9. Drug Reminder Times Table

**Purpose**: Specific reminder times for medications

```sql
CREATE TABLE drug_reminder_times (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drug_id UUID NOT NULL REFERENCES prescription_drugs(id) ON DELETE CASCADE,
    reminder_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes
CREATE INDEX idx_drug_reminder_times_drug_id ON drug_reminder_times(drug_id);
CREATE INDEX idx_drug_reminder_times_active ON drug_reminder_times(is_active, reminder_time) WHERE is_active = true;
```

### 10. Insurance Information Table

**Purpose**: Store health insurance details (one per user)

```sql
CREATE TABLE insurance_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_name VARCHAR(200) NOT NULL,
    policy_number VARCHAR(100) NOT NULL,
    contact_info TEXT,
    file_data TEXT, -- insurance card image
    file_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Indexes
CREATE INDEX idx_insurance_info_user_id ON insurance_info(user_id);
```

### 11. Diet Plans Table

**Purpose**: AI-generated personalized diet plans

```sql
CREATE TABLE diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal VARCHAR(50) NOT NULL CHECK (goal IN ('weight-loss', 'maintain-weight', 'muscle-gain', 'weight-gain')),
    dietary_preference VARCHAR(50) NOT NULL CHECK (dietary_preference IN ('non-vegetarian', 'vegetarian', 'vegan')),
    summary TEXT NOT NULL,
    based_on_health_entry_id UUID REFERENCES health_entries(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_diet_plans_user_id ON diet_plans(user_id);
CREATE INDEX idx_diet_plans_goal ON diet_plans(goal);
CREATE INDEX idx_diet_plans_created_at ON diet_plans(created_at DESC);
```

### 12. Diet Plan Days Table

**Purpose**: Individual days within a diet plan

```sql
CREATE TABLE diet_plan_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diet_plan_id UUID NOT NULL REFERENCES diet_plans(id) ON DELETE CASCADE,
    day_name VARCHAR(50) NOT NULL,
    daily_note TEXT,
    day_order INTEGER NOT NULL
);

-- Indexes
CREATE INDEX idx_diet_plan_days_plan_id ON diet_plan_days(diet_plan_id);
CREATE INDEX idx_diet_plan_days_order ON diet_plan_days(diet_plan_id, day_order);
```

### 13. Diet Plan Meals Table

**Purpose**: Meals within each day of diet plan

```sql
CREATE TABLE diet_plan_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diet_plan_day_id UUID NOT NULL REFERENCES diet_plan_days(id) ON DELETE CASCADE,
    meal_name VARCHAR(100) NOT NULL,
    meal_items JSONB NOT NULL, -- Array of food items
    meal_order INTEGER NOT NULL
);

-- Indexes
CREATE INDEX idx_diet_plan_meals_day_id ON diet_plan_meals(diet_plan_day_id);
CREATE INDEX idx_diet_plan_meals_order ON diet_plan_meals(diet_plan_day_id, meal_order);
```

### 14. Exercise Plans Table

**Purpose**: AI-generated personalized exercise plans

```sql
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

-- Indexes
CREATE INDEX idx_exercise_plans_user_id ON exercise_plans(user_id);
CREATE INDEX idx_exercise_plans_goal ON exercise_plans(goal);
CREATE INDEX idx_exercise_plans_fitness_level ON exercise_plans(fitness_level);
CREATE INDEX idx_exercise_plans_created_at ON exercise_plans(created_at DESC);
```

### 15. Exercise Plan Days Table

**Purpose**: Individual days within an exercise plan

```sql
CREATE TABLE exercise_plan_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_plan_id UUID NOT NULL REFERENCES exercise_plans(id) ON DELETE CASCADE,
    day_name VARCHAR(50) NOT NULL,
    details TEXT,
    day_order INTEGER NOT NULL
);

-- Indexes
CREATE INDEX idx_exercise_plan_days_plan_id ON exercise_plan_days(exercise_plan_id);
CREATE INDEX idx_exercise_plan_days_order ON exercise_plan_days(exercise_plan_id, day_order);
```

### 16. Exercise Plan Exercises Table

**Purpose**: Individual exercises within each day

```sql
CREATE TABLE exercise_plan_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_plan_day_id UUID NOT NULL REFERENCES exercise_plan_days(id) ON DELETE CASCADE,
    exercise_name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    duration VARCHAR(50) NOT NULL,
    exercise_type VARCHAR(50) NOT NULL CHECK (exercise_type IN ('Cardio', 'Strength', 'Flexibility')),
    exercise_order INTEGER NOT NULL
);

-- Indexes
CREATE INDEX idx_exercise_plan_exercises_day_id ON exercise_plan_exercises(exercise_plan_day_id);
CREATE INDEX idx_exercise_plan_exercises_order ON exercise_plan_exercises(exercise_plan_day_id, exercise_order);
CREATE INDEX idx_exercise_plan_exercises_type ON exercise_plan_exercises(exercise_type);
```

### 17. Health Advice Table

**Purpose**: AI-generated health advice based on user data

```sql
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

-- Indexes
CREATE INDEX idx_health_advice_user_id ON health_advice(user_id);
CREATE INDEX idx_health_advice_language ON health_advice(language);
CREATE INDEX idx_health_advice_created_at ON health_advice(created_at DESC);
```

## Key Design Decisions

### 1. UUID Primary Keys

- Globally unique identifiers
- Better for distributed systems
- Enhanced security (no sequential guessing)

### 2. JSONB for Flexible Data

- Symptom analyses (varying number of items)
- Meal items arrays
- Health advice arrays
- Native PostgreSQL JSON operators for querying

### 3. Comprehensive Constraints

- Data validation at database level
- Enum-like checks for categorical data
- Range checks for health metrics

### 4. Strategic Indexing

- Performance optimization for common queries
- User-specific data access patterns
- Time-based ordering (latest first)
- Full-text search capabilities

### 5. Cascading Deletes

- Automatic cleanup of related data
- Maintains referential integrity
- Simplifies application logic

## Common Query Patterns

### User Health Timeline

```sql
SELECT he.*, ha.dietary_advice
FROM health_entries he
LEFT JOIN health_advice ha ON ha.user_id = he.user_id
WHERE he.user_id = $1
ORDER BY he.date DESC;
```

### Latest Diet Plan with Full Details

```sql
SELECT dp.*, dpd.day_name, dpm.meal_name, dpm.meal_items
FROM diet_plans dp
JOIN diet_plan_days dpd ON dp.id = dpd.diet_plan_id
JOIN diet_plan_meals dpm ON dpd.id = dpm.diet_plan_day_id
WHERE dp.user_id = $1
ORDER BY dp.created_at DESC, dpd.day_order, dpm.meal_order
LIMIT 1;
```

### Active Drug Reminders

```sql
SELECT pd.drug_name, pd.dosage, drt.reminder_time, p.doctor_name
FROM prescription_drugs pd
JOIN drug_reminder_times drt ON pd.id = drt.drug_id
JOIN prescriptions p ON pd.prescription_id = p.id
WHERE p.user_id = $1 AND pd.reminder_enabled = true AND drt.is_active = true
ORDER BY drt.reminder_time;
```

### Chat History with Analysis

```sql
SELECT cm.*, sa.symptoms, sa.treatments
FROM chat_sessions cs
JOIN chat_messages cm ON cs.id = cm.session_id
LEFT JOIN symptom_analyses sa ON cm.id = sa.message_id
WHERE cs.user_id = $1
ORDER BY cm.created_at DESC;
```

## Performance Considerations

### 1. Query Optimization

- Use appropriate indexes for filtering and sorting
- Leverage partial indexes for boolean filters
- Consider materialized views for complex aggregations

### 2. Data Archiving

- Archive old chat sessions after 6 months
- Compress medical records older than 2 years
- Implement soft deletes for audit trails

### 3. Connection Pooling

- Use Supabase's built-in connection pooling
- Optimize for read-heavy workloads
- Consider read replicas for analytics

## Security Considerations

### 1. Row Level Security (RLS)

- Users can only access their own data
- Admin roles for system management
- Audit logging for sensitive operations

### 2. Data Encryption

- Sensitive fields encrypted at rest
- File data stored in Supabase Storage with encryption
- API keys and secrets in environment variables

### 3. Data Privacy

- GDPR/HIPAA compliance considerations
- User data export functionality
- Right to be forgotten implementation

## Migration and Maintenance

### 1. Version Control

- Track schema changes with migrations
- Use Supabase CLI for deployment
- Backup before major changes

### 2. Monitoring

- Query performance monitoring
- Storage usage tracking
- Error logging and alerting

### 3. Backup Strategy

- Daily automated backups
- Point-in-time recovery
- Cross-region backup replication

---

_This schema is designed to scale with the application while maintaining data integrity and performance. Regular review and optimization based on usage patterns is recommended._
