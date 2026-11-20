'use client';
import { useState } from 'react';
import { defaults, type Preferences } from '@/lib/preferences';
import { useLabel,usePreferences } from './preferences-provider';

export function PreferencesPanel({heading: Heading = 'h2'}: {heading?: 'h1' | 'h2'}){
  const {preferences,save}=usePreferences();
  const t=useLabel();
  const [message,setMessage]=useState(false);
  function update<K extends keyof Preferences>(key:K,value:Preferences[K]) {save({...preferences,[key]:value});setMessage(true);}
  return <section className="panel preferences-panel"><div><p className="eyebrow">{t('DO SEU JEITO','MAKE IT YOURS','A TU MANERA')}</p><Heading>{t('Aparência e experiência','Appearance and experience','Apariencia y experiencia')}</Heading></div>
    <p className="muted">{t('Preferências salvas neste navegador.','Preferences saved in this browser.','Preferencias guardadas en este navegador.')}</p>
    <div className="form-grid">
      <label>{t('Tema','Theme','Tema')}<select aria-label={t('Tema','Theme','Tema')} value={preferences.theme} onChange={e=>update('theme',e.target.value as Preferences['theme'])}><option value="dark">{t('Escuro','Dark','Oscuro')}</option><option value="light">{t('Claro','Light','Claro')}</option><option value="system">{t('Usar tema do sistema','Use system theme','Usar tema del sistema')}</option></select></label>
      <label>{t('Idioma da navegação','Navigation language','Idioma de navegación')}<select aria-label={t('Idioma da navegação','Navigation language','Idioma de navegación')} value={preferences.language} onChange={e=>update('language',e.target.value as Preferences['language'])}><option value="pt-BR">Português (Brasil)</option><option value="en">English</option><option value="es">Español</option></select></label>
      <label>{t('Movimento','Motion','Movimiento')}<select aria-label={t('Movimento','Motion','Movimiento')} value={preferences.motion} onChange={e=>update('motion',e.target.value as Preferences['motion'])}><option value="full">{t('Imersivo','Immersive','Inmersivo')}</option><option value="reduced">{t('Reduzido','Reduced','Reducido')}</option></select></label>
      <label>{t('Tamanho do texto','Text size','Tamaño del texto')}<select aria-label={t('Tamanho do texto','Text size','Tamaño del texto')} value={preferences.textSize} onChange={e=>update('textSize',e.target.value as Preferences['textSize'])}><option value="normal">{t('Padrão','Standard','Estándar')}</option><option value="large">{t('Ampliado','Large','Grande')}</option></select></label>
      <label>{t('Contraste','Contrast','Contraste')}<select aria-label={t('Contraste','Contrast','Contraste')} value={preferences.contrast} onChange={e=>update('contrast',e.target.value as Preferences['contrast'])}><option value="normal">{t('Padrão','Standard','Estándar')}</option><option value="high">{t('Alto','High','Alto')}</option></select></label>
      <label>{t('Densidade do catálogo','Catalog density','Densidad del catálogo')}<select aria-label={t('Densidade do catálogo','Catalog density','Densidad del catálogo')} value={preferences.density} onChange={e=>update('density',e.target.value as Preferences['density'])}><option value="comfortable">{t('Confortável','Comfortable','Cómoda')}</option><option value="compact">{t('Compacta','Compact','Compacta')}</option></select></label>
    </div>
    <label className="preference-check"><input type="checkbox" checked={preferences.autoplay} onChange={e=>update('autoplay',e.target.checked)}/>{t('Trocar banners automaticamente','Rotate banners automatically','Cambiar banners automáticamente')}</label>
    <p className="muted">{t('O idioma altera a navegação, estas preferências e a tela de confirmação. Catálogo, formulários e páginas institucionais permanecem em português nesta versão.','Language applies to navigation, these preferences and confirmation. Catalog, forms and information pages remain in Portuguese in this version.','El idioma cambia la navegación, estas preferencias y la confirmación. Catálogo, formularios y páginas informativas permanecen en portugués en esta versión.')}</p>
    <p className="muted">{t('A preferência de movimento reduzido do seu dispositivo é sempre respeitada.','Your device’s reduced motion preference is always respected.','Siempre se respeta la preferencia de movimiento reducido de tu dispositivo.')}</p>
    <div><button className="button secondary" onClick={()=>{save(defaults);setMessage(true);}}>{t('Restaurar preferências','Reset preferences','Restablecer preferencias')}</button></div>
    <p role="status">{message?t('Preferências salvas.','Preferences saved.','Preferencias guardadas.'):''}</p>
  </section>;
}
