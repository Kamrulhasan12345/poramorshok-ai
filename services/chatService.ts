import { supabase } from "../src/lib/supabase";
import { ChatMessage } from "../types";

export interface ChatSession {
	id: string;
	user_id: string;
	session_name: string;
	created_at: string;
}

export interface ChatMessageDB {
	id: string;
	session_id: string;
	sender: "user" | "ai";
	message_text: string;
	analysis_data?: any; // JSON field for symptom analysis
	created_at: string;
}

export const chatService = {
	// Create a new chat session
	async createSession(
		userId: string,
		sessionName: string
	): Promise<ChatSession> {
		const { data, error } = await supabase
			.from("chat_sessions")
			.insert([
				{
					user_id: userId,
					session_name: sessionName,
				},
			])
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	// Get all sessions for a user
	async getUserSessions(userId: string): Promise<ChatSession[]> {
		const { data, error } = await supabase
			.from("chat_sessions")
			.select("*")
			.eq("user_id", userId)
			.order("created_at", { ascending: false });

		if (error) throw error;
		return data || [];
	},

	// Save a message to the database
	async saveMessage(
		sessionId: string,
		sender: "user" | "ai",
		messageText: string,
		analysisData?: any
	): Promise<ChatMessageDB> {
		const { data, error } = await supabase
			.from("chat_messages")
			.insert([
				{
					session_id: sessionId,
					sender,
					message_text: messageText,
					analysis_data: analysisData,
				},
			])
			.select()
			.single();

		if (error) throw error;
		return data;
	},

	// Get all messages for a session
	async getSessionMessages(sessionId: string): Promise<ChatMessageDB[]> {
		const { data, error } = await supabase
			.from("chat_messages")
			.select("*")
			.eq("session_id", sessionId)
			.order("created_at", { ascending: true });

		if (error) throw error;
		return data || [];
	},

	// Update session name
	async updateSessionName(sessionId: string, newName: string): Promise<void> {
		const { error } = await supabase
			.from("chat_sessions")
			.update({ session_name: newName })
			.eq("id", sessionId);

		if (error) throw error;
	},

	// Delete a session and all its messages
	async deleteSession(sessionId: string): Promise<void> {
		const { error } = await supabase
			.from("chat_sessions")
			.delete()
			.eq("id", sessionId);

		if (error) throw error;
		// Messages will be deleted automatically due to CASCADE
	},
};
