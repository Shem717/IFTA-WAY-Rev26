import { FuelEntry } from '../types';

type DemoEntry = Omit<FuelEntry, 'id' | 'userId' | 'createdAt' | 'lastEditedAt'>

export const generateDemoEntries = (userId: string): Omit<FuelEntry, 'id'>[] => {
    const entries: Omit<FuelEntry, 'id'>[] = [];
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1); // Jan 1
    const endDate = new Date(currentYear, 2, 31); // Mar 31

    const trucks = [
        { number: '01', initialOdometer: 100000 },
        { number: '02', initialOdometer: 200000 }
    ];

    const westernStates = [
        { state: 'WA', cities: ['Seattle', 'Spokane', 'Tacoma'] },
        { state: 'OR', cities: ['Portland', 'Eugene', 'Salem'] },
        { state: 'CA', cities: ['Los Angeles', 'Sacramento', 'Oakland', 'San Diego', 'Fresno'] },
        { state: 'NV', cities: ['Las Vegas', 'Reno', 'Henderson'] },
        { state: 'ID', cities: ['Boise', 'Idaho Falls', 'Nampa'] },
        { state: 'MT', cities: ['Billings', 'Missoula', 'Bozeman'] },
        { state: 'WY', cities: ['Cheyenne', 'Casper', 'Laramie'] },
        { state: 'CO', cities: ['Denver', 'Grand Junction', 'Colorado Springs'] },
        { state: 'UT', cities: ['Salt Lake City', 'St. George', 'Provo'] },
        { state: 'AZ', cities: ['Phoenix', 'Tucson', 'Mesa'] },
        { state: 'NM', cities: ['Albuquerque', 'Santa Fe', 'Las Cruces'] }
    ];

    let highCostAnomalyAdded = false;
    let lateNightAnomalyAdded = false;

    trucks.forEach(truck => {
        let currentDate = new Date(startDate.getTime());
        let currentOdometer = truck.initialOdometer;
        let dieselFillCount = 0;

        while(currentDate <= endDate) {
            const daysToAdd = Math.floor(Math.random() * 2) + 2; // 2-3 days
            currentDate.setDate(currentDate.getDate() + daysToAdd);
            if (currentDate > endDate) break;

            const milesDriven = (2500 / 7) * daysToAdd + (Math.random() - 0.5) * 200;
            currentOdometer += milesDriven;

            const location = westernStates[Math.floor(Math.random() * westernStates.length)];
            const city = location.cities[Math.floor(Math.random() * location.cities.length)];

            const isDEF = dieselFillCount > 0 && dieselFillCount % (Math.floor(Math.random() * 2) + 4) === 0;
            
            let fuelInfo: { fuelType: 'diesel' | 'def', amount: number, cost: number };
            const randomHour = Math.floor(Math.random() * 12) + 8; // 8am to 8pm
            const randomMinute = Math.floor(Math.random() * 60);
            currentDate.setHours(randomHour, randomMinute);

            if(isDEF) {
                 const amount = parseFloat((5 + Math.random() * 5).toFixed(2));
                 const cost = parseFloat((amount * (3.00 + Math.random())).toFixed(2));
                 fuelInfo = { fuelType: 'def', amount, cost };
            } else {
                 dieselFillCount++;
                 const amount = parseFloat((120 + Math.random() * 30).toFixed(2));
                 const cost = parseFloat((amount * (3.50 + Math.random() * 2)).toFixed(2));
                 fuelInfo = { fuelType: 'diesel', amount, cost };
            }

            const finalEntry: Omit<FuelEntry, 'id'> = {
                userId: userId,
                truckNumber: truck.number,
                dateTime: new Date(currentDate).toISOString().slice(0, 16),
                odometer: Math.round(currentOdometer),
                city,
                state: location.state,
                fuelType: fuelInfo.fuelType,
                customFuelType: '',
                amount: fuelInfo.amount,
                cost: fuelInfo.cost,
                receiptUrl: '',
                isIgnored: false,
                isDemo: true,
                createdAt: new Date().toISOString(),
                lastEditedAt: new Date().toISOString()
            };

            if (truck.number === '01' && !highCostAnomalyAdded && currentDate.getMonth() === 1) { // Feb for truck 1
                finalEntry.cost = parseFloat((900 + Math.random() * 50).toFixed(2));
                finalEntry.amount = 155.55;
                highCostAnomalyAdded = true;
            }

            if (truck.number === '02' && !lateNightAnomalyAdded && currentDate.getMonth() === 2) { // Mar for truck 2
                currentDate.setHours(3, randomMinute);
                finalEntry.dateTime = new Date(currentDate).toISOString().slice(0, 16);
                lateNightAnomalyAdded = true;
            }

            entries.push(finalEntry);
        }
    });

    return entries;
}

export const convertEntriesToCsv = (entries: DemoEntry[]): string => {
    const headers = ['truckNumber', 'dateTime', 'odometer', 'city', 'state', 'fuelType', 'customFuelType', 'amount', 'cost'];
    const csvRows = [headers.join(',')];

    for (const entry of entries) {
        const row = headers.map(header => {
            const value = entry[header as keyof DemoEntry];
            return String(value ?? '');
        });
        csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
}
