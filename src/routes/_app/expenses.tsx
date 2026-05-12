import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Card, EmptyState } from "@/components/ui-kit";
import { Plus, Trash2, Pencil, ChevronLeft, ChevronRight, X, TrendingDown, TrendingUp, UtensilsCrossed, Plane, GraduationCap, Package } from "lucide-react";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";
import { CURRENCIES, useCurrency } from "@/lib/currency";

export const Route = createFileRoute("/_app/expenses")({ component: ExpensesPage });

const CATEGORIES = ["Food", "Travel", "Study", "Misc"] as const;
const COLORS: Record<string, string> = {
  Food: "var(--color-success)", Travel: "var(--color-primary)", Study: "var(--color-warning)", Misc: "var(--color-destructive)",
};
const ICONS: Record<string, any> = { Food: UtensilsCrossed, Travel: Plane, Study: GraduationCap, Misc: Package };

type Expense = { id: string; amount: number; category: string; description: string | null; expense_date: string };

const fmt = (sym: string, n: number, decimals = 2) => `${sym}${n.toFixed(decimals)}`;

function ExpensesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Expense[]>([]);
  const [prevTotal, setPrevTotal] = useState(0);
  const [month, setMonth] = useState(new Date());
  const [editing, setEditing] = useState<Expense | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [currency, setCurrency] = useState<string>(() => {
    if (typeof window === "undefined") return "USD";
    return localStorage.getItem("expense_currency") ?? "USD";
  });
  const curInfo = CURRENCIES.find(c => c.code === currency) ?? CURRENCIES[4];
  const decimals = currency === "JPY" ? 0 : 2;
  useEffect(() => { if (typeof window !== "undefined") localStorage.setItem("expense_currency", currency); }, [currency]);

  useEffect(() => {
    if (!user) return;
    const start = format(startOfMonth(month), "yyyy-MM-dd");
    const end = format(endOfMonth(month), "yyyy-MM-dd");
    const prevStart = format(startOfMonth(subMonths(month, 1)), "yyyy-MM-dd");
    const prevEnd = format(endOfMonth(subMonths(month, 1)), "yyyy-MM-dd");
    Promise.all([
      supabase.from("expenses").select("*").eq("user_id", user.id).gte("expense_date", start).lte("expense_date", end).order("expense_date", { ascending: false }),
      supabase.from("expenses").select("amount").eq("user_id", user.id).gte("expense_date", prevStart).lte("expense_date", prevEnd),
    ]).then(([cur, prev]) => {
      setItems((cur.data ?? []) as Expense[]);
      setPrevTotal((prev.data ?? []).reduce((s: number, e: any) => s + Number(e.amount), 0));
    });
  }, [user, month]);

  const total = items.reduce((s, e) => s + Number(e.amount), 0);
  const delta = prevTotal === 0 ? 0 : ((total - prevTotal) / prevTotal) * 100;

  const byCat = useMemo(() => CATEGORIES.map(c => ({
    name: c,
    value: items.filter(e => e.category === c).reduce((s, e) => s + Number(e.amount), 0),
  })).filter(x => x.value > 0), [items]);

  const remove = async (id: string) => {
    setItems(arr => arr.filter(x => x.id !== id));
    await supabase.from("expenses").delete().eq("id", id);
  };

  return (
    <div>
      <PageHeader title="Expenses"
        action={
          <div className="flex items-center gap-2">
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="rounded-xl border bg-background px-2.5 py-2 text-xs font-medium outline-none focus:border-primary">
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}
            </select>
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 rounded-xl bg-gradient-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-elegant">
              <Plus className="h-4 w-4" /> Add Expense
            </button>
          </div>
        } />

      {/* Month nav */}
      <Card>
        <div className="flex items-center justify-between">
          <button onClick={() => setMonth(subMonths(month, 1))} className="rounded-lg p-1.5 hover:bg-accent"><ChevronLeft className="h-4 w-4" /></button>
          <div className="text-sm font-semibold">{format(month, "MMMM yyyy")}</div>
          <button onClick={() => setMonth(addMonths(month, 1))} className="rounded-lg p-1.5 hover:bg-accent"><ChevronRight className="h-4 w-4" /></button>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Total Expenses</div>
            <div className="text-2xl font-bold">{fmt(curInfo.symbol, total, decimals)}</div>
          </div>
          {prevTotal > 0 && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${delta > 0 ? "text-destructive" : "text-success"}`}>
              {delta > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {Math.abs(delta).toFixed(0)}% from last month
            </div>
          )}
        </div>
      </Card>

      {/* By Category with donut */}
      {byCat.length > 0 && (
        <Card className="mt-4">
          <h3 className="mb-3 text-sm font-semibold">By Category</h3>
          <div className="flex items-center gap-4">
            <div className="h-32 w-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCat} dataKey="value" nameKey="name" innerRadius={36} outerRadius={56} paddingAngle={2}>
                    {byCat.map(c => <Cell key={c.name} fill={COLORS[c.name]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {byCat.map(c => {
                const Icon = ICONS[c.name];
                const pct = (c.value / total) * 100;
                return (
                  <div key={c.name} className="flex items-center gap-2 text-sm">
                    <div className="grid h-6 w-6 place-items-center rounded-md" style={{ background: `color-mix(in oklab, ${COLORS[c.name]} 15%, transparent)`, color: COLORS[c.name] }}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="flex-1">{c.name}</span>
                    <span className="font-semibold">{fmt(curInfo.symbol, c.value, 0)}</span>
                    <span className="w-9 text-right text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {/* Recent expenses */}
      <Card className="mt-4">
        <h3 className="mb-3 text-sm font-semibold">Recent Expenses</h3>
        <div className="space-y-2">
          {items.length === 0 && <EmptyState title="No expenses yet" />}
          {items.map(e => {
            const Icon = ICONS[e.category] ?? Package;
            return (
              <div key={e.id} className="flex items-center gap-3 rounded-xl bg-secondary/40 p-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${COLORS[e.category] ?? "var(--color-muted)"} 15%, transparent)`, color: COLORS[e.category] }}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{e.description || e.category}</div>
                  <div className="text-xs text-muted-foreground">{format(new Date(e.expense_date), "MMM d")}</div>
                </div>
                <div className="text-sm font-semibold">{fmt(curInfo.symbol, Number(e.amount), decimals)}</div>
                <button onClick={() => setEditing(e)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => remove(e.id)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            );
          })}
        </div>
      </Card>

      {(showAdd || editing) && (
        <ExpenseModal
          symbol={curInfo.symbol}
          initial={editing ?? undefined}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          onSave={async (payload) => {
            if (!user) return;
            if (editing) {
              setItems(arr => arr.map(x => x.id === editing.id ? { ...x, ...payload } as Expense : x));
              const { error } = await supabase.from("expenses").update(payload).eq("id", editing.id);
              if (error) toast.error(error.message);
            } else {
              const tempId = "tmp-" + Date.now();
              const optimistic = { id: tempId, ...payload } as Expense;
              setItems(arr => [optimistic, ...arr]);
              const { data, error } = await supabase.from("expenses").insert({ amount: payload.amount!, category: payload.category!, description: payload.description ?? null, expense_date: payload.expense_date!, user_id: user.id }).select().single();
              if (error) { toast.error(error.message); setItems(arr => arr.filter(x => x.id !== tempId)); }
              else setItems(arr => arr.map(x => x.id === tempId ? data as Expense : x));
            }
            setShowAdd(false); setEditing(null);
          }} />
      )}
    </div>
  );
}

function ExpenseModal({ initial, symbol, onSave, onClose }: { initial?: Expense; symbol: string; onSave: (p: Partial<Expense>) => void; onClose: () => void }) {
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? "");
  const [category, setCategory] = useState<string>(initial?.category ?? "Food");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState(initial?.expense_date ?? format(new Date(), "yyyy-MM-dd"));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl border bg-card p-5 shadow-glow sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">{initial ? "Edit expense" : "New expense"}</h3>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">{symbol}</span>
            <input type="number" step="0.01" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border bg-background py-2.5 pl-10 pr-3.5 text-sm outline-none focus:border-primary" />
          </div>
          <input list="expense-categories" placeholder="Category (type or pick)" value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
          <datalist id="expense-categories">
            {CATEGORIES.map(c => <option key={c} value={c} />)}
          </datalist>
          <input placeholder="Note" value={description ?? ""} onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-primary" />
        </div>
        <button disabled={!amount} onClick={() => onSave({ amount: Number(amount), category, description: description || null, expense_date: date })}
          className="mt-4 w-full rounded-xl bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-50">
          {initial ? "Save changes" : "Add expense"}
        </button>
      </div>
    </div>
  );
}
