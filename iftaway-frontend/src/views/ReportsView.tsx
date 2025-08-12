import React, { FC, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { FormCard } from '../components/ui/FormCard';
import { Spinner } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';

type ReportRow = {
    jurisdiction: string;
    totalMiles: number;
    totalFuel: number;
    totalCost: number;
};

type ReportData = {
    reportRows: ReportRow[];
    overallMPG: number;
};

const ReportsView: FC<{ showToast: (msg: string, type?: any) => void; }> = ({ showToast }) => {
    const getCurrentQuarter = () => Math.floor(new Date().getMonth() / 3) + 1;
    const getYears = () => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 5 }, (_, i) => currentYear - i);
    };

    const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
    const [selectedYear, setSelectedYear] = useState(getYears()[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    const inputStyle = "w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent";
    
    const downloadCSV = () => {
        if (!reportData) return;

        const { reportRows, overallMPG } = reportData;
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += `IFTA Report\n`;
        csvContent += `Quarter,Q${selectedQuarter}\n`;
        csvContent += `Year,${selectedYear}\n`;
        csvContent += `Overall Fleet MPG,${overallMPG.toFixed(2)}\n\n`;
        
        const headers = ["Jurisdiction", "Total Miles Driven", "Total Fuel Purchased (Gallons)", "Total Fuel Cost ($)"];
        csvContent += headers.join(",") + "\n";

        reportRows.forEach(row => {
            const rowArray = [
                row.jurisdiction,
                row.totalMiles.toFixed(2),
                row.totalFuel.toFixed(2),
                row.totalCost.toFixed(2)
            ];
            csvContent += rowArray.join(",") + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `IFTA_Report_Q${selectedQuarter}_${selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleConfirmAndDownload = () => {
        downloadCSV();
        setShowDisclaimer(false);
    };

    const handleGenerateReport = async () => {
        setIsLoading(true);
        setError(null);
        setReportData(null);
        
        try {
            const functions = getFunctions();
            const generateReportFn = httpsCallable(functions, 'generateReport');
            const result = await generateReportFn({ year: selectedYear, quarter: selectedQuarter });
            const data = result.data as any;

            if (data.message) {
                setError(data.message);
                showToast(data.message, "info");
            } else if (data.reportRows) {
                setReportData(data as ReportData);
                setShowDisclaimer(true);
            } else {
                 throw new Error("Invalid response from server.");
            }

        } catch (error: any) {
            console.error(error);
            const errorMessage = error.message || "An unknown error occurred.";
            setError(`Failed to generate report: ${errorMessage}`);
            showToast(`Failed to generate report: ${errorMessage}`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {showDisclaimer && reportData && <Modal
                title="Disclaimer"
                onClose={() => setShowDisclaimer(false)}
                onConfirm={handleConfirmAndDownload}
                confirmText="Download CSV"
                cancelText="Close"
            >
                <p>Mileage is estimated based on the odometer difference between fueling locations for each truck.</p>
                <p className="font-semibold mt-2">Please verify all data before filing your IFTA report.</p>
            </Modal>}

            <FormCard title={<><i className="fas fa-file-invoice text-light-accent dark:text-dark-accent"></i> IFTA Report Generator</>}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Quarter</label>
                        <select value={selectedQuarter} onChange={e => setSelectedQuarter(parseInt(e.target.value))} className={inputStyle}>
                            <option value="1">Q1 (Jan - Mar)</option>
                            <option value="2">Q2 (Apr - Jun)</option>
                            <option value="3">Q3 (Jul - Sep)</option>
                            <option value="4">Q4 (Oct - Dec)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-1">Year</label>
                        <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className={inputStyle}>
                            {getYears().map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button onClick={handleGenerateReport} disabled={isLoading} className="w-full h-10 px-4 py-2 rounded-lg font-semibold text-white bg-light-accent dark:bg-dark-accent hover:opacity-90 transition flex items-center justify-center gap-2 disabled:bg-slate-400 dark:disabled:bg-slate-600">
                           {isLoading ? <Spinner /> : <i className="fas fa-cogs"></i>}
                           Generate Report
                        </button>
                    </div>
                </div>
            </FormCard>

            {isLoading && <div className="flex justify-center py-10"><Spinner className="w-10 h-10" /></div>}

            {error && !isLoading && (
                <div className="p-4 text-center bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
                    <p><i className="fas fa-exclamation-triangle mr-2"></i>{error}</p>
                </div>
            )}

            {reportData && !isLoading && !error && (
                 <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-light-text dark:text-dark-text border-b border-light-border dark:border-dark-border pb-3">Report Summary</h2>
                    <div className="p-4 bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg">
                        <div className="text-lg font-semibold mb-2">Overall Fleet MPG: <span className="text-light-accent dark:text-dark-accent">{reportData.overallMPG.toFixed(2)}</span></div>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-light-border dark:border-dark-border">
                                    <th className="p-2">Jurisdiction</th>
                                    <th className="p-2">Total Miles</th>
                                    <th className="p-2">Total Fuel (Gal)</th>
                                    <th className="p-2">Total Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.reportRows.map(row => (
                                    <tr key={row.jurisdiction} className="border-b border-light-border/50 dark:border-dark-border/50">
                                        <td className="p-2 font-semibold">{row.jurisdiction}</td>
                                        <td className="p-2">{row.totalMiles.toFixed(2)}</td>
                                        <td className="p-2">{row.totalFuel.toFixed(2)}</td>
                                        <td className="p-2">${row.totalCost.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default ReportsView;
