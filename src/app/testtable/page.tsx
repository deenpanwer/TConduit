"use client";

import { useState, useMemo, useCallback, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation'; // Needed for potential navigation, though not used heavily here
import { toast } from "sonner"; // For notifications

// --- Mock Data and Hooks (for self-contained example) ---
// In a real app, these would be imported from "@/hooks/use-pos", "@/lib/utils", etc.

// Mock PosTable interface and types
interface PosTable {
    id: string;
    number: string;
    capacity: number;
    floor: string;
    status: 'free' | 'eating' | 'bill';
    lastStatusChange?: string; // ISO string
    imageUrl?: string;
    currentTicketId?: string;
}

interface PosConfig {
    floors: string[];
    storeName?: string;
    storeAddress?: string;
    storePhone?: string;
    defaultTaxRate?: number;
    showProductImagesOnInvoice?: boolean;
    // ... other config properties
}

// Mock usePos hook state and functions
const useMockPos = () => {
    const [tables, setTables] = useState<PosTable[]>([
        // Default tables for demonstration
        { id: 't1', number: '12', capacity: 4, floor: 'Main Floor', status: 'eating', lastStatusChange: new Date(Date.now() - 2.5 * 60 * 1000).toISOString(), imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop' },
        { id: 't2', number: '3', capacity: 6, floor: 'Main Floor', status: 'bill', lastStatusChange: new Date(Date.now() - 0.25 * 60 * 1000).toISOString(), imageUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop' },
        { id: 't3', number: '7', capacity: 2, floor: 'Main Floor', status: 'free', imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06a04b?q=80&w=1974&auto=format&fit=crop' },
        { id: 't4', number: '5', capacity: 4, floor: 'Main Floor', status: 'eating', lastStatusChange: new Date(Date.now() - 65 * 60 * 1000).toISOString(), imageUrl: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?q=80&w=1974&auto=format&fit=crop' },
        { id: 't5', number: '25', capacity: 2, floor: 'Main Floor', status: 'free', imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=2070&auto=format&fit=crop' },
        { id: 't6', number: '10', capacity: 4, floor: 'Second Floor', status: 'free', imageUrl: 'https://images.unsplash.com/photo-1590846406792-044253a43259?q=80&w=2070&auto=format&fit=crop' },
        { id: 't7', number: '11', capacity: 4, floor: 'Second Floor', status: 'eating', lastStatusChange: new Date(Date.now() - 10 * 60 * 1000).toISOString(), imageUrl: 'https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?q=80&w=1935&auto=format&fit=crop' },
    ]);
    const [loading, setLoading] = useState({ tables: false, products: false });
    const config: PosConfig = {
        floors: ['Main Floor', 'Second Floor', 'Patio'],
        storeName: "TRAC Restaurant",
        storeAddress: "123 Culinary Lane",
        storePhone: "555-123-4567",
        defaultTaxRate: 10,
        showProductImagesOnInvoice: true,
    };

    // Corrected Omit type to include imageUrl
    const addTable = async (tableData: Omit<PosTable, 'id' | 'status' | 'lastStatusChange' | 'currentTicketId'>) => {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 300));

        const newId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newTable: PosTable = {
            id: newId,
            number: tableData.number,
            capacity: tableData.capacity,
            floor: tableData.floor,
            status: 'free', // Default status
            lastStatusChange: new Date().toISOString(),
            imageUrl: tableData.imageUrl, // Now correctly handled
            currentTicketId: undefined,
        };
        setTables(prevTables => [...prevTables, newTable]);
        console.log(`Mock addTable: Added ${newTable.number} on ${newTable.floor} with capacity ${newTable.capacity}`);
        return newId; // Return ID if needed by caller
    };

    // Mock other relevant functions from usePos hook if needed by components
    const selectTable = (tableId: string) => console.log(`Mock selectTable: ${tableId}`);
    const loadTicket = async (ticketId: string) => { console.log(`Mock loadTicket: ${ticketId}`); return { id: ticketId, items: [], createdAt: new Date().toISOString() }; };
    const getEntityForInvoice = async (id: string) => { console.log(`Mock getEntityForInvoice: ${id}`); return { data: null, type: 'notFound' }; };
    const getTTSForTable = (table: PosTable) => `Table ${table.number} on ${table.floor}. Capacity ${table.capacity}. Status: ${table.status}.`;

    return { tables, addTable, config, loading, selectTable, loadTicket, getEntityForInvoice, getTTSForTable };
};

// --- Mock UI Components and Utilities ---
// In a real project, these would be imported from "@/components/ui/*" and "@/lib/utils"
const cn = (...classes: any[]) => classes.filter(Boolean).join(" "); // FIX: Allow different types for conditional classes

// Mock icons from lucide-react
const MockIcon = ({ name, size = 16, className }: { name: string, size?: number, className?: string }) => <span className={`mock-icon icon-${name} ${className || ''}`} style={{ fontSize: size }}>{getMockIconChar(name)}</span>;
const Trash2 = (props: any) => <MockIcon name="trash2" {...props} />;
const Plus = (props: any) => <MockIcon name="plus" {...props} />;
const Users = (props: any) => <MockIcon name="users" {...props} />;
const MapIcon = (props: any) => <MockIcon name="map" {...props} />;
const Clock = (props: any) => <MockIcon name="clock" {...props} />;
const Info = (props: any) => <MockIcon name="info" {...props} />;
const CheckCircle2 = (props: any) => <MockIcon name="checkCircle2" {...props} />;
const Play = (props: any) => <MockIcon name="play" {...props} />;
const Edit3 = (props: any) => <MockIcon name="edit3" {...props} />;
const Volume2 = (props: any) => <MockIcon name="volume2" {...props} />;
const X = (props: any) => <MockIcon name="x" {...props} />;
const Printer = (props: any) => <MockIcon name="printer" {...props} />;
const AlertCircle = (props: any) => <MockIcon name="alertCircle" {...props} />;
const ImageIcon = (props: any) => <MockIcon name="image" {...props} />;
const CreditCard = (props: any) => <MockIcon name="creditCard" {...props} />;

function getMockIconChar(name: string): string {
    switch (name) {
        case 'trash2': return '🗑️';
        case 'plus': return '➕';
        case 'users': return '👥';
        case 'map': return '🗺️';
        case 'clock': return '⏰';
        case 'info': return 'ℹ️';
        case 'checkCircle2': return '✅';
        case 'play': return '▶️';
        case 'edit3': return '✏️';
        case 'volume2': return '🔊';
        case 'x': return '❌';
        case 'printer': return '🖨️';
        case 'alertCircle': return '⚠️';
        case 'image': return '🖼️';
        case 'creditCard': return '💳';
        default: return '?';
    }
}

// Mock UI Components (simplified for this self-contained file)
const Button = ({ variant, size, className, onClick, children, ...props }: any) => (
    <button
        onClick={onClick}
        className={`p-2 rounded-md font-semibold m-0.5 border border-gray-300 disabled:opacity-50 dark:border-slate-700 ${className || ''}`}
        style={{ backgroundColor: variant === 'default' ? '#007AFF' : variant === 'destructive' ? '#FF3B30' : variant === 'outline' ? 'transparent' : 'white', color: variant === 'default' || variant === 'destructive' ? 'white' : 'black' }}
        {...props}
    >
        {children}
    </button>
);
const Input = ({ type, value, onChange, placeholder, className, min, ...props }: any) => (
    <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 ${className || ''}`}
        min={min}
        {...props}
    />
);
const Card = ({ className, children }: any) => <div className={`rounded-lg border border-gray-200 shadow-sm dark:border-slate-800 ${className || ''}`}>{children}</div>;
const CardHeader = ({ className, children }: any) => <div className={`p-4 border-b border-gray-200 dark:border-slate-800 ${className || ''}`}>{children}</div>;
const CardContent = ({ className, children }: any) => <div className={`p-4 ${className || ''}`}>{children}</div>;
const Label = ({ htmlFor, children, className }: any) => <label htmlFor={htmlFor} className={`font-bold text-sm block mb-1 ${className || ''}`}>{children}</label>;
const ScrollArea = ({ children, className }: any) => <div className={`overflow-auto ${className || ''}`}>{children}</div>;
const Select = ({ children, value, onChange, className }: any) => (
    <select value={value} onChange={onChange} className={`p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 ${className || ''}`}>
        {children}
    </select>
);
const Dialog = ({ open, onOpenChange, children }: any) => open && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">{children}</div>;
const DialogContent = ({ className, children }: any) => <div className={`bg-white p-6 rounded-lg shadow-lg max-w-sm w-full dark:bg-slate-900 ${className || ''}`}>{children}</div>;
const DialogHeader = ({ children }: any) => <div className="mb-4">{children}</div>;
const DialogTitle = ({ className, children }: any) => <h3 className={`text-xl font-bold ${className || ''}`}>{children}</h3>;
const DialogDescription = ({ className, children }: any) => <p className={`text-sm text-gray-600 dark:text-slate-400 ${className || ''}`}>{children}</p>;
const DialogFooter = ({ className, children }: any) => <div className={`mt-6 flex justify-end gap-3 ${className || ''}`}>{children}</div>;
const DialogTrigger = ({ children }: any) => <button className="inline-block">{children}</button>;
const Popover = ({ children }: any) => <div className="relative inline-block">{children}</div>;
const PopoverTrigger = ({ asChild, children }: any) => children; // Simplified: assume it's just a child element
const PopoverContent = ({ className, children }: any) => <div className={`bg-white p-4 rounded-lg shadow-lg border absolute z-10 dark:bg-slate-800 dark:border-slate-700 ${className || ''}`}>{children}</div>;

// Mock Animated components (simplistic for text wireframe demonstration)
const AnimatedView = ({ style, children, ...props }: any) => <div style={style} {...props}>{children}</div>;
const AnimatedAnimated = ({ style, children, ...props }: any) => <div style={style} {...props}>{children}</div>; // Alias for reanimated component

// Mock SVG components - simplified for text-based wireframes
const SvgCircle = ({ r, fill, className }: any) => (
    <span className={`mock-svg-circle ${className || ''}`} style={{ width: r * 2, height: r * 2, borderRadius: r, backgroundColor: fill, opacity: parseFloat(fill?.replace(/.*,/)) || 1 }}></span>
);
const SvgRect = ({ width, height, fill, className }: any) => (
    <span className={`mock-svg-rect ${className || ''}`} style={{ width: width, height: height, backgroundColor: fill, opacity: parseFloat(fill?.replace(/.*,/)) || 1 }}></span>
);
const SvgPath = ({ fill, className }: any) => (
    <span className={`mock-svg-path ${className || ''}`} style={{ backgroundColor: fill, opacity: parseFloat(fill?.replace(/.*,/)) || 1 }}>SVGPath</span>
);

// --- Floor Plan Variation Components ---
// These components render tables in different visual styles.

// Variation 1: Isometric Tables
const IsometricFloorView = ({ tables, config }: { tables: PosTable[], config: PosConfig }) => {
    const currentFloor = config.floors?.[0] || 'Main Floor';
    const filteredTables = tables.filter(t => t.floor === currentFloor);

    const getStatusInfo = (status: PosTable['status']) => {
        switch (status) {
            case 'free': return { text: 'Available', color: 'text-green-400' };
            case 'eating': return { text: 'Seated', color: 'text-orange-400' };
            case 'bill': return { text: 'Billing', color: 'text-blue-400' };
            default: return { text: 'Unknown', color: 'text-gray-400' };
        }
    };

    return (
        <div className="relative bg-slate-800/30 dark:bg-gray-800/30 p-8 rounded-2xl shadow-inner min-h-[300px] overflow-hidden text-white">
            <div className="absolute top-4 left-4 text-lg font-black uppercase tracking-tighter">{currentFloor}</div>
            {filteredTables.map((table, index) => {
                const statusInfo = getStatusInfo(table.status);
                const col = index % 4;
                const row = Math.floor(index / 4);
                const leftPos = 10 + col * 15;
                const bottomPos = 10 + row * 12;

                return (
                    <div
                        key={table.id}
                        className="absolute bottom-0 -translate-x-1/2 cursor-pointer group hover:scale-110 transition-transform duration-200"
                        style={{
                            left: `${leftPos}%`,
                            bottom: `${bottomPos}%`,
                        }}
                    >
                        <div className="transform skewX(-15deg)">
                            <div className={`relative w-24 h-10 bg-gray-700/80 rounded-t-md shadow-xl 
                                before:absolute before:inset-0 before:bg-gray-500/80 before:rounded-t-md before:-translate-y-2 
                                after:absolute after:inset-0 after:bg-gray-300/80 after:rounded-t-md after:-translate-y-4`}>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black">{table.number}</span>
                                    <span className="text-[9px] font-bold uppercase">{table.capacity} Seats</span>
                                </div>
                            </div>
                            <div className={`mt-[-10px] px-2 py-1 rounded-b-md text-[9px] font-bold uppercase tracking-widest ${statusInfo.color}`}>
                                {statusInfo.text}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Variation 2: Floating Cards
const FloatingCardsFloorView = ({ tables, config }: { tables: PosTable[], config: PosConfig }) => {
    const currentFloor = config.floors?.[0] || 'Main Floor';
    const filteredTables = tables.filter(t => t.floor === currentFloor);

    const getStatusInfo = (status: PosTable['status']) => {
        switch (status) {
            case 'free': return { text: 'Available', color: 'border-green-500/50 text-green-400' };
            case 'eating': return { text: 'Seated', color: 'border-orange-500/50 text-orange-400' };
            case 'bill': return { text: 'Billing', color: 'border-blue-500/50 text-blue-400' };
            default: return { text: 'Unknown', color: 'border-gray-500/50 text-gray-400' };
        }
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 min-h-[300px] p-4 bg-slate-100 dark:bg-gray-900">
            {filteredTables.map((table) => {
                const statusInfo = getStatusInfo(table.status);
                return (
                    <Card
                        key={table.id}
                        className={cn(
                            "group relative cursor-pointer transition-all duration-300 border-2 rounded-2xl overflow-hidden shadow-lg h-48 flex flex-col isolate",
                            "bg-card hover:shadow-2xl hover:border-primary dark:bg-slate-800",
                            statusInfo.color.includes('green') && "border-green-500/50",
                            statusInfo.color.includes('orange') && "border-orange-500/50",
                            statusInfo.color.includes('blue') && "border-blue-500/50"
                        )}
                    >
                        <img src={table.imageUrl || 'https://placehold.co/400x400/303030/FFFFFF?text=TableBG'} alt={`Table ${table.number}`} className="absolute inset-0 w-full h-full object-cover -z-10 opacity-20 group-hover:opacity-30 transition-opacity" />
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-t from-black/70 via-black/30 to-transparent -z-10" />

                        <CardContent className="p-4 flex flex-col h-full text-white relative z-10">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-4xl font-black tracking-tighter">{table.number}</span>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/20 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Edit3 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-auto">
                                <div className={cn("flex items-center gap-2 font-bold uppercase text-xs tracking-widest", statusInfo.color.split(' ')[1])}>
                                    {statusInfo.text}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-300 font-semibold mt-1">
                                    <Users className="h-4 w-4" />
                                    <span>{table.capacity} Seats</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};

// Variation 3: Blueprint Grid
const BlueprintGridFloorView = ({ tables, config }: { tables: PosTable[], config: PosConfig }) => {
    const currentFloor = config.floors?.[0] || 'Main Floor';
    const filteredTables = tables.filter(t => t.floor === currentFloor);

    const getStatusSymbol = (status: PosTable['status']) => {
        switch (status) {
            case 'free': return <span className="text-green-400">●</span>;
            case 'eating': return <span className="text-orange-400">●</span>;
            case 'bill': return <span className="text-blue-400">■</span>;
            default: return <span className="text-gray-400">?</span>;
        }
    };

    const GridCell = ({ children, hasTable }: { children: React.ReactNode, hasTable?: boolean }) => (
        <div className={cn("w-20 h-20 border flex items-center justify-center relative transition-colors duration-200", hasTable ? "border-primary/50 bg-primary/5" : "border-slate-700/50 bg-slate-900")}>
            {children}
        </div>
    );

    const gridSize = 6;
    const gridCells = Array.from({ length: gridSize * gridSize });

    const tableGridMap = new Map<number, PosTable>();
    filteredTables.forEach((table, index) => {
        if (index < gridCells.length) {
            tableGridMap.set(index, table);
        }
    });

    return (
        <div className="relative bg-slate-900 p-6 rounded-2xl shadow-inner min-h-[300px] overflow-hidden">
            <div className="absolute top-4 left-4 text-white font-black text-lg">{currentFloor}</div>
            <div className={`grid grid-cols-${gridSize} gap-1`}>
                {gridCells.map((_, i) => {
                    const table = tableGridMap.get(i);
                    return (
                        <GridCell key={i} hasTable={!!table}>
                            {table ? (
                                <div className="text-center text-white group cursor-pointer">
                                    <div className="text-2xl font-black">{table.number}</div>
                                    <div className="text-xs leading-none flex items-center justify-center gap-1">
                                        {getStatusSymbol(table.status)} {table.capacity}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-slate-500/30 text-xs">.</div>
                            )}
                        </GridCell>
                    );
                })}
            </div>
        </div>
    );
};

// Variation 4: Interactive Zones
const InteractiveZonesFloorView = ({ tables, config }: { tables: PosTable[], config: PosConfig }) => {
    const currentFloor = config.floors?.[0] || 'Main Floor';
    const filteredTables = tables.filter(t => t.floor === currentFloor);

    const [activeTableDetails, setActiveTableDetails] = useState<PosTable | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    const handleTableInteraction = (table: PosTable) => { // FIX: Removed unused 'e' parameter
        setActiveTableDetails(table);
        setShowDetails(true);
    };

    const getStatusInfo = (status: PosTable['status']) => {
        switch (status) {
            case 'free': return { text: 'Available', color: 'bg-green-500/30 text-green-400' };
            case 'eating': return { text: 'Seated', color: 'bg-orange-500/30 text-orange-400' };
            case 'bill': return { text: 'Billing', color: 'bg-blue-500/30 text-blue-400' };
            default: return { text: 'Unknown', color: 'bg-gray-500/30 text-gray-400' };
        }
    };

    const PopoverContentMock = ({ table }: { table: PosTable }) => {
        const statusInfo = getStatusInfo(table.status);
        return (
            <div className="p-3 w-48 bg-white rounded-lg shadow-xl border border-gray-200 text-gray-800 text-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-black text-lg">{table.number}</span>
                    <Button variant="outline" size="sm">Edit</Button>
                </div>
                <div className={`font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${statusInfo.color.split(' ')[1]}`}>{statusInfo.text}</div>
                <div className="mt-2 text-gray-600 dark:text-slate-400">Capacity: {table.capacity}</div>
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700 text-right">
                    <Button variant="default" size="sm" className="bg-primary">View Details</Button>
                </div>
            </div>
        );
    };

    const Zone = ({ table, children }: { table: PosTable, children: React.ReactNode }) => (
        <div
            className="absolute cursor-pointer hover:bg-primary/10 transition-colors duration-200 border-dashed border-primary/30"
            style={{
                left: `${(parseInt(table.number) % 3) * 20 + 5}%`,
                top: `${(Math.floor(parseInt(table.number) / 3) % 3) * 25 + 15}%`,
                width: `${20 - 5}%`,
                height: `${25 - 5}%`,
                borderWidth: table.status === 'free' ? '1px' : table.status === 'eating' ? '2px' : '3px',
                borderColor: table.status === 'free' ? '#60A5FA' : table.status === 'eating' ? '#F97316' : '#3B82F6',
            }}
            onClick={() => handleTableInteraction(table)}
        >
            {children}
        </div>
    );

    return (
        <div className="relative bg-slate-900 p-6 rounded-2xl shadow-inner min-h-[300px] overflow-hidden">
            <div className="absolute top-4 left-4 text-white font-black text-lg">{currentFloor}</div>
            {filteredTables.map((table) => (
                <Zone key={table.id} table={table}>
                    <div className="absolute bottom-2 left-2 text-white/80 text-xs font-bold flex items-center gap-1">
                        {table.number} {table.capacity}
                    </div>
                </Zone>
            ))}
            {showDetails && activeTableDetails && (
                <div
                    className="absolute z-20"
                    style={{
                        top: `calc(${15 + (Math.floor(parseInt(activeTableDetails.number) / 3) % 3) * 25 + 5}% + 10px)`,
                        left: `${(parseInt(activeTableDetails.number) % 3) * 20 + 5}%`,
                    }}
                >
                    <PopoverContentMock table={activeTableDetails} />
                </div>
            )}
        </div>
    );
};

// Variation 5: Iconic Tables
const IconicTablesFloorView = ({ tables, config }: { tables: PosTable[], config: PosConfig }) => {
    const currentFloor = config.floors?.[0] || 'Main Floor';
    const filteredTables = tables.filter(t => t.floor === currentFloor);

    const getStatusInfo = (status: PosTable['status']) => {
        switch (status) {
            case 'free': return { text: 'Free', icon: <CheckCircle2 className="h-4 w-4 text-green-400" />, color: 'text-green-400' };
            case 'eating': return { text: 'Seated', icon: <Users className="h-4 w-4 text-orange-400" />, color: 'text-orange-400' };
            case 'bill': return { text: 'Billing', icon: <CreditCard className="h-4 w-4 text-blue-400" />, color: 'text-blue-400' };
            default: return { text: 'Unknown', icon: <Info className="h-4 w-4 text-gray-400" />, color: 'text-gray-400' };
        }
    };

    const TableIcon = ({ table }: { table: PosTable }) => {
        const statusInfo = getStatusInfo(table.status);
        const iconShape = table.capacity <= 2 ? 'round' : 'square';
        const IconComponent = iconShape === 'round'
            ? ({ children }: { children: React.ReactNode }) => <span className="inline-block w-10 h-10 rounded-full bg-gray-700/70 flex items-center justify-center">{children}</span>
            : ({ children }: { children: React.ReactNode }) => <span className="inline-block w-12 h-8 bg-gray-700/70 flex items-center justify-center">{children}</span>;

        return (
            <div className="relative text-center text-white group cursor-pointer">
                <IconComponent>
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-2xl font-black">{table.number}</span>
                        <span className="text-[9px] font-bold uppercase">{table.capacity}</span>
                    </div>
                </IconComponent>
                <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-widest ${statusInfo.color.split(' ')[1] || 'text-gray-400'}`}>
                    {statusInfo.icon} {statusInfo.text}
                </div>
                <Button variant="ghost" size="icon" className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-black/20 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit3 className="h-4 w-4" />
                </Button>
            </div>
        );
    };

    return (
        <div className="relative bg-slate-900 p-6 rounded-2xl shadow-inner min-h-[300px] overflow-hidden">
            <div className="absolute top-4 left-4 text-white font-black text-lg">{currentFloor}</div>
            <div className="grid grid-cols-4 gap-8 p-8">
                {filteredTables.map((table) => (
                    <TableIcon key={table.id} table={table} />
                ))}
            </div>
        </div>
    );
};


// --- Main TestTable Page Component ---
export default function TestTablePage() {
    const { tables, addTable, config, loading } = useMockPos();
    const [seatingNumber, setSeatingNumber] = useState<string>("2");
    const [floorFilter, setFloorFilter] = useState(config.floors?.[0] || 'Main Floor');

    const handleAddTable = useCallback(async () => {
        const capacity = parseInt(seatingNumber, 10);
        if (isNaN(capacity) || capacity <= 0) {
            toast.error("Please enter a valid seating number.");
            return;
        }

        const newTableNumber = `T-${Math.floor(Math.random() * 10000)}`;
        
        const newTableData: Omit<PosTable, 'id' | 'status' | 'lastStatusChange' | 'imageUrl' | 'currentTicketId'> = {
            number: newTableNumber,
            capacity: capacity,
            floor: floorFilter,
        };

        try {
            await addTable(newTableData);
            toast.success(`Table ${newTableNumber} added with ${capacity} seats.`);
        } catch (error) {
            toast.error("Failed to add table.");
            console.error("Error adding table:", error);
        }
    }, [seatingNumber, floorFilter, addTable]);

    const tablesForCurrentFloor = useMemo(() => {
        return tables.filter(t => t.floor === floorFilter);
    }, [tables, floorFilter]);

    if (loading.tables) {
        return <div className="min-h-screen flex items-center justify-center">Loading tables...</div>;
    }

    return (
        <div className="p-4 bg-slate-100 dark:bg-black min-h-screen text-slate-800 dark:text-slate-200">
            <div className="flex flex-col md:flex-row items-center gap-4 mb-6 sticky top-0 z-50 p-4 bg-slate-100/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-border rounded-b-lg shadow-sm">
                <h1 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Table Variations Test</h1>
                
                <div className="flex items-center gap-2">
                    <label htmlFor="floor-select" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Floor:</label>
                    <Select
                        id="floor-select"
                        value={floorFilter}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setFloorFilter(e.target.value)}
                        className="bg-card border-border px-3 py-1.5 rounded-md focus:ring-primary focus:border-primary text-sm"
                    >
                        {(config.floors && config.floors.length > 0 ? config.floors : ["Main Floor"]).map(floor => (
                            <option key={floor} value={floor}>{floor}</option>
                        ))}
                    </Select>
                </div>

                <Input
                    type="number"
                    value={seatingNumber}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSeatingNumber(e.target.value)}
                    placeholder="Seating capacity"
                    className="w-32 h-10"
                    min="1"
                />
                <Button onClick={handleAddTable} className="h-10 px-6 shadow-lg bg-primary text-white dark:bg-blue-600">
                    Add Table
                </Button>
            </div>

            <div className="space-y-12">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter mb-4 dark:text-white">1. Isometric View</h2>
                    <IsometricFloorView tables={tablesForCurrentFloor} config={config} />
                </div>

                <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter mb-4 dark:text-white">2. Floating Cards</h2>
                    <FloatingCardsFloorView tables={tablesForCurrentFloor} config={config} />
                </div>

                <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter mb-4 dark:text-white">3. Blueprint Grid</h2>
                    <BlueprintGridFloorView tables={tablesForCurrentFloor} config={config} />
                </div>

                <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter mb-4 dark:text-white">4. Interactive Zones</h2>
                    <InteractiveZonesFloorView tables={tablesForCurrentFloor} config={config} />
                </div>

                <div>
                    <h2 className="text-xl font-black uppercase tracking-tighter mb-4 dark:text-white">5. Iconic Tables</h2>
                    <IconicTablesFloorView tables={tablesForCurrentFloor} config={config} />
                </div>
            </div>
        </div>
    );
}
