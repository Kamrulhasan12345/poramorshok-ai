import React, { useState, useRef, useEffect, useCallback } from "react";
import * as htmlToImage from "html-to-image";
import { SymptomAnalysis, ChatMessage } from "../types";
import { analyzeSymptoms } from "../services/geminiService";
import { chatService } from "../src/services/database";
import { useAuth } from "../src/contexts/AuthContext";
import Icon from "./Icon";
import Disclaimer from "./Disclaimer";
import Loader from "./Loader";
import { useLanguage } from "../hooks/useLanguage";
import { useTheme } from "../contexts/ThemeContext";

const AnalysisResultCard: React.FC<{
	title: string;
	items: string[];
	icon: "symptom" | "cause" | "treatment" | "medication";
}> = ({ title, items, icon }) => {
	return (
		<div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800/80 p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col h-full">
			<div className="flex items-center mb-3">
				<div className="flex-shrink-0 h-8 w-8 rounded-full bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
					<Icon name={icon} className="h-5 w-5" />
				</div>
				<h3 className="ml-3 font-semibold text-gray-800 dark:text-gray-200">
					{title}
				</h3>
			</div>
			<ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 list-disc pl-5">
				{items.map((item, index) => (
					<li key={index}>{item}</li>
				))}
			</ul>
		</div>
	);
};

const MentalHealthSupportCard: React.FC<{ items: string[] }> = ({ items }) => {
	const { t } = useLanguage();
	return (
		<div className="md:col-span-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-200 dark:border-purple-500/30 p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
			<div className="flex items-center mb-3">
				<div className="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
					<Icon name="mental-health" className="h-5 w-5" />
				</div>
				<h3 className="ml-3 font-semibold text-purple-800 dark:text-purple-300">
					{t("mentalHealthSupport")}
				</h3>
			</div>
			<ul className="space-y-2 text-sm text-purple-700 dark:text-purple-300 list-disc pl-5">
				{items.map((item, index) => (
					<li key={index}>{item}</li>
				))}
			</ul>
		</div>
	);
};

const Chatbot: React.FC = () => {
	const { user } = useAuth();
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loadingFromDatabase, setLoadingFromDatabase] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const chatContainerRef = useRef<HTMLDivElement>(null);
	const { language, t } = useLanguage();
	const { theme } = useTheme();

	// Load chat history from database
	const loadChatHistory = useCallback(async () => {
		if (!user) {
			// No authenticated user, start with empty chat
			setMessages([]);
			setCurrentSessionId(null);
			return;
		}

		// User is authenticated, load from database
		try {
			setLoadingFromDatabase(true);
			const sessions = await chatService.getSessions(user.id);

			if (sessions && sessions.length > 0) {
				// Get the most recent session
				const latestSession = sessions[0];
				setCurrentSessionId(latestSession.id);

				// Convert database messages to ChatMessage format
				const dbMessages: ChatMessage[] =
					latestSession.chat_messages?.map((msg: any) => ({
						sender:
							msg.sender === "assistant" ? "ai" : (msg.sender as "user" | "ai"),
						text: msg.message_text,
						analysis: msg.symptom_analyses?.[0]
							? {
									symptoms: msg.symptom_analyses[0].symptoms || [],
									causes: msg.symptom_analyses[0].causes || [],
									treatments: msg.symptom_analyses[0].treatments || [],
									medications: msg.symptom_analyses[0].medications || [],
									mentalHealthSupport:
										msg.symptom_analyses[0].mental_health_support || [],
							  }
							: undefined,
					})) || [];

				setMessages(dbMessages);
			} else {
				// No existing sessions, start fresh
				setMessages([]);
				setCurrentSessionId(null);
			}
		} catch (error) {
			console.error("Failed to load chat history from database:", error);
			// Start with empty chat on database error
			setMessages([]);
			setCurrentSessionId(null);
		} finally {
			setLoadingFromDatabase(false);
		}
	}, [user]);

	// Save message to database (database-first approach)
	const saveMessage = useCallback(
		async (newMessage: ChatMessage) => {
			if (!user) {
				// For non-authenticated users, just update local state
				// Chat history won't be persisted across sessions
				setMessages((prev) => [...prev, newMessage]);
				return;
			}

			try {
				// Ensure we have a session
				let sessionId = currentSessionId;
				if (!sessionId) {
					const session = await chatService.createSession(
						user.id,
						`Chat ${new Date().toLocaleDateString()}`
					);
					sessionId = session.id;
					setCurrentSessionId(sessionId);
				}

				// Save message to database
				// Ensure sender is only 'user' or 'ai' for DB
				const dbSender = newMessage.sender === "user" ? "user" : "ai";
				const dbMessage = await chatService.addMessage(sessionId, {
					sender: dbSender,
					message_text: newMessage.text,
				});

				// Save symptom analysis if present
				if (newMessage.analysis && dbMessage) {
					await chatService.addSymptomAnalysis(dbMessage.id, {
						symptoms: newMessage.analysis.symptoms || [],
						causes: newMessage.analysis.causes || [],
						treatments: newMessage.analysis.treatments || [],
						medications: newMessage.analysis.medications || [],
						mental_health_support:
							newMessage.analysis.mentalHealthSupport || [],
					});
				}

				// Update local state after successful database save
				setMessages((prev) => [...prev, newMessage]);
			} catch (error) {
				console.error("Failed to save message to database:", error);
				// For authenticated users, don't save locally if database fails
				// This ensures consistency and encourages proper error handling
				throw error;
			}
		},
		[user, currentSessionId]
	);

	// Clear chat history from database
	const clearChatHistory = useCallback(async () => {
		if (user && currentSessionId) {
			try {
				// For simplicity, we'll just create a new session
				// In a more advanced implementation, you might want to delete the old session
				setCurrentSessionId(null);
			} catch (error) {
				console.error("Failed to clear chat from database:", error);
			}
		}

		// Clear local state
		setMessages([]);
	}, [user, currentSessionId]);

	// Load chat history on component mount and when user changes
	useEffect(() => {
		loadChatHistory();
	}, [loadChatHistory]);

	// Only sync to localStorage for non-authenticated users
	useEffect(() => {
		if (!user && messages.length > 0) {
			try {
				localStorage.setItem("chatHistory", JSON.stringify(messages));
			} catch (err) {
				console.error("Failed to save chat history to localStorage", err);
			}
		}
	}, [messages, user]);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		if (!isLoading) {
			scrollToBottom();
		}
	}, [messages, isLoading]);

	const handleDownloadChat = useCallback(() => {
		const node = chatContainerRef.current;
		if (node === null) {
			return;
		}

		setIsDownloading(true);

		htmlToImage
			.toCanvas(node, {
				cacheBust: true,
				backgroundColor: theme === "dark" ? "#0a0a0e" : "#f3f4f6", // zinc-950 or gray-100
				pixelRatio: 2,
				width: node.offsetWidth,
				height: node.scrollHeight,
			})
			.then((canvas) => {
				const ctx = canvas.getContext("2d");
				if (!ctx) return;

				// Watermark
				ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
				const fontSize = canvas.width / 60;
				ctx.font = `bold ${fontSize}px sans-serif`;
				ctx.textAlign = "right";
				ctx.textBaseline = "bottom";
				ctx.fillText(
					"পরামর্শক AI",
					canvas.width - fontSize,
					canvas.height - fontSize
				);

				// Download
				const link = document.createElement("a");
				link.download = "ai-analyzer-chat.png";
				link.href = canvas.toDataURL("image/png");
				link.click();
			})
			.catch((err) => {
				console.error("oops, something went wrong!", err);
				alert("Sorry, could not download chat image.");
			})
			.finally(() => {
				setIsDownloading(false);
			});
	}, [theme]);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!input.trim() || isLoading) return;

			const userMessage: ChatMessage = { sender: "user", text: input };
			setInput("");
			setIsLoading(true);
			setError(null);

			// Save user message to database/localStorage
			await saveMessage(userMessage);

			try {
				const analysis = await analyzeSymptoms(input, language);
				const aiMessage: ChatMessage = {
					sender: "ai",
					text: t("aiAnalysisDisclaimer"),
					analysis,
				};

				// Save AI message to database/localStorage
				await saveMessage(aiMessage);
			} catch (err) {
				const message = err instanceof Error ? err.message : t("unknownError");
				setError(message);
				const errorMessage: ChatMessage = {
					sender: "ai",
					text: `${t("aiProcessError")} ${message}`,
				};

				// Save error message to database/localStorage
				await saveMessage(errorMessage);
			} finally {
				setIsLoading(false);
			}
		},
		[input, isLoading, language, t, saveMessage]
	);

	return (
		<div className="flex flex-col animate-fade-in-up">
			<div className="flex-1 p-1 sm:p-4">
				{/* Chat Header */}
				<div className="max-w-4xl mx-auto mb-4 flex justify-between items-center">
					<h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
						{messages.length > 0
							? t("conversation")
							: t("symptomAnalyzerTitle")}
					</h2>
					{messages.length > 0 && (
						<button
							onClick={handleDownloadChat}
							disabled={isDownloading}
							className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-semibold rounded-lg shadow-sm text-white bg-teal-500 hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all disabled:opacity-70 disabled:cursor-wait"
						>
							{isDownloading ? (
								<>
									<svg
										className="animate-spin h-5 w-5"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											className="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											strokeWidth="4"
										></circle>
										<path
											className="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
									<span>{t("downloading")}</span>
								</>
							) : (
								<>
									<Icon name="image-download" className="h-5 w-5" />
									<span>{t("downloadChat")}</span>
								</>
							)}
						</button>
					)}
				</div>

				<div
					ref={chatContainerRef}
					className="space-y-6 max-w-4xl mx-auto pb-28 pt-4 bg-gray-100 dark:bg-zinc-950"
				>
					{loadingFromDatabase && (
						<div className="text-center text-gray-500 dark:text-gray-400 pt-16 flex flex-col items-center justify-center">
							<div className="animate-spin h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"></div>
							<p className="mt-2">
								{t("loadingChatHistory") || "Loading chat history..."}
							</p>
						</div>
					)}
					{!user && !loadingFromDatabase && (
						<div className="mx-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
							<div className="flex items-start gap-3">
								<div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
									<Icon name="user" className="h-5 w-5" />
								</div>
								<div>
									<p className="text-sm font-medium text-blue-800 dark:text-blue-300">
										{t("chatHistoryNotSaved") || "Chat history won't be saved"}
									</p>
									<p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
										{t("loginToSaveChat") ||
											"Log in to save your conversations and access them across devices."}
									</p>
								</div>
							</div>
						</div>
					)}
					{!loadingFromDatabase && messages.length === 0 && (
						<div className="text-center text-gray-500 dark:text-gray-400 pt-16 flex flex-col items-center justify-center">
							<Icon
								name="search"
								className="h-20 w-20 mx-auto text-gray-300 dark:text-gray-600 mb-4"
							/>
							<p className="mt-2 max-w-sm">{t("symptomAnalyzerDescription")}</p>
						</div>
					)}
					{messages.map((msg, index) => (
						<div key={index}>
							<div
								className={`flex items-end gap-3 ${
									msg.sender === "user" ? "justify-end" : "justify-start"
								}`}
							>
								{msg.sender === "ai" && (
									<div className="flex-shrink-0 h-8 w-8 rounded-full bg-white-500 flex items-center justify-center text-white shadow-sm">
										<img
											src="/images/icon-black.png"
											alt="পরামর্শক AI Logo"
											className="h-5 w-5"
										/>
									</div>
								)}
								<div
									className={`max-w-2xl px-4 py-2.5 rounded-2xl ${
										msg.sender === "user"
											? "bg-blue-500 dark:bg-blue-600 text-white rounded-br-none"
											: "bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-200/80 dark:border-zinc-800/80"
									}`}
								>
									<p className="text-base">{msg.text}</p>
								</div>
							</div>
							{msg.analysis && (
								<div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl ml-11">
									<AnalysisResultCard
										title={t("identifiedSymptoms")}
										items={msg.analysis.symptoms}
										icon="symptom"
									/>
									<AnalysisResultCard
										title={t("potentialCauses")}
										items={msg.analysis.causes}
										icon="cause"
									/>
									<AnalysisResultCard
										title={t("suggestedTreatments")}
										items={msg.analysis.treatments}
										icon="treatment"
									/>
									<AnalysisResultCard
										title={t("possibleMedications")}
										items={msg.analysis.medications}
										icon="medication"
									/>
									{msg.analysis.mentalHealthSupport &&
										msg.analysis.mentalHealthSupport.length > 0 && (
											<MentalHealthSupportCard
												items={msg.analysis.mentalHealthSupport}
											/>
										)}
									<div className="md:col-span-2">
										<Disclaimer />
									</div>
								</div>
							)}
						</div>
					))}
					{isLoading && (
						<div className="flex items-end gap-3 justify-start">
							<div className="flex-shrink-0 h-8 w-8 rounded-full bg-teal-500 flex items-center justify-center text-white shadow-sm">
								<Icon name="logo" className="h-5 w-5" />
							</div>
							<div className="max-w-md p-3 rounded-2xl rounded-bl-none bg-white dark:bg-zinc-800 border border-gray-200/80 dark:border-zinc-800/80">
								<Loader />
							</div>
						</div>
					)}
					{error && !isLoading && (
						<div className="text-center text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-500/30">
							<p>
								<strong>{t("errorLabel")}:</strong> {error}
							</p>
						</div>
					)}
					<div ref={messagesEndRef} />
				</div>
			</div>
			<div className="p-4 bg-gray-100/80 dark:bg-zinc-950/80 backdrop-blur-sm border-t border-gray-200/80 dark:border-zinc-800/80 sticky bottom-0">
				<div className="max-w-4xl mx-auto">
					<form onSubmit={handleSubmit} className="flex items-center space-x-3">
						<input
							type="text"
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder={t("symptomInputPlaceholder")}
							className="flex-1 block w-full rounded-full border-gray-300 dark:border-zinc-700 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-3 pl-5 bg-white dark:bg-zinc-800 dark:text-gray-200 dark:placeholder-gray-400"
							disabled={isLoading}
							aria-label={t("symptomInputPlaceholder")}
						/>
						<button
							type="submit"
							disabled={isLoading || !input.trim()}
							className="inline-flex items-center justify-center rounded-full h-12 w-12 border border-transparent bg-teal-500 text-white shadow-sm hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							aria-label={t("sendMessage")}
						>
							<Icon name="send" className="h-5 w-5" />
						</button>
					</form>
				</div>
			</div>
		</div>
	);
};

export default Chatbot;
