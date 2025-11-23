import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, Zap, Maximize2, MoreHorizontal, Activity, Clock, BarChart2, TrendingUp } from 'lucide-react';

// Convert data to SVG path
const getPath = (data, width, height) => {
    if (data.length === 0) return "";

    const prices = data.map(d => d.close);
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const range = max - min;

    const padding = range * 0.1;
    const renderMin = min - padding;
    const renderRange = range + (padding * 2);

    const stepX = width / (data.length - 1);

    let d = `M 0 ${height - ((prices[0] - renderMin) / renderRange) * height}`;

    for (let i = 1; i < data.length; i++) {
        const x = i * stepX;
        const y = height - ((prices[i] - renderMin) / renderRange) * height;
        d += ` L ${x} ${y}`;
    }

    return d;
};

const getAreaPath = (data, width, height) => {
    const linePath = getPath(data, width, height);
    return `${linePath} L ${width} ${height} L 0 ${height} Z`;
};

const INTERVALS = [
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: '1H', value: '1h' },
    { label: '4H', value: '4h' },
    { label: '1D', value: '1d' },
];

export default function PriceChart({ symbol }) {
    const [data, setData] = useState([]);
    const [hoveredData, setHoveredData] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [loading, setLoading] = useState(true);
    const [interval, setInterval] = useState('1m');
    const [chartType, setChartType] = useState('line'); // 'line' | 'candle'

    // Zoom and Pan State
    // range: number of candles visible
    // offset: number of candles from the right (0 = live edge)
    const [viewState, setViewState] = useState({ range: 50, offset: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef(null);

    const wsRef = useRef(null);

    // Fetch data when interval or symbol changes
    useEffect(() => {
        setLoading(true);
        const fetchHistory = async () => {
            try {
                // Increased limit to 1000 to allow scrolling back
                const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=1000`);
                const rawData = await response.json();

                const formattedData = rawData.map(item => ({
                    time: item[0],
                    open: parseFloat(item[1]),
                    high: parseFloat(item[2]),
                    low: parseFloat(item[3]),
                    close: parseFloat(item[4]),
                    price: parseFloat(item[4]) // Keep for compatibility
                }));

                setData(formattedData);
                setLoading(false);
                // Reset view to live edge on new data load
                setViewState(prev => ({ ...prev, offset: 0 }));
            } catch (error) {
                console.error("Error fetching history:", error);
                setLoading(false);
            }
        };

        fetchHistory();

        // Setup WebSocket for live kline updates
        if (wsRef.current) wsRef.current.close();

        wsRef.current = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);

        wsRef.current.onmessage = (event) => {
            const message = JSON.parse(event.data);
            const kline = message.k;

            const newPoint = {
                time: kline.t,
                open: parseFloat(kline.o),
                high: parseFloat(kline.h),
                low: parseFloat(kline.l),
                close: parseFloat(kline.c),
                price: parseFloat(kline.c)
            };

            setData(prev => {
                const lastPoint = prev[prev.length - 1];

                // If the incoming data is for the same time slot as the last point, update it
                if (lastPoint && lastPoint.time === newPoint.time) {
                    const newData = [...prev];
                    newData[newData.length - 1] = newPoint;
                    return newData;
                }
                // Otherwise add a new point
                else {
                    const newData = [...prev, newPoint];
                    // Keep a larger buffer in memory (e.g., 2000)
                    if (newData.length > 2000) return newData.slice(newData.length - 2000);
                    return newData;
                }
            });
        };

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [interval, symbol]);

    // Derived visible data based on zoom/pan
    const visibleData = useMemo(() => {
        if (data.length === 0) return [];
        const { range, offset } = viewState;

        // Calculate start and end indices
        // offset 0 means end is data.length
        // offset 10 means end is data.length - 10
        let endIndex = data.length - offset;
        let startIndex = endIndex - range;

        // Clamp indices
        if (endIndex > data.length) endIndex = data.length;
        if (startIndex < 0) startIndex = 0;
        if (endIndex < startIndex) endIndex = startIndex + 1; // Safety

        return data.slice(startIndex, endIndex);
    }, [data, viewState]);

    const currentPrice = data.length > 0 ? data[data.length - 1].close : 0;
    const prevPrice = data.length > 1 ? data[data.length - 2].close : 0;
    const isUp = currentPrice >= prevPrice;
    const priceChange = currentPrice - prevPrice;
    const percentChange = prevPrice !== 0 ? (priceChange / prevPrice) * 100 : 0;

    const width = 800;
    const height = 400;

    const pathD = useMemo(() => getPath(visibleData, width, height), [visibleData, width, height]);
    const areaD = useMemo(() => getAreaPath(visibleData, width, height), [visibleData, width, height]);

    // Interaction Handlers
    const handleWheel = (e) => {
        e.preventDefault();
        const zoomSpeed = 0.1;
        const delta = Math.sign(e.deltaY);

        setViewState(prev => {
            let newRange = prev.range + (delta * prev.range * zoomSpeed);
            // Clamp zoom
            newRange = Math.max(10, Math.min(newRange, 500));
            return { ...prev, range: Math.round(newRange) };
        });
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        dragStartRef.current = { x: e.clientX, offset: viewState.offset };
    };

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePos({ x, y });

        // Hover logic
        const index = Math.min(
            Math.max(0, Math.floor((x / rect.width) * visibleData.length)),
            visibleData.length - 1
        );
        if (visibleData[index]) setHoveredData(visibleData[index]);

        // Drag logic
        if (isDragging && dragStartRef.current) {
            const deltaX = e.clientX - dragStartRef.current.x;
            // Sensitivity: how many pixels per candle. 
            // If chart width is 800 and we show 'range' candles, each candle is 800/range pixels.
            const pixelsPerCandle = width / viewState.range;
            const candlesMoved = Math.round(deltaX / pixelsPerCandle);

            setViewState(prev => {
                let newOffset = dragStartRef.current.offset + candlesMoved;
                // Clamp offset
                // Max offset: data.length - range (showing oldest data)
                // Min offset: 0 (showing newest data) - actually allow negative slightly for "overscroll" feel? No, strict 0.
                const maxOffset = Math.max(0, data.length - prev.range);
                newOffset = Math.max(0, Math.min(newOffset, maxOffset));

                return { ...prev, offset: newOffset };
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        dragStartRef.current = null;
    };

    const handleMouseLeave = () => {
        setHoveredData(null);
        setIsDragging(false);
        dragStartRef.current = null;
    };

    // Helper for Candle rendering
    const renderCandles = () => {
        if (visibleData.length === 0) return null;

        const prices = visibleData.flatMap(d => [d.high, d.low]);
        const max = Math.max(...prices);
        const min = Math.min(...prices);
        const range = max - min;
        const padding = range * 0.1;
        const renderMin = min - padding;
        const renderRange = range + (padding * 2);

        const candleWidth = (width / visibleData.length) * 0.6;
        const stepX = width / visibleData.length;

        return visibleData.map((d, i) => {
            const x = i * stepX + (stepX - candleWidth) / 2;
            const yHigh = height - ((d.high - renderMin) / renderRange) * height;
            const yLow = height - ((d.low - renderMin) / renderRange) * height;
            const yOpen = height - ((d.open - renderMin) / renderRange) * height;
            const yClose = height - ((d.close - renderMin) / renderRange) * height;

            const isCandleUp = d.close >= d.open;
            const color = isCandleUp ? '#10B981' : '#EF4444';
            const barTop = Math.min(yOpen, yClose);
            const barHeight = Math.max(Math.abs(yClose - yOpen), 1);

            return (
                <g key={d.time}>
                    <line x1={x + candleWidth / 2} y1={yHigh} x2={x + candleWidth / 2} y2={yLow} stroke={color} strokeWidth="1" />
                    <rect x={x} y={barTop} width={candleWidth} height={barHeight} fill={color} />
                </g>
            );
        });
    };

    return (
        <div className="flex-1 bg-rive-panel m-4 rounded-2xl border border-rive-border flex flex-col overflow-hidden shadow-2xl relative">
            {/* Header */}
            <div className="h-16 border-b border-rive-border flex items-center justify-between px-6 bg-rive-panel/50 backdrop-blur-sm z-10">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-rive-muted text-sm">Current Price</span>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className={`text-2xl font-mono font-medium transition-colors duration-300 ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                            ${(hoveredData?.close || currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <div className={`flex items-center gap-1 text-xs font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                            {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            <span>{Math.abs(percentChange).toFixed(2)}%</span>
                        </div>
                    </div>
                    <div className="h-8 w-[1px] bg-rive-border" />
                    <div className="flex gap-2">
                        <button
                            onClick={() => setChartType('line')}
                            className={`p-2 rounded-lg transition-colors ${chartType === 'line' ? 'bg-white/10 text-white' : 'text-rive-muted hover:text-white hover:bg-white/5'}`}
                            title="Line Chart"
                        >
                            <TrendingUp size={18} />
                        </button>
                        <button
                            onClick={() => setChartType('candle')}
                            className={`p-2 rounded-lg transition-colors ${chartType === 'candle' ? 'bg-white/10 text-white' : 'text-rive-muted hover:text-white hover:bg-white/5'}`}
                            title="Candlestick Chart"
                        >
                            <BarChart2 size={18} />
                        </button>
                        <div className="w-[1px] h-6 bg-rive-border mx-1" />
                        <button className="p-2 hover:bg-white/5 rounded-lg text-rive-muted hover:text-white transition-colors"><Zap size={18} /></button>
                        <button className="p-2 hover:bg-white/5 rounded-lg text-rive-muted hover:text-white transition-colors"><Maximize2 size={18} /></button>
                        <button className="p-2 hover:bg-white/5 rounded-lg text-rive-muted hover:text-white transition-colors"><MoreHorizontal size={18} /></button>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div
                className={`flex-1 relative ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            >
                {/* Grid Lines */}
                <div className="absolute inset-0 pointer-events-none opacity-10">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="absolute w-full h-[1px] bg-rive-muted" style={{ top: `${i * 25}%` }} />
                    ))}
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="absolute h-full w-[1px] bg-rive-muted" style={{ left: `${i * 14.2}%` }} />
                    ))}
                </div>

                {/* Y-Axis Labels (Price) */}
                {!loading && visibleData.length > 0 && (
                    <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between py-2 pr-2 pointer-events-none z-10">
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                            const prices = visibleData.map(d => chartType === 'candle' ? d.high : d.close);
                            const allPrices = chartType === 'candle' ? visibleData.flatMap(d => [d.high, d.low]) : visibleData.map(d => d.close);
                            const max = Math.max(...allPrices);
                            const min = Math.min(...allPrices);
                            const range = max - min;
                            const padding = range * 0.1;
                            const renderMax = max + padding;
                            const renderMin = min - padding;
                            const price = renderMax - (renderMax - renderMin) * ratio;
                            return (
                                <span key={i} className="text-[10px] font-mono text-rive-muted bg-rive-panel/50 px-1 rounded backdrop-blur-sm">
                                    {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* X-Axis Labels (Time) */}
                {!loading && visibleData.length > 0 && (
                    <div className="absolute left-0 right-0 bottom-0 flex justify-between px-4 pb-1 pointer-events-none z-10">
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                            const index = Math.floor((visibleData.length - 1) * ratio);
                            const item = visibleData[index];
                            if (!item) return null;
                            const date = new Date(item.time);
                            const timeStr = interval.includes('d')
                                ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                : date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
                            return (
                                <span key={i} className="text-[10px] font-mono text-rive-muted bg-rive-panel/50 px-1 rounded backdrop-blur-sm">
                                    {timeStr}
                                </span>
                            );
                        })}
                    </div>
                )}

                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <Activity className="w-8 h-8 text-rive-accent animate-spin" />
                            <span className="text-rive-muted text-sm">Loading {symbol} Data...</span>
                        </div>
                    </div>
                ) : (
                    <svg
                        viewBox={`0 0 ${width} ${height}`}
                        className="w-full h-full overflow-visible"
                        preserveAspectRatio="none"
                    >
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                            </linearGradient>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {chartType === 'line' ? (
                            <>
                                {/* Area Fill */}
                                <motion.path
                                    d={areaD}
                                    fill="url(#chartGradient)"
                                    stroke="none"
                                    initial={false}
                                    animate={{ d: areaD }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />

                                {/* Line */}
                                <motion.path
                                    d={pathD}
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={false}
                                    animate={{ d: pathD }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    filter="url(#glow)"
                                />
                            </>
                        ) : (
                            renderCandles()
                        )}
                    </svg>
                )}

                {/* Cursor Follower */}
                {hoveredData && !loading && (
                    <>
                        <div
                            className="absolute top-0 bottom-0 w-[1px] bg-white/20 pointer-events-none border-r border-dashed border-white/30"
                            style={{ left: mousePos.x }}
                        />
                        <div
                            className="absolute left-0 right-0 h-[1px] bg-white/20 pointer-events-none border-b border-dashed border-white/30"
                            style={{ top: mousePos.y }}
                        />
                        {chartType === 'line' && (
                            <div
                                className="absolute w-3 h-3 bg-rive-accent rounded-full shadow-[0_0_10px_#3b82f6] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 border-2 border-white"
                                style={{ left: mousePos.x, top: mousePos.y }}
                            />
                        )}
                        {/* Tooltip */}
                        <div
                            className="absolute bg-rive-panel border border-rive-border p-3 rounded-lg shadow-xl pointer-events-none z-50 flex flex-col gap-1 min-w-[140px]"
                            style={{
                                left: mousePos.x + 15,
                                top: mousePos.y - 15
                            }}
                        >
                            <span className="text-xs text-rive-muted">
                                {new Date(hoveredData.time).toLocaleTimeString()}
                            </span>
                            <div className="flex flex-col gap-0.5 mt-1">
                                <div className="flex justify-between gap-4 text-xs">
                                    <span className="text-rive-muted">O:</span>
                                    <span className="font-mono text-white">${hoveredData.open.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between gap-4 text-xs">
                                    <span className="text-rive-muted">H:</span>
                                    <span className="font-mono text-white">${hoveredData.high.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between gap-4 text-xs">
                                    <span className="text-rive-muted">L:</span>
                                    <span className="font-mono text-white">${hoveredData.low.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between gap-4 text-xs">
                                    <span className="text-rive-muted">C:</span>
                                    <span className="font-mono text-white">${hoveredData.close.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Time Controls */}
            <div className="h-12 border-t border-rive-border flex items-center px-4 gap-2 bg-rive-panel/50">
                <div className="flex items-center gap-2 mr-4 text-rive-muted">
                    <Clock size={16} />
                    <span className="text-xs font-medium">Interval</span>
                </div>
                {INTERVALS.map((int) => (
                    <button
                        key={int.value}
                        onClick={() => setInterval(int.value)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${interval === int.value ? 'bg-rive-accent text-white shadow-lg shadow-blue-500/20' : 'text-rive-muted hover:text-white hover:bg-white/5'}`}
                    >
                        {int.label}
                    </button>
                ))}
                <div className="ml-auto flex items-center gap-2 text-xs text-rive-muted">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Live Data (Binance)
                </div>
            </div>
        </div>
    );
}
