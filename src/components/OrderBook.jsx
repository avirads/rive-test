import React, { useState, useEffect, useRef } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

export default function OrderBook({ symbol }) {
    const [bids, setBids] = useState([]);
    const [asks, setAsks] = useState([]);
    const wsRef = useRef(null);

    useEffect(() => {
        if (wsRef.current) wsRef.current.close();

        wsRef.current = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth20@100ms`);

        wsRef.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setBids(message.bids.slice(0, 15));
            setAsks(message.asks.slice(0, 15).reverse());
        };

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [symbol]);

    const maxTotal = Math.max(
        ...bids.map(b => parseFloat(b[1])),
        ...asks.map(a => parseFloat(a[1]))
    );

    return (
        <div className="w-72 border-l border-rive-border bg-rive-panel hidden lg:flex flex-col z-20">
            <div className="p-4 border-b border-rive-border flex justify-between items-center">
                <h3 className="text-sm font-medium text-white">Order Book</h3>
                <span className="text-xs text-rive-muted font-mono">{symbol}</span>
            </div>

            {/* Header */}
            <div className="flex px-2 py-1 text-[10px] text-rive-muted font-medium uppercase tracking-wider">
                <div className="flex-1">Price</div>
                <div className="flex-1 text-right">Amount</div>
                <div className="flex-1 text-right">Total</div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* Asks (Sells) - Red */}
                <div className="flex flex-col-reverse">
                    {asks.map((ask, i) => {
                        const price = parseFloat(ask[0]);
                        const amount = parseFloat(ask[1]);
                        const total = price * amount;
                        const width = (amount / maxTotal) * 100;

                        return (
                            <div key={i} className="flex relative group cursor-pointer hover:bg-white/5 py-[1px] px-2 text-xs">
                                <div
                                    className="absolute top-0 right-0 bottom-0 bg-red-500/10 transition-all duration-300"
                                    style={{ width: `${Math.min(width * 5, 100)}%` }}
                                />
                                <span className="flex-1 text-red-400 font-mono z-10">{price.toFixed(2)}</span>
                                <span className="flex-1 text-right text-rive-muted z-10">{amount.toFixed(4)}</span>
                                <span className="flex-1 text-right text-white z-10">{total.toFixed(0)}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="py-2 border-y border-rive-border my-1 flex justify-center items-center gap-2 bg-rive-bg/50">
                    <span className={`text-lg font-bold ${bids[0] && asks[asks.length - 1] && parseFloat(bids[0][0]) > parseFloat(asks[asks.length - 1][0]) ? 'text-green-500' : 'text-white'}`}>
                        {bids[0] ? parseFloat(bids[0][0]).toFixed(2) : '---'}
                    </span>
                    {bids[0] && asks[asks.length - 1] && (
                        <ArrowUp size={14} className={parseFloat(bids[0][0]) > parseFloat(asks[asks.length - 1][0]) ? 'text-green-500' : 'text-rive-muted'} />
                    )}
                </div>

                {/* Bids (Buys) - Green */}
                <div>
                    {bids.map((bid, i) => {
                        const price = parseFloat(bid[0]);
                        const amount = parseFloat(bid[1]);
                        const total = price * amount;
                        const width = (amount / maxTotal) * 100;

                        return (
                            <div key={i} className="flex relative group cursor-pointer hover:bg-white/5 py-[1px] px-2 text-xs">
                                <div
                                    className="absolute top-0 right-0 bottom-0 bg-green-500/10 transition-all duration-300"
                                    style={{ width: `${Math.min(width * 5, 100)}%` }}
                                />
                                <span className="flex-1 text-green-400 font-mono z-10">{price.toFixed(2)}</span>
                                <span className="flex-1 text-right text-rive-muted z-10">{amount.toFixed(4)}</span>
                                <span className="flex-1 text-right text-white z-10">{total.toFixed(0)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="p-4 border-t border-rive-border bg-black/20">
                <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-500/20 mb-2 active:scale-95">
                    Buy {symbol.replace('USDT', '')}
                </button>
                <button className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95">
                    Sell {symbol.replace('USDT', '')}
                </button>
            </div>
        </div>
    );
}
