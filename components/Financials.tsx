
import React from 'react';
import { FinancialMetric } from '../types';
import Card from './Card';

interface FinancialsProps {
  data: FinancialMetric[];
}

const Financials: React.FC<FinancialsProps> = ({ data }) => {
  return (
    <Card className="mb-6">
      <h2 className="text-2xl font-bold mb-4">Financials</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {data.map((metric) => (
          <div key={metric.label} className="bg-gray-900 p-4 rounded-lg">
            <p className="text-sm text-gray-400">{metric.label}</p>
            <p className="text-xl font-bold font-mono">{metric.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default Financials;
