import { createEnrollment, createInvitation, createOrganizerEncryptionKey, createResponse, decodePacket } from './participant-exchange.js';
const $=(id)=>document.querySelector('#'+id); let enrollment, invitation;
const setMessage=(id,text,error=false)=>{$(id).textContent=text;$(id).classList.toggle('error',error);};
async function copy(value,messageId){try{await navigator.clipboard.writeText(value);setMessage(messageId,'Copied to clipboard.');}catch{setMessage(messageId,'Copy was blocked. Select the packet and copy it manually.',true);}}
$('enroll').onclick=()=>{try{enrollment=createEnrollment($('slot').value);localStorage.setItem(`veilconsent:${$('slot').value}:secret`,enrollment.secret);$('enrollment').value=enrollment.packet;$('copyEnrollment').disabled=false;setMessage('enrollMessage','Credential created. Keep this browser storage until you answer the invitation.');}catch(error){setMessage('enrollMessage',error.message,true);}};
$('copyEnrollment').onclick=()=>copy($('enrollment').value,'enrollMessage');
function reviewInvitation(){try{invitation=decodePacket($('invitation').value,'invitation');const purpose=invitation.purpose;$('reviewSlot').textContent=invitation.slot;$('reviewTask').textContent=purpose.task;$('reviewModel').textContent=purpose.model;$('reviewRecipients').textContent=purpose.recipients;$('reviewRetention').textContent=purpose.retention;$('reviewExpiry').textContent=new Date(Number(invitation.expiry)*1000).toLocaleString();$('reviewRequest').textContent=invitation.request.slice(0,16)+'…'+invitation.request.slice(-8);$('reviewCard').style.display='block';setMessage('reviewMessage','Verify these terms. Your response will be encrypted before it leaves this page.');}catch(error){$('reviewCard').style.display='none';setMessage('reviewMessage',error.message,true);}}
$('review').onclick=reviewInvitation;
async function answer(approved){try{if(!invitation)throw new Error('Review an invitation first');const storageKey=`veilconsent:${invitation.slot}:secret`;const secret=localStorage.getItem(storageKey);if(!secret)throw new Error(`No local credential is available for participant ${invitation.slot}`);$('response').value=await createResponse($('invitation').value,secret,approved);localStorage.removeItem(storageKey);$('copyResponse').disabled=false;setMessage('responseMessage',approved?'Approval encrypted. The one-time credential was removed from browser storage.':'Decline encrypted. The one-time credential was removed from browser storage.');}catch(error){setMessage('responseMessage',error.message,true);}}
$('approve').onclick=()=>answer(true);$('decline').onclick=()=>answer(false);$('copyResponse').onclick=()=>copy($('response').value,'responseMessage');

if(new URLSearchParams(location.search).get('demo')==='review'){
  enrollment=createEnrollment('B');
  $('slot').value='B';
  $('enrollment').value=enrollment.packet;
  $('copyEnrollment').disabled=false;
  const organizer=await createOrganizerEncryptionKey();
  $('invitation').value=createInvitation({slot:'B',credential:enrollment.credential,request:'7b'.repeat(32),purpose:{task:'Summarize decisions and action items',model:'veil-demo-v1',recipients:'Project Aurora members',retention:'24 hours'},expiry:Math.floor(Date.now()/1000)+3600,organizerPublicKey:organizer.publicKey});
  reviewInvitation();
  document.querySelector('.panel').style.display='none';
}
