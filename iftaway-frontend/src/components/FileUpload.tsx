import React, { FC, useState, useRef } from 'react';
import { Spinner } from './ui/Spinner';

interface FileUploadProps {
    onFileSelect: (file: File | null) => void;
    receiptFile: File | null;
    receiptPreview: string | null;
    isScanning: boolean;
    scanError: string | null;
    clearFile: () => void;
}

export const FileUpload: FC<FileUploadProps> = ({ onFileSelect, receiptFile, receiptPreview, isScanning, scanError, clearFile }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (files: FileList | null) => {
        if (files && files.length > 0) {
            const file = files[0];
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert("File is too large. Max size is 10MB.");
                return;
            }
            onFileSelect(file);
        } else {
            onFileSelect(null);
        }
    };
    
    const onDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileChange(e.dataTransfer.files);
    };
    
    const isPdf = receiptFile?.type === 'application/pdf' || (receiptPreview && receiptPreview.toLowerCase().includes('.pdf'));

    return (
        <div className="text-center">
            <input type="file" ref={fileInputRef} onChange={e => handleFileChange(e.target.files)} accept="image/png,image/jpeg,application/pdf" className="hidden" />
            
            {receiptPreview ? (
                <div className="relative group">
                    {isPdf ? (
                        <div className="h-48 w-full rounded-lg bg-light-bg dark:bg-dark-bg border-2 border-dashed border-light-border dark:border-dark-border flex flex-col items-center justify-center text-light-text-secondary dark:text-dark-text-secondary">
                           <i className="fas fa-file-pdf text-5xl text-red-500"></i>
                           <p className="mt-2 font-semibold">PDF Receipt Uploaded</p>
                           <a href={receiptPreview} target="_blank" rel="noopener noreferrer" className="text-sm text-light-accent dark:text-dark-accent hover:underline mt-1">View PDF</a>
                        </div>
                    ) : (
                        <div className="relative">
                            <img src={receiptPreview} alt="Receipt Preview" className="h-48 w-full object-contain rounded-lg bg-light-bg dark:bg-dark-bg p-2" />
                            <button 
                                type="button" 
                                onClick={() => window.open(receiptPreview, '_blank')}
                                className="absolute top-2 right-2 bg-black/70 text-white p-2 rounded-full hover:bg-black/90 transition-colors"
                                title="View Full Size"
                            >
                                <i className="fas fa-expand-arrows-alt"></i>
                            </button>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="text-white bg-slate-800/80 px-4 py-2 rounded-lg hover:bg-slate-700/80 mx-1"><i className="fas fa-exchange-alt mr-2"></i>Change</button>
                        <button type="button" onClick={clearFile} className="text-white bg-red-600/80 px-4 py-2 rounded-lg hover:bg-red-500/80 mx-1"><i className="fas fa-trash mr-2"></i>Remove</button>
                    </div>
                    {isScanning && (
                         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
                            <Spinner className="w-8 h-8"/>
                            <p className="text-white mt-3 font-semibold">Scanning Receipt...</p>
                        </div>
                    )}
                </div>
            ) : (
                 <div 
                    className={`h-48 w-full rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging ? 'border-light-accent dark:border-dark-accent bg-light-accent/10 dark:bg-dark-accent/10' : 'border-light-border dark:border-dark-border hover:border-light-accent/50 dark:hover:border-dark-accent/50'}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragOver={onDragOver} onDrop={onDrop}
                >
                    <i className="fas fa-cloud-upload-alt text-4xl text-light-text-secondary dark:text-dark-text-secondary"></i>
                    <p className="mt-3 font-semibold text-light-text dark:text-dark-text">Click to upload or drag and drop</p>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">PNG, JPG, or PDF (MAX. 10MB)</p>
                </div>
            )}
             {scanError && <p className="text-red-500 text-sm mt-2 text-center">{scanError}</p>}
        </div>
    );
};
