import React from 'react';
import { LayoutDashboard, BarChart2, Wallet, Settings, HelpCircle, LogOut } from 'lucide-react';
import RiveAnimation from './RiveAnimation';

const SidebarItem = ({ icon: Icon, label, active = false }) => (
    <div className={`
    flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 group
    ${active
            ? 'bg-rive-accent text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]'
            : 'text-rive-muted hover:bg-white/5 hover:text-white'
        }
  `}>
        <Icon size={20} className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
        <span className="font-medium text-sm">{label}</span>
        {active && (
            <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_white]" />
        )}
    </div>
);

export default function Sidebar() {
    return (
        <div className="w-64 bg-rive-panel border-r border-rive-border flex flex-col p-4 z-20">
            <div className="flex items-center gap-3 px-4 py-6 mb-6">
                <div className="w-8 h-8 bg-rive-accent rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                    <div className="w-4 h-4 bg-white rounded-sm rotate-45" />
                </div>
                <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    RiveTrade
                </h1>
            </div>

            <div className="flex flex-col gap-2 flex-1">
                <SidebarItem icon={LayoutDashboard} label="Dashboard" active />
                <SidebarItem icon={BarChart2} label="Markets" />
                <SidebarItem icon={Wallet} label="Wallet" />
                <div className="my-4 h-[1px] bg-rive-border/50 mx-4" />
                <SidebarItem icon={Settings} label="Settings" />
                <SidebarItem icon={HelpCircle} label="Support" />
            </div>

            {/* Rive Animation Area */}
            <div className="h-40 w-full bg-black/20 rounded-xl overflow-hidden mb-4 border border-rive-border/50 relative group">
                <div className="absolute inset-0 bg-gradient-to-t from-rive-panel to-transparent z-10 pointer-events-none" />
                <RiveAnimation
                    src="https://cdn.rive.app/animations/vehicles.riv"
                    stateMachines="bumpy"
                    className="opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                />
                <div className="absolute bottom-3 left-0 right-0 text-center z-20">
                    <span className="text-[10px] font-mono text-rive-muted uppercase tracking-widest">System Active</span>
                </div>
            </div>

            <div className="mt-auto">
                <SidebarItem icon={LogOut} label="Logout" />
            </div>
        </div>
    );
}
