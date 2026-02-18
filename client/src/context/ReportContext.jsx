import React, { createContext, useState, useContext } from 'react';

const ReportContext = createContext();

export const useReportCalls = () => useContext(ReportContext);

export const ReportProvider = ({ children }) => {
    const [reportContext, setReportContext] = useState({});

    // Helper to update context from any component
    const updateReportContext = (data) => {
        setReportContext(prev => ({ ...prev, ...data }));
    };

    // Helper to clear context (e.g., on page change)
    const clearReportContext = () => {
        setReportContext({});
    };

    return (
        <ReportContext.Provider value={{ reportContext, updateReportContext, clearReportContext }}>
            {children}
        </ReportContext.Provider>
    );
};
