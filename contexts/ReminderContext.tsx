import React, { createContext, useState, useEffect, ReactNode, useContext, useRef, useCallback, useMemo } from 'react';
import { InAppAlertInfo, Prescription } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { useAuth } from '../src/contexts/AuthContext';
import { prescriptionsService } from '../src/services/database';
import Icon from '../components/Icon';


type PermissionStatus = 'default' | 'granted' | 'denied';

interface ReminderContextType {
    permissionStatus: PermissionStatus;
    requestPermission: () => void;
    scheduleReminders: () => void;
    activeInAppAlert: InAppAlertInfo | null;
    dismissInAppAlert: () => void;
}

const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export const ReminderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('default');
    const [activeInAppAlert, setActiveInAppAlert] = useState<InAppAlertInfo | null>(null);
    const timeoutIds = useRef<NodeJS.Timeout[]>([]);
    const { t } = useLanguage();

    useEffect(() => {
        if ('Notification' in window) {
            setPermissionStatus(Notification.permission as PermissionStatus);
        }
    }, []);
    
    useEffect(() => {
        scheduleReminders();
    }, [permissionStatus]);


    const requestPermission = useCallback(() => {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                setPermissionStatus(permission as PermissionStatus);
            });
        }
    }, []);
    
    const triggerNotification = useCallback((drugName: string, dosage: string, doctor: string) => {
        // In-app alert
        setActiveInAppAlert({ drugName, dosage, doctor });

        // Browser notification
        if (permissionStatus === 'granted') {
             new Notification(t('reminderAlertTitle'), {
                body: t('reminderAlertText', { drug: `${drugName} (${dosage})` }),
                icon: '/vite.svg', // Replace with a proper icon if available
            });
        }

    }, [permissionStatus, t]);


    const scheduleReminders = useCallback(async () => {
        // Clear existing timeouts
        timeoutIds.current.forEach(clearTimeout);
        timeoutIds.current = [];
        
        if (permissionStatus !== 'granted') return;

        try {
            let prescriptions: Prescription[] = [];
            
            if (user) {
                // Load from database for authenticated users
                const dbPrescriptions = await prescriptionsService.getPrescriptions(user.id);
                prescriptions = dbPrescriptions.map(prescription => ({
                    id: prescription.id,
                    doctor: prescription.prescribing_doctor,
                    date: prescription.issue_date,
                    drugs: prescription.prescription_drugs?.map(drug => ({
                        id: drug.id,
                        name: drug.drug_name,
                        dosage: drug.dosage,
                        reminderEnabled: drug.reminder_enabled || false,
                        reminderTimes: drug.drug_reminder_times?.map(rt => rt.reminder_time) || [],
                    })) || [],
                    fileData: prescription.file_data,
                    fileType: prescription.file_type,
                }));
            } else {
                // Fallback to localStorage for non-authenticated users
                const storedPrescriptions = localStorage.getItem('prescriptions');
                prescriptions = storedPrescriptions ? JSON.parse(storedPrescriptions) : [];
            }

            const now = new Date();
            
            prescriptions.forEach(p => {
                p.drugs.forEach(drug => {
                    if (drug.reminderEnabled && drug.reminderTimes) {
                        drug.reminderTimes.forEach(time => {
                            const [hours, minutes] = time.split(':').map(Number);
                            
                            const reminderTime = new Date();
                            reminderTime.setHours(hours, minutes, 0, 0);

                            let msUntilNext;
                            if (reminderTime.getTime() > now.getTime()) {
                                // Today, in the future
                                msUntilNext = reminderTime.getTime() - now.getTime();
                            } else {
                                // Tomorrow
                                const tomorrowReminderTime = new Date(reminderTime);
                                tomorrowReminderTime.setDate(tomorrowReminderTime.getDate() + 1);
                                msUntilNext = tomorrowReminderTime.getTime() - now.getTime();
                            }
                            
                            if (msUntilNext > 0) {
                                const timeoutId = setTimeout(() => {
                                    triggerNotification(drug.name, drug.dosage, p.doctor);
                                    // Reschedule for tomorrow after it fires
                                    scheduleReminders();
                                }, msUntilNext);
                                timeoutIds.current.push(timeoutId);
                            }
                        });
                    }
                });
            });
        } catch (error) {
            console.error("Failed to load prescriptions for reminders", error);
            
            // Fallback to localStorage if database fails
            if (user) {
                try {
                    const storedPrescriptions = localStorage.getItem('prescriptions');
                    const prescriptions: Prescription[] = storedPrescriptions ? JSON.parse(storedPrescriptions) : [];
                    // ... (continue with the same logic as above for localStorage)
                } catch (localError) {
                    console.error("Failed to parse prescriptions from localStorage", localError);
                }
            }
        }
    }, [permissionStatus, triggerNotification, user]);
    
    const dismissInAppAlert = useCallback(() => {
        setActiveInAppAlert(null);
    }, []);

    const value = useMemo(() => ({
        permissionStatus,
        requestPermission,
        scheduleReminders,
        activeInAppAlert,
        dismissInAppAlert,
    }), [permissionStatus, requestPermission, scheduleReminders, activeInAppAlert, dismissInAppAlert]);

    return (
        <ReminderContext.Provider value={value}>
            {children}
        </ReminderContext.Provider>
    );
};

export const useReminders = (): ReminderContextType => {
    const context = useContext(ReminderContext);
    if (context === undefined) {
        throw new Error('useReminders must be used within a ReminderProvider');
    }
    return context;
};