'use strict';
const modal = document.getElementById('offer-dialog');
let opener;
for (const button of document.querySelectorAll('[data-offer]')) button.addEventListener('click',()=>{opener=button;modal.showModal();});
document.getElementById('close-dialog').addEventListener('click',()=>modal.close());
modal.addEventListener('click',event=>{if(event.target===modal){const r=modal.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)modal.close();}});
modal.addEventListener('close',()=>opener?.focus());
for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>{
 for(const tab of document.querySelectorAll('[data-view]'))tab.setAttribute('aria-pressed',String(tab===button));
 for(const panel of document.querySelectorAll('[data-result]'))panel.hidden=panel.dataset.result!==button.dataset.view;
});
const sticky=document.querySelector('.sticky-offer');
if('IntersectionObserver' in window){new IntersectionObserver(entries=>sticky.classList.toggle('is-hidden',entries[0].isIntersecting),{threshold:0.12}).observe(document.getElementById('erbjudande'));}
