const form=document.querySelector('#privacy-form');
form.addEventListener('submit',async event=>{
  event.preventDefault();const button=form.querySelector('button');const status=document.querySelector('#privacy-status');button.disabled=true;status.textContent='Saving your request…';
  try{const response=await fetch('/api/privacy',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.email.value,requestType:form.requestType.value,website:form.website.value}),signal:AbortSignal.timeout(25000)});const data=await response.json();if(!response.ok)throw Error(data.error);status.textContent=data.message;form.reset();}catch(error){status.textContent=error.name==='TimeoutError'?'The request took too long. Please try again.':error.message||'Please check your connection and try again.';}finally{button.disabled=false;}
});
