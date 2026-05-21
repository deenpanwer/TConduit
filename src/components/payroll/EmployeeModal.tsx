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
  DocumentData,
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
} from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: any | null; // If provided, modal is in 'view/edit' mode
}

export function EmployeeModal({ isOpen, onClose, employee }: EmployeeModalProps) {
  const { userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    department: '',
    salary: '',
    email: '',
    password: '',
    whatsapp: '',
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        designation: employee.designation || '',
        department: employee.department || '',
        salary: String(employee.salary || ''),
        email: employee.email || '',
        password: '••••••••', // Hidden for security
        whatsapp: employee.whatsapp || '',
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
    }
  }, [employee, isOpen]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const email =
      name.length > 0
        ? `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`
        : '';
    setFormData({ ...formData, name, email });
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

      let uid = employee?.id;

      if (!employee) {
        // 1. Create Auth User via API
        const authRes = await fetch('/api/admin/create-user', {
          method: 'POST',
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            displayName: formData.name,
          }),
        });
        const authData = await authRes.json();
        if (authData.error) throw new Error(authData.error);
        uid = authData.uid;
      }

      // 2. Create/Update Firestore Doc
      const commonFields = {
        name: formData.name,
        email: formData.email,
        designation: formData.designation,
        department: formData.department,
        baseSalary: Number(formData.salary),
        whatsappNumber: formData.whatsapp,
        systemPassword: formData.password,
        orgId,
        role: 'employee',
        active: true,
        updatedAt: serverTimestamp(),
      };

      if (!employee) {
        // Fetch org invite code for the profile
        const orgRef = doc(db, 'organizations', orgId);
        const orgDoc = await getDoc(orgRef);
        const inviteCode = orgDoc.exists() ? orgDoc.data()?.inviteCode : '';

        // New Employee specific fields (Provenance & Defaults)
        await setDoc(
          doc(db, 'users', uid),
          {
            ...commonFields,
            createdAt: serverTimestamp(),
            attachedAt: serverTimestamp(),
            onboardedAt: serverTimestamp(),
            createdBy: userData?.id || 'unknown',
            creationMode: 'owner-created',
            onboardingProfile: { inviteCode },
            // Default tracking & system fields from reference
            accessLocked: false,
            autoTrackApps: [],
            autoTrackOnboardingComplete: false,
            blurScreenshots: false,
            disableScreenshots: false,
            employeeOnboardingV1Complete: false,
            enableManualTimeTracking: false,
            orgStatus: 'active',
            screenshotInterval: 5,
            shiftSyncInterval: 1,
          },
          { merge: true }
        );
      } else {
        // Update existing employee
        await setDoc(doc(db, 'users', uid), commonFields, { merge: true });
      }

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
              <div className="relative group">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-emerald-500" />
                <Input
                  value={formData.designation}
                  onChange={e =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                  placeholder="e.g. Senior Developer"
                  className="pl-12 h-12 rounded-xl bg-secondary/20 border-none font-bold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Department
              </Label>
              <div className="relative group">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-emerald-500" />
                <Input
                  value={formData.department}
                  onChange={e =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  placeholder="e.g. Engineering"
                  className="pl-12 h-12 rounded-xl bg-secondary/20 border-none font-bold"
                />
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
                Base Salary (Monthly)
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

          {!isViewMode && (
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                System Password
              </Label>
              <div className="relative group">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-emerald-500" />
                <Input
                  type="password"
                  value={formData.password}
                  onChange={e =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Set login password"
                  className="pl-12 h-12 rounded-xl bg-secondary/20 border-none font-bold"
                />
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
