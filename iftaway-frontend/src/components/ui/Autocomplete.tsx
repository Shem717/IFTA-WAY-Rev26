import React, { FC, useState, useEffect, useCallback, useRef } from 'react';

interface AutocompleteProps {
    id: string;
    value: string;
    onChange: (value: string) => void;
    items: { value: string; label: string }[];
    placeholder?: string;
    disabled?: boolean;
}

export const Autocomplete: FC<AutocompleteProps> = ({ id, value, onChange, items, placeholder, disabled }) => {
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<{ value: string; label: string }[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const selectedItem = items.find(item => item.value === value);
        setInputValue(selectedItem ? selectedItem.label : '');
    }, [value, items]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setInputValue(text);

        if (text) {
            const filteredSuggestions = items.filter(item =>
                item.label.toLowerCase().includes(text.toLowerCase())
            );
            setSuggestions(filteredSuggestions);
            setIsOpen(true);
        } else {
            setSuggestions([]);
            setIsOpen(false);
            onChange(''); 
        }
    };
    
    const handleSuggestionClick = (suggestion: { value: string; label: string }) => {
        onChange(suggestion.value);
        setInputValue(suggestion.label);
        setIsOpen(false);
        setSuggestions([]);
    };

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setIsOpen(false);
            const currentItem = items.find(item => item.label === inputValue);
            if (!currentItem) {
                const valueItem = items.find(item => item.value === value);
                setInputValue(valueItem ? valueItem.label : '');
                if (!valueItem) {
                    onChange('');
                }
            }
        }
    }, [value, inputValue, items, onChange]);
    
    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

    const inputStyles = "mt-1 block w-full px-3 py-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text placeholder-light-text-secondary dark:placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-light-accent dark:focus:ring-dark-accent focus:border-light-accent dark:focus:border-dark-accent transition disabled:bg-slate-200/50 dark:disabled:bg-slate-800/50 disabled:cursor-not-allowed";

    const suggestionListStyles = "absolute z-10 mt-1 w-full bg-light-card dark:bg-dark-card shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-light-border dark:ring-dark-border ring-opacity-5 overflow-auto focus:outline-none sm:text-sm";
    const suggestionItemStyles = "text-light-text dark:text-dark-text cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-light-accent/10 dark:hover:bg-dark-accent/10 hover:text-light-accent dark:hover:text-dark-accent";

    return (
        <div className="relative" ref={containerRef}>
            <input
                type="text"
                id={id}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={() => { if(!disabled) setIsOpen(true); }}
                placeholder={placeholder}
                required
                disabled={disabled}
                autoComplete="off"
                className={inputStyles}
            />
            {isOpen && suggestions.length > 0 && (
                <ul className={suggestionListStyles}>
                    {suggestions.map((suggestion, index) => (
                        <li
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className={suggestionItemStyles}
                        >
                            <span className="font-normal block truncate">{suggestion.label}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
