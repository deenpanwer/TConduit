"use client";

import React, { useState, useMemo } from 'react';
import { usePos, Customer } from '@/hooks/use-pos';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Trash2, 
  Edit,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function CustomersPage() {
  const { customers, addCustomer, deleteCustomer, updateCustomer } = usePos();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  
  const defaultFormData: Partial<Customer> = {
    name: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: 'Prefer not to say',
    postalCode: '',
    marketingConsent: false,
    customerGroup: 'Regular',
    internalNotes: '',
  };

  const [formData, setFormData] = useState<Partial<Customer>>(defaultFormData);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.phoneNumber && c.phoneNumber.includes(searchQuery))
    );
  }, [customers, searchQuery]);

  const handleInputChange = (field: keyof Customer, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomerId(customer.id);
    setFormData({
        name: customer.name,
        email: customer.email,
        phoneNumber: customer.phoneNumber,
        dateOfBirth: customer.dateOfBirth,
        gender: customer.gender,
        postalCode: customer.postalCode,
        marketingConsent: customer.marketingConsent,
        customerGroup: customer.customerGroup,
        internalNotes: customer.internalNotes,
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingCustomerId(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Customer name is required.");
      return;
    }

    try {
      if (editingCustomerId) {
        const success = await updateCustomer(editingCustomerId, formData);
        if (success) {
            toast.success("Customer profile updated!");
            setIsModalOpen(false);
            resetForm();
        }
      } else {
        const newCustomer = await addCustomer(formData as Omit<Customer, 'id' | 'createdAt'>);
        if (newCustomer) {
          toast.success("Customer created successfully!");
          setIsModalOpen(false);
          resetForm();
        }
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
        const success = await deleteCustomer(id);
        if (success) toast.success("Customer deleted.");
    }
  };

  return (
    <div className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Customer CRM
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Manage your customer profiles and marketing preferences
          </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="font-black uppercase tracking-widest text-xs h-12 px-6 gap-2 shadow-lg" onClick={resetForm}>
              <UserPlus className="h-5 w-5" />
              Add New Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tighter">
                    {editingCustomerId ? "Edit Customer Profile" : "Create Customer Profile"}
                </DialogTitle>
                <DialogDescription className="text-xs uppercase font-bold tracking-widest opacity-60">
                  {editingCustomerId ? "Modify existing customer details and preferences." : "Fill in the details below to add a new customer to your database."}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-6 py-6 text-foreground">
                {/* Basic Info */}
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 text-primary">Full Name *</label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="John Doe" 
                    className="font-bold bg-muted/20 border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input 
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="john@example.com" 
                      className="pl-10 font-bold bg-muted/20 border-border"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input 
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      placeholder="+1 (555) 000-0000" 
                      className="pl-10 font-bold bg-muted/20 border-border"
                    />
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input 
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className="pl-10 font-bold bg-muted/20 border-border"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Gender</label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(val) => handleInputChange('gender', val)}
                  >
                    <SelectTrigger className="font-bold bg-muted/20 border-border">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Postal Code</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input 
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange('postalCode', e.target.value)}
                      placeholder="90210" 
                      className="pl-10 font-bold bg-muted/20 border-border"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Customer Group</label>
                  <Select 
                    value={formData.customerGroup} 
                    onValueChange={(val) => handleInputChange('customerGroup', val)}
                  >
                    <SelectTrigger className="font-bold bg-muted/20 border-border">
                      <SelectValue placeholder="Select Group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                      <SelectItem value="Wholesale">Wholesale</SelectItem>
                      <SelectItem value="Employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Internal Notes</label>
                  <Textarea 
                    value={formData.internalNotes}
                    onChange={(e) => handleInputChange('internalNotes', e.target.value)}
                    placeholder="Add private notes about this customer..." 
                    className="font-bold bg-muted/20 border-border min-h-[80px]"
                  />
                </div>

                <div className="col-span-2 flex items-center space-x-2 bg-primary/5 p-4 rounded-lg border border-primary/10">
                  <Checkbox 
                    id="marketing" 
                    checked={formData.marketingConsent}
                    onCheckedChange={(val) => handleInputChange('marketingConsent', !!val)}
                  />
                  <label 
                    htmlFor="marketing" 
                    className="text-[11px] font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 uppercase tracking-tight"
                  >
                    Customer consents to marketing communications via email/SMS
                  </label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} className="font-black uppercase tracking-widest text-xs text-foreground">Cancel</Button>
                <Button type="submit" className="font-black uppercase tracking-widest text-xs">
                    {editingCustomerId ? "Update Profile" : "Save Customer Profile"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-md bg-white dark:bg-slate-900">
              <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Customers</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-3xl font-black text-primary tracking-tighter">{customers.length}</p>
              </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white dark:bg-slate-900">
              <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Consented to Marketing</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-3xl font-black text-green-500 tracking-tighter">
                    {customers.filter(c => c.marketingConsent).length}
                  </p>
              </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white dark:bg-slate-900">
              <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">VIP Group</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-3xl font-black text-orange-500 tracking-tighter">
                    {customers.filter(c => c.customerGroup === 'VIP').length}
                  </p>
              </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white dark:bg-slate-900">
              <CardHeader className="pb-2">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New This Month</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-3xl font-black text-blue-500 tracking-tighter">
                    {customers.filter(c => {
                        const date = new Date(c.createdAt);
                        const now = new Date();
                        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
              </CardContent>
          </Card>
      </div>

      {/* Filter & Table Area */}
      <Card className="border-0 shadow-xl overflow-hidden bg-white dark:bg-slate-900">
        <CardHeader className="bg-muted/30 p-6 border-b">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search by name, email or phone..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 font-bold bg-background border-border text-foreground"
                    />
                </div>
                <div className="flex gap-2 text-foreground">
                    <Button variant="outline" size="icon" className="h-11 w-11"><Filter className="h-4 w-4" /></Button>
                    <Select defaultValue="all">
                        <SelectTrigger className="w-[180px] h-11 font-bold">
                            <SelectValue placeholder="Customer Group" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Groups</SelectItem>
                            <SelectItem value="Regular">Regular</SelectItem>
                            <SelectItem value="VIP">VIP</SelectItem>
                            <SelectItem value="Wholesale">Wholesale</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border">
                <TableHead className="font-black uppercase tracking-widest text-[10px] py-4">Customer</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] py-4">Contact Info</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] py-4">Group</TableHead>
                <TableHead className="font-black uppercase tracking-widest text-[10px] py-4">Last Purchase</TableHead>
                <TableHead className="text-right font-black uppercase tracking-widest text-[10px] py-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground font-bold uppercase tracking-widest text-xs opacity-50">
                    No customers found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/20 transition-colors border-border">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-black text-sm uppercase tracking-tighter text-slate-900 dark:text-slate-100">{c.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-muted-foreground">{c.gender}</span>
                            {c.marketingConsent && (
                                <span className="bg-green-100 text-green-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Marketing OK</span>
                            )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                          <Mail className="h-3 w-3 opacity-50" />
                          {c.email || "N/A"}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                          <Phone className="h-3 w-3 opacity-50" />
                          {c.phoneNumber || "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border",
                        c.customerGroup === 'VIP' ? "bg-orange-500/10 text-orange-600 border-orange-500/20" : 
                        c.customerGroup === 'Wholesale' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                        "bg-slate-500/10 text-slate-600 border-slate-500/20"
                      )}>
                        {c.customerGroup}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        {c.lastPurchaseDate ? new Date(c.lastPurchaseDate).toLocaleDateString() : "Never"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                                onClick={() => handleEdit(c)}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-muted-foreground hover:text-red-500 transition-colors"
                                onClick={() => handleDelete(c.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
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
