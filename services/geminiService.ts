import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SymptomAnalysis, DietPlan, HealthEntry, DietPlanRequest, ExercisePlan, ExercisePlanRequest, HealthAdvice } from '../types';

if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const symptomAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        symptoms: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of identified physical symptoms from the user's query."
        },
        causes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of potential common causes for the physical symptoms."
        },
        treatments: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of general non-prescription treatments or lifestyle advice for the physical symptoms."
        },
        medications: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of possible over-the-counter medications for physical symptoms. Must include advice to consult a doctor."
        },
        mentalHealthSupport: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Optional. If the user mentions stress, anxiety, sadness, depression, or feeling overwhelmed, populate this with 2-3 supportive, empathetic statements. Include gentle self-care advice and a strong recommendation to see a mental health professional. Do not diagnose."
        }
    },
    required: ["symptoms", "causes", "treatments", "medications"]
};

const healthAdviceSchema = {
    type: Type.OBJECT,
    properties: {
        dietaryAdvice: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 2-3 specific, actionable dietary recommendations."
        },
        exerciseRecommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 2-3 specific, actionable exercise recommendations."
        },
        lifestyleSuggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of 1-2 general wellness or lifestyle suggestions (e.g., sleep, stress management)."
        }
    },
    required: ["dietaryAdvice", "exerciseRecommendations", "lifestyleSuggestions"]
};


const dietPlanSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "A brief, 2-3 sentence summary of the overall diet plan's strategy and focus."
        },
        plan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.STRING, description: "Day of the week (e.g., Monday)." },
                    dailyNote: { type: Type.STRING, description: "A short, motivational, or informational note for the day (e.g., 'Focus on hydration today.')."},
                    meals: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: "Meal name (e.g., Breakfast, Lunch, Dinner)." },
                                items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of food items for the meal." }
                            },
                            required: ["name", "items"]
                        }
                    }
                },
                required: ["day", "dailyNote", "meals"]
            }
        }
    },
    required: ["summary", "plan"]
};

const exercisePlanSchema = {
    type: Type.OBJECT,
    properties: {
        advice: {
            type: Type.STRING,
            description: "A brief, encouraging paragraph of personalized advice based on the user's goals, age, fitness level, and BMI. This should be presented before the weekly plan."
        },
        plan: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.STRING, description: "Day of the week (e.g., Monday)." },
                    details: { type: Type.STRING, description: "A brief description for the day's focus (e.g., 'Cardio and Core')." },
                    exercises: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: "Name of the exercise." },
                                description: { type: Type.STRING, description: "Brief description or instruction for the exercise." },
                                duration: { type: Type.STRING, description: "Duration or sets/reps (e.g., '30 minutes', '3 sets of 12')." },
                                type: { type: Type.STRING, enum: ['Cardio', 'Strength', 'Flexibility'], description: "The type of exercise." },
                            },
                            required: ["name", "description", "duration", "type"]
                        }
                    }
                },
                required: ["day", "details", "exercises"]
            }
        }
    },
    required: ["advice", "plan"]
};


export const analyzeSymptoms = async (symptoms: string, language: 'en' | 'bn'): Promise<SymptomAnalysis> => {
    const langInstruction = language === 'bn' ? 'Bengali' : 'English';
    const userInputLang = language === 'bn' ? 'The user has provided their symptoms in Bengali.' : 'The user has provided their symptoms in English.';

    const prompt = `You are a helpful and empathetic medical AI assistant called পরামর্শক AI. ${userInputLang} Analyze the following symptoms: "${symptoms}". 
    1.  Identify key physical symptoms, list potential common causes, suggest general non-prescription treatments, and list possible over-the-counter medications. 
    2.  Additionally, be highly sensitive to any user input that suggests mental health concerns such as stress, anxiety, sadness, depression, or feeling overwhelmed. If such themes are detected, populate the 'mentalHealthSupport' field. This field should contain a list of 2-3 supportive and empathetic statements. These should include gentle advice for self-care (e.g., talking to a friend, mindfulness exercises) and a clear, strong recommendation to consult a mental health professional or a doctor for proper guidance. Do not attempt to diagnose. The tone must be compassionate and encouraging.
    3.  IMPORTANT: Your entire response must be in JSON format conforming to the provided schema. The string values within the JSON response must be in ${langInstruction}. Emphasize that this is not a substitute for professional medical advice in your suggestions.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: symptomAnalysisSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as SymptomAnalysis;
    } catch (error) {
        console.error("Error analyzing symptoms:", error);
        throw new Error("Failed to get analysis from AI. Please try again.");
    }
};

export const getHealthAdvice = async (healthData: HealthEntry[], language: 'en' | 'bn'): Promise<HealthAdvice> => {
    const latestEntry = healthData[healthData.length - 1];
    if (!latestEntry) throw new Error("No health data available to provide advice.");

    const langInstruction = language === 'bn' ? 'Bengali' : 'English';
    const prompt = `You are a health and wellness AI coach specializing in advice for people from Bangladesh. A user's latest health data is: Age: ${latestEntry.age} years, Height: ${latestEntry.height} cm, Weight: ${latestEntry.weight} kg, BMI: ${latestEntry.bmi.toFixed(2)}. Based on this, provide a set of concise, actionable, personalized, and age-appropriate health recommendations. The advice, especially dietary, must be culturally relevant for Bangladesh, prioritizing locally available, affordable, and nutritious foods (like various dals, local fish, seasonal vegetables). Do not compromise on nutritional effectiveness. Structure the advice into three categories: 'dietaryAdvice', 'exerciseRecommendations', and 'lifestyleSuggestions'. Frame the advice in a supportive and encouraging tone. Your entire response must be in JSON format conforming to the provided schema. All string values in the JSON response must be in ${langInstruction}.`;
    
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: healthAdviceSchema,
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as HealthAdvice;
    } catch (error) {
        console.error("Error getting health advice:", error);
        throw new Error("Failed to get health advice. Please try again.");
    }
};

export const generateDietPlan = async (request: DietPlanRequest, language: 'en' | 'bn'): Promise<DietPlan> => {
    const { goal, preference, healthData } = request;
    const healthInfo = healthData ? `Their latest health data is: Age: ${healthData.age} years, Height: ${healthData.height} cm, Weight: ${healthData.weight} kg, BMI: ${healthData.bmi.toFixed(2)}.` : "They have not provided specific health data.";
    const langInstruction = language === 'bn' ? 'fluent Bengali' : 'English';

    const prompt = `You are an expert nutritionist AI. A user wants a 7-day diet plan. Their goal is "${goal}", their dietary preference is "${preference}". ${healthInfo} Create a plan that is appropriate for their age. The user is from Bangladesh, so the food items should be common, affordable, and readily available in Bangladeshi cuisine (e.g., rice (bhaat), lentils (dal), fish (maach), chicken (murgi), and local vegetables). Generate a balanced 7-day diet plan with suggestions for Breakfast, Lunch, and Dinner. Start with a brief 'summary' of the plan's overall strategy. For each day, include a short, encouraging 'dailyNote'. Your entire response must be in JSON format conforming to the provided schema. All string values in the JSON (like summary, dailyNote, day, meal names, and food items) must be in ${langInstruction}. Do not include any text outside the JSON.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: dietPlanSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as DietPlan;
    } catch (error) {
        console.error("Error generating diet plan:", error);
        throw new Error("Failed to generate diet plan. Please try again.");
    }
};


export const generateExercisePlan = async (request: ExercisePlanRequest, language: 'en' | 'bn'): Promise<ExercisePlan> => {
    const { goal, healthData, fitnessLevel, location, timePerDay } = request;
    if (!healthData) {
        throw new Error("Health data is required to generate an exercise plan.");
    }
    
    const bmiCategory = healthData.bmi < 18.5 ? 'Underweight' : healthData.bmi < 25 ? 'Normal weight' : healthData.bmi < 30 ? 'Overweight' : 'Obese';
    const healthInfo = `The user's latest health data is: Age: ${healthData.age} years, Height: ${healthData.height} cm, Weight: ${healthData.weight} kg, BMI: ${healthData.bmi.toFixed(2)} (${bmiCategory}).`;
    const personalInfo = `Their self-assessed fitness level is '${fitnessLevel}'. They prefer to exercise at '${location}' and have about '${timePerDay}' available each day.`;
    const langInstruction = language === 'bn' ? 'fluent Bengali' : 'English';

    const prompt = `You are an expert fitness coach AI. A user wants a 7-day exercise plan. Their primary goal is "${goal}". ${healthInfo} ${personalInfo} First, provide a brief, encouraging paragraph of personalized 'advice' based on the user's goals, age, fitness level, and BMI. This advice should provide a high-level strategy. Then, create a balanced, safe, and age-appropriate 7-day 'plan' tailored to this user. The plan should include a mix of Cardio, Strength, and Flexibility. Adjust the intensity and complexity of exercises based on their age, fitness level, and available location (home vs. gym). Ensure daily workouts fit within the user's available time. For each day in the plan, provide a brief summary of the focus. For each exercise, provide its name, a brief description of how to perform it, its type, and the duration or sets/reps. Always include a rest day. Emphasize warm-ups and cool-downs. Your entire response must be in JSON format conforming to the provided schema, including both the 'advice' and 'plan' fields. All string values in the JSON must be in ${langInstruction}.`;

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: exercisePlanSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ExercisePlan;
    } catch (error) {
        console.error("Error generating exercise plan:", error);
        throw new Error("Failed to generate exercise plan. Please try again.");
    }
};

export const getFunFact = async (language: 'en' | 'bn'): Promise<string> => {
    const langInstruction = language === 'bn' ? 'Bengali' : 'English';
    const prompt = `Provide a single, surprising, and positive trivia about human health or biology. The response must be a single, concise sentence in ${langInstruction}. Do not include any introductory phrases like "Here's a fun fact:". Just provide the fact.`;
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        
        if (!response.text) {
            console.warn("AI returned an empty fun fact. Using fallback.");
            throw new Error("AI returned an empty fun fact.");
        }
        return response.text;
    } catch (error) {
        console.error("Error getting fun fact:", error);
        
        // Return a reliable, hardcoded fallback fact.
        if (language === 'bn') {
            return "মজার তথ্য: হাসলে আপনার রোগ প্রতিরোধ ক্ষমতা শক্তিশালী হতে পারে!";
        }
        return "Fun fact: Laughing can boost your immune system!";
    }
};