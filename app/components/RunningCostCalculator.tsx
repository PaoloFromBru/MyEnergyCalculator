'use client';

import { useState, useMemo, FC } from 'react';

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

// --- Mock Data (with CO2 Emission Factors) ---
// In a real-world application, you would fetch this from an API.
// Emission factors are estimates based on the energy mix of each country.
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
  'Fridges', 'Washing Machines', 'Tumble Dryers', 'Dishwashers', 
  'Ovens', 'Air conditioners', 'Water heaters', 'Range hoods'
];

const consumptionUnitOptions: ConsumptionUnit[] = [
  { value: 'per_year', label: 'per year', base: 1, prompt: null },
  { value: 'per_100_cycles', label: 'per 100 cycles', base: 100, prompt: 'How many cycles do you run per year?' },
  { value: 'per_cycle', label: 'per cycle', base: 1, prompt: 'How many cycles per year?' },
  { value: 'per_1000_hours', label: 'per 1,000 hours', base: 1000, prompt: 'How many hours per year do you use it?' },
];

// --- SVG Icons for the results ---
const EuroIcon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 15.536A9.004 9.004 0 0112 16.5c-2.672 0-5.082-1.135-6.8-2.936m13.6 0A9.004 9.004 0 0112 16.5c-2.672 0-5.082-1.135-6.8-2.936m13.6 0H21m-9.121-1.464A9.004 9.004 0 0012 7.5c-2.672 0-5.082 1.135-6.8-2.936m13.6 0H3" />
    </svg>
);

const Co2Icon: FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.5 17.5c2.485 0 4.5-2.015 4.5-4.5s-2.015-4.5-4.5-4.5S-1 10.515-1 13s2.015 4.5 4.5 4.5zm1-9C6.985 8.5 9 6.485 9 4s-2.015-4.5-4.5-4.5S0 1.515 0 4s2.015 4.5 4.5 4.5z" transform="translate(7 3)"/>
        <text x="12" y="18" fontFamily="Arial, sans-serif" fontSize="6" textAnchor="middle" fill="currentColor">CO2</text>
    </svg>
);


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

  // Memoize the selected unit object to avoid re-calculating on every render
  const selectedUnit = useMemo(() => {
    return consumptionUnitOptions.find(u => u.value === consumptionUnit);
  }, [consumptionUnit]);
  
  const selectedCountryData = useMemo(() => {
      return countryData.find(c => c.name === country);
  }, [country]);

  // Handler for country change to auto-fill electricity price
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCountry = e.target.value;
    setCountry(newCountry);
    const newPrice = countryData.find(c => c.name === newCountry)?.price || 0;
    setElectricityPrice(newPrice.toString());
  };
  
  // Reset usage when unit changes to one that doesn't need it
  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newUnit = e.target.value;
      setConsumptionUnit(newUnit);
      if (newUnit === 'per_year') {
          setEstimatedUsage('');
      }
  }

  // --- Calculation logic ---
  const handleCalculate = () => {
    setError('');
    setAnnualCost(null);
    setCo2Emissions(null);

    const price = parseFloat(electricityPrice);
    const consumption = parseFloat(energyConsumption);
    
    // Validate inputs
    if (isNaN(price) || price < 0) {
      setError("Please enter a valid electricity price.");
      return;
    }
    if (isNaN(consumption) || consumption <= 0) {
      setError("Please enter a valid energy consumption from the label.");
      return;
    }

    if (!selectedUnit || !selectedCountryData) return;
    
    const usage = parseFloat(estimatedUsage);

    if (selectedUnit.prompt && (isNaN(usage) || usage < 0)) {
        setError("Please enter your estimated usage.");
        return;
    }

    // Calculate total kWh for the year
    const usageFactor = selectedUnit.value === 'per_year' ? 1 : usage / selectedUnit.base;
    const totalKWh = consumption * usageFactor;
    
    // Formula for running cost
    const costResult = totalKWh * price;
    setAnnualCost(costResult);

    // Formula for Co2 calculator
    const co2Result = totalKWh * selectedCountryData.emissionFactor;
    setCo2Emissions(co2Result);
  };

  return (
    <div className="bg-slate-50 min-h-screen w-full flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-3xl mx-auto p-6 md:p-8 bg-white shadow-2xl rounded-2xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-slate-800">Appliance Running Cost & CO2 Calculator</h1>
            <p className="text-sm text-slate-500 mb-8">
                Estimate your appliance&apos;s annual running cost and CO2 emissions.
            </p>

            <div className="space-y-6">
                {/* --- Input Grid --- */}
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
                            <label htmlFor="estimated-usage" className="block text-sm font-medium text-slate-700 mb-1">{selectedUnit.prompt}</label>
                            <input type="number" min="0" id="estimated-usage" value={estimatedUsage} onChange={(e) => setEstimatedUsage(e.target.value)} className="mt-1 block w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="e.g., 160"/>
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
                                        <EuroIcon className="w-9 h-9" />
                                        {annualCost.toFixed(2)}
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
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out forwards;
          }
        `}
        </style>
    </div>
  );
};

export default RunningCostCalculator;
