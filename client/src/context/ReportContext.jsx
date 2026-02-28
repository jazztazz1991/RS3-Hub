import React, { createContext, useState, useContext, useCallback } from 'react';

const ReportContext = createContext();

export const useReportCalls = () => useContext(ReportContext);

export const ReportProvider = ({ children }) => {
    const [reportContext, setReportContext] = useState({});

    // Stable references — no re-render loop when used as useEffect deps
    const updateReportContext = useCallback((data) => {
        setReportContext(prev => ({ ...prev, ...data }));
    }, []);

    const clearReportContext = useCallback(() => {
        setReportContext({});
    }, []);

    return (
        <ReportContext.Provider value={{ reportContext, updateReportContext, clearReportContext }}>
            {children}
        </ReportContext.Provider>
    );
};
