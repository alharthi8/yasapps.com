const form=document.querySelector('#privacy-form');
form.addEventListener('submit',async event=>{
  event.preventDefault();const button=form.querySelector('button');const status=document.querySelector('#privacy-status');button.disabled=true;status.textContent='Saving your request…';
  try{const {submitFormJson}=await import('/form-request.js');const data=await submitFormJson('/api/privacy',{email:form.email.value,requestType:form.requestType.value,website:form.website.value});status.textContent=data.message;form.reset();}catch(error){status.textContent=error.message||'Please check your connection and try again.';}finally{button.disabled=false;}
});
