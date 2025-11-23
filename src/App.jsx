import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import PriceChart from './components/PriceChart';
import OrderBook from './components/OrderBook';
import CryptoSelector from './components/CryptoSelector';

function App() {
  const [symbol, setSymbol] = useState('BTCUSDT');

  return (
    <div className="flex h-screen w-screen bg-rive-bg overflow-hidden font-sans selection:bg-rive-accent/30">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full relative">
        {/* Top Navigation Bar */}
        <header className="h-14 border-b border-rive-border flex items-center justify-between px-6 bg-rive-panel z-10">
          <div className="flex items-center gap-4">
            {/* Logo removed as it is now in Sidebar */}

            <CryptoSelector selectedSymbol={symbol} onSelect={setSymbol} />

            <div className="h-4 w-[1px] bg-rive-border mx-2" />
            <nav className="flex items-center gap-6 text-sm font-medium text-rive-muted">
              <a href="#" className="hover:text-white transition-colors">Dashboard</a>
              <a href="#" className="hover:text-white transition-colors">Markets</a>
              <a href="#" className="hover:text-white transition-colors text-white">Exchange</a>
              <a href="#" className="hover:text-white transition-colors">Learn</a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20 rounded-lg border border-white/5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-rive-muted font-medium">System Operational</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rive-accent to-purple-500 border-2 border-rive-panel shadow-lg cursor-pointer hover:scale-105 transition-transform" />
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />

          <PriceChart symbol={symbol} />

          <OrderBook symbol={symbol} />
        </div>
      </main>
    </div>
  );
}

export default App;
