import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://encmtxchlbcmoywcirms.supabase.co";
const supabaseAnonKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuY210eGNobGJjbW95d2Npcm1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODQyMzQsImV4cCI6MjA3MzY2MDIzNH0.263PirlTsfJrpHNFkt3qllrQUT8HR8jYqtYJJggU9gE";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUserCreation() {
	console.log("🧪 Testing user creation flow...\n");

	// Step 1: Check if we can query the users table
	console.log("1. Testing users table access...");
	try {
		const { data, error } = await supabase.from("users").select("*").limit(1);

		if (error) {
			console.log("❌ Error querying users table:", error.message);
			console.log("   Code:", error.code);
			console.log("   Details:", error.details);
		} else {
			console.log("✅ Can query users table, found", data.length, "records");
		}
	} catch (err) {
		console.log("❌ Exception querying users table:", err.message);
	}

	// Step 2: Test signup and user creation
	console.log("\n2. Testing signup flow...");
	const testEmail = `test-${Date.now()}@example.com`;
	const testPassword = "TestPassword123!";

	try {
		console.log("   Signing up with email:", testEmail);
		const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
			{
				email: testEmail,
				password: testPassword,
			}
		);

		if (signUpError) {
			console.log("❌ Signup error:", signUpError.message);
			return;
		}

		console.log("✅ Signup successful, user ID:", signUpData.user?.id);

		if (signUpData.user) {
			// Step 3: Try to create user profile
			console.log("\n3. Testing user profile creation...");
			const profileData = {
				id: signUpData.user.id,
				email: signUpData.user.email,
				name: signUpData.user.email.split("@")[0],
				avatar_url: null,
			};

			console.log("   Profile data:", profileData);

			const { data: profileResult, error: profileError } = await supabase
				.from("users")
				.insert([profileData])
				.select()
				.single();

			if (profileError) {
				console.log("❌ Profile creation error:", profileError.message);
				console.log("   Code:", profileError.code);
				console.log("   Details:", profileError.details);
				console.log("   Hint:", profileError.hint);

				// Try to check current auth status
				console.log("\n   Checking auth status...");
				const {
					data: { user },
					error: userError,
				} = await supabase.auth.getUser();
				if (user) {
					console.log("   ✅ Auth user found:", user.id);
					console.log("   Email confirmed:", user.email_confirmed_at !== null);
				} else {
					console.log("   ❌ No auth user found:", userError);
				}
			} else {
				console.log("✅ Profile created successfully:", profileResult);
			}

			// Cleanup - try to delete the test user (this might fail, that's ok)
			console.log("\n4. Cleanup...");
			try {
				await supabase.from("users").delete().eq("id", signUpData.user.id);
				console.log("✅ Cleanup successful");
			} catch (cleanupErr) {
				console.log("⚠️ Cleanup failed (expected):", cleanupErr.message);
			}
		}
	} catch (err) {
		console.log("❌ Exception during signup:", err.message);
	}
}

// Step 4: Check RLS policies
async function checkRLSPolicies() {
	console.log("\n🔒 Checking RLS policies...");

	try {
		// This query will only work if we have proper permissions
		const { data, error } = await supabase
			.rpc("get_table_policies", { table_name: "users" })
			.single();

		if (error) {
			console.log("❌ Cannot check policies (expected):", error.message);
		} else {
			console.log("✅ Policies found:", data);
		}
	} catch (err) {
		console.log("❌ Exception checking policies:", err.message);
	}
}

// Run tests
testUserCreation()
	.then(() => checkRLSPolicies())
	.then(() => {
		console.log("\n🏁 Test completed");
		process.exit(0);
	})
	.catch((err) => {
		console.log("❌ Test failed:", err);
		process.exit(1);
	});
