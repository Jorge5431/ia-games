'use client';

import { useActionState, type ReactNode } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Button } from './ui/button';

export type ActionState = { error?: string; success?: string; fieldErrors?: Record<string,string> };
export type SubmitAction = (previous: ActionState, form: FormData) => Promise<ActionState>;

export function ActionForm({ action, label, children, className, secondary }: {
  action: SubmitAction; label: string; children?: ReactNode; className?: string; secondary?: boolean;
}) {
  const [state, submit, pending] = useActionState(action, {});
  return <form action={submit} className={className ?? 'form'}>
    <fieldset disabled={pending}>
      {children}
      <Button variant={secondary ? 'secondary' : 'default'} type="submit" aria-busy={pending}>
        {pending && <LoaderCircle size={16} className="spinner" aria-hidden/>}{label}
      </Button>
    </fieldset>
    {state.error && <p className="feedback error" role="alert">{state.error}</p>}
    {state.success && <p className="feedback success" role="status">{state.success}</p>}
  </form>;
}

export function Field({ name, label, type = 'text', value, required, min, max, autoComplete }: {
  name: string; label: string; type?: string; value?: string | number | null;
  required?: boolean; min?: number; max?: number; autoComplete?: string;
}) {
  return <label className="field">{label}<input name={name} type={type} defaultValue={value ?? undefined}
    required={required} minLength={type !== 'number' ? min : undefined} maxLength={type !== 'number' ? max : undefined}
    min={type === 'number' ? min : undefined} step={type === 'number' ? '.01' : undefined} autoComplete={autoComplete}/></label>;
}

export function Notes({ name, label, value, maxLength = 2000, required = false }: {
  name: string; label: string; value?: string | null; maxLength?: number; required?: boolean;
}) {
  return <label className="field">{label}<textarea name={name} defaultValue={value ?? ''} rows={4} maxLength={maxLength} required={required}/></label>;
}
