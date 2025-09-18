import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	healthService,
	chatService,
	medicalRecordsService,
	prescriptionsService,
	insuranceService,
	dietService,
	exerciseService,
	healthAdviceService,
} from "../services/database";
import { useAuth } from "../contexts/AuthContext";

// Health Entries hooks
export const useHealthEntries = () => {
	const { user } = useAuth();

	return useQuery({
		queryKey: ["healthEntries", user?.id],
		queryFn: () => healthService.getEntries(user!.id),
		enabled: !!user,
	});
};

export const useAddHealthEntry = () => {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	return useMutation({
		mutationFn: healthService.addEntry,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["healthEntries", user?.id] });
		},
	});
};

export const useUpdateHealthEntry = () => {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	return useMutation({
		mutationFn: ({ id, updates }: { id: string; updates: any }) =>
			healthService.updateEntry(id, updates),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["healthEntries", user?.id] });
		},
	});
};

export const useDeleteHealthEntry = () => {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	return useMutation({
		mutationFn: healthService.deleteEntry,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["healthEntries", user?.id] });
		},
	});
};

// Chat Sessions hooks
export const useChatSessions = () => {
	const { user } = useAuth();

	return useQuery({
		queryKey: ["chatSessions", user?.id],
		queryFn: () => chatService.getSessions(user!.id),
		enabled: !!user,
	});
};

export const useCreateChatSession = () => {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	return useMutation({
		mutationFn: ({ name }: { name?: string }) =>
			chatService.createSession(user!.id, name),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["chatSessions", user?.id] });
		},
	});
};

export const useAddChatMessage = () => {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	return useMutation({
		mutationFn: ({ sessionId, message }: { sessionId: string; message: any }) =>
			chatService.addMessage(sessionId, message),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["chatSessions", user?.id] });
		},
	});
};

// Medical Records hooks
export const useMedicalRecords = () => {
	const { user } = useAuth();

	return useQuery({
		queryKey: ["medicalRecords", user?.id],
		queryFn: () => medicalRecordsService.getRecords(user!.id),
		enabled: !!user,
	});
};

export const useAddMedicalRecord = () => {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	return useMutation({
		mutationFn: medicalRecordsService.addRecord,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["medicalRecords", user?.id] });
		},
	});
};

// Prescriptions hooks
export const usePrescriptions = () => {
	const { user } = useAuth();

	return useQuery({
		queryKey: ["prescriptions", user?.id],
		queryFn: () => prescriptionsService.getPrescriptions(user!.id),
		enabled: !!user,
	});
};

export const useAddPrescription = () => {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	return useMutation({
		mutationFn: ({
			prescription,
			drugs,
		}: {
			prescription: any;
			drugs: any[];
		}) => prescriptionsService.addPrescription(prescription, drugs),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["prescriptions", user?.id] });
		},
	});
};

// Insurance hooks
export const useInsurance = () => {
	const { user } = useAuth();

	return useQuery({
		queryKey: ["insurance", user?.id],
		queryFn: () => insuranceService.getInsurance(user!.id),
		enabled: !!user,
	});
};

export const useUpsertInsurance = () => {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	return useMutation({
		mutationFn: insuranceService.upsertInsurance,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["insurance", user?.id] });
		},
	});
};

// Diet Plans hooks
export const useDietPlans = () => {
	const { user } = useAuth();

	return useQuery({
		queryKey: ["dietPlans", user?.id],
		queryFn: () => dietService.getPlans(user!.id),
		enabled: !!user,
	});
};

export const useAddDietPlan = () => {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	return useMutation({
		mutationFn: ({ plan, days }: { plan: any; days: any[] }) =>
			dietService.addPlan(plan, days),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["dietPlans", user?.id] });
		},
	});
};

// Exercise Plans hooks
export const useExercisePlans = () => {
	const { user } = useAuth();

	return useQuery({
		queryKey: ["exercisePlans", user?.id],
		queryFn: () => exerciseService.getPlans(user!.id),
		enabled: !!user,
	});
};

export const useAddExercisePlan = () => {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	return useMutation({
		mutationFn: ({ plan, days }: { plan: any; days: any[] }) =>
			exerciseService.addPlan(plan, days),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["exercisePlans", user?.id] });
		},
	});
};

// Health Advice hooks
export const useHealthAdvice = (language: string) => {
	const { user } = useAuth();

	return useQuery({
		queryKey: ["healthAdvice", user?.id, language],
		queryFn: () => healthAdviceService.getAdvice(user!.id, language),
		enabled: !!user,
	});
};

export const useAddHealthAdvice = () => {
	const queryClient = useQueryClient();
	const { user } = useAuth();

	return useMutation({
		mutationFn: healthAdviceService.addAdvice,
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["healthAdvice", user?.id, variables.language],
			});
		},
	});
};
