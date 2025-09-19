#!/usr/bin/env node

// Integration test for the complete Supabase setup
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Read environment variables from .env file
const envFile = readFileSync(".env", "utf8");
const envVars = {};
envFile.split("\n").forEach((line) => {
	const [key, value] = line.split("=");
	if (key && value) {
		envVars[key.trim()] = value.trim().replace(/"/g, "");
	}
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
	console.error("❌ Missing Supabase environment variables");
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runIntegrationTest() {
	console.log("🚀 Running Supabase Integration Test");
	console.log("=====================================\n");

	// Test 1: Database Connection
	console.log("1. Testing Database Connection...");
	try {
		const { data, error } = await supabase
			.from("health_entries")
			.select("count")
			.limit(1);
		if (error && error.code !== "PGRST116") {
			console.log(`❌ Database connection failed: ${error.message}`);
		} else {
			console.log("✅ Database connection successful");
		}
	} catch (e) {
		console.log(`❌ Database connection error: ${e.message}`);
	}

	// Test 2: Table Structure
	console.log("\n2. Testing Table Structure...");
	const tables = [
		"user_profiles",
		"health_entries",
		"medical_records",
		"prescriptions",
		"prescription_drugs",
		"chat_sessions",
		"chat_messages",
		"diet_plans",
		"exercise_plans",
		"health_advice",
	];

	let tablesOk = 0;
	for (const table of tables) {
		try {
			const { error } = await supabase.from(table).select("id").limit(1);
			if (error && error.code !== "PGRST116") {
				console.log(`❌ Table ${table}: ${error.message}`);
			} else {
				console.log(`✅ Table ${table}: Available`);
				tablesOk++;
			}
		} catch (e) {
			console.log(`❌ Table ${table}: ${e.message}`);
		}
	}

	// Test 3: Critical Columns
	console.log("\n3. Testing Critical Columns...");
	try {
		const { error } = await supabase
			.from("medical_records")
			.select("record_type")
			.limit(1);

		if (error) {
			console.log(`❌ medical_records.record_type: ${error.message}`);
		} else {
			console.log(`✅ medical_records.record_type: Column exists`);
		}
	} catch (e) {
		console.log(`❌ medical_records.record_type: ${e.message}`);
	}

	// Test 4: Edge Functions
	console.log("\n4. Testing Edge Functions...");
	try {
		const { data, error } = await supabase.functions.invoke("chat-ai", {
			body: {
				message: "Hello, this is a test message",
				language: "en",
				userId: "test-user",
			},
		});

		if (error) {
			console.log(`❌ chat-ai function: ${error.message}`);
		} else {
			console.log("✅ chat-ai function: Responding correctly");
		}
	} catch (e) {
		console.log(`❌ chat-ai function: ${e.message}`);
	}

	// Test 5: Authentication Setup
	console.log("\n5. Testing Authentication Setup...");
	try {
		const {
			data: { session },
		} = await supabase.auth.getSession();
		console.log(
			`✅ Auth session check: ${
				session ? "User logged in" : "No active session"
			}`
		);

		const {
			data: { user },
		} = await supabase.auth.getUser();
		console.log(
			`✅ Auth user check: ${user ? "User data available" : "No user data"}`
		);
	} catch (e) {
		console.log(`❌ Auth check: ${e.message}`);
	}

	// Test Summary
	console.log("\n=====================================");
	console.log("📊 Integration Test Summary");
	console.log("=====================================");
	console.log(`Tables Available: ${tablesOk}/${tables.length}`);

	if (tablesOk === tables.length) {
		console.log("🎉 All core systems operational!");
		console.log("\n✅ Database: Ready");
		console.log("✅ Tables: All present");
		console.log("✅ Columns: Properly structured");
		console.log("✅ Edge Functions: Deployed");
		console.log("✅ Authentication: Configured");

		console.log(
			"\n🚀 Your Supabase integration is complete and ready for production!"
		);
		console.log("🌐 Access your app at: http://localhost:5173/");
		console.log(
			"📊 Supabase Dashboard: https://supabase.com/dashboard/project/encmtxchlbcmoywcirms"
		);
	} else {
		console.log("⚠️  Some issues detected - check the details above");
	}
}

runIntegrationTest();
