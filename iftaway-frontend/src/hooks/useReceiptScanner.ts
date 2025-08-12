import { useState, useCallback, useRef } from 'react';
import apiService from '../services/apiService';

type ScanState = 'idle' | 'loading' | 'success' | 'error';

export const useReceiptScanner = (
    onScanSuccess: (data: any) => void,
    onScanError: (error: string) => void
) => {
    const [scanState, setScanState] = useState<ScanState>('idle');
    const [scanError, setScanError] = useState<string | null>(null);
    const currentScanRef = useRef<number>(0);

    const scanReceipt = useCallback(async (file: File) => {
        setScanState('loading');
        setScanError(null);

        const scanId = Date.now();
        currentScanRef.current = scanId;

        let workingFile = file;

        // Handle HEIC/HEIF conversion
        if (/(image\/heic|image\/heif)/i.test(file.type)) {
            try {
                const heic2any = (await import('heic2any')).default;
                const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
                const convertedBlob: Blob = Array.isArray(converted) ? converted[0] : converted;
                workingFile = new File([convertedBlob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: 'image/jpeg' });
            } catch (e) {
                console.error("HEIC conversion failed", e);
                // Continue with the original file, the backend might handle it.
            }
        }

        if (currentScanRef.current !== scanId) return; // A new scan was initiated

        try {
            const reader = new FileReader();
            reader.readAsDataURL(workingFile);
            reader.onloadend = async () => {
                if (currentScanRef.current !== scanId) return;

                try {
                    const base64String = (reader.result as string).split(',')[1];
                    const data = await apiService.scanReceipt(base64String, workingFile.type);

                    if (currentScanRef.current === scanId) {
                        onScanSuccess(data);
                        setScanState('success');
                    }
                } catch (e: any) {
                    if (currentScanRef.current === scanId) {
                        const errorMessage = e.message || 'Unknown error during scan.';
                        setScanError(errorMessage);
                        onScanError(errorMessage);
                        setScanState('error');
                    }
                }
            };
            reader.onerror = () => {
                if (currentScanRef.current === scanId) {
                    const errorMessage = 'Failed to read file.';
                    setScanError(errorMessage);
                    onScanError(errorMessage);
                    setScanState('error');
                }
            };
        } catch (e: any) {
             if (currentScanRef.current === scanId) {
                const errorMessage = 'An unexpected error occurred.';
                setScanError(errorMessage);
                onScanError(errorMessage);
                setScanState('error');
            }
        }
    }, [onScanSuccess, onScanError]);

    return { scanState, scanError, scanReceipt };
};
