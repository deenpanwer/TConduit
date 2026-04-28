"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { 
  FolderTree, Plus, ChevronRight, ChevronDown, 
  Users, Pencil, Save, MoreHorizontal,
  Building2, Briefcase, User as UserIcon,
  GripVertical, Info, Loader2, Trash2
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { cn, getUserAvatar } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Employee {
  id: string;
  name: string;
  role: string;
  department?: string;
  photoUrl?: string;
}

interface Department {
  id: string;
  name: string;
  color?: string;
}

const DEPT_COLORS = [
  { name: 'Emerald', class: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' },
  { name: 'Blue', class: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500/20', bg: 'bg-blue-500/10' },
  { name: 'Amber', class: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500/20', bg: 'bg-amber-500/10' },
  { name: 'Purple', class: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500/20', bg: 'bg-purple-500/10' },
  { name: 'Rose', class: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500/20', bg: 'bg-rose-500/10' },
  { name: 'Indigo', class: 'bg-indigo-500', text: 'text-indigo-500', border: 'border-indigo-500/20', bg: 'bg-indigo-500/10' },
  { name: 'Slate', class: 'bg-slate-500', text: 'text-slate-500', border: 'border-slate-500/20', bg: 'bg-slate-500/10' },
];

interface DepartmentManagerProps {
  orgName: string;
  employees: Employee[];
  departments: Department[];
  onSave: (departments: Department[], employeeUpdates: Record<string, Partial<Employee>>) => Promise<void>;
}

export function DepartmentManager({ orgName, employees: initialEmployees, departments: initialDepartments, onSave }: DepartmentManagerProps) {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments || []);
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees || []);
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({ 'root': true, 'unassigned': true });
  
  // Modals
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [isEditEmpOpen, setIsEditEmpOpen] = useState(false);
  const [isRenameDeptOpen, setIsRenameDeptOpen] = useState(false);
  const [isDeleteDeptOpen, setIsDeleteDeptOpen] = useState(false);
  
  // Temp State
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptColor, setNewDeptColor] = useState(DEPT_COLORS[0].name);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [deptToDelete, setDeptToDelete] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameColor, setRenameColor] = useState('');
  
  const [pendingEmployeeUpdates, setPendingEmployeeUpdates] = useState<Record<string, Partial<Employee>>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if props change
  useEffect(() => {
    setDepartments(initialDepartments || []);
    setEmployees(initialEmployees || []);
  }, [initialDepartments, initialEmployees]);

  // Group employees by department for rendering
  const employeesByDept = useMemo(() => {
    const grouped: Record<string, Employee[]> = { 'unassigned': [] };
    departments.forEach(d => { grouped[d.id] = []; });
    
    employees.forEach(emp => {
      const update = pendingEmployeeUpdates[emp.id];
      const dept = update?.department !== undefined ? update.department : (emp.department || 'unassigned');
      if (!grouped[dept]) grouped[dept] = [];
      grouped[dept].push({ ...emp, ...update });
    });
    
    return grouped;
  }, [departments, employees, pendingEmployeeUpdates]);

  const hasChanges = useMemo(() => {
    const deptChanged = JSON.stringify(departments) !== JSON.stringify(initialDepartments || []);
    const empChanged = Object.keys(pendingEmployeeUpdates).length > 0;
    return deptChanged || empChanged;
  }, [departments, initialDepartments, pendingEmployeeUpdates]);

  const toggleDept = (id: string) => {
    setExpandedDepts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddDepartment = () => {
    if (!newDeptName.trim()) return;
    const newId = `dept_${Date.now()}`;
    setDepartments(prev => [...prev, { 
      id: newId, 
      name: newDeptName.trim(), 
      color: newDeptColor 
    }]);
    setNewDeptName('');
    setNewDeptColor(DEPT_COLORS[0].name);
    setIsAddDeptOpen(false);
    setExpandedDepts(prev => ({ ...prev, [newId]: true }));
  };

  const handleRenameDepartment = () => {
    if (!selectedDept || !renameValue.trim()) return;
    setDepartments(prev => prev.map(d => 
      d.id === selectedDept.id 
        ? { ...d, name: renameValue.trim(), color: renameColor } 
        : d
    ));
    setIsRenameDeptOpen(false);
    setSelectedDept(null);
  };

  const handleDeleteDepartment = (id: string) => {
    // 1. Remove department
    setDepartments(prev => prev.filter(d => d.id !== id));
    
    // 2. Move employees to unassigned
    const updates: Record<string, Partial<Employee>> = { ...pendingEmployeeUpdates };
    employees.forEach(emp => {
      const currentDept = updates[emp.id]?.department !== undefined ? updates[emp.id].department : emp.department;
      if (currentDept === id) {
        updates[emp.id] = { ...updates[emp.id], department: 'unassigned' };
      }
    });
    setPendingEmployeeUpdates(updates);
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === result.source.droppableId) return;
    if (destination.droppableId === 'root') return; // Prevent dropping into root

    setPendingEmployeeUpdates(prev => ({
      ...prev,
      [draggableId]: { ...prev[draggableId], department: destination.droppableId }
    }));
  };

  const handleUpdateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const role = formData.get('role') as string;
    const department = formData.get('department') as string;

    setPendingEmployeeUpdates(prev => ({
      ...prev,
      [selectedEmp.id]: { 
        ...prev[selectedEmp.id], 
        role, 
        department 
      }
    }));
    
    setIsEditEmpOpen(false);
    setSelectedEmp(null);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSave(departments, pendingEmployeeUpdates);
      setPendingEmployeeUpdates({});
    } finally {
      setIsSaving(false);
    }
  };

  const renderEmployee = (emp: Employee, index: number, deptColor?: string) => {
    const colorConfig = DEPT_COLORS.find(c => c.name === deptColor) || DEPT_COLORS[6]; // Default to Slate

    return (
      <Draggable key={emp.id} draggableId={emp.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={() => {
              setSelectedEmp(emp);
              setIsEditEmpOpen(true);
            }}
            className={cn(
              "flex items-center justify-between p-2 pl-3 bg-card border border-border/50 rounded-xl mb-1 group/emp hover:border-primary/50 transition-all cursor-pointer",
              deptColor && `border-l-4 ${colorConfig.border}`,
              snapshot.isDragging && "shadow-2xl border-primary ring-2 ring-primary/20 opacity-90 scale-[1.02]"
            )}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-7 w-7 border border-border">
                <AvatarImage src={getUserAvatar(emp)} />
                <AvatarFallback className="text-[10px]">{emp.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-tight truncate">{emp.name}</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-none">
                  {pendingEmployeeUpdates[emp.id]?.role || emp.role || 'Staff'}
                </p>
              </div>
            </div>
            <GripVertical size={12} className="text-muted-foreground/30 opacity-0 group-hover/emp:opacity-100 transition-opacity" />
          </div>
        )}
      </Draggable>
    );
  };

  const renderDeptNode = (id: string, name: string, icon: React.ReactNode, isRoot = false, deptColor?: string) => {
    const count = employeesByDept[id]?.length || 0;
    const isExpanded = expandedDepts[id];
    const colorConfig = DEPT_COLORS.find(c => c.name === deptColor);

    return (
      <div key={id} className="space-y-1">
        <div className="flex items-center justify-between group/node py-1.5 px-2 hover:bg-secondary/40 rounded-lg transition-all">
          <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => toggleDept(id)}>
            <div className="w-4 flex justify-center">
              {isExpanded ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
            </div>
            <div className={cn("flex items-center gap-2", isRoot ? "text-primary" : (colorConfig ? colorConfig.text : "text-foreground"))}>
              {colorConfig ? <Briefcase size={16} className={colorConfig.text} /> : icon}
              <span className={cn("text-xs font-black uppercase tracking-widest", isRoot && "text-sm")}>{name}</span>
              {!isRoot && (
                <Badge variant="secondary" className={cn("text-[8px] font-bold tabular-nums px-1.5 h-4", colorConfig && `${colorConfig.bg} ${colorConfig.text} border-none`)}>
                  {count}
                </Badge>
              )}
            </div>
          </div>

          {!isRoot && id !== 'unassigned' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md opacity-0 group-hover/node:opacity-100 transition-opacity">
                  <MoreHorizontal size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  setSelectedDept({ id, name, color: deptColor });
                  setRenameValue(name);
                  setRenameColor(deptColor || DEPT_COLORS[0].name);
                  setIsRenameDeptOpen(true);
                }}>
                  <Pencil size={12} className="mr-2" /> Rename & Color
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    setDeptToDelete(id);
                    setIsDeleteDeptOpen(true);
                  }}
                >
                  <Trash2 size={12} className="mr-2" /> Delete Department
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toggleDept(id)}>
                  {isExpanded ? "Collapse" : "Expand"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {isExpanded && !isRoot && (
          <div className="pl-6 ml-3 border-l border-border/60 space-y-2">
            <Droppable droppableId={id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "min-h-[10px] py-1 transition-colors rounded-xl",
                    snapshot.isDraggingOver && (colorConfig ? colorConfig.bg : "bg-primary/5"),
                    snapshot.isDraggingOver && (colorConfig ? `border-2 border-dashed ${colorConfig.border}` : "border-2 border-dashed border-primary/20")
                  )}
                >
                  {employeesByDept[id]?.map((emp, idx) => renderEmployee(emp, idx, deptColor))}
                  {provided.placeholder}
                  {count === 0 && !snapshot.isDraggingOver && (
                    <p className="text-[9px] italic text-muted-foreground/40 pl-3 py-2 uppercase font-bold tracking-widest">Empty</p>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 bg-black dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center shadow-lg">
            <FolderTree size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter">Organization Structure</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Manage departments and roles</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={() => setIsAddDeptOpen(true)}
            className="flex-1 sm:flex-none h-11 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <Plus size={14} className="mr-2" /> Add Department
          </Button>
          {hasChanges && (
            <Button 
              onClick={handleSaveAll} 
              disabled={isSaving}
              className="flex-1 sm:flex-none h-11 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-y-[2px] active:shadow-none transition-all"
            >
              {isSaving ? <Loader2 className="mr-2 animate-spin" size={14} /> : <Save className="mr-2" size={14} />}
              Save Changes
            </Button>
          )}
        </div>
      </div>

      <div className="bg-secondary/10 rounded-[2.5rem] border-2 border-border p-6 sm:p-10 min-h-[500px]">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="space-y-2">
            {renderDeptNode('root', orgName, <Building2 size={18} />, true)}
            
            <div className="pl-6 ml-3 border-l-2 border-border/40 space-y-4">
              {departments.map(dept => renderDeptNode(dept.id, dept.name, <Briefcase size={16} />, false, dept.color))}
              {renderDeptNode('unassigned', 'Unassigned Employees', <Users size={16} className="text-muted-foreground" />)}
            </div>
          </div>
        </DragDropContext>
      </div>

      {/* Add Department Modal */}
      <Dialog open={isAddDeptOpen} onOpenChange={setIsAddDeptOpen}>
        <DialogContent className="rounded-[2.5rem] border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">New Department</DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Add a new department to {orgName}</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Department Name</Label>
              <Input 
                autoFocus
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="e.g. SEO, Media Buying, HR..."
                className="h-12 rounded-xl border-2 border-black dark:border-white font-bold"
                onKeyDown={(e) => e.key === 'Enter' && handleAddDepartment()}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Department Color</Label>
              <div className="grid grid-cols-7 gap-2">
                {DEPT_COLORS.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setNewDeptColor(c.name)}
                    className={cn(
                      "size-8 rounded-full border-2 transition-all",
                      c.class,
                      newDeptColor === c.name ? "border-black dark:border-white scale-110 shadow-lg" : "border-transparent opacity-50 hover:opacity-100"
                    )}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddDeptOpen(false)} className="rounded-xl font-black uppercase tracking-widest text-[10px]">Cancel</Button>
            <Button onClick={handleAddDepartment} className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Create Department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Department Modal */}
      <Dialog open={isRenameDeptOpen} onOpenChange={setIsRenameDeptOpen}>
        <DialogContent className="rounded-[2.5rem] border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Edit Department</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Department Name</Label>
              <Input 
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="h-12 rounded-xl border-2 border-black dark:border-white font-bold"
                onKeyDown={(e) => e.key === 'Enter' && handleRenameDepartment()}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest mb-2 block">Department Color</Label>
              <div className="grid grid-cols-7 gap-2">
                {DEPT_COLORS.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setRenameColor(c.name)}
                    className={cn(
                      "size-8 rounded-full border-2 transition-all",
                      c.class,
                      renameColor === c.name ? "border-black dark:border-white scale-110 shadow-lg" : "border-transparent opacity-50 hover:opacity-100"
                    )}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRenameDeptOpen(false)} className="rounded-xl font-black uppercase tracking-widest text-[10px]">Cancel</Button>
            <Button onClick={handleRenameDepartment} className="rounded-xl h-12 px-8 font-black uppercase tracking-widest text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Modal */}
      <Dialog open={isEditEmpOpen} onOpenChange={setIsEditEmpOpen}>
        <DialogContent className="rounded-[2.5rem] border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-0 overflow-hidden outline-none">
          <div className="p-8 space-y-8">
            <DialogHeader className="flex flex-row items-center gap-6 text-left space-y-0">
               <Avatar className="h-16 w-16 border-4 border-black dark:border-white shadow-lg">
                  <AvatarImage src={getUserAvatar(selectedEmp)} />
                  <AvatarFallback className="text-xl font-black">{selectedEmp?.name?.[0]}</AvatarFallback>
               </Avatar>
               <div>
                  <DialogTitle className="text-3xl font-black uppercase tracking-tighter leading-none mb-1">{selectedEmp?.name}</DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Update Employee Details</DialogDescription>
               </div>
            </DialogHeader>

            <form onSubmit={handleUpdateEmployee} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Department</Label>
                  <Select name="department" defaultValue={pendingEmployeeUpdates[selectedEmp?.id || '']?.department || selectedEmp?.department || 'unassigned'}>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-black dark:border-white font-bold">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Role</Label>
                  <Select name="role" defaultValue={pendingEmployeeUpdates[selectedEmp?.id || '']?.role || selectedEmp?.role || 'employee'}>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-black dark:border-white font-bold">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="founder">Founder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                 <Button type="button" variant="ghost" onClick={() => setIsEditEmpOpen(false)} className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px]">Discard</Button>
                 <Button type="submit" className="flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all">Save Changes</Button>
              </div>
            </form>
          </div>
          
          <div className="bg-black text-white dark:bg-white dark:text-black py-3 px-8 flex items-center gap-2">
             <Info size={14} />
             <span className="text-[9px] font-black uppercase tracking-widest">Changes will be saved once you click "Save Changes" on the main screen.</span>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDeptOpen} onOpenChange={setIsDeleteDeptOpen}>
        <AlertDialogContent className="rounded-[2rem] border-4 border-black dark:border-white shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black uppercase tracking-tighter">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-bold uppercase tracking-tight text-muted-foreground">
              This will permanently remove the department. Any employees currently assigned to it will be moved to the "Unassigned" bucket.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-black uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deptToDelete) {
                  handleDeleteDepartment(deptToDelete);
                  setDeptToDelete(null);
                }
              }}
              className="rounded-xl bg-destructive text-destructive-foreground font-black uppercase tracking-widest text-[10px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              Confirm Deletion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
