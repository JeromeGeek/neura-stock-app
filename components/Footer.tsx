
import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="w-full text-center py-8 mt-12 border-t border-slate-700/50">
            <p className="text-sm text-slate-400">
                Created by <a href="https://github.com/JeromeGeek" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-300 hover:text-amber-400 transition-colors">Jerome Kingsly</a>
            </p>
            <p className="text-xs text-slate-500 mt-1">
                This is an unofficial calculator and is not affiliated with Bilt Rewards.
            </p>
        </footer>
    );
};
