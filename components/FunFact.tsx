import React, { useState, useEffect } from 'react';
import { getFunFact } from '../services/geminiService';
import Icon from './Icon';
import Loader from './Loader';
import { useLanguage } from '../hooks/useLanguage';

const FunFact: React.FC = () => {
    const [fact, setFact] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { language, t } = useLanguage();

    useEffect(() => {
        const fetchFact = async () => {
            setIsLoading(true);
            try {
                const newFact = await getFunFact(language);
                setFact(newFact);
            } catch (error) {
                console.error(error);
                setFact(t('funFactError'));
            } finally {
                setIsLoading(false);
            }
        };
        fetchFact();
    }, [language, t]);

    return (
        <div className="mt-8 mb-8 max-w-7xl mx-auto px-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200/80 dark:border-zinc-800/80 p-4 flex items-start gap-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in-up" style={{animationDelay: '200ms'}}>
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 flex items-center justify-center">
                    <Icon name="lightbulb" className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">{t('funHealthFact')}</h4>
                    {isLoading ? (
                        <div className="mt-2 h-5"><Loader /></div>
                    ) : (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{fact}</p>
                    )}
                </div>
            </div>
        </div>
    );
};
export default FunFact;