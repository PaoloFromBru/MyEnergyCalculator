'use client';

import { useState, useMemo, FC, Fragment } from 'react';

// --- Type Definitions ---
interface CountryData {
  name: string;
  price: number; // in EUR per kWh
  emissionFactor: number; // in kg CO2e per kWh
}

interface ConsumptionUnit {
  value: string;
  label: string;
  base: number;
  prompt: string | null; // Prompt for the usage input field
}

interface HelpContent {
    [key: string]: {
        title: string;
        example: string;
    }
}

// --- Mock Data ---
const countryData: CountryData[] = [
  { name: 'Austria', price: 0.22, emissionFactor: 0.11 },
  { name: 'Belgium', price: 0.27, emissionFactor: 0.16 },
  { name: 'Bulgaria', price: 0.10, emissionFactor: 0.45 },
  { name: 'Croatia', price: 0.13, emissionFactor: 0.13 },
  { name: 'Cyprus', price: 0.23, emissionFactor: 0.65 },
  { name: 'Czechia', price: 0.21, emissionFactor: 0.42 },
  { name: 'Denmark', price: 0.34, emissionFactor: 0.12 },
  { name: 'Estonia', price: 0.15, emissionFactor: 0.68 },
  { name: 'Finland', price: 0.18, emissionFactor: 0.07 },
  { name: 'France', price: 0.20, emissionFactor: 0.05 },
  { name: 'Germany', price: 0.32, emissionFactor: 0.36 },
  { name: 'Greece', price: 0.19, emissionFactor: 0.55 },
  { name: 'Hungary', price: 0.11, emissionFactor: 0.25 },
  { name: 'Ireland', price: 0.26, emissionFactor: 0.29 },
  { name: 'Italy', price: 0.28, emissionFactor: 0.24 },
  { name: 'Latvia', price: 0.16, emissionFactor: 0.11 },
  { name: 'Lithuania', price: 0.14, emissionFactor: 0.02 },
  { name: 'Luxembourg', price: 0.19, emissionFactor: 0.04 },
  { name: 'Malta', price: 0.17, emissionFactor: 0.54 },
  { name: 'Netherlands', price: 0.30, emissionFactor: 0.38 },
  { name: 'Poland', price: 0.15, emissionFactor: 0.75 },
  { name: 'Portugal', price: 0.22, emissionFactor: 0.19 },
  { name: 'Romania', price: 0.15, emissionFactor: 0.26 },
  { name: 'Slovakia', price: 0.18, emissionFactor: 0.11 },
  { name: 'Slovenia', price: 0.16, emissionFactor: 0.22 },
  { name: 'Spain', price: 0.25, emissionFactor: 0.19 },
  { name: 'Sweden', price: 0.18, emissionFactor: 0.01 },
];

const applianceTypes: string[] = [
  'Ovens', 'Fridges', 'Washing Machines', 'Tumble Dryers', 'Dishwashers', 
  'Air conditioners', 'Water heaters', 'Range hoods'
];

const consumptionUnitOptions: ConsumptionUnit[] = [
  { value: 'per_year', label: 'per year', base: 1, prompt: null },
  { value: 'per_100_cycles', label: 'per 100 cycles', base: 100, prompt: 'On average, how many cycles per week do you run?' },
  { value: 'per_cycle', label: 'per cycle', base: 1, prompt: 'On average, how many cycles per week do you run?' },
  { value: 'per_1000_hours', label: 'per 1,000 hours', base: 1000, prompt: 'On average, how many hours per week do you use this appliance?' },
];

// --- Dynamic Help Content for the Modal ---
const usageHelpContent: HelpContent = {
    'Ovens': {
        title: 'Estimating Oven Usage',
        example: 'A typical cooking session might be 1.5 hours. If you cook 3 times a week, your total is 4.5 hours per week.'
    },
    'Air conditioners': {
        title: 'Estimating AC Usage',
        example: 'If you run your AC for 4 hours a day on the 3 hottest days of the week during summer, that’s 12 hours per week.'
    },
    'Default': {
        title: 'Estimating Usage',
        example: 'Think about a typical day. How many hours do you use the appliance? Now, multiply that by the number of days you use it each week.'
    }
}

// --- Reusable SVG Icons ---
const InfoIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CloseIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const Co2Icon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.5 17.5c2.485 0 4.5-2.015 4.5-4.5s-2.015-4.5-4.5-4.5S-1 10.515-1 13s2.015 4.5 4.5 4.5zm1-9C6.985 8.5 9 6.485 9 4s-2.015-4.5-4.5-4.5S0 1.515 0 4s2.015 4.5 4.5 4.5z" transform="translate(7 3)"/>
        <text x="12" y="18" fontFamily="Arial, sans-serif" fontSize="6" textAnchor="middle" fill="currentColor">CO2</text>
    </svg>
);

// --- Help Modal Component ---
const HelpModal: FC<{ isOpen: boolean; onClose: () => void; applianceType: string }> = ({ isOpen, onClose, applianceType }) => {
    if (!isOpen) return null;

    const content = usageHelpContent[applianceType] || usageHelpContent['Default'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <div className="flex items-center gap-3 mb-4">
                    <InfoIcon className="w-8 h-8 text-blue-500" />
                    <h3 className="text-xl font-bold text-slate-800">{content.title}</h3>
                </div>
                <p className="text-slate-600">{content.example}</p>
            </div>
        </div>
    );
};

// --- Main Calculator Component ---
const RunningCostCalculator: FC = () => {
  // State for all input fields
  const [country, setCountry] = useState<string>(countryData[0].name);
  const [electricityPrice, setElectricityPrice] = useState<string>(countryData[0].price.toString());
  const [appliance, setAppliance] = useState<string>(applianceTypes[0]);
  const [energyConsumption, setEnergyConsumption] = useState<string>('');
  const [consumptionUnit, setConsumptionUnit] = useState<string>(consumptionUnitOptions[0].value);
  const [estimatedUsage, setEstimatedUsage] = useState<string>('');
  
  const [annualCost, setAnnualCost] = useState<number | null>(null);
  const [co2Emissions, setCo2Emissions] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Memoized values for performance
  const selectedUnit = useMemo(() => consumptionUnitOptions.find(u => u.value === consumptionUnit), [consumptionUnit]);
  const selectedCountryData = useMemo(() => countryData.find(c => c.name === country), [country]);

  // --- Event Handlers ---
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    setCountry(newCountry);
    const newPrice = countryData.find(c => c.name === newCountry)?.price || 0;
    setElectricityPrice(newPrice.toString());
  };
  
  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newUnit = e.target.value;
      setConsumptionUnit(newUnit);
      if (newUnit === 'per_year') {
          setEstimatedUsage('');
      }
  }

  // --- Main Calculation Logic ---
  const handleCalculate = () => {
    setError('');
    setAnnualCost(null);
    setCo2Emissions(null);

    const price = parseFloat(electricityPrice);
    const consumption = parseFloat(energyConsumption);
    
    if (isNaN(price) || price < 0) {
      setError("Please enter a valid electricity price.");
      return;
    }
    if (isNaN(consumption) || consumption <= 0) {
      setError("Please enter a valid energy consumption from the label.");
      return;
    }

    if (!selectedUnit || !selectedCountryData) return;
    
    // Convert weekly usage to annual usage
    let annualUsage = 0;
    if (selectedUnit.prompt) {
        const weeklyUsage = parseFloat(estimatedUsage);
        if (isNaN(weeklyUsage) || weeklyUsage < 0) {
            setError("Please enter your estimated weekly usage.");
            return;
        }
        annualUsage = weeklyUsage * 52; // 52 weeks in a year
    }

    // Calculate total kWh for the year
    const usageFactor = selectedUnit.value === 'per_year' ? 1 : annualUsage / selectedUnit.base;
    const totalKWh = consumption * usageFactor;
    
    // Formula for running cost
    setAnnualCost(totalKWh * price);
    // Formula for Co2 calculator
    setCo2Emissions(totalKWh * selectedCountryData.emissionFactor);
  };

  // --- Render Method ---
  return (
    <Fragment>
        <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} applianceType={appliance} />
        <div className="bg-slate-50 min-h-screen w-full flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-3xl mx-auto p-6 md:p-8 bg-white shadow-2xl rounded-2xl">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-slate-800">Appliance Running Cost & CO2 Calculator</h1>
                <p className="text-sm text-slate-500 mb-8">
                    Estimate your appliance&apos;s annual running cost and CO2 emissions.
                </p>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Country Selection */}
                        <div>
                            <label htmlFor="country" className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                            <select id="country" value={country} onChange={handleCountryChange} className="mt-1 block w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                                {countryData.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>

                        {/* Electricity Price */}
                        <div>
                            <label htmlFor="electricity-price" className="block text-sm font-medium text-slate-700 mb-1">Electricity price (€/kWh)</label>
                            <input type="number" step="0.01" min="0" id="electricity-price" value={electricityPrice} onChange={(e) => setElectricityPrice(e.target.value)} className="mt-1 block w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="e.g., 0.30"/>
                        </div>

                        {/* Appliance Type */}
                        <div>
                            <label htmlFor="appliance-type" className="block text-sm font-medium text-slate-700 mb-1">Appliance Type</label>
                            <select id="appliance-type" value={appliance} onChange={(e) => setAppliance(e.target.value)} className="mt-1 block w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                                {applianceTypes.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>

                        {/* Energy Consumption */}
                        <div>
                            <label htmlFor="energy-consumption" className="block text-sm font-medium text-slate-700 mb-1">Energy Consumption from Label (kWh)</label>
                            <input type="number" min="0" id="energy-consumption" value={energyConsumption} onChange={(e) => setEnergyConsumption(e.target.value)} className="mt-1 block w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="e.g., 54"/>
                        </div>
                        
                        {/* Unit of Consumption */}
                        <div className="md:col-span-2">
                            <label htmlFor="consumption-unit" className="block text-sm font-medium text-slate-700 mb-1">Unit of Energy Consumption</label>
                            <select id="consumption-unit" value={consumptionUnit} onChange={handleUnitChange} className="mt-1 block w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition">
                                {consumptionUnitOptions.map(unit => <option key={unit.value} value={unit.value}>{unit.label}</option>)}
                            </select>
                        </div>

                        {/* Estimated Usage (Conditional) */}
                        {selectedUnit?.prompt && (
                            <div className="md:col-span-2">
                                <label htmlFor="estimated-usage" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                                    {selectedUnit.prompt}
                                    {selectedUnit.value === 'per_1000_hours' && (
                                        <button onClick={() => setIsHelpModalOpen(true)} className="text-blue-600 hover:text-blue-800">
                                            <InfoIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </label>
                                <input type="number" min="0" id="estimated-usage" value={estimatedUsage} onChange={(e) => setEstimatedUsage(e.target.value)} className="mt-1 block w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="e.g., 4.5"/>
                            </div>
                        )}
                    </div>

                    {/* --- Calculate Button, Result, and Errors --- */}
                    <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                        <button onClick={handleCalculate} className="w-full md:w-auto bg-blue-600 text-white font-bold py-3 px-10 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-105 shadow-lg">
                            Calculate
                        </button>
                        
                        {error && (
                            <div className="mt-4 p-3 text-red-800 bg-red-100 border border-red-200 rounded-lg">
                                <p>{error}</p>
                            </div>
                        )}

                        {annualCost !== null && co2Emissions !== null && (
                            <div className="mt-6 p-6 bg-green-50 border-2 border-dashed border-green-200 rounded-lg animate-fade-in">
                                <div className="flex flex-col md:flex-row justify-center items-center md:divide-x-2 md:divide-green-200">
                                    {/*-- Cost Result --*/}
                                    <div className="p-4 w-full md:w-1/2 text-center">
                                        <p className="text-lg text-slate-600">Estimated Annual Cost</p>
                                        <p className="text-4xl md:text-5xl font-extrabold text-green-600 my-2 flex items-center justify-center gap-2">
                                            €{annualCost.toFixed(2)}
                                        </p>
                                    </div>
                                    {/*-- CO2 Result --*/}
                                    <div className="p-4 w-full md:w-1/2 text-center">
                                        <p className="text-lg text-slate-600">Estimated CO2 Emissions</p>
                                        <p className="text-4xl md:text-5xl font-extrabold text-green-600 my-2 flex items-center justify-center gap-2">
                                             <Co2Icon className="w-9 h-9" />
                                            {co2Emissions.toFixed(2)}
                                            <span className="text-2xl font-semibold text-slate-500">kg</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* --- Disclaimer --- */}
                <div className="mt-10 text-xs text-slate-400 text-center">
                    <p><strong>Disclaimer:</strong> This calculator provides an estimate for informational purposes only. Actual costs and emissions may vary. Always consult your appliance&apos;s official energy label and your energy provider for the most accurate information.</p>
                </div>
            </div>
            <style>
            {`
              @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes fade-in-up {
                from { opacity: 0; transform: translateY(20px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
              .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
              .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
            `}
            </style>
        </div>
    </Fragment>
  );
};

export default RunningCostCalculator;

