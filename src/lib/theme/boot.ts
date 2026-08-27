import { DEFAULT_THEME_PREFERENCE } from './types';

export const THEME_STORAGE_KEY = 'bytelabs.theme.v1';

/**
 * Runs synchronously in <head> before first paint, so the page never flashes the
 * wrong palette. It is a string rather than a module because it has to execute
 * ahead of hydration — which means it deliberately duplicates the small amount of
 * logic in resolve.ts. `resolve.test.ts` asserts the two agree.
 */
export const themeBootScript = `(function(){try{
var K=${JSON.stringify(THEME_STORAGE_KEY)};
var d=document.documentElement;
var p=${JSON.stringify(DEFAULT_THEME_PREFERENCE)};
try{var s=localStorage.getItem(K);if(s){var v=JSON.parse(s);
if(v&&typeof v.mode==='string')p.mode=v.mode;
if(v&&typeof v.skin==='string')p.skin=v.skin;}}catch(e){}
var t;
if(p.skin==='terminal'||p.skin==='neon'){t='dark';}
else if(p.mode==='light'){t='light';}
else if(p.mode==='dark'){t='dark';}
else if(p.mode==='system'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
else{var h=new Date().getHours();t=(h>=7&&h<18)?'light':'dark';}
d.setAttribute('data-skin',p.skin);
d.setAttribute('data-theme',t);
}catch(e){
document.documentElement.setAttribute('data-skin','default');
document.documentElement.setAttribute('data-theme','light');
}})();`;
