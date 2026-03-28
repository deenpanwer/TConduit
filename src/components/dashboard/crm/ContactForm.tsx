'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit } from 'lucide-react';
import { useCRM } from '@/hooks/use-crm';

interface ContactFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: Record<string, any>;
  mode?: 'create' | 'edit' | 'preview';
}

export function ContactForm({ onSubmit, onCancel, initialData, mode = 'create' }: ContactFormProps) {
  const { config } = useCRM();
  const [currentView, setCurrentView] = useState<'edit' | 'preview'>(
    mode === 'preview' ? 'preview' : 'edit'
  );
  const [formData, setFormData] = useState(initialData || {});

  useEffect(() => {
    setCurrentView(mode === 'preview' ? 'preview' : 'edit');
    setFormData(initialData || {});
  }, [mode, initialData]);

  const salutationOptions = config.modules.leads.fields.find(f => f.key === 'salutation')?.options || [];
  const genderOptions = config.modules.deals.fields.find(f => f.key === 'gender')?.options || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    if (mode !== 'create') {
      setCurrentView('preview');
    }
  };

  const handleCancel = () => {
    if (mode === 'preview' && currentView === 'edit') {
      setCurrentView('preview');
      setFormData(initialData || {});
    } else {
      onCancel();
    }
  };

  if (currentView === 'preview') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold">Contact Details</h3>
          <Button variant="ghost" size="icon" onClick={() => setCurrentView('edit')}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Salutation</Label>
            <p className="text-sm">{formData.salutation || '-'}</p>
          </div>
          <div>
            <Label>First Name</Label>
            <p className="text-sm">{formData.firstName || '-'}</p>
          </div>
          <div>
            <Label>Last Name</Label>
            <p className="text-sm">{formData.lastName || '-'}</p>
          </div>
          <div>
            <Label>Email</Label>
            <p className="text-sm">{formData.email || '-'}</p>
          </div>
          <div>
            <Label>Mobile No.</Label>
            <p className="text-sm">{formData.mobile || '-'}</p>
          </div>
          <div>
            <Label>Gender</Label>
            <p className="text-sm">{formData.gender || '-'}</p>
          </div>
          <div>
            <Label>Company Name</Label>
            <p className="text-sm">{formData.company || '-'}</p>
          </div>
          <div>
            <Label>Designation</Label>
            <p className="text-sm">{formData.jobTitle || '-'}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-bold">{mode === 'create' ? 'Create New Contact' : 'Edit Contact'}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="salutation">Salutation</Label>
          <Select onValueChange={(value) => handleSelectChange('salutation', value)} value={formData.salutation}>
            <SelectTrigger id="salutation">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {salutationOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <Input id="firstName" name="firstName" onChange={handleChange} value={formData.firstName || ''} />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" name="lastName" onChange={handleChange} value={formData.lastName || ''} />
        </div>
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" name="email" type="email" onChange={handleChange} value={formData.email || ''} />
        </div>
        <div>
          <Label htmlFor="mobile">Mobile No.</Label>
          <Input id="mobile" name="mobile" onChange={handleChange} value={formData.mobile || ''} />
        </div>
        <div>
          <Label htmlFor="gender">Gender</Label>
          <Select onValueChange={(value) => handleSelectChange('gender', value)} value={formData.gender}>
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {genderOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="company">Company Name</Label>
          <Input id="company" name="company" onChange={handleChange} value={formData.company || ''} />
        </div>
        <div>
          <Label htmlFor="jobTitle">Designation</Label>
          <Input id="jobTitle" name="jobTitle" onChange={handleChange} value={formData.jobTitle || ''} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={handleCancel}>Cancel</Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}
