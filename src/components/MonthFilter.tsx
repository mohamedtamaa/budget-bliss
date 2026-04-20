import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addMonths, format, parse } from "date-fns";

export function MonthFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const date = parse(value + "-01", "yyyy-MM-dd", new Date());
  const today = format(new Date(), "yyyy-MM");
  const move = (n: number) => onChange(format(addMonths(date, n), "yyyy-MM"));

  return (
    <div className="flex items-center gap-1 glass-card px-2 py-1.5 w-fit">
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => move(-1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="px-3 text-sm font-medium min-w-[110px] text-center">{format(date, "MMMM yyyy")}</div>
      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => move(1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
      {value !== today && (
        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onChange(today)} title="Reset to current">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
