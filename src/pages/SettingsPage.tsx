import { useState } from "react";
import { Plus, Trash2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories, useCategoryMutations, useProfile } from "@/hooks/useFinanceData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { requestNotificationPermission } from "@/lib/notifications";

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: categories = [] } = useCategories();
  const m = useCategoryMutations();

  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [parent, setParent] = useState("");
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [currency, setCurrency] = useState(profile?.currency || "EGP");

  const saveProfile = async () => {
    const { error } = await supabase.from("profiles").update({ display_name: displayName, currency }).eq("user_id", user!.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };

  const addCat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await m.create.mutateAsync({ name, type, parent_id: parent || null });
    setName(""); setParent("");
  };

  const enableNotif = async () => {
    const p = await requestNotificationPermission();
    if (p === "granted") toast.success("Notifications enabled");
    else toast.error("Notification permission denied");
  };

  const parents = categories.filter((c: any) => c.type === type && !c.parent_id);
  const grouped = ["income", "expense"].map((t) => ({
    type: t,
    parents: categories.filter((c: any) => c.type === t && !c.parent_id),
  }));

  return (
    <div className="space-y-5 max-w-3xl">
      <section className="glass-card p-5 space-y-4">
        <h3 className="font-semibold">Profile</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>Display name</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
          <div><Label>Currency</Label><Input value={currency} onChange={(e) => setCurrency(e.target.value)} /></div>
        </div>
        <Button onClick={saveProfile}>Save profile</Button>
      </section>

      <section className="glass-card p-5 space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><Bell size={16} /> Notifications</h3>
        <p className="text-sm text-muted-foreground">Enable browser notifications to get loan due-date reminders.</p>
        <Button onClick={enableNotif} variant="outline">Enable notifications</Button>
      </section>

      <section className="glass-card p-5 space-y-4">
        <h3 className="font-semibold">Categories & sub-categories</h3>
        <form onSubmit={addCat} className="grid sm:grid-cols-4 gap-3">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Select value={type} onValueChange={(v) => { setType(v as any); setParent(""); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="expense">Expense</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent>
          </Select>
          <Select value={parent || "none"} onValueChange={(v) => setParent(v === "none" ? "" : v)}>
            <SelectTrigger><SelectValue placeholder="(top-level)" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">(top-level)</SelectItem>
              {parents.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="submit"><Plus size={14} /> Add</Button>
        </form>

        <div className="grid sm:grid-cols-2 gap-4">
          {grouped.map((g) => (
            <div key={g.type}>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{g.type}</div>
              <div className="space-y-2">
                {g.parents.map((p: any) => {
                  const subs = categories.filter((c: any) => c.parent_id === p.id);
                  return (
                    <div key={p.id} className="rounded-xl border border-border/60 p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{p.name}</div>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => m.remove.mutate(p.id)}><Trash2 size={12} /></Button>
                      </div>
                      {subs.length > 0 && (
                        <div className="mt-2 ml-3 space-y-1">
                          {subs.map((s: any) => (
                            <div key={s.id} className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">↳ {s.name}</span>
                              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => m.remove.mutate(s.id)}><Trash2 size={11} /></Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {!g.parents.length && <div className="text-xs text-muted-foreground">None yet</div>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
