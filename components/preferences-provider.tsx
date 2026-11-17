'use client';
import { createContext, useContext, useState } from 'react';
import { MotionConfig, useReducedMotion } from 'motion/react';
import { defaults, preferenceCookie, type Preferences } from '@/lib/preferences';

const Context=createContext({preferences:defaults,save:(_value:Preferences)=>{void _value;}});
export function PreferencesProvider({initial,children}:{initial:Preferences;children:React.ReactNode}) {
  const [preferences,setPreferences]=useState(initial);
  function save(value:Preferences) {
    document.cookie=`${preferenceCookie}=${encodeURIComponent(JSON.stringify(value))}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;
    setPreferences(value);
    const root=document.documentElement;
    root.dataset.theme=value.theme;root.dataset.motion=value.motion;root.dataset.textSize=value.textSize;
    root.dataset.contrast=value.contrast;root.dataset.density=value.density;
  }
  return <Context.Provider value={{preferences,save}}><MotionConfig reducedMotion={preferences.motion==='reduced'?'always':'user'}>{children}</MotionConfig></Context.Provider>;
}
export function usePreferences(){return useContext(Context);}
export function useGentleMotion(){const system=useReducedMotion();const {preferences}=usePreferences();return system||preferences.motion==='reduced';}
export function useLabel(){const {preferences}=usePreferences();return (pt:string,en:string,es:string)=>preferences.language==='en'?en:preferences.language==='es'?es:pt;}
