import { useState, useEffect, useCallback } from 'react';
import { SubscriptionState, SubscriptionPlan } from '../types';

const DEFAULT_SUBSCRIPTION_STATE: SubscriptionState = {
    plan: 'basic',
    nearbyUsageCount: 0,
    nearbyUsageLimit: 5,
};

const STORAGE_KEY = 'subscription_state';

export const useSubscription = () => {
    const [subscriptionState, setSubscriptionState] = useState<SubscriptionState>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return { ...DEFAULT_SUBSCRIPTION_STATE, ...JSON.parse(stored) };
            }
        } catch (error) {
            console.error('Error loading subscription state from localStorage:', error);
        }
        return DEFAULT_SUBSCRIPTION_STATE;
    });

    // Save to localStorage whenever state changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptionState));
        } catch (error) {
            console.error('Error saving subscription state to localStorage:', error);
        }
    }, [subscriptionState]);

    const updatePlan = useCallback((plan: SubscriptionPlan) => {
        setSubscriptionState(prev => ({
            ...prev,
            plan,
            // Reset usage count when changing plans
            nearbyUsageCount: 0,
        }));
    }, []);

    const incrementNearbyUsage = useCallback(() => {
        setSubscriptionState(prev => ({
            ...prev,
            nearbyUsageCount: prev.nearbyUsageCount + 1,
        }));
    }, []);

    const canUseNearby = useCallback(() => {
        return subscriptionState.plan === 'pro' || 
               subscriptionState.nearbyUsageCount < subscriptionState.nearbyUsageLimit;
    }, [subscriptionState]);

    const getRemainingNearbyUses = useCallback(() => {
        if (subscriptionState.plan === 'pro') return Infinity;
        return Math.max(0, subscriptionState.nearbyUsageLimit - subscriptionState.nearbyUsageCount);
    }, [subscriptionState]);

    return {
        subscriptionState,
        updatePlan,
        incrementNearbyUsage,
        canUseNearby,
        getRemainingNearbyUses,
    };
};