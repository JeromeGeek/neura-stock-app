
import React from 'react';

interface ToggleSwitchProps {
  label: string;
  isChecked: boolean;
  onChange: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, isChecked, onChange }) => {
  return (
    <label htmlFor="toggle" className="flex items-center cursor-pointer">
      <span className="mr-3 text-sm font-medium text-gray-300">{label}</span>
      <div className="relative">
        <input id="toggle" type="checkbox" className="sr-only" checked={isChecked} onChange={onChange} />
        <div className={`block w-10 h-6 rounded-full transition ${isChecked ? 'bg-emerald-500' : 'bg-gray-600'}`}></div>
        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isChecked ? 'transform translate-x-full' : ''}`}></div>
      </div>
    </label>
  );
};

export default ToggleSwitch;
