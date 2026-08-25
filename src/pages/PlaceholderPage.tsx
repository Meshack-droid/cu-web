import { Card } from '@/components/Card';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-primary-900">{title}</h1>
      <p className="mb-6 text-sm text-slate-500">{description}</p>
      <Card className="border-dashed text-center text-sm text-slate-400">
        This module is wired to the API but the UI is still being built out.
      </Card>
    </div>
  );
}
