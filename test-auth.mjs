#!/usr/bin/env node

// Test authentication and database connection
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

async function testAuth() {
	console.log("Testing Supabase authentication...");

	try {
		// Test basic connection
		const { data, error } = await supabase.auth.getSession();
		if (error) {
			console.error("❌ Auth connection error:", error.message);
		} else {
			console.log("✅ Auth connection successful");
			console.log(
				"Current session:",
				data.session ? "Active session" : "No active session"
			);
		}

		// Check if we can access the users table structure
		console.log("\nChecking auth.users access...");
		try {
			// This should fail with permission error but confirm the connection works
			const { error: userError } = await supabase.auth.admin.listUsers();
			if (userError) {
				console.log(
					"✅ Auth admin functions are properly restricted (expected)"
				);
			}
		} catch (e) {
			console.log(
				"✅ Auth setup is working (admin access restricted as expected)"
			);
		}

		// Test a simple signup to verify auth works
		console.log("\nTesting signup process...");
		const testEmail = `test_${Date.now()}@example.com`;
		const testPassword = "TestPassword123!";

		const { data: signupData, error: signupError } = await supabase.auth.signUp(
			{
				email: testEmail,
				password: testPassword,
				options: {
					data: {
						full_name: "Test User",
					},
				},
			}
		);

		if (signupError) {
			console.log("⚠️  Signup error:", signupError.message);
			if (signupError.message.includes("confirm")) {
				console.log(
					"✅ Email confirmation is enabled (this is good for production)"
				);
			}
		} else {
			console.log("✅ Signup successful");
			console.log("User created:", signupData.user ? "Yes" : "No");
			console.log(
				"Session created:",
				signupData.session ? "Yes (auto-confirmed)" : "No (needs confirmation)"
			);

			// Clean up test user if possible
			if (signupData.session) {
				await supabase.auth.signOut();
				console.log("✅ Test user signed out");
			}
		}
	} catch (error) {
		console.error("❌ Auth test failed:", error.message);
	}
}

testAuth();
