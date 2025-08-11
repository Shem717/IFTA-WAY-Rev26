import React, { FC, useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { FuelEntry, Theme } from '../types';
import { EntryCard } from '../components/EntryCard';
import { FormCard } from '../components/ui/FormCard';
import { Spinner } from '../components/ui/Spinner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardViewProps {
    onOpenActionSheet: (entry: FuelEntry) => void;
    showToast: (msg: string, type?: any) => void;
    theme: Theme;
    onDataChange: () => void;
}

const DashboardView: FC<DashboardViewProps> = ({ onOpenActionSheet, showToast, theme, onDataChange }) => {
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const data = await apiService.getDashboardStats();
                setDashboardData(data);
            } catch (error: any) {
                showToast(error.message || "Couldn't load dashboard data.", "error");
            } finally {
                setIsLoading(false);
            }
        };
        fetchDashboardData();
    }, [showToast, onDataChange]);

    const { currentMonthStats, prevMonthStats, monthlyCostData, recentEntries } = dashboardData || {
        currentMonthStats: { miles: 0, expenses: 0, mpg: 0 },
        prevMonthStats: { miles: 0, expenses: 0, mpg: 0 },
        monthlyCostData: [],
        recentEntries: [],
    };

    const renderTrend = (current: number, previous: number, type: 'miles' | 'expenses' | 'mpg') => {
        if (previous === 0) return null;
        const change = ((current - previous) / previous) * 100;
        if (isNaN(change) || !isFinite(change)) return null;
    
        const isPositive = change >= 0;
        const isGoodLogic = { miles: isPositive, expenses: !isPositive, mpg: isPositive };
        const isGood = isGoodLogic[type];
        
        const trendText = `${Math.abs(change).toFixed(0)}%`;
    
        return (
            <div className={`relative inline-flex items-center text-xs font-bold px-4 py-1.5 overflow-hidden rounded-md`}>
                <div className={`absolute inset-0 -skew-x-12 ${isGood ? 'bg-green-500/20' : 'bg-red-500/20'}`}></div>
                <div className={`relative flex items-center gap-1.5 ${isGood ? 'text-green-500' : 'text-red-500'}`}>
                    <i className={`fa-solid ${isPositive ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>
                    <span>{trendText}</span>
                </div>
            </div>
        );
    };

    const getDifferenceText = (current: number, previous: number, type: 'miles' | 'expenses' | 'mpg') => {
        if (previous === 0 || isNaN(current) || isNaN(previous) || !isFinite(current) || !isFinite(previous)) {
            return <span className="text-light-text-secondary dark:text-dark-text-secondary text-sm mt-1">No data for last month</span>;
        }
        const diff = current - previous;
        let formattedDiff: string;
        switch(type) {
            case 'expenses': formattedDiff = `$${Math.abs(diff).toFixed(2)}`; break;
            case 'mpg': formattedDiff = `${Math.abs(diff).toFixed(1)}`; break;
            default: formattedDiff = Math.abs(Math.round(diff)).toLocaleString();
        }
        return <p className="text-light-text-secondary dark:text-dark-text-secondary text-sm mt-1">{diff >= 0 ? '+' : '−'}{formattedDiff} from last month</p>;
    };

    if (isLoading || !dashboardData) {
        return <div className="flex justify-center items-center py-20"><Spinner className="w-10 h-10" /></div>;
    }

    const StatCard: FC<{ title: string; value: string; trend: React.ReactNode; diff: React.ReactNode }> = ({ title, value, trend, diff }) => (
        <div className="bg-light-card dark:bg-dark-card p-6 rounded-lg shadow-md border border-light-border dark:border-dark-border">
            <p className="text-light-text-secondary dark:text-dark-text-secondary font-medium">{title}</p>
            <div className="flex items-baseline gap-3 mt-2">
                <p className="text-4xl font-bold text-light-text dark:text-dark-text">{value}</p>
                {trend}
            </div>
            {diff}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <StatCard
                    title="Miles This Month"
                    value={currentMonthStats.miles.toLocaleString()}
                    trend={renderTrend(currentMonthStats.miles, prevMonthStats.miles, 'miles')}
                    diff={getDifferenceText(currentMonthStats.miles, prevMonthStats.miles, 'miles')}
                />
                <StatCard
                    title="Expenses This Month"
                    value={`$${currentMonthStats.expenses.toFixed(2)}`}
                    trend={renderTrend(currentMonthStats.expenses, prevMonthStats.expenses, 'expenses')}
                    diff={getDifferenceText(currentMonthStats.expenses, prevMonthStats.expenses, 'expenses')}
                />
                <StatCard
                    title="Average MPG This Month"
                    value={currentMonthStats.mpg.toFixed(1)}
                    trend={renderTrend(currentMonthStats.mpg, prevMonthStats.mpg, 'mpg')}
                    diff={getDifferenceText(currentMonthStats.mpg, prevMonthStats.mpg, 'mpg')}
                />
            </div>
            <FormCard title={<><i className="fas fa-history text-light-accent dark:text-dark-accent"></i> Recent Entries</>}>
                <div className="space-y-4">
                    {recentEntries.map((entry: FuelEntry) => <EntryCard key={entry.id} entry={entry} onOpenActionSheet={onOpenActionSheet} />)}
                    {recentEntries.length === 0 && <p className="text-center text-light-text-secondary dark:text-dark-text-secondary py-4">No entries yet. Add one to get started!</p>}
                </div>
            </FormCard>
            <FormCard title={<><i className="fas fa-chart-area text-light-accent dark:text-dark-accent"></i> Monthly Fuel Cost</>}>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyCostData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={theme === 'dark' ? '#22d3ee' : '#2563eb'} stopOpacity={0.4}/>
                                <stop offset="95%" stopColor={theme === 'dark' ? '#22d3ee' : '#2563eb'} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "rgba(148, 163, 184, 0.1)" : "rgba(100, 116, 139, 0.1)"} />
                        <XAxis dataKey="name" tick={{fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12}} axisLine={{stroke: theme === 'dark' ? '#334155' : '#cbd5e1'}} tickLine={{stroke: theme === 'dark' ? '#334155' : '#cbd5e1'}} />
                        <YAxis tick={{fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12}} tickFormatter={(value: number) => `$${value}`} axisLine={{stroke: theme === 'dark' ? '#334155' : '#cbd5e1'}} tickLine={{stroke: theme === 'dark' ? '#334155' : '#cbd5e1'}}/>
                        <Tooltip 
                            cursor={{fill: theme === 'dark' ? 'rgba(34, 211, 238, 0.1)' : 'rgba(37, 99, 235, 0.1)'}} 
                            contentStyle={{
                                background: theme === 'dark' ? '#2A2F45' : '#FFFFFF',
                                border: '1px solid',
                                borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                                borderRadius: '0.5rem',
                                color: theme === 'dark' ? '#f1f5f9' : '#1e293b'
                            }}
                            formatter={(value: number) => [`$${typeof value === 'number' ? value.toFixed(2) : '0.00'}`, 'Cost']}
                            labelFormatter={(label: string) => `Month: ${label}`}
                        />
                        <Area type="monotone" dataKey="cost" stroke={theme === 'dark' ? '#22d3ee' : '#2563eb'} fillOpacity={1} fill="url(#colorCost)" />
                    </AreaChart>
                </ResponsiveContainer>
            </FormCard>
        </div>
    );
};

export default DashboardView;
