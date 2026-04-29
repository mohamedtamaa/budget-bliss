import { Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMonthlyPayments, useMonthlyPaymentMutations, type SourceType } from "@/hooks/useMonthlyPayments";

interface Props {
  sourceType: SourceType;
  sourceId: string;
  amount: number;
  month: string;
}

export function PaidToggle({ sourceType, sourceId, amount, month }: Props) {
  const { data: payments = [] } = useMonthlyPayments(month);
  const m = useMonthlyPaymentMutations(month);
  const existing = payments.find((p: any) => p.source_id === sourceId && p.source_type === sourceType);
  const paid = !!existing;

  return (
    <Button
      size="sm"
      variant={paid ? "default" : "outline"}
      onClick={() =>
        m.togglePaid.mutate({
          source_type: sourceType,
          source_id: sourceId,
          amount,
          existingId: existing?.id,
          currentlyPaid: paid,
        })
      }
      className={cn("h-8 gap-1.5 text-xs", paid && "bg-primary text-primary-foreground")}
    >
      {paid ? <Check size={14} /> : <Circle size={14} />}
      {paid ? "Paid" : "Mark paid"}
    </Button>
  );
}
