import React from 'react';
import Ide from '@/features/simulator/components/Ide';
import { Link } from 'react-router-dom';

export default function SimulatorPage() {
  return (
    <div className="h-screen w-full bg-gray-900 overflow-hidden flex flex-col">
      {/* Top Navigation Bar */}
      <div className="h-16 bg-gray-800 border-b border-gray-700 flex items-center px-6 shrink-0 text-white relative z-10">
        <h1 className="text-xl font-bold tracking-tight">EduRobotics <span className="font-light text-gray-400 ml-2">| Simulador 3D (Beta)</span></h1>
        
        <div className="flex-grow"></div>
        
        <Link 
          to="/dashboard" 
          className="text-sm px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors text-white font-medium"
        >
          Volver al Dashboard
        </Link>
      </div>
      
      {/* IDE Container */}
      <div className="flex-grow w-full relative">
        <Ide />
      </div>
    </div>
  );
}
