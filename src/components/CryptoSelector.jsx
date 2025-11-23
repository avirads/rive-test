import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

const COINS = [
    { symbol: 'BTCUSDT', name: 'Bitcoin', color: '#F7931A' },
    { symbol: 'ETHUSDT', name: 'Ethereum', color: '#627EEA' },
    { symbol: 'SOLUSDT', name: 'Solana', color: '#14F195' },
    { symbol: 'BNBUSDT', name: 'BNB', color: '#F3BA2F' },
    { symbol: 'ADAUSDT', name: 'Cardano', color: '#0033AD' },
    { symbol: 'DOGEUSDT', name: 'Dogecoin', color: '#C2A633' },
    { symbol: 'DOTUSDT', name: 'Polkadot', color: '#E6007A' },
];

export default function CryptoSelector({ selectedSymbol, onSelect }) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedCoin = COINS.find(c => c.symbol === selectedSymbol) || COINS[0];

    return (
        <div className="relative z-50">
            <motion.button
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl border border-rive-border bg-rive-panel hover:border-rive-accent/50 transition-colors min-w-[180px]"
            >
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center border border-white/10 shadow-inner"
                    style={{ backgroundColor: `${selectedCoin.color}20` }}
                >
                    <span className="font-bold text-xs" style={{ color: selectedCoin.color }}>
                        {selectedCoin.symbol.substring(0, 1)}
                    </span>
                </div>

                <div className="flex flex-col items-start mr-auto">
                    <span className="text-sm font-bold text-white leading-none">{selectedCoin.name}</span>
                    <span className="text-[10px] text-rive-muted font-mono">{selectedCoin.symbol}</span>
                </div>

                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                >
                    <ChevronDown size={16} className="text-rive-muted" />
                </motion.div>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full left-0 mt-2 w-64 bg-rive-panel border border-rive-border rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl z-[100]"
                    >
                        <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {COINS.map((coin) => (
                                <motion.button
                                    key={coin.symbol}
                                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)', x: 4 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelect(coin.symbol);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all cursor-pointer ${selectedSymbol === coin.symbol ? 'bg-white/5' : 'hover:bg-white/5'}`}
                                >
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center border border-white/10"
                                        style={{ backgroundColor: `${coin.color}20` }}
                                    >
                                        <span className="font-bold text-xs" style={{ color: coin.color }}>
                                            {coin.symbol.substring(0, 1)}
                                        </span>
                                    </div>

                                    <div className="flex flex-col items-start mr-auto">
                                        <span className={`text-sm font-medium ${selectedSymbol === coin.symbol ? 'text-white' : 'text-rive-muted group-hover:text-white'}`}>
                                            {coin.name}
                                        </span>
                                        <span className="text-[10px] text-rive-muted font-mono">{coin.symbol}</span>
                                    </div>

                                    {selectedSymbol === coin.symbol && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                        >
                                            <Check size={14} className="text-rive-accent" />
                                        </motion.div>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
