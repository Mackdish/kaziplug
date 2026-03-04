import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  usePaymentMethods,
  useUpsertPaymentMethod,
  useDeletePaymentMethod,
  PayoutMethodType,
} from "@/hooks/usePaymentMethods";
import { CreditCard, Phone, Building, Trash2, Plus, Loader2 } from "lucide-react";

const METHOD_CONFIG: Record<PayoutMethodType, { label: string; icon: typeof Phone; fields: { key: string; label: string; placeholder: string }[] }> = {
  mpesa: {
    label: "M-Pesa",
    icon: Phone,
    fields: [
      { key: "phone_number", label: "Phone Number", placeholder: "e.g. 254712345678" },
      { key: "name", label: "Account Name", placeholder: "Name on M-Pesa" },
    ],
  },
  paypal: {
    label: "PayPal",
    icon: CreditCard,
    fields: [
      { key: "email", label: "PayPal Email", placeholder: "your@email.com" },
    ],
  },
  bank: {
    label: "Bank Transfer",
    icon: Building,
    fields: [
      { key: "bank_name", label: "Bank Name", placeholder: "e.g. Equity Bank" },
      { key: "account_number", label: "Account Number", placeholder: "Account number" },
      { key: "account_name", label: "Account Holder Name", placeholder: "Name on account" },
    ],
  },
};

interface Props {
  userId: string;
}

const PaymentMethodsCard = ({ userId }: Props) => {
  const { data: methods = [], isLoading } = usePaymentMethods(userId);
  const upsert = useUpsertPaymentMethod();
  const remove = useDeletePaymentMethod();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<PayoutMethodType>("mpesa");
  const [formData, setFormData] = useState<Record<string, string>>({});

  const openAdd = () => {
    // Find a type not yet added
    const existing = new Set(methods.map((m) => m.method_type));
    const available = (["mpesa", "paypal", "bank"] as PayoutMethodType[]).find((t) => !existing.has(t));
    setSelectedType(available || "mpesa");
    setFormData({});
    setDialogOpen(true);
  };

  const openEdit = (method: typeof methods[0]) => {
    setSelectedType(method.method_type);
    setFormData(method.details || {});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const config = METHOD_CONFIG[selectedType];
    const missing = config.fields.filter((f) => !formData[f.key]?.trim());
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    try {
      await upsert.mutateAsync({ userId, methodType: selectedType, details: formData });
      toast.success(`${config.label} payment method saved`);
      setDialogOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove.mutateAsync({ id, userId });
      toast.success("Payment method removed");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Methods
          </CardTitle>
          {methods.length < 3 && (
            <Button size="sm" variant="outline" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : methods.length > 0 ? (
            <div className="space-y-3">
              {methods.map((m) => {
                const config = METHOD_CONFIG[m.method_type];
                const Icon = config?.icon || CreditCard;
                return (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{config?.label || m.method_type}</p>
                        <p className="text-xs text-muted-foreground">
                          {Object.values(m.details || {}).filter(Boolean).join(" • ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(m)}>Edit</Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(m.id)}
                        disabled={remove.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No payment methods set up yet. Add one to receive payments.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {methods.some((m) => m.method_type === selectedType) ? "Edit" : "Add"} Payment Method
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Method Type</label>
              <Select
                value={selectedType}
                onValueChange={(v) => {
                  setSelectedType(v as PayoutMethodType);
                  setFormData({});
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {METHOD_CONFIG[selectedType].fields.map((field) => (
              <div key={field.key}>
                <label className="text-sm font-medium mb-2 block">{field.label}</label>
                <Input
                  placeholder={field.placeholder}
                  value={formData[field.key] || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PaymentMethodsCard;
