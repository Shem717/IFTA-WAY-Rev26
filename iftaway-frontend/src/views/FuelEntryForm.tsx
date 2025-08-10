import React, { FC, useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';
import { getFirebase } from '../lib/firebase';
import { uploadReceipt } from '../services/storageService';
import { FuelEntry, Truck, SaveState } from '../types';
import { statesAndProvinces } from '../utils/constants';

import { FormCard } from '../components/ui/FormCard';
import { Autocomplete } from '../components/ui/Autocomplete';
import { Spinner } from '../components/ui/Spinner';
import { FileUpload } from '../components/FileUpload';

interface User { id: string; email: string; }

interface FuelEntryFormProps {
    trucks: Truck[];
    showToast: (msg: string, type?: any) => void;
    user: User;
    onSave: () => void;
    entryToEdit: FuelEntry | null;
    setEntryToEdit: (entry: FuelEntry | null) => void;
}

const FuelEntryForm: FC<FuelEntryFormProps> = ({ trucks, showToast, onSave, entryToEdit, setEntryToEdit }) => {
    const [truckNumber, setTruckNumber] = useState('');
    const [dateTime, setDateTime] = useState(new Date().toISOString().slice(0, 16));
    const [odometer, setOdometer] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [fuelType, setFuelType] = useState<'diesel' | 'def' | 'custom'>('diesel');
    const [customFuelType, setCustomFuelType] = useState('');
    const [amount, setAmount] = useState('');
    const [cost, setCost] = useState('');
    const [pricePerGallon, setPricePerGallon] = useState('');
    // Optional second fuel for same stop (opposite of selected fuel type)
    const [includeSecondFuel, setIncludeSecondFuel] = useState(false);
    const [secondAmount, setSecondAmount] = useState('');
    const [secondCost, setSecondCost] = useState('');
    const [secondPricePerGallon, setSecondPricePerGallon] = useState('');

    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [previewObjectURL, setPreviewObjectURL] = useState<string | null>(null);
    const [saveState, setSaveState] = useState<SaveState>('idle');
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const clearForm = useCallback(() => {
        setTruckNumber('');
        setDateTime(new Date().toISOString().slice(0, 16));
        setOdometer('');
        setCity('');
        setState('');
        setFuelType('diesel');
        setCustomFuelType('');
        setAmount('');
        setCost('');
        setPricePerGallon('');
        setIncludeSecondFuel(false);
        setSecondAmount('');
        setSecondCost('');
        setSecondPricePerGallon('');
        setReceiptFile(null);
        setReceiptPreview(null);
        setScanError(null);
        if (previewObjectURL) {
            URL.revokeObjectURL(previewObjectURL);
            setPreviewObjectURL(null);
        }
        setEntryToEdit(null);
    }, [previewObjectURL, setEntryToEdit]);

    useEffect(() => {
        if (entryToEdit) {
            setTruckNumber(entryToEdit.truckNumber);
            setDateTime(new Date(entryToEdit.dateTime).toISOString().slice(0, 16));
            setOdometer(entryToEdit.odometer.toString());
            setCity(entryToEdit.city);
            setState(entryToEdit.state);
            setFuelType(entryToEdit.fuelType);
            setCustomFuelType(entryToEdit.customFuelType || '');
            setAmount(entryToEdit.amount.toString());
            setCost(entryToEdit.cost.toString());
            if (entryToEdit.amount > 0) {
                setPricePerGallon((entryToEdit.cost / entryToEdit.amount).toFixed(4));
            } else {
                setPricePerGallon('');
            }
            if (entryToEdit.receiptUrl) {
                setReceiptPreview(entryToEdit.receiptUrl);
            }
            // When editing an existing single entry, reset second fuel
            setIncludeSecondFuel(false);
            setSecondAmount('');
            setSecondCost('');
            setSecondPricePerGallon('');
        } else {
            clearForm();
        }
    }, [entryToEdit, clearForm]);

    useEffect(() => {
        return () => {
            if (previewObjectURL) URL.revokeObjectURL(previewObjectURL);
        }
    }, [previewObjectURL]);

    const handleFileSelect = useCallback(async (file: File | null) => {
        setReceiptFile(file);
        setScanError(null);
        if (previewObjectURL) {
            URL.revokeObjectURL(previewObjectURL);
            setPreviewObjectURL(null);
        }

        if (file) {
            const objectUrl = URL.createObjectURL(file);
            setPreviewObjectURL(objectUrl);
            setReceiptPreview(objectUrl);

            setIsScanning(true);
            try {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = async () => {
                    try {
                        const base64String = (reader.result as string).split(',')[1];
                        const mimeType = file.type;
                        const data = await apiService.scanReceipt(base64String, mimeType);
                        
                        const parsedOdometer = data.odometer;
                        if (parsedOdometer) setOdometer(parsedOdometer.toString());

                        // Map structured dual-fuel output if present
                        const dieselGallons = data.dieselGallons;
                        const dieselCost = data.dieselCost;
                        const defGallons = data.defGallons;
                        const defCost = data.defCost;

                        if (dieselGallons || dieselCost || defGallons || defCost) {
                            if (dieselGallons) setFuelType('diesel');
                            if (dieselGallons) setAmount(String(dieselGallons));
                            if (dieselCost) setCost(String(dieselCost));
                            if (dieselGallons && dieselCost) setPricePerGallon((Number(dieselCost) / Number(dieselGallons)).toFixed(4));

                            if (defGallons || defCost) {
                                setIncludeSecondFuel(true);
                                setSecondAmount(defGallons ? String(defGallons) : '');
                                setSecondCost(defCost ? String(defCost) : '');
                                if (defGallons && defCost) setSecondPricePerGallon((Number(defCost) / Number(defGallons)).toFixed(4));
                            }
                        } else {
                            // Backward compatibility
                            const parsedCost = data.cost;
                            const parsedAmount = data.amount;
                            if (parsedCost) setCost(parsedCost.toString());
                            if (parsedAmount) setAmount(parsedAmount.toString());
                            if (parsedCost && parsedAmount && parsedAmount > 0) {
                                setPricePerGallon((parsedCost / parsedAmount).toFixed(4));
                            }
                            if (data.fuelType) {
                                const ft = String(data.fuelType).toLowerCase();
                                if(ft.includes('diesel')) setFuelType('diesel');
                                else if(ft.includes('def')) setFuelType('def');
                                else {
                                    setFuelType('custom');
                                    setCustomFuelType(data.fuelType);
                                }
                            }
                        }

                        if (data.city) setCity(data.city);
                        if (data.state) setState(String(data.state).toUpperCase());
                        
                        // Handle date and time
                        if (data.date) {
                            let dateTimeString = data.date;
                            if (data.time) {
                                dateTimeString += 'T' + data.time;
                            } else {
                                dateTimeString += 'T12:00:00';
                            }
                            const parsedDate = new Date(dateTimeString + 'Z');
                            if (!isNaN(parsedDate.getTime())) {
                               const localDate = new Date(parsedDate.getTime() + parsedDate.getTimezoneOffset() * 60000);
                               setDateTime(localDate.toISOString().slice(0,16));
                            }
                        }
                        
                        showToast("Receipt auto-filled!", "success");
                    } catch (e: any) {
                         console.error("Scan failed:", e);
                         const errorMessage = e.message || 'Unknown error occurred';
                         setScanError(`Scan failed: ${errorMessage}. Please enter manually.`);
                         showToast("Receipt scanning failed. Please enter details manually.", "error");
                    } finally {
                        setIsScanning(false);
                    }
                };
            } catch (error: any) {
                 console.error("File Read failed:", error);
                 setScanError(`Failed to read file. Please try again.`);
                 setIsScanning(false);
            }
        } else {
             if (!entryToEdit?.receiptUrl) {
                setReceiptPreview(null);
            }
        }
    }, [previewObjectURL, showToast, entryToEdit]);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newAmount = e.target.value;
        setAmount(newAmount);
        const numAmount = parseFloat(newAmount);
        const numPrice = parseFloat(pricePerGallon);
        if (!isNaN(numAmount) && !isNaN(numPrice) && numAmount >= 0 && numPrice >= 0) {
            setCost((numAmount * numPrice).toFixed(2));
        }
    };
    
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPrice = e.target.value;
        setPricePerGallon(newPrice);
        const numAmount = parseFloat(amount);
        const numPrice = parseFloat(newPrice);
        if (!isNaN(numAmount) && !isNaN(numPrice) && numAmount >= 0 && numPrice >= 0) {
            setCost((numAmount * numPrice).toFixed(2));
        }
    };
    
    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newCost = e.target.value;
        setCost(newCost);
        const numAmount = parseFloat(amount);
        const numCost = parseFloat(newCost);
        if (!isNaN(numAmount) && !isNaN(numCost) && numAmount > 0) {
            setPricePerGallon((numCost / numAmount).toFixed(4));
        } else if (numAmount <= 0 && numCost > 0) {
            setPricePerGallon('');
        }
    };

    const handleSecondAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newAmount = e.target.value;
        setSecondAmount(newAmount);
        const numAmount = parseFloat(newAmount);
        const numPrice = parseFloat(secondPricePerGallon);
        if (!isNaN(numAmount) && !isNaN(numPrice) && numAmount >= 0 && numPrice >= 0) {
            setSecondCost((numAmount * numPrice).toFixed(2));
        }
    };

    const handleSecondPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPrice = e.target.value;
        setSecondPricePerGallon(newPrice);
        const numAmount = parseFloat(secondAmount);
        const numPrice = parseFloat(newPrice);
        if (!isNaN(numAmount) && !isNaN(numPrice) && numAmount >= 0 && numPrice >= 0) {
            setSecondCost((numAmount * numPrice).toFixed(2));
        }
    };

    const handleSecondCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newCost = e.target.value;
        setSecondCost(newCost);
        const numAmount = parseFloat(secondAmount);
        const numCost = parseFloat(newCost);
        if (!isNaN(numAmount) && !isNaN(numCost) && numAmount > 0) {
            setSecondPricePerGallon((numCost / numAmount).toFixed(4));
        } else if (numAmount <= 0 && numCost > 0) {
            setSecondPricePerGallon('');
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaveState('saving');
        
        let receiptUrl = entryToEdit?.receiptUrl || '';
        try {
            if (receiptFile) {
                setIsUploading(true);
                const { auth } = getFirebase();
                const uid = auth.currentUser?.uid;
                if (!uid) throw new Error('Not authenticated');
                receiptUrl = await uploadReceipt(uid, receiptFile);
            }
        } catch (e) {
            console.error('Receipt upload failed:', e);
        } finally {
            setIsUploading(false);
        }

        try {
            const odometerValue = parseFloat(odometer);
            const amountValue = parseFloat(amount);
            const costValue = parseFloat(cost);

            const primaryEntry = {
                truckNumber,
                dateTime,
                odometer: odometerValue || 0,
                city,
                state,
                fuelType,
                customFuelType: fuelType === 'custom' ? customFuelType : '',
                amount: amountValue || 0,
                cost: costValue || 0,
                receiptUrl,
                isIgnored: entryToEdit?.isIgnored || false,
            };

            const entriesToSave: Array<{ id?: string; data: any; isUpdate?: boolean }> = [];
            if (entryToEdit) {
                entriesToSave.push({ id: entryToEdit.id, data: primaryEntry, isUpdate: true });
            } else {
                entriesToSave.push({ data: primaryEntry });
            }

            // Optional second fuel entry (opposite type)
            if (includeSecondFuel) {
                const otherType: 'diesel' | 'def' = fuelType === 'diesel' ? 'def' : 'diesel';
                const secondAmountValue = parseFloat(secondAmount);
                const secondCostValue = parseFloat(secondCost);
                if (!isNaN(secondAmountValue) && !isNaN(secondCostValue) && (secondAmountValue > 0 || secondCostValue > 0)) {
                    const secondEntry = {
                        truckNumber,
                        dateTime,
                        odometer: odometerValue || 0,
                        city,
                        state,
                        fuelType: otherType,
                        customFuelType: '',
                        amount: secondAmountValue || 0,
                        cost: secondCostValue || 0,
                        receiptUrl,
                        isIgnored: false,
                    };
                    // Always create a new entry for the second fuel
                    entriesToSave.push({ data: secondEntry });
                }
            }

            for (const item of entriesToSave) {
                if (item.isUpdate && item.id) {
                    await apiService.updateEntry(item.id, item.data);
                } else {
                    await apiService.addEntry(item.data);
                }
            }

            showToast(entriesToSave.length > 1 ? 'Entries saved successfully!' : 'Entry saved successfully!', 'success');

            setSaveState('success');
            setTimeout(() => {
                clearForm();
                onSave();
                setSaveState('idle');
            }, 1200);

        } catch (error: any) {
            setSaveState('error');
            showToast(error.message || 'Save failed. Please check your connection.', 'error');
            setTimeout(() => setSaveState('idle'), 3000);
        }
    };
    
    const inputStyle = "mt-1 block w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text placeholder-light-text-secondary dark:placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent focus:border-light-accent dark:focus:border-dark-accent transition disabled:opacity-50";
    const labelStyle = "block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary";

    const stateOptions = statesAndProvinces.map(s => ({ value: s.code, label: `${s.name} (${s.code})` }));
    
    const renderSaveButtonContent = () => {
        switch (saveState) {
            case 'saving':
                return <><Spinner />Saving...</>;
            case 'success':
                return <><i className="fas fa-check-circle"></i>Saved!</>;
            case 'error':
                return <><i className="fas fa-exclamation-triangle"></i>Save Failed</>;
            default:
                return <><i className="fas fa-save"></i>{entryToEdit ? 'Save Changes' : 'Save Entry'}</>;
        }
    };
    
    const getSaveButtonClass = () => {
        switch (saveState) {
            case 'saving':
                return 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed';
            case 'success':
                return 'bg-green-600 dark:bg-green-500';
            case 'error':
                return 'bg-red-600 dark:bg-red-500';
            default:
                return 'bg-light-accent dark:bg-dark-accent hover:opacity-90';
        }
    };

    const secondFuelLabel = fuelType === 'diesel' ? 'DEF' : 'Diesel';

    return (
        <FormCard title={<><i className={`fas ${entryToEdit ? 'fa-edit' : 'fa-plus'} text-light-accent dark:text-dark-accent`}></i> {entryToEdit ? 'Edit Fuel Entry' : 'Add Fuel Entry'}</>}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <FileUpload 
                    onFileSelect={handleFileSelect}
                    receiptFile={receiptFile}
                    receiptPreview={receiptPreview}
                    isScanning={isScanning}
                    scanError={scanError}
                    clearFile={() => { 
                        setReceiptFile(null); 
                        setReceiptPreview(null); 
                        if (previewObjectURL) URL.revokeObjectURL(previewObjectURL);
                        setPreviewObjectURL(null);
                    }}
                />
                
                <div>
                    <label htmlFor="truckNumber" className={labelStyle}>Truck</label>
                    <select
                        id="truckNumber"
                        value={truckNumber}
                        onChange={e => setTruckNumber(e.target.value)}
                        required
                        className={inputStyle}
                    >
                        <option value="" disabled>Select a truck...</option>
                        {trucks.map(truck => (
                            <option key={truck.id} value={truck.number}>
                                {truck.makeModel} - #{truck.number}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="dateTime" className={labelStyle}>Date & Time</label>
                        <input type="datetime-local" id="dateTime" value={dateTime} onChange={e => setDateTime(e.target.value)} required className={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="odometer" className={labelStyle}>Odometer Reading</label>
                        <input type="number" id="odometer" value={odometer} onChange={e => setOdometer(e.target.value)} placeholder="e.g., 123456" required className={inputStyle} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label htmlFor="city" className={labelStyle}>City</label>
                        <input type="text" id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g., Phoenix" required className={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="state" className={labelStyle}>State/Province</label>
                        <Autocomplete id="state" value={state} onChange={setState} items={stateOptions} placeholder="Select state..." />
                    </div>
                </div>

                <div>
                    <label className={labelStyle}>Primary Fuel Type</label>
                    <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg bg-light-bg dark:bg-dark-bg p-1">
                        {(['diesel', 'def', 'custom'] as const).map(type => (
                            <button type="button" key={type} onClick={() => setFuelType(type)} className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors capitalize ${fuelType === type ? 'bg-light-accent dark:bg-dark-accent text-white shadow' : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>{type}</button>
                        ))}
                    </div>
                    {fuelType === 'custom' && (
                        <input type="text" value={customFuelType} onChange={e => setCustomFuelType(e.target.value)} placeholder="Enter custom fuel type" required className={`${inputStyle} mt-2`} />
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="amount" className={labelStyle}>Fuel amount (gallons)</label>
                        <input type="number" step="any" id="amount" value={amount} onChange={handleAmountChange} placeholder="e.g., 150.5" required className={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="pricePerGallon" className={labelStyle}>Price per gallon ($)</label>
                        <input type="number" step="any" id="pricePerGallon" value={pricePerGallon} onChange={handlePriceChange} placeholder="e.g., 3.999" required className={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="cost" className={labelStyle}>Total Cost ($)</label>
                        <input type="number" step="any" id="cost" value={cost} onChange={handleCostChange} placeholder="e.g., 601.75" required className={inputStyle} />
                    </div>
                </div>

                <div className="pt-2">
                    <label className={labelStyle}>Add {secondFuelLabel} for this stop?</label>
                    <div className="mt-2 flex items-center gap-3">
                        <input id="includeSecondFuel" type="checkbox" checked={includeSecondFuel} onChange={e => setIncludeSecondFuel(e.target.checked)} />
                        <label htmlFor="includeSecondFuel" className="text-sm">Include {secondFuelLabel} line item</label>
                    </div>
                </div>

                {includeSecondFuel && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className={labelStyle}>{secondFuelLabel} amount (gallons)</label>
                            <input type="number" step="any" value={secondAmount} onChange={handleSecondAmountChange} placeholder="e.g., 2.5" className={inputStyle} />
                        </div>
                        <div>
                            <label className={labelStyle}>{secondFuelLabel} price per gallon ($)</label>
                            <input type="number" step="any" value={secondPricePerGallon} onChange={handleSecondPriceChange} placeholder="e.g., 3.299" className={inputStyle} />
                        </div>
                        <div>
                            <label className={labelStyle}>{secondFuelLabel} total cost ($)</label>
                            <input type="number" step="any" value={secondCost} onChange={handleSecondCostChange} placeholder="e.g., 8.25" className={inputStyle} />
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-light-border dark:border-dark-border">
                     <button type="button" onClick={clearForm} className="px-6 py-3 rounded-lg font-semibold text-light-text-secondary dark:text-dark-text-secondary hover:bg-slate-200/50 dark:hover:bg-dark-border/50 transition-colors">Clear</button>
                    <button type="submit" disabled={saveState !== 'idle' || isScanning || isUploading} className={`px-8 py-3 rounded-lg font-semibold text-white transition-all flex items-center gap-2 disabled:cursor-not-allowed ${getSaveButtonClass()}`}>
                        {renderSaveButtonContent()}
                    </button>
                </div>
            </form>
        </FormCard>
    );
};

export default FuelEntryForm;
