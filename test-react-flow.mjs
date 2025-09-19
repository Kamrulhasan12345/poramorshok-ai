import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://encmtxchlbcmoywcirms.supabase.co";
const supabaseAnonKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuY210eGNobGJjbW95d2Npcm1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwODQyMzQsImV4cCI6MjA3MzY2MDIzNH0.263PirlTsfJrpHNFkt3qllrQUT8HR8jYqtYJJggU9gE";

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: true,
	},
});

// Simulate the userService from React app
const userService = {
	async getProfile(userId) {
		console.log("   Checking if profile exists for user:", userId);
		const { data, error } = await supabase
			.from("users")
			.select("*")
			.eq("id", userId)
			.single();

		if (error && error.code !== "PGRST116") {
			console.log("   ❌ Error checking profile:", error.message);
			throw error;
		}
		console.log("   📝 Profile check result:", data ? "Found" : "Not found");
		return data;
	},

	async createProfile(profile) {
		console.log("   Creating profile with data:", profile);
		const { data, error } = await supabase
			.from("users")
			.insert([profile])
			.select()
			.single();

		if (error) {
			console.log("   ❌ Error creating profile:", error.message);
			throw error;
		}

		console.log("   ✅ Profile created:", data);
		return data;
	},
};

// Simulate the ensureUserProfile function from React app
async function ensureUserProfile(user) {
	try {
		console.log(
			"🔍 Ensuring user profile for:",
			user.email,
			"User ID:",
			user.id
		);

		// Check if user profile exists
		const existingProfile = await userService.getProfile(user.id);

		if (!existingProfile) {
			// Create user profile
			const name =
				user.user_metadata?.name ||
				user.user_metadata?.full_name ||
				user.email?.split("@")[0] ||
				"User";

			const profileData = {
				id: user.id,
				email: user.email,
				name: name,
				avatar_url: user.user_metadata?.avatar_url || null,
			};

			console.log("📝 Creating user profile with data:", profileData);
			const createdProfile = await userService.createProfile(profileData);
			console.log("✅ Successfully created user profile:", createdProfile);
			return createdProfile;
		} else {
			console.log("✅ User profile already exists for:", user.email);
			return existingProfile;
		}
	} catch (error) {
		console.error("❌ Failed to ensure user profile:", error);
		throw error;
	}
}

async function testReactFlow() {
	console.log("🧪 Testing React app flow...\n");

	const testEmail = `react-test-${Date.now()}@example.com`;
	const testPassword = "TestPassword123!";

	try {
		// Step 1: Signup
		console.log("1. 📝 Signing up...");
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

		console.log("✅ Signup successful");

		// Step 2: Simulate the auth state change
		if (signUpData.user) {
			console.log("\n2. 🔄 Simulating auth state change (SIGNED_UP)...");
			await ensureUserProfile(signUpData.user);
		}

		// Step 3: Check if profile was created
		console.log("\n3. 🔍 Verifying profile was created...");
		const { data: allUsers, error: queryError } = await supabase
			.from("users")
			.select("*")
			.eq("email", testEmail);

		if (queryError) {
			console.log("❌ Error querying users:", queryError.message);
		} else {
			console.log("✅ Users found:", allUsers.length);
			allUsers.forEach((user) => {
				console.log("   📋 User:", user.email, "ID:", user.id);
			});
		}

		// Cleanup
		console.log("\n4. 🧹 Cleanup...");
		if (signUpData.user) {
			try {
				await supabase.from("users").delete().eq("id", signUpData.user.id);
				console.log("✅ Cleanup successful");
			} catch (cleanupErr) {
				console.log("⚠️ Cleanup failed:", cleanupErr.message);
			}
		}
	} catch (err) {
		console.log("❌ Test failed:", err.message);
		console.log("   Stack:", err.stack);
	}
}

// Run the test
testReactFlow()
	.then(() => {
		console.log("\n🏁 React flow test completed");
		process.exit(0);
	})
	.catch((err) => {
		console.log("❌ React flow test failed:", err);
		process.exit(1);
	});
