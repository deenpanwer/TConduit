import React, { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Upload, FileText, AlertTriangle, AlertCircle, 
  Loader2, ChevronRight, Settings, Info, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import * as xlsx from "xlsx";

interface LeadImportDrawerProps {
  onClose: () => void;
  config: any; // CRM leads module configuration
  addEntity: (payload: { name: string; data: Record<string, any> }) => Promise<string | null>;
  employees: any[];
  existingLeads: any[];
}

export function LeadImportDrawer({
  onClose,
  config,
  addEntity,
  employees: _employees, // prefixed with underscore to indicate it is intentionally unused/reserved for future assignment features
  existingLeads
}: LeadImportDrawerProps) {
  const [activeTab, setActiveTab] = useState<"file" | "paste">("file");
  const [isDragging, setIsDragging] = useState(false);
  const [openDropdownHeader, setOpenDropdownHeader] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Parsed state
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<string[][]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  
  // Progress state
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);

  // User and Org Data
  const { user, userData } = useAuth();
  const [orgData, setOrgData] = useState<any>(null);
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);
  
  // Duplicates State
  const [duplicateMode, setDuplicateMode] = useState(false);
  const [duplicateRows, setDuplicateRows] = useState<any[]>([]);
  const [validRows, setValidRows] = useState<any[]>([]);
  const [selectedDuplicateIndices, setSelectedDuplicateIndices] = useState<Set<number>>(new Set());
  const [dupPage, setDupPage] = useState(0);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const orgId = userData?.ownedOrgId || userData?.orgId || user?.uid;
    if (!orgId) return;
    const unsub = onSnapshot(doc(db, 'organizations', orgId), (snap) => {
      if (snap.exists()) setOrgData(snap.data());
    });
    return () => unsub();
  }, [user, userData]);

  const isPremium = orgData?.isPremium || false;
  const isStandard = orgData?.isStandard || false;
  const tier = isPremium ? 'Premium' : isStandard ? 'Standard' : 'Free';
  const importLimit = isPremium ? 'Unlimited' : isStandard ? 10000 : 1000;

  // Clean empty rows
  const cleanRows = useMemo(() => {
    return parsedRows.filter(row => row.some(cell => cell.trim() !== ""));
  }, [parsedRows]);

  const hasIssues = useMemo(() => {
    if (importLimit === 'Unlimited') return false;
    return cleanRows.length > (importLimit as number);
  }, [cleanRows, importLimit]);

  // Autodetect delimiter and parse text/csv
  const processCSVText = (text: string, nameForDisplay = "Pasted Data") => {
    if (!text.trim()) {
      setParseError("The content appears to be empty.");
      return;
    }
    
    try {
      const delimiter = detectDelimiter(text);
      const rows = parseCSV(text, delimiter);
      
      if (rows.length === 0) {
        setParseError("Could not parse any valid rows from the content.");
        return;
      }
      
      const headers = rows[0].map(h => h.trim());
      const dataRows = rows.slice(1);
      
      setParsedHeaders(headers);
      setParsedRows(dataRows);
      setParseError(null);
      
      // Auto-mapping columns based on header name
      const initialMappings: Record<string, string> = {};
      const leadFields = (config?.fields || []).filter((f: any) => f.key !== 'lastInteraction' && f.isVisible !== false);
      
      headers.forEach(header => {
        const cleanHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "");
        const match = leadFields.find((f: any) => {
          const cleanKey = f.key.toLowerCase().replace(/[^a-z0-9]/g, "");
          const cleanLabel = f.label.toLowerCase().replace(/[^a-z0-9]/g, "");
          return cleanKey === cleanHeader || cleanLabel === cleanHeader;
        });
        initialMappings[header] = match ? match.key : "";
      });
      
      setColumnMappings(initialMappings);
    } catch (err) {
      console.error(err);
      setParseError("Failed to parse the data format. Please check the structure.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelected(file);
    }
  };

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = xlsx.read(data, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = xlsx.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (!json || json.length === 0) {
            setParseError("Could not parse any valid rows from the Excel file.");
            return;
          }
          
          // filter out completely empty rows
          const rows = json.filter(row => row && row.some(cell => cell !== undefined && cell !== null && cell !== ''));
          if (rows.length === 0) {
            setParseError("Excel file appears to be empty.");
            return;
          }

          const headers = rows[0].map(h => String(h).trim());
          const dataRows = rows.slice(1).map(row => row.map(cell => cell !== undefined && cell !== null ? String(cell) : ""));
          
          setParsedHeaders(headers);
          setParsedRows(dataRows);
          setParseError(null);
          
          // Auto-mapping columns based on header name
          const initialMappings: Record<string, string> = {};
          const leadFields = (config?.fields || []).filter((f: any) => f.key !== 'lastInteraction' && f.isVisible !== false);
          
          headers.forEach(header => {
            const cleanHeader = header.toLowerCase().replace(/[^a-z0-9]/g, "");
            const match = leadFields.find((f: any) => {
              const cleanKey = f.key.toLowerCase().replace(/[^a-z0-9]/g, "");
              const cleanLabel = f.label.toLowerCase().replace(/[^a-z0-9]/g, "");
              return cleanKey === cleanHeader || cleanLabel === cleanHeader;
            });
            initialMappings[header] = match ? match.key : "";
          });
          
          setColumnMappings(initialMappings);
        } catch (err) {
          console.error("Excel parse error", err);
          setParseError("Failed to parse the Excel file format. Please check the structure.");
        }
      };
      reader.readAsBinaryString(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        processCSVText(text, file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.name.endsWith(".csv") || file.name.endsWith(".tsv") || file.name.endsWith(".txt") || file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        handleFileSelected(file);
      } else {
        setParseError("Please upload a .csv, .tsv, .txt, .xlsx or .xls file.");
      }
    }
  };

  const handlePasteSubmit = () => {
    processCSVText(pastedText, "Pasted Text");
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPastedText("");
    setParsedHeaders([]);
    setParsedRows([]);
    setColumnMappings({});
    setParseError(null);
    setImportProgress(0);
    setImportTotal(0);
    setIsImporting(false);
    setDuplicateMode(false);
    setDuplicateRows([]);
    setValidRows([]);
    setSelectedDuplicateIndices(new Set());
    setDupPage(0);
  };

  const handleImport = async () => {
    if (cleanRows.length === 0 || isImporting || hasIssues) return;
    
    // First, scan for duplicates
    const payloads: any[] = [];
    
    cleanRows.forEach((row, i) => {
      const payloadData: Record<string, any> = {};
      
      parsedHeaders.forEach((header, colIndex) => {
        const fieldKey = columnMappings[header];
        if (!fieldKey) return; 
        
        const field = config.fields.find((f: any) => f.key === fieldKey);
        const rawValue = row[colIndex] || "";
        if (field) {
          payloadData[fieldKey] = formatImportValue(rawValue, field.type, field);
        }
      });
      
      const firstName = payloadData.firstName || "";
      const lastName = payloadData.lastName || "";
      const company = payloadData.company || payloadData.organization || "";
      const calculatedName = `${firstName} ${lastName}`.trim() || company || "Imported Lead";
      
      payloads.push({
        name: calculatedName,
        data: payloadData,
        _originalRowIndex: i
      });
    });
    
    // Create Set of existing emails for O(1) lookup
    const existingEmails = new Set(
      (existingLeads || [])
        .map(l => l.data?.email?.toLowerCase()?.trim())
        .filter(Boolean)
    );
    
    const duplicates: any[] = [];
    const valid: any[] = [];
    
    payloads.forEach(p => {
      const email = p.data.email?.toLowerCase()?.trim();
      if (email && existingEmails.has(email)) {
        duplicates.push(p);
      } else {
        valid.push(p);
      }
    });
    
    if (duplicates.length > 0) {
      setDuplicateRows(duplicates);
      setValidRows(valid);
      setDuplicateMode(true);
    } else {
      executeImport(valid);
    }
  };

  const executeImport = async (payloadsToImport: any[]) => {
    if (payloadsToImport.length === 0) {
      toast.error("No selected leads to import.");
      setIsImporting(false);
      return;
    }

    setIsImporting(true);
    setImportTotal(payloadsToImport.length);
    setImportProgress(0);
    
    let successCount = 0;
    let failCount = 0;



    // Inform user that sync is happening in background and they shouldn't close the tab
    const syncToastId = toast.loading("Syncing imported leads with backend database. Please do not close this tab... 0%", {
      duration: Infinity
    });

    const addEntityWithRetry = async (p: any, maxRetries = 3): Promise<boolean> => {
      let delay = 200;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const res = await addEntity({
            name: p.name,
            data: { ...p.data, _isImported: true }
          });
          if (res) return true;
        } catch (err) {
          console.warn(`Attempt ${attempt} failed for lead ${p.name}:`, err);
        }
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 1.5;
        }
      }
      return false;
    };
    
    // Process in larger parallel batches of 50 for faster trickling
    const BATCH_SIZE = 50; 
    for (let i = 0; i < payloadsToImport.length; i += BATCH_SIZE) {
      const batch = payloadsToImport.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (p) => {
          const success = await addEntityWithRetry(p);
          if (success) {
            successCount++;
          } else {
            failCount++;
          }
          setImportProgress(prev => {
            const nextProgress = prev + 1;
            const percentage = Math.round((nextProgress / payloadsToImport.length) * 100);
            toast.loading(`Syncing imported leads with backend database. Please do not close this tab... ${percentage}%`, {
              id: syncToastId
            });
            return nextProgress;
          });
        })
      );
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    toast.dismiss(syncToastId);
    
    if (failCount > 0) {
      toast.error(`Import completed with ${failCount} errors.`);
    } else {
      toast.success(`Successfully imported ${successCount} leads!`);
    }

    setIsImporting(false);
    handleReset();
    onClose();
  };

  // CSV parsing algorithms
  const detectDelimiter = (text: string): string => {
    const firstLine = text.split(/\r?\n/)[0] || "";
    const commaCount = (firstLine.match(/,/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    return tabCount > commaCount ? "\t" : ",";
  };

  const parseCSV = (text: string, delimiter: string): string[][] => {
    const result: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentVal = "";
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        row.push(currentVal);
        currentVal = "";
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        row.push(currentVal);
        result.push(row);
        row = [];
        currentVal = "";
        if (char === '\r' && nextChar === '\n') {
          i++; // skip double newline chars (crlf)
        }
      } else {
        currentVal += char;
      }
    }
    
    if (currentVal !== "" || row.length > 0) {
      row.push(currentVal);
      result.push(row);
    }
    
    return result;
  };

  // Graceful data matching
  const formatImportValue = (val: string, type: string, field: any) => {
    const cleanVal = val.trim();
    if (!cleanVal) return "";
    
    switch (type) {
      case 'number':
      case 'currency': {
        const numStr = cleanVal.replace(/[^0-9.-]/g, '');
        const num = parseFloat(numStr);
        return isNaN(num) ? 0 : num;
      }
      case 'checkbox': {
        return ['true', 'yes', '1', 'y', 'checked', 'active'].includes(cleanVal.toLowerCase());
      }
      case 'date': {
        const timestamp = Date.parse(cleanVal);
        if (!isNaN(timestamp)) {
          return new Date(timestamp).toISOString();
        }
        return cleanVal;
      }
      case 'select': {
        const options = field.options || [];
        const match = options.find((o: any) => 
          o.label.toLowerCase() === cleanVal.toLowerCase() ||
          o.value.toLowerCase() === cleanVal.toLowerCase()
        );
        return match ? match.value : cleanVal;
      }
      default:
        return cleanVal;
    }
  };

  const hasMappedColumns = Object.values(columnMappings).some(val => val !== "");

  if (!mounted) return null;

  return createPortal(
    <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => !isImporting && onClose()} 
            className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-sm" 
          />
          
          {/* Drawer Wrapper */}
          <motion.div
            initial={{ opacity: 0, x: 200 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 200 }} 
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="fixed inset-y-3 right-3 z-[100] w-full max-w-[650px] bg-card/95 border border-border/50 shadow-2xl rounded-[2rem] overflow-hidden flex flex-col outline-none backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-border/20 shrink-0 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                  Add data to <span className="text-blue-600">Leads</span>
                </h2>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                  Upload a CSV/Excel file or paste spreadsheet tabular rows to import leads.
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full border border-border/40"
                onClick={onClose}
                disabled={isImporting}
              >
                <X size={14} />
              </Button>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {duplicateMode ? (
                // Step 3: Duplicate Review UI
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Warning Header */}
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 text-blue-700 dark:text-blue-300">
                    <AlertTriangle className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" size={16} />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider mb-1">Duplicate Leads Detected</h4>
                      <p className="text-[10px] leading-relaxed font-semibold uppercase opacity-90">
                        We found {duplicateRows.length} duplicate lead{duplicateRows.length === 1 ? '' : 's'} (matching by email). 
                        Check the box next to any duplicate you wish to import anyway, or leave them unchecked to exclude them.
                      </p>
                    </div>
                  </div>

                  {/* Duplicate List container */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-foreground">
                        Duplicates to Import: {selectedDuplicateIndices.size} of {duplicateRows.length}
                      </span>
                      {Math.ceil(duplicateRows.length / 50) > 1 && (
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                          Page {dupPage + 1} of {Math.ceil(duplicateRows.length / 50)}
                        </span>
                      )}
                    </div>

                    <div className="border border-border/20 rounded-2xl overflow-hidden bg-background/50 divide-y divide-border/20">
                      {/* Master Checkbox Header */}
                      <div className="p-3.5 bg-muted/20 flex items-center justify-between">
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={selectedDuplicateIndices.size === duplicateRows.length}
                            onChange={() => {
                              if (selectedDuplicateIndices.size === duplicateRows.length) {
                                setSelectedDuplicateIndices(new Set());
                              } else {
                                setSelectedDuplicateIndices(new Set(duplicateRows.map((_, idx) => idx)));
                              }
                            }}
                            className="rounded border-border/40 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer accent-blue-600"
                          />
                          <span className="text-[10px] font-black uppercase tracking-wider text-foreground">
                            {selectedDuplicateIndices.size === duplicateRows.length ? "Deselect All Duplicates" : "Select All Duplicates"}
                          </span>
                        </label>
                      </div>

                      {/* Paginated Rows */}
                      {duplicateRows.slice(dupPage * 50, (dupPage + 1) * 50).map((dup, pIdx) => {
                        const globalIdx = dupPage * 50 + pIdx;
                        return (
                          <div key={globalIdx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-blue-500/[0.02] transition-colors">
                            <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 select-none">
                              <input 
                                type="checkbox" 
                                checked={selectedDuplicateIndices.has(globalIdx)}
                                onChange={() => {
                                  const next = new Set(selectedDuplicateIndices);
                                  if (next.has(globalIdx)) {
                                    next.delete(globalIdx);
                                  } else {
                                    next.add(globalIdx);
                                  }
                                  setSelectedDuplicateIndices(next);
                                }}
                                className="rounded border-border/40 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer accent-blue-600"
                              />
                              <div className="flex flex-col min-w-0">
                                <span className="text-[10px] font-black uppercase text-foreground truncate">{dup.name}</span>
                                <span className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5 truncate">{dup.data.email}</span>
                              </div>
                            </label>
                            <div className="shrink-0 flex items-center gap-2">
                              {dup.data.company && (
                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground bg-muted/40 px-2 py-0.5 rounded">
                                  {dup.data.company}
                                </span>
                              )}
                              <Badge className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-black uppercase tracking-wider">
                                Duplicate
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pagination Controls */}
                  {Math.ceil(duplicateRows.length / 50) > 1 && (
                    <div className="flex justify-between items-center bg-muted/10 border border-border/20 p-2 rounded-xl">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={dupPage === 0}
                        onClick={() => setDupPage(p => Math.max(0, p - 1))}
                        className="text-[9px] font-black uppercase tracking-wider h-8"
                      >
                        Prev Page
                      </Button>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                        Page {dupPage + 1} of {Math.ceil(duplicateRows.length / 50)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={dupPage >= Math.ceil(duplicateRows.length / 50) - 1}
                        onClick={() => setDupPage(p => p + 1)}
                        className="text-[9px] font-black uppercase tracking-wider h-8"
                      >
                        Next Page
                      </Button>
                    </div>
                  )}
                </div>
              ) : parsedHeaders.length === 0 ? (
                // Step 1: Upload / Paste source
                <div className="space-y-4">
                  {/* Tab Selector */}
                  <div className="grid grid-cols-2 bg-muted/20 p-1 rounded-xl border border-border/10">
                    <button 
                      onClick={() => setActiveTab("file")} 
                      className={cn(
                        "py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors",
                        activeTab === "file" ? "bg-card text-foreground shadow-sm border border-border/20" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Upload File
                    </button>
                    <button 
                      onClick={() => setActiveTab("paste")} 
                      className={cn(
                        "py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors",
                        activeTab === "paste" ? "bg-card text-foreground shadow-sm border border-border/20" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Paste Text
                    </button>
                  </div>

                  {activeTab === "file" ? (
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={cn(
                        "border-2 border-dashed border-border/40 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/[0.01] transition-all min-h-[200px]",
                        isDragging && "border-blue-500 bg-blue-500/[0.03]"
                      )}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept=".csv,.tsv,.txt,.xlsx,.xls" 
                      />
                      <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
                        <Upload size={24} />
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-xs font-bold text-foreground">
                          Drag & drop or <span className="text-blue-500 hover:underline">browse</span> files
                        </p>
                        <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                          Accepts .csv, .tsv, .txt, .xlsx, .xls
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-[10px] font-semibold text-muted-foreground leading-normal uppercase">
                        Copy a table from a spreadsheet program (such as Google Sheets or Excel) and paste it below. The first row should contain the column headers.
                      </p>
                      <textarea
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder="First Name&#9;Last Name&#9;Company&#9;Status&#10;Jane&#9;Smith&#9;Acme Corp&#9;New&#10;John&#9;Doe&#9;Google&#9;Qualified"
                        className="w-full h-44 p-4 text-xs font-mono border border-border/40 rounded-xl bg-background text-foreground focus:ring-1 focus:ring-blue-500/30 outline-none resize-none"
                      />
                      <Button 
                        onClick={handlePasteSubmit} 
                        disabled={!pastedText.trim()}
                        className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl"
                      >
                        Parse Pasted Data
                      </Button>
                    </div>
                  )}

                  {parseError && (
                    <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex gap-2.5 items-start">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <h4 className="text-[10px] font-black uppercase tracking-wider">Format Error</h4>
                        <p className="text-[9px] font-bold leading-normal">{parseError}</p>
                      </div>
                    </div>
                  )}

                  {/* Limit note with Dropdown */}
                  <div className="bg-secondary/30 border border-border/20 rounded-xl overflow-hidden mt-4">
                    <button 
                      onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)}
                      className="w-full p-3.5 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex gap-2.5 items-start text-left">
                        <Info size={16} className="shrink-0 text-blue-500 mt-0.5" />
                        <div className="space-y-0.5">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-foreground">Import Limit Alert</h4>
                          <p className="text-[9px] font-bold text-muted-foreground leading-normal uppercase">
                            Maximum <span className="text-blue-600 font-extrabold">{importLimit === 'Unlimited' ? 'unlimited' : (importLimit as number).toLocaleString()}</span> rows can be uploaded at a time. Click to view all plan limits.
                          </p>
                        </div>
                      </div>
                      <ChevronDown size={14} className={cn("text-muted-foreground transition-transform shrink-0", isPlanDropdownOpen && "rotate-180")} />
                    </button>
                    <AnimatePresence>
                      {isPlanDropdownOpen && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-3.5 pb-3.5 border-t border-border/10"
                        >
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {[
                              { name: 'Free', limit: '1,000' },
                              { name: 'Standard', limit: '10,000' },
                              { name: 'Premium', limit: 'Unlimited' }
                            ].map(t => (
                              <div key={t.name} className={cn(
                                "p-2 rounded-lg border flex flex-col items-center justify-center text-center",
                                t.name === tier ? "border-blue-500/50 bg-blue-500/5" : "border-border/40 bg-background/50"
                              )}>
                                <span className="text-[9px] font-black uppercase text-foreground">{t.name}</span>
                                <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">{t.limit} rows</span>
                                {t.name === tier && <span className="text-[7px] font-black uppercase tracking-widest text-blue-500 mt-1">Current</span>}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                // Step 2: Configuration & Matching
                <div className="space-y-6">
                  {/* File Metadata info */}
                  <div className="flex items-center justify-between p-3 border border-border/20 bg-muted/10 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <FileText size={16} className="text-blue-500" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-foreground uppercase truncate max-w-[240px]">
                          {selectedFile ? selectedFile.name : "Tabular Pasted Text"}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                          {cleanRows.length} rows detected
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Button 
                        variant="ghost" 
                        onClick={handleReset} 
                        className="text-[9px] font-black text-red-500 uppercase hover:bg-red-500/10 px-3 rounded-lg h-7"
                      >
                        Clear Data
                      </Button>
                    </div>
                  </div>

                  {/* Errors / Warnings */}
                  {hasIssues && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex gap-3 text-orange-600 dark:text-orange-400">
                      <AlertCircle className="shrink-0 mt-0.5" size={16} />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-1">Import limit exceeded</h4>
                        <p className="text-[10px] leading-relaxed opacity-90 font-medium">
                          Your {tier} plan allows up to {importLimit === 'Unlimited' ? 'Unlimited' : (importLimit as number).toLocaleString()} rows per import. 
                          You are attempting to import {cleanRows.length.toLocaleString()} rows. Please split your file or upgrade your plan.
                        </p>
                      </div>
                    </div>
                  )}

                  {!hasMappedColumns && (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl flex gap-2.5 items-start">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <h4 className="text-[10px] font-black uppercase tracking-wider">No Columns Mapped</h4>
                        <p className="text-[9px] font-bold leading-normal uppercase">
                          Select at least one column mapping configuration below to start importing.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                      <Settings size={14} className="text-blue-500" /> Match CSV/Excel Headers to CRM Fields
                    </h3>
                    <div className="border border-border/20 rounded-2xl overflow-hidden divide-y divide-border/20 bg-background/50">
                      {parsedHeaders.map(header => {
                        const currentMappedKey = columnMappings[header];
                        const matchedField = config.fields.find((f: any) => f.key === currentMappedKey);
                        return (
                          <div key={header} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-black text-foreground uppercase truncate block">
                                {header}
                              </span>
                              <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 block">
                                First value: "{parsedRows[0]?.[parsedHeaders.indexOf(header)] || "-"}"
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2 relative">
                              <ChevronRight size={14} className="text-muted-foreground/40 hidden sm:block" />
                              
                              {/* Custom Dropdown Trigger */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={() => setOpenDropdownHeader(openDropdownHeader === header ? null : header)}
                                  className="h-8 bg-card border border-border/40 hover:bg-muted/10 text-[10px] font-bold uppercase rounded-lg px-3 flex items-center justify-between gap-2 text-foreground min-w-[200px] text-left transition-colors"
                                >
                                  <span className="truncate">
                                    {matchedField ? `${matchedField.label} (${matchedField.type})` : "Ignore (Do not import)"}
                                  </span>
                                  <ChevronRight size={12} className={cn("text-muted-foreground/60 transition-transform shrink-0", openDropdownHeader === header && "rotate-90")} />
                                </button>
                                
                                {openDropdownHeader === header && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-40" 
                                      onClick={() => setOpenDropdownHeader(null)} 
                                    />
                                    <div className={cn(
                                       "absolute right-0 w-[220px] bg-card border border-border/50 rounded-xl shadow-xl z-50 py-1.5 max-h-[200px] overflow-y-auto custom-scrollbar",
                                       parsedHeaders.indexOf(header) >= Math.max(3, Math.floor(parsedHeaders.length / 2))
                                         ? "bottom-full mb-1.5"
                                         : "mt-1.5"
                                     )}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setColumnMappings(prev => ({ ...prev, [header]: "" }));
                                          setOpenDropdownHeader(null);
                                        }}
                                        className={cn(
                                          "w-full text-left px-3 py-2 text-[9px] font-bold uppercase transition-colors hover:bg-muted/20",
                                          currentMappedKey === "" ? "text-blue-500 bg-blue-500/5" : "text-foreground/80"
                                        )}
                                      >
                                        Ignore (Do not import)
                                      </button>
                                      {config.fields
                                        .filter((f: any) => f.key !== 'lastInteraction' && f.isVisible !== false)
                                        .map((f: any) => {
                                          const isMappedElsewhere = Object.entries(columnMappings).some(
                                            ([k, val]) => k !== header && val === f.key
                                          );
                                          return (
                                            <button
                                              key={f.id}
                                              type="button"
                                              onClick={() => {
                                                setColumnMappings(prev => {
                                                  const next = { ...prev };
                                                  Object.keys(next).forEach(k => {
                                                    if (k !== header && next[k] === f.key) {
                                                      next[k] = "";
                                                    }
                                                  });
                                                  next[header] = f.key;
                                                  return next;
                                                });
                                                setOpenDropdownHeader(null);
                                              }}
                                              className={cn(
                                                "w-full text-left px-3 py-2 text-[9px] font-bold uppercase transition-colors hover:bg-muted/20 flex items-center justify-between gap-1",
                                                currentMappedKey === f.key ? "text-blue-500 bg-blue-500/5" : "text-foreground/80"
                                              )}
                                            >
                                              <span className="truncate">{f.label} ({f.type})</span>
                                              {isMappedElsewhere && (
                                                <span className="text-[7px] text-amber-500 font-semibold uppercase shrink-0">
                                                  (Mapped)
                                                </span>
                                              )}
                                            </button>
                                          );
                                        })}
                                    </div>
                                  </>
                                )}
                              </div>
                              
                              {matchedField ? (
                                <Badge className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-wider shrink-0">
                                  Mapped
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-muted-foreground text-[8px] font-black uppercase tracking-wider shrink-0">
                                  Ignored
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                      <Info size={14} className="text-blue-500" /> Data Preview (First 5 Rows)
                    </h3>
                    <div className="border border-border/20 rounded-2xl overflow-hidden bg-background/30 shadow-inner">
                      <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse text-[9px]">
                          <thead>
                            <tr className="border-b border-border/20 bg-muted/20">
                              {parsedHeaders.map(h => (
                                <th key={h} className="p-3 font-black uppercase tracking-wider text-muted-foreground border-r border-border/20 last:border-r-0">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {parsedRows.slice(0, 5).map((row, rIdx) => (
                              <tr key={rIdx} className="border-b border-border/10 last:border-b-0 hover:bg-muted/10">
                                {parsedHeaders.map((h, colIdx) => (
                                  <td key={colIdx} className="p-3 font-semibold text-foreground/80 border-r border-border/10 last:border-r-0 truncate max-w-[120px]">
                                    {row[colIdx] || "-"}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

             {/* Footer */}
            <div className="p-6 border-t border-border/20 shrink-0 bg-background/50 flex flex-col gap-4">
              {isImporting && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Loader2 className="animate-spin text-blue-500" size={12} /> Importing Leads...
                    </span>
                    <span>{importProgress} / {importTotal} ({Math.round((importProgress / importTotal) * 100)}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${(importProgress / importTotal) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                {duplicateMode ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setDuplicateMode(false)}
                      disabled={isImporting}
                      className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest text-foreground px-6 border-border/40"
                    >
                      Back to Mapping
                    </Button>
                    <Button 
                      onClick={() => {
                        const selectedDuplicates = duplicateRows.filter((_, idx) => selectedDuplicateIndices.has(idx));
                        const finalPayloads = [...validRows, ...selectedDuplicates];
                        executeImport(finalPayloads);
                      }}
                      disabled={isImporting}
                      className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl px-6 shadow-lg shadow-blue-500/20 disabled:opacity-40"
                    >
                      Import Selected ({validRows.length + selectedDuplicateIndices.size})
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={onClose}
                      disabled={isImporting}
                      className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest text-foreground px-6 border-border/40"
                    >
                      Cancel
                    </Button>
                    
                    {parsedHeaders.length > 0 && (
                      <Button 
                        onClick={handleImport}
                        disabled={isImporting || !hasMappedColumns || hasIssues}
                        className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl px-6 shadow-lg shadow-blue-500/20 disabled:opacity-40"
                      >
                        Import data
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>,
    document.body
  );
}
