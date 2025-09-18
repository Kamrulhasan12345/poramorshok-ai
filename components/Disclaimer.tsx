import React from 'react';

import { useLanguage } from '../hooks/useLanguage';

const Disclaimer: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className="mt-4 text-gray-500 dark:text-gray-400 text-xs">
            <p>
                <strong>{t('disclaimerTitle')}:</strong> {t('disclaimerText')}
            </p>
        </div>
    );
};

export default Disclaimer;