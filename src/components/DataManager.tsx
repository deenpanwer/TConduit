
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { seedMockData } from "@/lib/mock-data";
import { storage } from "@/lib/storage";
import { toast } from "sonner";

export function DataManager() {
  const [counts, setCounts] = useState({ 
    users: 15, 
    tasks: 40, 
    crm: 30, 
    pos: 25, 
    shifts: 60,
    invoices: 20,
    notes: 50,
    callLogs: 30
  });

  const handleSeed = () => {
    seedMockData(true, counts);
    toast.success("All data regenerated");
  };

  const handleClear = () => {
    storage.clearAll();
    toast.success("All data cleared");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="fixed top-2 right-2 z-[9999] opacity-30 hover:opacity-100 transition-opacity text-[10px] uppercase tracking-widest font-black bg-secondary">Data</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manual Data Management</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
                <Label>Employees</Label>
                <Input type="number" value={counts.users} onChange={(e) => setCounts({...counts, users: parseInt(e.target.value)})} />
            </div>
            <div>
                <Label>Tasks</Label>
                <Input type="number" value={counts.tasks} onChange={(e) => setCounts({...counts, tasks: parseInt(e.target.value)})} />
            </div>
            <div>
                <Label>CRM Entities</Label>
                <Input type="number" value={counts.crm} onChange={(e) => setCounts({...counts, crm: parseInt(e.target.value)})} />
            </div>
            <div>
                <Label>POS Products</Label>
                <Input type="number" value={counts.pos} onChange={(e) => setCounts({...counts, pos: parseInt(e.target.value)})} />
            </div>
            <div>
                <Label>Shifts</Label>
                <Input type="number" value={counts.shifts} onChange={(e) => setCounts({...counts, shifts: parseInt(e.target.value)})} />
            </div>
            <div>
                <Label>Invoices</Label>
                <Input type="number" value={counts.invoices} onChange={(e) => setCounts({...counts, invoices: parseInt(e.target.value)})} />
            </div>
            <div>
                <Label>Notes</Label>
                <Input type="number" value={counts.notes} onChange={(e) => setCounts({...counts, notes: parseInt(e.target.value)})} />
            </div>
            <div>
                <Label>Call Logs</Label>
                <Input type="number" value={counts.callLogs} onChange={(e) => setCounts({...counts, callLogs: parseInt(e.target.value)})} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={handleSeed}>Regenerate All Data</Button>
            <Button variant="destructive" onClick={handleClear}>Clear All Data</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
