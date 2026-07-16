import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { TrustBadge } from "@/components/TrustBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, HandCoins, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace · SafeNest AI" },
      { name: "description", content: "Trusted borrower-lender marketplace with verification badges on every profile." },
    ],
  }),
  component: MarketplacePage,
});

interface Listing {
  id: string;
  user_id: string;
  kind: "borrower_request" | "lender_product";
  title: string;
  description: string;
  amount: number;
  interest_rate: number | null;
  tenure_months: number | null;
  purpose: string | null;
  created_at: string;
}
interface Profile { display_name: string | null; trust_score: number }

function MarketplacePage() {
  const { t } = useI18n();
  const [listings, setListings] = useState<Listing[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  async function load() {
    const { data } = await supabase
      .from("marketplace_listings")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });
    const list = (data ?? []) as Listing[];
    setListings(list);
    const uids = [...new Set(list.map((l) => l.user_id))];
    if (uids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, display_name, trust_score").in("id", uids);
      const map: Record<string, Profile> = {};
      (profs ?? []).forEach((p: { id: string; display_name: string | null; trust_score: number }) => {
        map[p.id] = { display_name: p.display_name, trust_score: p.trust_score };
      });
      setProfiles(map);
    }
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{t("marketplace.title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("marketplace.sub")}</p>
        </div>
        <NewListingDialog onDone={load} />
      </div>

      <Tabs defaultValue="borrower_request">
        <TabsList>
          <TabsTrigger value="borrower_request" className="gap-1.5"><HandCoins className="h-4 w-4" /> {t("marketplace.borrowers")}</TabsTrigger>
          <TabsTrigger value="lender_product" className="gap-1.5"><Building2 className="h-4 w-4" /> {t("marketplace.lenders")}</TabsTrigger>
        </TabsList>
        {(["borrower_request", "lender_product"] as const).map((kind) => (
          <TabsContent key={kind} value={kind} className="mt-6">
            <ListingGrid listings={listings.filter((l) => l.kind === kind)} profiles={profiles} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function ListingGrid({ listings, profiles }: { listings: Listing[]; profiles: Record<string, Profile> }) {
  if (listings.length === 0) return <p className="text-sm text-muted-foreground">No listings yet. Be the first to post!</p>;
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {listings.map((l) => {
        const p = profiles[l.user_id];
        return (
          <div key={l.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold leading-tight">{l.title}</h3>
              {p && <TrustBadge score={p.trust_score} className="flex-none" />}
            </div>
            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{l.description}</p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <Stat label="Amount" value={`₹${l.amount.toLocaleString("en-IN")}`} />
              {l.interest_rate != null && <Stat label="Rate" value={`${l.interest_rate}%`} />}
              {l.tenure_months && <Stat label="Tenure" value={`${l.tenure_months}mo`} />}
            </div>
            {p?.display_name && <div className="mt-3 text-xs text-muted-foreground">by {p.display_name}</div>}
          </div>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary/50 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function NewListingDialog({ onDone }: { onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"borrower_request" | "lender_product">("borrower_request");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(50000);
  const [rate, setRate] = useState(12);
  const [tenure, setTenure] = useState(24);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title || !description) { toast.error("Title and description required"); return; }
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id;
      if (!uid) throw new Error("Sign in required");
      const { error } = await supabase.from("marketplace_listings").insert({
        user_id: uid, kind, title, description, amount,
        interest_rate: kind === "lender_product" ? rate : null,
        tenure_months: tenure,
      });
      if (error) throw error;
      toast.success("Listing posted");
      setOpen(false);
      setTitle(""); setDescription("");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Post listing</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Post a listing</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["borrower_request", "lender_product"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm capitalize ${kind === k ? "border-accent bg-accent/10 text-accent-foreground" : "border-border"}`}
              >
                {k === "borrower_request" ? "Need a loan" : "Offer a loan"}
              </button>
            ))}
          </div>
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Amount (₹)</Label><Input type="number" min={1000} value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></div>
            <div><Label>Tenure (months)</Label><Input type="number" min={1} value={tenure} onChange={(e) => setTenure(Number(e.target.value))} /></div>
            {kind === "lender_product" && (
              <div className="col-span-2"><Label>Interest rate (% p.a.)</Label><Input type="number" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} /></div>
            )}
          </div>
          <Button onClick={submit} disabled={busy} className="w-full">Post</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
