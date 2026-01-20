
import React, { useState, useMemo } from 'react';
import type { CardTier, CalculatorOption, CalculationResults } from './types';
import { CARD_TIERS, RENT_MULTIPLIERS, BILT_CASH_FEE_RATE, BILT_CASH_REBATE_RATE, BILT_CASH_SPEND_MULTIPLIER, WELCOME_BONUS_CASH, WELCOME_BONUS_PALLADIUM_POINTS, MINIMUM_SPEND_RATIO_THRESHOLD, MINIMUM_SPEND_BASE_POINTS } from './constants';
import { Header } from './components/Header';
import { InputPanel } from './components/InputPanel';
import { TierSelector } from './components/TierSelector';
import { BiltCashDetails } from './components/BiltCashDetails';
import { AnnualSummary } from './components/AnnualSummary';
import { TieredSummary } from './components/TieredSummary';
import { TierBenefitsDisplay } from './components/TierBenefitsDisplay';
import { Footer } from './components/Footer';

const App: React.FC = () => {
  const [monthlyPayment, setMonthlyPayment] = useState(1900);
  const [everydaySpend, setEverydaySpend] = useState(400);
  const [cardTier, setCardTier] = useState<CardTier>('blue');
  const [calculatorOption, setCalculatorOption] = useState<CalculatorOption>('biltCash');
  const [includeWelcomeBonus, setIncludeWelcomeBonus] = useState(false);

  const results = useMemo((): CalculationResults => {
    const annualSpend = (monthlyPayment + everydaySpend) * 12;

    let welcomeBonusPoints = 0;
    let welcomeBonusCash = 0;

    if (includeWelcomeBonus) {
        welcomeBonusCash = WELCOME_BONUS_CASH[cardTier];
        if (cardTier === 'palladium') { // Assume spend requirement is met for simplicity in this UI
            welcomeBonusPoints = WELCOME_BONUS_PALLADIUM_POINTS;
        }
    }

    const spendToRentRatio = monthlyPayment > 0 ? everydaySpend / monthlyPayment : Infinity;

    // Tiered calculation
    let rentPoints = 0;
    let rentMultiplier = 0;

    if (monthlyPayment > 0 && spendToRentRatio < MINIMUM_SPEND_RATIO_THRESHOLD) {
        rentPoints = MINIMUM_SPEND_BASE_POINTS;
    } else if (monthlyPayment > 0) {
        const rentMultiplierTier = RENT_MULTIPLIERS.slice().reverse().find(tier => spendToRentRatio >= tier.ratio);
        if (rentMultiplierTier) {
            rentMultiplier = rentMultiplierTier.multiplier;
            rentPoints = monthlyPayment * rentMultiplier;
        }
    }
    
    const nextMultiplierTier = RENT_MULTIPLIERS.find(tier => spendToRentRatio < tier.ratio);
    const tieredMonthlyPoints = rentPoints + (everydaySpend * CARD_TIERS[cardTier].spendMultiplier);
    let tieredAnnualPoints = tieredMonthlyPoints * 12;
    tieredAnnualPoints += welcomeBonusPoints;
    
    // Bilt Cash calculation
    // FIX: Corrected typo from BILT_CASH_FEE_rate to BILT_CASH_FEE_RATE.
    const transactionFee = monthlyPayment * BILT_CASH_FEE_RATE;
    const biltCashEarned = everydaySpend * BILT_CASH_REBATE_RATE;
    const feeCoverage = biltCashEarned - transactionFee;
    const biltCashMonthlyPoints = (monthlyPayment * 1) + (everydaySpend * 1);
    let biltCashAnnualPoints = biltCashMonthlyPoints * 12;
    biltCashAnnualPoints += welcomeBonusPoints;

    return {
      annualSpend,
      welcomeBonus: {
        isIncluded: includeWelcomeBonus,
        points: welcomeBonusPoints,
        cash: welcomeBonusCash
      },
      tiered: {
        rentMultiplier,
        spendMultiplier: CARD_TIERS[cardTier].spendMultiplier,
        monthlyPoints: tieredMonthlyPoints,
        annualPoints: tieredAnnualPoints,
        spendToRentRatio,
        nextMultiplierTier,
      },
      biltCash: {
        transactionFee,
        biltCash: biltCashEarned,
        feeCoverage,
        monthlyPoints: biltCashMonthlyPoints,
        annualPoints: biltCashAnnualPoints,
        annualTransactionFee: transactionFee * 12,
        annualBiltCash: biltCashEarned * 12,
        surplusBiltCash: feeCoverage > 0 ? feeCoverage * 12 : 0,
      },
    };
  }, [monthlyPayment, everydaySpend, cardTier, includeWelcomeBonus]);

  return (
    <div className="min-h-screen text-slate-200 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-screen-lg mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 sm:gap-0">
            <Header cardTier={cardTier} />
            <TierSelector cardTier={cardTier} setCardTier={setCardTier} />
        </header>

        <div className="grid grid-cols-2 gap-4 bg-slate-800/80 p-1 rounded-xl max-w-lg mx-auto">
              <button 
                onClick={() => setCalculatorOption('tiered')} 
                className={`py-3 px-4 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base ${calculatorOption === 'tiered' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}
              >
                Option 1: Tiered
              </button>
              <button 
                onClick={() => setCalculatorOption('biltCash')} 
                className={`py-3 px-4 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base ${calculatorOption === 'biltCash' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-700/50'}`}
              >
                Option 2: Bilt Cash
              </button>
        </div>
        
        <main className="mt-8">
          {calculatorOption === 'biltCash' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputPanel 
                monthlyPayment={monthlyPayment}
                setMonthlyPayment={setMonthlyPayment}
                everydaySpend={everydaySpend}
                setEverydaySpend={setEverydaySpend}
                cardTier={cardTier}
                results={results}
              />
              <BiltCashDetails 
                results={results} 
                monthlyPayment={monthlyPayment}
                everydaySpend={everydaySpend}
              />
              <AnnualSummary 
                results={results} 
                includeWelcomeBonus={includeWelcomeBonus} 
                setIncludeWelcomeBonus={setIncludeWelcomeBonus} 
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputPanel 
                monthlyPayment={monthlyPayment}
                setMonthlyPayment={setMonthlyPayment}
                everydaySpend={everydaySpend}
                setEverydaySpend={setEverydaySpend}
                cardTier={cardTier}
                results={results}
              />
              <TieredSummary results={results} monthlyPayment={monthlyPayment} everydaySpend={everydaySpend} />
            </div>
          )}
        </main>
        
        <section className="mt-12 w-full">
            <TierBenefitsDisplay cardTier={cardTier} />
        </section>

        <Footer />
      </div>
    </div>
  );
};

export default App;
