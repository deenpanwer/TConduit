"use client";

import React, { useState, useMemo } from 'react';
import { usePos } from '@/hooks/use-pos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  Trash2, 
  ExternalLink,
  Filter,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

/**
 * POS CUSTOMER MANAGEMENT (CRM INTEGRATED)
 * This page now interfaces directly with the CRM module.
 * Customers added here become "Leads" in the CRM.
 */

export default function CustomersPage() {
  const router = useRouter();
  const { customers, addCustomer, loading } = usePos();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      (c.name || c.data?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.data?.email && c.data.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.data?.mobile && c.data.mobile.includes(searchQuery))
    );
  }, [customers, searchQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Customer name is required.");
      return;
    }

    try {
      const leadId = await addCustomer(formData);
      if (leadId) {
        toast.success("Customer added to CRM database!");
        setIsModalOpen(false);
        setFormData({ name: '', email: '', phoneNumber: '' });
      }
    } catch (error) {
      toast.error("Failed to sync with CRM.");
    }
  };

  return (
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen space-y-8 text-foreground">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Customer Hub
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Unified POS & CRM customer management
          </p>
        </div>

        <div className="flex gap-3">
            <Button variant="outline" className="font-black uppercase tracking-widest text-xs h-12 px-6 gap-2" onClick={() => router.push('/crm/leads')}>
                <ExternalLink className="h-4 w-4" />
                Open Full CRM
            </Button>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
                <Button className="font-black uppercase tracking-widest text-xs h-12 px-6 gap-2 shadow-lg">
                <UserPlus className="h-5 w-5" />
                Add Customer
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <form onSubmit={handleSubmit}>
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tighter">New Customer</DialogTitle>
                    <DialogDescription className="text-xs uppercase font-bold tracking-widest opacity-60">
                    Creates a lead in the CRM system instantly.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Full Name *</label>
                        <Input 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="John Doe" 
                            className="font-bold bg-muted/20"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                        <Input 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="john@example.com" 
                            className="font-bold bg-muted/20"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</label>
                        <Input 
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                            placeholder="+1 (555) 000-0000" 
                            className="font-bold bg-muted/20"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button type="submit" className="w-full font-black uppercase tracking-widest text-xs h-11">
                        Secure Customer Profile
                    </Button>
                </DialogFooter>
                </form>
            </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-widest">Live CRM Synchronization Active</p>
          </div>
          <p className="text-[9px] font-bold text-muted-foreground uppercase">Data stored in CRM Leads module</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
              <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Database</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-3xl font-black text-primary tracking-tighter">{customers.length}</p>
              </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
              <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sourced from POS</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-3xl font-black text-blue-500 tracking-tighter">
                    {customers.filter(c => c.data?.source === 'POS System').length}
                  </p>
              </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">
              <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Module Health</CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <p className="text-xs font-black uppercase tracking-tighter">Integrated</p>
                  </div>
              </CardContent>
          </Card>
      </div>

      {/* Filter & Table Area */}
      <Card className="border-0 shadow-xl overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="bg-muted/30 p-6 border-b">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search leads..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 font-bold bg-background"
                />
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border">
                <TableHead className="font-black uppercase tracking-widest text-[10px] py-4">Customer/Lead</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] py-4">Contact Detail</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] py-4 text-center">Status</TableHead>
                <TableHead className="text-right font-black uppercase tracking-widest text-[10px] py-4">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading.customers ? (
                  <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                          <p className="animate-pulse font-black uppercase tracking-widest text-xs opacity-50">Syncing with CRM...</p>
                      </TableCell>
                  </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs opacity-50">
                    No customers found in database.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/20 transition-colors border-border group">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-black text-sm uppercase tracking-tighter">{c.name || c.data?.name || "Unnamed"}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">ID: {c.id.slice(0, 8)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-bold">
                          <Mail className="h-3 w-3 opacity-50" />
                          {c.data?.email || "N/A"}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold">
                          <Phone className="h-3 w-3 opacity-50" />
                          {c.data?.mobile || "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-secondary border border-border">
                        {c.data?.status || 'new'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 text-[10px] font-black uppercase tracking-tighter gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => router.push(`/crm/leads?id=${c.id}`)}
                        >
                            CRM Profile
                            <ArrowRight className="h-3 w-3" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}