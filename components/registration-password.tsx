'use client';

import { useForm, useWatch } from 'react-hook-form';

export function RegistrationPassword() {
  const { register, control }=useForm({defaultValues:{password:'',confirm:''}});
  const [password,confirm]=useWatch({control,name:['password','confirm']});
  const mismatch=Boolean(confirm && confirm!==password);
  return <>
    <label className="field">Senha<input type="password" autoComplete="new-password" minLength={8} required {...register('password')}/></label>
    <label className="field">Confirme a senha<input type="password" autoComplete="new-password" minLength={8} required
      aria-invalid={mismatch || undefined} aria-describedby={mismatch?'password-match':undefined} {...register('confirm')}/></label>
    {mismatch && <p id="password-match" className="muted">As senhas precisam ser iguais.</p>}
  </>;
}
