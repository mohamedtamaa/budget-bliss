import { useState } from 'react';
import { useBudgetStore } from '@/lib/budget-store';
import { CategoryGroup } from '@/lib/types';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { categoryGroups, addCategoryGroup, updateCategoryGroup, deleteCategoryGroup } = useBudgetStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryGroup | null>(null);
  const [form, setForm] = useState({ name: '', type: 'expense' as 'income' | 'expense' });
  const [subInput, setSubInput] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [addSubDialogOpen, setAddSubDialogOpen] = useState(false);
  const [addSubGroupId, setAddSubGroupId] = useState('');
  const [newSubName, setNewSubName] = useState('');

  const incomeGroups = categoryGroups.filter((g) => g.type === 'income');
  const expenseGroups = categoryGroups.filter((g) => g.type === 'expense');

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', type: 'expense' });
    setSubInput('');
    setDialogOpen(true);
  };

  const openEdit = (g: CategoryGroup) => {
    setEditing(g);
    setForm({ name: g.name, type: g.type });
    setSubInput(g.subcategories.join(', '));
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.name) { toast.error('Name is required'); return; }
    const subcategories = subInput.split(',').map((s) => s.trim()).filter(Boolean);
    if (editing) {
      updateCategoryGroup(editing.id, { ...form, subcategories });
      toast.success('Updated');
    } else {
      addCategoryGroup({ ...form, subcategories });
      toast.success('Added');
    }
    setDialogOpen(false);
  };

  const openAddSub = (groupId: string) => {
    setAddSubGroupId(groupId);
    setNewSubName('');
    setAddSubDialogOpen(true);
  };

  const saveSub = () => {
    if (!newSubName.trim()) return;
    const group = categoryGroups.find((g) => g.id === addSubGroupId);
    if (group) {
      updateCategoryGroup(addSubGroupId, { subcategories: [...group.subcategories, newSubName.trim()] });
      toast.success('Subcategory added');
    }
    setAddSubDialogOpen(false);
  };

  const removeSub = (groupId: string, subName: string) => {
    const group = categoryGroups.find((g) => g.id === groupId);
    if (group) {
      updateCategoryGroup(groupId, { subcategories: group.subcategories.filter((s) => s !== subName) });
      toast.success('Subcategory removed');
    }
  };

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderGroupSection = (title: string, groups: CategoryGroup[], color: string) => (
    <div className="glass-card p-4">
      <h3 className={`text-sm font-medium mb-3 ${color}`}>{title}</h3>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No groups yet. Add one!</p>
      ) : (
        <div className="space-y-1">
          {groups.map((g) => (
            <div key={g.id}>
              <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-secondary/30 transition-colors">
                <button onClick={() => toggleGroup(g.id)} className="flex items-center gap-2 flex-1 text-left">
                  {g.subcategories.length > 0 ? (
                    expandedGroups.has(g.id) ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />
                  ) : <div className="w-3.5" />}
                  <span className="text-sm font-medium">{g.name}</span>
                  <span className="text-xs text-muted-foreground">({g.subcategories.length} sub)</span>
                </button>
                <div className="flex gap-1">
                  <button onClick={() => openAddSub(g.id)} className="p-1.5 hover:bg-secondary rounded-lg text-xs text-primary">+ Sub</button>
                  <button onClick={() => openEdit(g)} className="p-1.5 hover:bg-secondary rounded-lg"><Pencil size={14} className="text-muted-foreground" /></button>
                  <button onClick={() => { deleteCategoryGroup(g.id); toast.success('Deleted'); }} className="p-1.5 hover:bg-destructive/10 rounded-lg"><Trash2 size={14} className="text-destructive" /></button>
                </div>
              </div>
              {expandedGroups.has(g.id) && g.subcategories.length > 0 && (
                <div className="ml-8 space-y-1 mb-2">
                  {g.subcategories.map((sub) => (
                    <div key={sub} className="flex items-center justify-between py-1 px-3 text-sm text-muted-foreground">
                      <span>{sub}</span>
                      <button onClick={() => removeSub(g.id, sub)} className="p-1 hover:bg-destructive/10 rounded"><Trash2 size={12} className="text-destructive" /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Category Groups</h2>
          <p className="text-muted-foreground text-sm">Manage main groups and sub-groups for income & expenses</p>
        </div>
        <Button onClick={openAdd} className="gap-2"><Plus size={16} /> Add Group</Button>
      </div>

      {renderGroupSection('Income Groups', incomeGroups, 'text-success')}
      {renderGroupSection('Expense Groups', expenseGroups, 'text-warning')}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit' : 'Add'} Category Group</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Group name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border" />
            <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Subcategories (comma-separated)" value={subInput} onChange={(e) => setSubInput(e.target.value)} className="bg-secondary border-border" />
            <p className="text-xs text-muted-foreground">e.g. Groceries, Restaurant, Coffee</p>
            <Button onClick={save} className="w-full">{editing ? 'Update' : 'Add'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={addSubDialogOpen} onOpenChange={setAddSubDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Subcategory</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Subcategory name" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} className="bg-secondary border-border" />
            <Button onClick={saveSub} className="w-full">Add</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
