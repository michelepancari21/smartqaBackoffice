import React from 'react';
import { Loader } from 'lucide-react';

interface GlobalLoaderProps {
  isVisible: boolean;
  message?: string;
}

const GlobalLoader: React.FC<GlobalLoaderProps> = ({ 
  isVisible, 
  message = 'Loading...' 
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/30 rounded-xl p-8 shadow-2xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-500 opacity-20 rounded-full blur-sm animate-pulse"></div>
          </div>
          <p className="text-white font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default GlobalLoader;