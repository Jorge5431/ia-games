'use client';

import { imageInputAccept, imageLimitBytes, imageLimitMb } from '@/lib/image-limits';

export function ImageField() {
  return <label className="field">
    Imagem JPEG, PNG ou WebP (até {imageLimitMb} MB)
    <input name="image" type="file" accept={imageInputAccept} required onChange={event=>{
      const input=event.currentTarget;
      const file=input.files?.[0];
      input.setCustomValidity(file && file.size>imageLimitBytes ? 'Escolha uma imagem de até '+imageLimitMb+' MB.' : '');
    }}/>
  </label>;
}
