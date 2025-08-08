import React, { FC, useState } from 'react';
import apiService from '../services/apiService';
import { generateDemoEntries, convertEntriesToCsv } from '../utils/csvHelpers';
import { Truck, Theme, UploadProgress } from '../types';

import { FormCard } from '../components/ui/FormCard';
import { Modal } from '../components/ui/Modal';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Spinner } from '../components/ui/Spinner';
import { ThemeToggle } from '../components/ui/ThemeToggle';

interface User { id: number; email: string; }

interface SettingsViewProps { 
    user: User; 
    trucks: Truck[]; 
    showToast: (msg: string, type?: any) => void; 
    theme: Theme; 
    setTheme: (theme: Theme) => void; 
    onSignOut: () => void;
    onTrucksChange: () => void;
}

const SettingsView: FC<SettingsViewProps> = ({ user, trucks, showToast, theme, setTheme, onSignOut, onTrucksChange }) => {
    const [newTruckNumber, setNewTruckNumber] = useState('');
    const [newTruckMakeModel, setNewTruckMakeModel] = useState('');
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ status: 'idle', percentage: 0, message: '' });
    const [showUploadConfirm, setShowUploadConfirm] = useState(false);


    const handleAddTruck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTruckNumber || !newTruckMakeModel) return;
        try {
            await apiService.addTruck(newTruckNumber, newTruckMakeModel);
            showToast("Truck added successfully", "success");
            setNewTruckNumber('');
            setNewTruckMakeModel('');
            onTrucksChange();
        } catch (error: any) {
            showToast(error.message || "Failed to add truck.", "error");
        }
    };
    
    const handleDeleteTruck = async (truckId: string) => {
        if (!window.confirm("Are you sure you want to delete this truck?")) return;
        try {
            await apiService.deleteTruck(truckId);
            showToast("Truck deleted.", "success");
            onTrucksChange();
        } catch (error: any) {
            showToast(error.message || "Failed to delete truck.", "error");
        }
    };

    const handleDownloadDemoCsv = () => {
        const demoEntries = generateDemoEntries(user.id.toString());
        const csvContent = convertEntriesToCsv(demoEntries);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "ifta-way-sample-upload.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    const handleCsvUploadClick = () => {
        showToast("Bulk CSV upload is coming soon!", "info");
    };

    const isProcessing = uploadProgress.status === 'reading' || uploadProgress.status === 'parsing' || uploadProgress.status === 'uploading';

    return (
        <div className="space-y-8">
            {showUploadConfirm && (
                <Modal
                    title="Confirm Upload"
                    onClose={() => setShowUploadConfirm(false)}
                    onConfirm={() => {}}
                    confirmText="Proceed"
                >
                    <p>This feature is coming soon!</p>
                </Modal>
            )}

            <FormCard title={<><i className="fas fa-user-circle text-light-accent dark:text-dark-accent"></i> Account</>}>
                <div className="flex items-center justify-between">
                    <p>Logged in as <span className="font-semibold">{user.email}</span></p>
                    <button onClick={onSignOut} className="font-semibold text-red-500 hover:text-red-600 dark:hover:text-red-400">Sign Out</button>
                </div>
            </FormCard>
            
            <FormCard title={<><i className="fas fa-sun text-light-accent dark:text-dark-accent"></i> Theme</>}>
                 <div className="flex items-center justify-between">
                    <p>Switch between light and dark mode.</p>
                    <ThemeToggle theme={theme} setTheme={setTheme} />
                </div>
            </FormCard>

            <FormCard title={<><i className="fas fa-truck text-light-accent dark:text-dark-accent"></i> Manage Trucks</>}>
                <form onSubmit={handleAddTruck} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1">
                         <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Truck Number</label>
                         <input value={newTruckNumber} onChange={e => setNewTruckNumber(e.target.value)} placeholder="#123" className="mt-1 w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg focus:outline-none focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent"/>
                    </div>
                     <div className="md:col-span-1">
                         <label className="block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary">Make / Model</label>
                         <input value={newTruckMakeModel} onChange={e => setNewTruckMakeModel(e.target.value)} placeholder="e.g., Freightliner Cascadia" className="mt-1 w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg focus:outline-none focus:ring-1 focus:ring-light-accent dark:focus:ring-dark-accent"/>
                    </div>
                    <button type="submit" className="md:col-span-1 h-10 px-4 py-2 rounded-lg font-semibold text-white bg-light-accent dark:bg-dark-accent hover:opacity-90">Add Truck</button>
                </form>
                <div className="mt-6 space-y-2">
                    {trucks.map(truck => (
                        <div key={truck.id} className="flex justify-between items-center p-3 bg-light-bg dark:bg-dark-bg rounded-lg">
                            <div>
                                <p className="font-semibold">{truck.makeModel}</p>
                                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Truck #{truck.number}</p>
                            </div>
                            <button onClick={() => handleDeleteTruck(truck.id)} className="text-red-500 hover:text-red-700"><i className="fas fa-trash"></i></button>
                        </div>
                    ))}
                    {trucks.length === 0 && <p className="text-center text-sm text-light-text-secondary dark:text-dark-text-secondary pt-4">No trucks added yet.</p>}
                </div>
            </FormCard>
            
            <FormCard title={<><i className="fas fa-upload text-light-accent dark:text-dark-accent"></i> Upload Historical Data</>}>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
                    Upload a CSV file of your past fuel entries to analyze historical data. This is also a great way to test the app's features with a larger dataset.
                </p>
                <div className="p-4 rounded-lg bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border">
                    <h4 className="font-semibold text-light-text dark:text-dark-text">CSV Format Requirements:</h4>
                    <ul className="list-disc list-inside text-sm mt-2 text-light-text-secondary dark:text-dark-text-secondary space-y-1">
                        <li>Must be a valid CSV file with a header row.</li>
                        <li>Required headers: <code className="text-xs bg-slate-200 dark:bg-slate-700 p-1 rounded">truckNumber, dateTime, odometer, city, state, fuelType, amount, cost</code>.</li>
                        <li>Date & Time format: <code className="text-xs bg-slate-200 dark:bg-slate-700 p-1 rounded">YYYY-MM-DDTHH:mm</code> (e.g., 2024-01-15T14:30).</li>
                    </ul>
                    <button onClick={handleDownloadDemoCsv} className="mt-4 text-sm font-semibold text-light-accent dark:text-dark-accent hover:underline">
                        <i className="fas fa-download mr-1"></i> Download sample CSV with 70+ demo entries
                    </button>
                </div>
                
                <div className="mt-6 flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 w-full">
                        <label htmlFor="csv-upload" className="w-full h-12 px-4 py-2 rounded-lg border-2 border-dashed border-light-border dark:border-dark-border flex items-center justify-center cursor-pointer hover:border-light-accent dark:hover:border-dark-accent transition-colors">
                            <i className="fas fa-file-csv mr-2 text-xl text-light-text-secondary dark:text-dark-text-secondary"></i>
                            <span className="text-light-text dark:text-dark-text font-medium">{csvFile ? csvFile.name : 'Choose a .csv file...'}</span>
                        </label>
                        <input id="csv-upload" type="file" accept=".csv" disabled className="hidden" />
                    </div>
                    <button 
                        onClick={handleCsvUploadClick} 
                        disabled={true || !csvFile || isProcessing}
                        className="px-6 py-2 h-12 rounded-lg font-semibold text-white bg-light-accent dark:bg-dark-accent hover:opacity-90 transition flex items-center justify-center gap-2 disabled:bg-slate-400 dark:disabled:bg-slate-600 w-full md:w-56"
                    >
                        {isProcessing ? <Spinner /> : <><i className="fas fa-cloud-upload-alt"></i> Upload & Process</>}
                    </button>
                </div>
                 <ProgressBar progress={uploadProgress} />
            </FormCard>
        </div>
    );
};

export default SettingsView;
