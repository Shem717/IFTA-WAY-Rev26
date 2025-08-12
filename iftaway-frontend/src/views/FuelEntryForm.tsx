import React, { FC, useEffect, useCallback, useReducer } from 'react';
import apiService from '../services/apiService';
import { getFirebase } from '../lib/firebase';
import { uploadReceipt } from '../services/storageService';
import { FuelEntry, Truck, SaveState } from '../types';
import { statesAndProvinces } from '../utils/constants';
import { FormCard } from '../components/ui/FormCard';
import { Autocomplete } from '../components/ui/Autocomplete';
import { Spinner } from '../components/ui/Spinner';
import { FileUpload } from '../components/FileUpload';
import { useReceiptScanner } from '../hooks/useReceiptScanner';

// --- State, Reducer, and Initial State ---

type FormState = {
    truckNumber: string;
    dateTime: string;
    odometer: string;
    city: string;
    state: string;
    fuelType: 'diesel' | 'def' | 'custom';
    customFuelType: string;
    amount: string;
    cost: string;
    pricePerGallon: string;
    includeSecondFuel: boolean;
    secondAmount: string;
    secondCost: string;
    secondPricePerGallon: string;
    receiptFile: File | null;
    receiptPreview: string | null;
    previewObjectURL: string | null;
    saveState: SaveState;
    isUploading: boolean;
};

const getInitialState = (): FormState => ({
    truckNumber: '',
    dateTime: new Date().toISOString().slice(0, 16),
    odometer: '',
    city: '',
    state: '',
    fuelType: 'diesel',
    customFuelType: '',
    amount: '',
    cost: '',
    pricePerGallon: '',
    includeSecondFuel: false,
    secondAmount: '',
    secondCost: '',
    secondPricePerGallon: '',
    receiptFile: null,
    receiptPreview: null,
    previewObjectURL: null,
    saveState: 'idle',
    isUploading: false,
});

type FormAction =
    | { type: 'SET_FIELD'; field: keyof FormState; payload: any }
    | { type: 'SET_FROM_ENTRY'; payload: FuelEntry }
    | { type: 'APPLY_SCAN_RESULTS'; payload: any }
    | { type: 'CLEAR_FORM' }
    | { type: 'SET_SAVE_STATE'; payload: SaveState }
    | { type: 'SET_UPLOAD_STATE'; payload: boolean }
    | { type: 'SET_FILE'; payload: { file: File | null, preview: string | null, objectURL: string | null } };

const formReducer = (state: FormState, action: FormAction): FormState => {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.field]: action.payload };
        case 'SET_FROM_ENTRY':
            const entry = action.payload;
            return {
                ...getInitialState(),
                truckNumber: entry.truckNumber,
                dateTime: new Date(entry.dateTime).toISOString().slice(0, 16),
                odometer: entry.odometer.toString(),
                city: entry.city,
                state: entry.state,
                fuelType: entry.fuelType,
                customFuelType: entry.customFuelType || '',
                amount: entry.amount.toString(),
                cost: entry.cost.toString(),
                pricePerGallon: entry.amount > 0 ? (entry.cost / entry.amount).toFixed(4) : '',
                receiptPreview: entry.receiptUrl || null,
            };
        case 'APPLY_SCAN_RESULTS':
            const data = action.payload;
            const updates: Partial<FormState> = {};
            if (data.odometer) updates.odometer = data.odometer.toString();
            if (data.city) updates.city = data.city;
            if (data.state) updates.state = String(data.state).toUpperCase();
            if (data.dieselGallons || data.dieselCost || data.defGallons || data.defCost) {
                if (data.dieselGallons) {
                    updates.fuelType = 'diesel';
                    updates.amount = String(data.dieselGallons);
                    if (data.dieselCost) updates.pricePerGallon = (Number(data.dieselCost) / Number(data.dieselGallons)).toFixed(4);
                }
                if (data.dieselCost) updates.cost = String(data.dieselCost);
                if (data.defGallons || data.defCost) {
                    updates.includeSecondFuel = true;
                    if(data.defGallons) updates.secondAmount = String(data.defGallons);
                    if(data.defCost) updates.secondCost = String(data.defCost);
                    if (data.defGallons && data.defCost) updates.secondPricePerGallon = (Number(data.defCost) / Number(data.defGallons)).toFixed(4);
                }
            } else {
                if (data.cost) updates.cost = data.cost.toString();
                if (data.amount) updates.amount = data.amount.toString();
                if (data.cost && data.amount && data.amount > 0) updates.pricePerGallon = (data.cost / data.amount).toFixed(4);
            }
             if (data.date) {
                let dateTimeString = data.date;
                if (data.time) dateTimeString += 'T' + data.time; else dateTimeString += 'T12:00:00';
                const parsedDate = new Date(dateTimeString + 'Z');
                if (!isNaN(parsedDate.getTime())) {
                   const localDate = new Date(parsedDate.getTime() + parsedDate.getTimezoneOffset() * 60000);
                   updates.dateTime = localDate.toISOString().slice(0,16);
                }
            }
            return { ...state, ...updates };
        case 'CLEAR_FORM':
            if (state.previewObjectURL) URL.revokeObjectURL(state.previewObjectURL);
            return getInitialState();
        case 'SET_SAVE_STATE':
            return { ...state, saveState: action.payload };
        case 'SET_UPLOAD_STATE':
            return { ...state, isUploading: action.payload };
        case 'SET_FILE':
            if (state.previewObjectURL) URL.revokeObjectURL(state.previewObjectURL);
            return { ...state, receiptFile: action.payload.file, receiptPreview: action.payload.preview, previewObjectURL: action.payload.objectURL };
        default:
            return state;
    }
};

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
    const [state, dispatch] = useReducer(formReducer, getInitialState());
    const {
        truckNumber, dateTime, odometer, city, state: jurisdiction, fuelType, customFuelType,
        amount, cost, pricePerGallon, includeSecondFuel, secondAmount, secondCost,
        secondPricePerGallon, receiptFile, receiptPreview, saveState,
        isUploading
    } = state;

    const onScanSuccess = useCallback((data: any) => {
        dispatch({ type: 'APPLY_SCAN_RESULTS', payload: data });
        showToast("Receipt auto-filled!", "success");
    }, [showToast]);

    const onScanError = useCallback((error: string) => {
        showToast(`Scan failed: ${error}`, "error");
    }, [showToast]);

    const { scanState, scanError, scanReceipt } = useReceiptScanner(onScanSuccess, onScanError);

    const clearForm = useCallback(() => {
        dispatch({ type: 'CLEAR_FORM' });
        setEntryToEdit(null);
    }, [setEntryToEdit]);

    useEffect(() => {
        if (entryToEdit) {
            dispatch({ type: 'SET_FROM_ENTRY', payload: entryToEdit });
        } else {
            dispatch({ type: 'CLEAR_FORM' });
        }
    }, [entryToEdit]);

    useEffect(() => {
        const objectURL = state.previewObjectURL;
        return () => {
            if (objectURL) URL.revokeObjectURL(objectURL);
        }
    }, [state.previewObjectURL]);

    const handleFileSelect = useCallback((file: File | null) => {
        if (!file) {
            dispatch({ type: 'SET_FILE', payload: { file: null, preview: entryToEdit?.receiptUrl || null, objectURL: null } });
            return;
        }
        const objectUrl = URL.createObjectURL(file);
        dispatch({ type: 'SET_FILE', payload: { file, preview: objectUrl, objectURL: objectUrl } });
        scanReceipt(file);
    }, [entryToEdit, scanReceipt]);
    
    const handlePriceCostChange = (field: 'amount' | 'cost' | 'pricePerGallon', value: string, isSecond: boolean) => {
        const targetPrefix = isSecond ? 'second' : '';
        const updates: Partial<FormState> = { [`${targetPrefix}${field.charAt(0).toUpperCase() + field.slice(1)}`]: value };

        let numAmount = parseFloat(isSecond ? secondAmount : amount);
        let numCost = parseFloat(isSecond ? secondCost : cost);
        let numPrice = parseFloat(isSecond ? secondPricePerGallon : pricePerGallon);

        if (field === 'amount') numAmount = parseFloat(value);
        if (field === 'cost') numCost = parseFloat(value);
        if (field === 'pricePerGallon') numPrice = parseFloat(value);

        if (!isNaN(numAmount) && !isNaN(numPrice)) {
            updates[isSecond ? 'secondCost' : 'cost'] = (numAmount * numPrice).toFixed(2);
        } else if (!isNaN(numAmount) && !isNaN(numCost) && numAmount > 0) {
            updates[isSecond ? 'secondPricePerGallon' : 'pricePerGallon'] = (numCost / numAmount).toFixed(4);
        }
        dispatch({ type: 'SET_FIELD', field: Object.keys(updates)[0] as keyof FormState, payload: Object.values(updates)[0] });
        if(Object.keys(updates).length > 1) {
            dispatch({ type: 'SET_FIELD', field: Object.keys(updates)[1] as keyof FormState, payload: Object.values(updates)[1] });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        dispatch({ type: 'SET_SAVE_STATE', payload: 'saving' });
        
        let receiptUrl = entryToEdit?.receiptUrl || '';
        if (receiptFile) {
            dispatch({ type: 'SET_UPLOAD_STATE', payload: true });
            try {
                const { auth } = getFirebase();
                const uid = auth.currentUser?.uid;
                if (!uid) throw new Error('Not authenticated');
                receiptUrl = await uploadReceipt(uid, receiptFile);
            } catch (e) {
                console.error('Receipt upload failed:', e);
            } finally {
                dispatch({ type: 'SET_UPLOAD_STATE', payload: false });
            }
        }

        try {
            const primaryEntry = {
                truckNumber, dateTime, receiptUrl,
                odometer: parseFloat(odometer) || 0,
                city, state: jurisdiction, fuelType,
                customFuelType: fuelType === 'custom' ? customFuelType : '',
                amount: parseFloat(amount) || 0,
                cost: parseFloat(cost) || 0,
                isIgnored: entryToEdit?.isIgnored || false,
            };

            const entriesToSave: any[] = [];
            if (entryToEdit) await apiService.updateEntry(entryToEdit.id, primaryEntry);
            else entriesToSave.push(primaryEntry);

            if (includeSecondFuel) {
                const secondAmountValue = parseFloat(secondAmount);
                const secondCostValue = parseFloat(secondCost);
                if (!isNaN(secondAmountValue) && !isNaN(secondCostValue) && (secondAmountValue > 0 || secondCostValue > 0)) {
                    entriesToSave.push({
                        ...primaryEntry,
                        fuelType: fuelType === 'diesel' ? 'def' : 'diesel',
                        customFuelType: '',
                        amount: secondAmountValue,
                        cost: secondCostValue,
                    });
                }
            }

            await Promise.all(entriesToSave.map(entry => apiService.addEntry(entry)));

            showToast(entriesToSave.length > 1 ? 'Entries saved successfully!' : 'Entry saved successfully!', 'success');
            dispatch({ type: 'SET_SAVE_STATE', payload: 'success' });
            setTimeout(() => {
                clearForm();
                onSave();
            }, 1200);

        } catch (error: any) {
            dispatch({ type: 'SET_SAVE_STATE', payload: 'error' });
            showToast(error.message || 'Save failed. Please check your connection.', 'error');
            setTimeout(() => dispatch({ type: 'SET_SAVE_STATE', payload: 'idle' }), 3000);
        }
    };
    
    const inputStyle = "mt-1 block w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text placeholder-light-text-secondary dark:placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent focus:border-light-accent dark:focus:border-dark-accent transition disabled:opacity-50";
    const labelStyle = "block text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary";
    const stateOptions = statesAndProvinces.map(s => ({ value: s.code, label: `${s.name} (${s.code})` }));
    const secondFuelLabel = fuelType === 'diesel' ? 'DEF' : 'Diesel';
    
    const renderSaveButtonContent = () => {
        switch (saveState) {
            case 'saving': return <><Spinner />Saving...</>;
            case 'success': return <><i className="fas fa-check-circle"></i>Saved!</>;
            case 'error': return <><i className="fas fa-exclamation-triangle"></i>Save Failed</>;
            default: return <><i className="fas fa-save"></i>{entryToEdit ? 'Save Changes' : 'Save Entry'}</>;
        }
    };
    
    const getSaveButtonClass = () => {
        switch (saveState) {
            case 'saving': return 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed';
            case 'success': return 'bg-green-600 dark:bg-green-500';
            case 'error': return 'bg-red-600 dark:bg-red-500';
            default: return 'bg-light-accent dark:bg-dark-accent hover:opacity-90';
        }
    };

    return (
        <FormCard title={<><i className={`fas ${entryToEdit ? 'fa-edit' : 'fa-plus'} text-light-accent dark:text-dark-accent`}></i> {entryToEdit ? 'Edit Fuel Entry' : 'Add Fuel Entry'}</>}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <FileUpload onFileSelect={handleFileSelect} receiptFile={receiptFile} receiptPreview={receiptPreview} isScanning={isScanning} scanError={scanError} clearFile={() => dispatch({ type: 'SET_FILE', payload: { file: null, preview: null, objectURL: null } })} />
                
                <div>
                    <label htmlFor="truckNumber" className={labelStyle}>Truck</label>
                    <select id="truckNumber" value={truckNumber} onChange={e => dispatch({ type: 'SET_FIELD', field: 'truckNumber', payload: e.target.value })} required className={inputStyle}>
                        <option value="" disabled>Select a truck...</option>
                        {trucks.map(truck => <option key={truck.id} value={truck.number}>{truck.makeModel} - #{truck.number}</option>)}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="dateTime" className={labelStyle}>Date & Time</label>
                        <input type="datetime-local" id="dateTime" value={dateTime} onChange={e => dispatch({ type: 'SET_FIELD', field: 'dateTime', payload: e.target.value })} required className={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="odometer" className={labelStyle}>Odometer Reading</label>
                        <input type="number" id="odometer" value={odometer} onChange={e => dispatch({ type: 'SET_FIELD', field: 'odometer', payload: e.target.value })} placeholder="e.g., 123456" required className={inputStyle} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label htmlFor="city" className={labelStyle}>City</label>
                        <input type="text" id="city" value={city} onChange={e => dispatch({ type: 'SET_FIELD', field: 'city', payload: e.target.value })} placeholder="e.g., Phoenix" required className={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="state" className={labelStyle}>State/Province</label>
                        <Autocomplete id="state" value={jurisdiction} onChange={(val) => dispatch({ type: 'SET_FIELD', field: 'state', payload: val })} items={stateOptions} placeholder="Select state..." />
                    </div>
                </div>

                <div>
                    <label className={labelStyle}>Primary Fuel Type</label>
                    <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg bg-light-bg dark:bg-dark-bg p-1">
                        {(['diesel', 'def', 'custom'] as const).map(type => (
                            <button type="button" key={type} onClick={() => dispatch({ type: 'SET_FIELD', field: 'fuelType', payload: type })} className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors capitalize ${fuelType === type ? 'bg-light-accent dark:bg-dark-accent text-white shadow' : 'hover:bg-slate-200/50 dark:hover:bg-slate-700/50'}`}>{type}</button>
                        ))}
                    </div>
                    {fuelType === 'custom' && (
                        <input type="text" value={customFuelType} onChange={e => dispatch({ type: 'SET_FIELD', field: 'customFuelType', payload: e.target.value })} placeholder="Enter custom fuel type" required className={`${inputStyle} mt-2`} />
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label htmlFor="amount" className={labelStyle}>Fuel amount (gallons)</label>
                        <input type="number" step="any" id="amount" value={amount} onChange={e => handlePriceCostChange('amount', e.target.value, false)} placeholder="e.g., 150.5" required className={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="pricePerGallon" className={labelStyle}>Price per gallon ($)</label>
                        <input type="number" step="any" id="pricePerGallon" value={pricePerGallon} onChange={e => handlePriceCostChange('pricePerGallon', e.target.value, false)} placeholder="e.g., 3.999" required className={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="cost" className={labelStyle}>Total Cost ($)</label>
                        <input type="number" step="any" id="cost" value={cost} onChange={e => handlePriceCostChange('cost', e.target.value, false)} placeholder="e.g., 601.75" required className={inputStyle} />
                    </div>
                </div>

                <div className="pt-2">
                    <label className={labelStyle}>Add {secondFuelLabel} for this stop?</label>
                    <div className="mt-2 flex items-center gap-3">
                        <input id="includeSecondFuel" type="checkbox" checked={includeSecondFuel} onChange={e => dispatch({ type: 'SET_FIELD', field: 'includeSecondFuel', payload: e.target.checked })} />
                        <label htmlFor="includeSecondFuel" className="text-sm">Include {secondFuelLabel} line item</label>
                    </div>
                </div>

                {includeSecondFuel && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className={labelStyle}>{secondFuelLabel} amount (gallons)</label>
                            <input type="number" step="any" value={secondAmount} onChange={e => handlePriceCostChange('amount', e.target.value, true)} placeholder="e.g., 2.5" className={inputStyle} />
                        </div>
                        <div>
                            <label className={labelStyle}>{secondFuelLabel} price per gallon ($)</label>
                            <input type="number" step="any" value={secondPricePerGallon} onChange={e => handlePriceCostChange('pricePerGallon', e.target.value, true)} placeholder="e.g., 3.299" className={inputStyle} />
                        </div>
                        <div>
                            <label className={labelStyle}>{secondFuelLabel} total cost ($)</label>
                            <input type="number" step="any" value={secondCost} onChange={e => handlePriceCostChange('cost', e.target.value, true)} placeholder="e.g., 8.25" className={inputStyle} />
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
