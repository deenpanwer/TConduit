'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import {
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import {
  Loader2,
  User,
  Mail,
  Shield,
  Briefcase,
  Phone,
  Banknote,
  Dices,
} from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: any | null; // If provided, modal is in 'view/edit' mode
}

export function EmployeeModal({ isOpen, onClose, employee }: EmployeeModalProps) {
  const { user, userData } = useAuth();
  const orgId = userData?.ownedOrgId || userData?.orgId;
  const [loading, setLoading] = useState(false);
  const [orgDepartments, setOrgDepartments] = useState<{ id: string; name: string }[]>([]);
  const [orgCurrency, setOrgCurrency] = useState("PKR");
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    department: '',
    salary: '',
    email: '',
    password: '',
    whatsapp: '',
  });

  // Fetch departments & settings currency if they exist in their org doc
  useEffect(() => {
    async function fetchOrgData() {
      if (isOpen && orgId) {
        try {
          const orgRef = doc(db, 'organizations', orgId);
          const orgDoc = await getDoc(orgRef);
          if (orgDoc.exists()) {
            const data = orgDoc.data();
            if (data?.departments && Array.isArray(data.departments)) {
              setOrgDepartments(data.departments);
            } else {
              setOrgDepartments([]);
            }
            if (data?.attendanceSettings?.currency) {
              setOrgCurrency(data.attendanceSettings.currency);
            } else if (data?.settings?.currency) {
              setOrgCurrency(data.settings.currency);
            }
          }
        } catch (err) {
          console.error('Error fetching org data:', err);
        }
      }
    }
    fetchOrgData();
  }, [isOpen, orgId]);

  useEffect(() => {
    if (employee) {
      const deptVal = employee.department || '';
      if (orgDepartments.length > 0) {
        const inOrgDepts = orgDepartments.some(d => d.id === deptVal);
        setIsCustomDept(!inOrgDepts && deptVal !== '');
      }
      setFormData({
        name: employee.name || '',
        designation: employee.designation || '',
        department: deptVal,
        salary: String(employee.salary || employee.baseSalary || ''),
        email: employee.email || '',
        password: employee.systemPassword || '',
        whatsapp: employee.whatsapp || employee.whatsappNumber || '',
      });
    } else {
      setFormData({
        name: '',
        designation: '',
        department: '',
        salary: '',
        email: '',
        password: '',
        whatsapp: '',
      });
      setIsCustomDept(false);
    }
  }, [employee, isOpen, orgDepartments]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const email =
      name.length > 0
        ? `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`
        : '';
    setFormData({ ...formData, name, email });
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let pass = "";
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password: pass });
    toast.success("Generated random password!");
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || (!employee && !formData.password)) {
      toast.error('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const orgId = userData?.ownedOrgId || userData?.orgId;
      if (!orgId) throw new Error('No organization context found.');

      // Call server-side API to create/update employee (Firebase Admin SDK bypasses firestore.rules)
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: employee?.id, // If provided, updates existing employee
          email: formData.email,
          password: formData.password,
          displayName: formData.name,
          designation: formData.designation,
          department: formData.department,
          salary: formData.salary,
          whatsapp: formData.whatsapp,
          orgId,
          createdBy: user?.uid || 'unknown',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success(
        employee
          ? 'Employee updated successfully!'
          : 'Employee onboarded successfully!'
      );
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const isViewMode = !!employee;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-[2.5rem] border-border/40 shadow-2xl bg-background/95 backdrop-blur-xl p-0 overflow-hidden">
        <DialogHeader className="p-8 pb-4 bg-secondary/5 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <User size={24} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
                {isViewMode ? 'Employee Credentials' : 'Onboard New Staff'}
              </DialogTitle>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                {isViewMode
                  ? 'System identity and payroll metadata'
                  : 'Create identity and initialize payroll record'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Full Name
              </Label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-emerald-500" />
                <Input
                  value={formData.name}
                  onChange={handleNameChange}
                  readOnly={isViewMode}
                  placeholder="Employee Name"
                  className="pl-12 h-12 rounded-xl bg-secondary/20 border-none font-bold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Work Email
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-emerald-500" />
                <Input
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  readOnly={isViewMode}
                  placeholder="name@example.com"
                  className="pl-12 h-12 rounded-xl bg-secondary/20 border-none font-bold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Designation
              </Label>
                <div className="relative w-full">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-emerald-500 z-10" />
                  <select
                    value={formData.designation}
                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                    disabled={isViewMode}
                    className="w-full pl-12 pr-10 h-12 rounded-xl bg-secondary/20 border-none font-bold text-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer text-black dark:text-white disabled:opacity-80"
                  >
                    <option value="" disabled className="text-black bg-white">Select Designation</option>
                    <option value="Manager" className="text-black bg-white">Manager</option>
                    <option value="Employee" className="text-black bg-white">Employee</option>
                    {/* Handle any existing custom designation value gracefully if loaded */}
                    {formData.designation && formData.designation !== "Manager" && formData.designation !== "Employee" && (
                      <option value={formData.designation} className="text-black bg-white">
                        {formData.designation}
                      </option>
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Department <span className="lowercase text-[9px] opacity-60 font-bold">(optional)</span>
              </Label>
              <div className="relative group">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-emerald-500 z-10" />
                
                {orgDepartments.length > 0 && !isCustomDept ? (
                  <div className="relative w-full">
                    <select
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                      disabled={isViewMode}
                      className="w-full pl-12 pr-10 h-12 rounded-xl bg-secondary/20 border-none font-bold text-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer text-black dark:text-white disabled:opacity-80"
                    >
                      <option value="" className="text-black bg-white">Select Department</option>
                      {orgDepartments.map((dept) => (
                        <option key={dept.id} value={dept.id} className="text-black bg-white">
                          {dept.name}
                        </option>
                      ))}
                      {/* Handle existing custom value gracefully */}
                      {formData.department && !orgDepartments.some(d => d.id === formData.department) && (
                        <option value={formData.department} className="text-black bg-white">
                          {formData.department}
                        </option>
                      )}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted-foreground">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>
                ) : (
                  <Input
                    value={formData.department}
                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                    readOnly={isViewMode}
                    placeholder="e.g. Engineering"
                    className="pl-12 h-12 rounded-xl bg-secondary/20 border-none font-bold"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                WhatsApp Number
              </Label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-emerald-500" />
                <Input
                  value={formData.whatsapp}
                  onChange={e =>
                    setFormData({ ...formData, whatsapp: e.target.value })
                  }
                  placeholder='+92 300 0000000'
                  className="pl-12 h-12 rounded-xl bg-secondary/20 border-none font-bold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Base Salary (Monthly) <span className="lowercase text-[9px] opacity-60 font-bold">({orgCurrency})</span>
              </Label>
              <div className="relative group">
                <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-emerald-500" />
                <Input
                  type="number"
                  value={formData.salary}
                  onChange={e => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="e.g. 50000"
                  className="pl-12 h-12 rounded-xl bg-secondary/20 border-none font-bold"
                />
              </div>
            </div>
          </div>

          {/* Show System Password block: Always in creation mode, and conditionally in view mode if owner-created */}
          {(!isViewMode || employee?.systemPassword) && (
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                System Password
              </Label>
              <div className="relative group">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-emerald-500" />
                <Input
                  type="text" // Display plain-text to copy easily
                  value={formData.password}
                  onChange={e =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  readOnly={isViewMode}
                  placeholder="Set login password"
                  className="pl-12 pr-16 h-12 rounded-xl bg-secondary/20 border-none font-bold"
                />
                
                {/* Random Password Dice Generator inside input container for onboarding */}
                {!isViewMode && (
                  <button 
                    type="button"
                    onClick={generateRandomPassword}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-emerald-500 transition-colors p-1"
                    title="Generate random password"
                  >
                    <Dices size={16} />
                  </button>
                )}

                {/* Plain-text Copy button for existing credentials */}
                {isViewMode && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(formData.password);
                      toast.success("Password copied to clipboard!");
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black uppercase text-emerald-500 hover:text-emerald-600 transition-colors p-1"
                  >
                    Copy
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-8 bg-secondary/5 border-t border-border/50">
          <Button variant="ghost" onClick={onClose} className="rounded-xl font-bold">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="rounded-xl font-black uppercase tracking-widest px-8 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : null}
            {isViewMode ? 'Update Record' : 'Create Employee'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
