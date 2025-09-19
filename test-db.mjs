#!/usr/bin/env node

// Simple script to test Supabase connection
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
	console.log("Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
	console.log("Testing Supabase connection...");

	try {
		// Test basic connection with a simple query
		const { data, error } = await supabase.rpc("now");

		if (error) {
			console.error("Connection error:", error.message);
		} else {
			console.log("✅ Successfully connected to Supabase!");
			console.log("Database is ready for use.");
		}

		// Test authentication status
		const {
			data: { session },
		} = await supabase.auth.getSession();
		console.log(
			"Current session:",
			session ? "Authenticated" : "Not authenticated"
		);

		// Test database schema
		console.log("\nChecking database tables...");

		const tables = [
			"user_profiles",
			"health_entries",
			"medical_records",
			"prescriptions",
			"chat_sessions",
			"diet_plans",
			"exercise_plans",
		];

		for (const table of tables) {
			try {
				const { error } = await supabase.from(table).select("id").limit(1);
				if (error && error.code !== "PGRST116") {
					// PGRST116 = no rows found
					console.log(`❌ Table ${table}: ${error.message}`);
				} else {
					console.log(`✅ Table ${table}: Available`);
				}
			} catch (e) {
				console.log(`❌ Table ${table}: ${e.message}`);
			}
		}

		// Check medical_records table structure specifically
		console.log("\nChecking medical_records table structure...");
		try {
			const { data, error } = await supabase
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
	} catch (error) {
		console.error("❌ Connection failed:", error.message);
	}
}

testConnection();
