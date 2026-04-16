import { format, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MonthFilterProps {
  value: string; // yyyy-MM
  onChange: (month: string) => void;
}

export default function MonthFilter({ value, onChange }: MonthFilterProps) {
  const date = new Date(value + '-01');
  const label = format(date, 'MMMM yyyy');

  const prev = () => onChange(format(subMonths(date, 1), 'yyyy-MM'));
  const next = () => onChange(format(addMonths(date, 1), 'yyyy-MM'));
  const reset = () => onChange(format(new Date(), 'yyyy-MM'));

  const isCurrent = value === format(new Date(), 'yyyy-MM');

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="icon" onClick={prev} className="h-8 w-8">
        <ChevronLeft size={16} />
      </Button>
      <button
        onClick={reset}
        className={`text-sm font-medium min-w-[140px] text-center px-3 py-1.5 rounded-lg transition-colors ${
          isCurrent ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'
        }`}
      >
        {label}
      </button>
      <Button variant="ghost" size="icon" onClick={next} className="h-8 w-8">
        <ChevronRight size={16} />
      </Button>
    </div>
  );
}
