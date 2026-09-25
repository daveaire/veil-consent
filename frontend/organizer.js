import { BrowserConsentSession, browserConsentInput } from './proof-client.js';
import { createInvitation, createOrganizerEncryptionKey, hexToBytes, openResponse, readEnrollment } from './participant-exchange.js';
import { canonicalPurpose, createPurposePolicy, assertExecutionAllowed } from '../src/purpose-policy.js';
const $ = (id) => document.querySelector('#' + id);
const session = await BrowserConsentSession.create();
const demoStep = new URLSearchParams(location.search).get('demo');
const demoCapture = Boolean(demoStep);
const sampleDocument = 'Project Aurora launches Tuesday. Keep the customer list private. Legal must review the announcement tomorrow.';
if (demoCapture) {
  document.documentElement.classList.add('demo-capture');
  document.querySelector('.wallet').style.display = 'none';
}
let input, encrypted, organizerEncryption, activeRequest, activePurpose;
const enrollments = [null, null, null], independentResponses = [null, null, null];

function purposePolicy() { return createPurposePolicy({task:$('task').value,model:$('model').value,recipients:$('recipients').value,retention:$('retention').value}); }
function purpose() { return canonicalPurpose(purposePolicy()); }
function decisions() { return [$('p1').checked, $('p2').checked, $('p3').checked]; }
function isIndependent() { return $('workflow').value === 'independent'; }
function message(value, error=false) { $('message').textContent=value; $('message').classList.toggle('error', error); }
function stage(n, label) {
  const el=$('s'+n);
  el.classList.add('done');
  el.querySelector('.badge').textContent=label;
  $('statusChip').textContent=n === 1 ? 'Awaiting consent' : n === 2 ? 'Authorized' : 'Consumed';
}
function paint() { return demoCapture ? Promise.resolve() : new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); }
async function encrypt(text, secret) { const iv=crypto.getRandomValues(new Uint8Array(12)); const key=await crypto.subtle.importKey('raw',secret,'AES-GCM',false,['encrypt','decrypt']); return {iv,data:new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(text))),key}; }
async function decrypt(envelope) { return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:envelope.iv},envelope.key,envelope.data)); }

async function createRequest() {
  $('create').disabled=true; $('create').textContent='Encrypting…'; message('Encrypting the document and creating its purpose-bound commitment…');
  try {
    await paint();
    const now=Math.floor(Date.now()/1000), document=$('document').value.trim();
    if(!document) throw new Error('Add a private document or choose Use sample before creating the request');
    if(isIndependent() && enrollments.some(value=>!value)) throw new Error('Import all three participant enrollments before creating the request');
    const expiry=now+Number($('expiry').value);
    if(isIndependent()) organizerEncryption=await createOrganizerEncryptionKey();
    input=await browserConsentInput({document,purpose:purpose(),threshold:Number($('threshold').value),decisions:[false,false,false],expiry,credentials:isIndependent()?enrollments.map(item=>hexToBytes(item.credential)):[],revocationHandles:isIndependent()?enrollments.map(item=>hexToBytes(item.revocationHandle)):[]});
    encrypted=await encrypt(document,input.capabilitySecret);
    const result=session.createRequest(input);
    activeRequest=result.request;
    activePurpose=purposePolicy();
    $('document').value=''; $('document').placeholder='Encrypted locally · plaintext cleared';
    $('commitment').textContent=result.request; stage(1,'Active');
    $('create').textContent='Request created'; $('create').hidden=true; $('issue').hidden=false; $('revoke').hidden=false; $('issue').disabled=isIndependent(); $('revoke').disabled=false;
    $('workflow').disabled=true;
    if(isIndependent()) await renderInvitations(result.request,expiry);
    message(`Encrypted ${encrypted.data.length} bytes. The circuit exposed no identity, vote, threshold, purpose, or plaintext.`);
  } catch (error) { $('create').disabled=false; $('create').textContent='Create request'; message(error.message,true); throw error; }
}
async function issueCapability() { $('issue').disabled=true; $('issue').textContent='Proving…'; message('Checking the private responses against the committed consent policy…'); try { await paint(); if(!isIndependent())[input.decisionA,input.decisionB,input.decisionC]=decisions().map(x=>x?1n:0n); const result=session.issueCapability(input,Math.floor(Date.now()/1000)); $('commitment').textContent=result.capability; stage(2,'Issued'); $('issue').textContent='Consent proven'; $('process').hidden=false; $('process').disabled=false; message('Zero-knowledge circuit accepted the private consent witnesses. A one-use capability is ready.'); } catch(error){ $('issue').disabled=false; $('issue').textContent='Prove consent'; message(error.message,true); throw error; } }
async function processOnce() { $('process').disabled=true; $('process').textContent='Processing…'; message('Validating the execution policy, then consuming the one-use capability before decryption…'); try { await paint(); assertExecutionAllowed(activePurpose,{task:activePurpose.task,model:activePurpose.model,recipient:activePurpose.recipients,retentionSeconds:activePurpose.retentionSeconds}); session.consumeCapability(input,Math.floor(Date.now()/1000)); const text=await decrypt(encrypted); const summary=text.split(/(?<=[.!?])\s+/).slice(0,2).join(' '); stage(3,'Consumed'); $('process').textContent='Processed once'; $('revoke').disabled=true; $('output').style.display='block'; $('output').textContent='AI adapter output: '+summary; message('Capability consumed under the committed task, model, recipient, and retention policy. A replay attempt will be rejected by contract state.'); } catch(error){ $('process').disabled=false; $('process').textContent='Process once'; message(error.message,true); throw error; } }
$('create').onclick = createRequest;
$('issue').onclick = issueCapability;
$('process').onclick = processOnce;
$('revoke').onclick = () => { try { session.revoke(input); $('issue').disabled=true; $('process').disabled=true; $('revoke').disabled=true; stage(1,'Revoked'); $('statusChip').textContent='Revoked'; message('Request revoked. No capability can now be issued or consumed.'); } catch(error){ message(error.message,true); } };

$('workflow').onchange=()=>{const independent=isIndependent();$('localResponses').style.display=independent?'none':'grid';$('enrollmentPanel').classList.toggle('visible',independent);$('enrollmentPanel').open=independent;$('modeLocal').checked=!independent;$('modeIndependent').checked=independent;$('modeLocalCard').classList.toggle('selected',!independent);$('modeIndependentCard').classList.toggle('selected',independent);$('create').disabled=independent&&enrollments.some(value=>!value);message(independent?'Import one enrollment packet from each participant before creating the request.':'Local walkthrough uses three simulated participants in this browser.');};
document.querySelectorAll('.enroll-import').forEach(button=>button.onclick=()=>{try{const slot=button.dataset.slot,index=['A','B','C'].indexOf(slot),packet=readEnrollment($('enroll'+slot).value);if(packet.slot!==slot)throw new Error(`This enrollment is for participant ${packet.slot}`);if(enrollments.some((item,itemIndex)=>itemIndex!==index&&item?.credential===packet.credential))throw new Error('Each participant must use a distinct credential');enrollments[index]=packet;$('enrollStatus'+slot).textContent='Credential ready';$('create').disabled=enrollments.some(value=>!value);message(`Participant ${slot} enrollment imported. The private credential was not disclosed.`);}catch(error){message(error.message,true);}});
async function copyPacket(value){try{await navigator.clipboard.writeText(value);message('Invitation copied. Send it to the assigned participant.');}catch{message('Copy was blocked. Select the invitation packet and copy it manually.',true);}}
async function renderInvitations(request,expiry){const grid=$('invitationGrid');grid.replaceChildren();for(const [index,enrollment] of enrollments.entries()){const slot=['A','B','C'][index],packet=await createInvitation({slot,credential:enrollment.credential,request,purpose:activePurpose,expiry,organizerPublicKey:organizerEncryption.publicKey,organizerSigningPublicKey:organizerEncryption.signingPublicKey,organizerSigningPrivateKey:organizerEncryption.signingKeyPair.privateKey});const card=document.createElement('div');card.className='packet-card';const title=document.createElement('strong');title.textContent=`Participant ${slot}`;const area=document.createElement('textarea');area.readOnly=true;area.value=packet;const button=document.createElement('button');button.className='secondary';button.textContent='Copy invitation';button.onclick=()=>copyPacket(packet);card.append(title,area,button);grid.append(card);}$('organizerFingerprint').textContent=organizerEncryption.signingFingerprint;$('invitationPanel').classList.add('visible');$('invitationPanel').open=true;}
$('importResponse').onclick=async()=>{try{if(!organizerEncryption||!activeRequest)throw new Error('Create an independent request first');const response=await openResponse($('responsePacket').value,organizerEncryption.keyPair.privateKey,activeRequest,enrollments.map(item=>item.credential),activePurpose);const index=['A','B','C'].indexOf(response.slot);if(independentResponses[index])throw new Error(`Participant ${response.slot} has already responded`);independentResponses[index]=response;if(response.approved)input[['approvalSecretA','approvalSecretB','approvalSecretC'][index]]=hexToBytes(response.approvalSecret);input[['decisionA','decisionB','decisionC'][index]]=response.approved?1n:0n;$('response'+response.slot).textContent=`${response.slot} received`;$('response'+response.slot).classList.add('done');$('responsePacket').value='';$('issue').disabled=independentResponses.some(value=>!value);message(`Participant ${response.slot} response authenticated and decrypted locally. The decision is hidden from the public ledger; the organizer can see it.`);}catch(error){message(error.message,true);}};

const draftKey='veilconsent:organizer-draft:v1';
const draftFields=['task','model','recipients','retention','threshold','expiry'];
try { const draft=JSON.parse(sessionStorage.getItem(draftKey)||'null'); if(draft) for(const id of draftFields) if(draft[id]!==undefined) $(id).value=draft[id]; } catch {}
function saveDraft(){sessionStorage.setItem(draftKey,JSON.stringify(Object.fromEntries(draftFields.map(id=>[id,$(id).value]))));}
for(const id of draftFields) $(id).addEventListener('change',saveDraft);
$('useSample').onclick=()=>{$('document').value=sampleDocument;message('Sample document loaded. Replace it with your own text or continue with the example.');};
for(const radio of [$('modeLocal'),$('modeIndependent')]) radio.onchange=()=>{if(!radio.checked)return;$('workflow').value=radio.value;$('workflow').dispatchEvent(new Event('change'));};

let wizardPage=1;
function renderSummary(){
  $('summaryDocument').textContent=`${$('document').value.trim().length} characters · encrypted locally`;
  $('summaryTask').textContent=$('task').value;
  $('summaryModel').textContent=$('model').value;
  $('summaryRecipients').textContent=$('recipients').value;
  $('summaryRetention').textContent=$('retention').value;
  $('summaryThreshold').textContent=$('threshold').selectedOptions[0].textContent;
  $('summaryExpiry').textContent=$('expiry').selectedOptions[0].textContent;
  $('summaryWorkflow').textContent=isIndependent()?'Independent participants':'Local walkthrough';
}
function showWizard(page){
  wizardPage=page;
  for(let i=1;i<=3;i++){
    $('wizardPage'+i).hidden=i!==page;
    $('wizardPage'+i).classList.toggle('active',i===page);
    $('wizardTab'+i).classList.toggle('active',i===page);
    $('wizardTab'+i).toggleAttribute('aria-current',i===page);
  }
  $('wizardBack').hidden=page===1;
  $('wizardNext').hidden=page===3;
  $('create').hidden=page!==3;
  if(page===3) renderSummary();
}
function validatePage(page){
  if(page===1){
    if(!$('document').value.trim()) throw new Error('Add a private document or choose Use sample');
    purposePolicy();
  }
  if(page===2&&isIndependent()&&enrollments.some(value=>!value)) message('You can review now and finish importing all three enrollments before creating the request.');
}
$('wizardNext').onclick=()=>{try{validatePage(wizardPage);showWizard(Math.min(3,wizardPage+1));message(wizardPage===2?'Choose a consent workflow and policy.':'Review the exact authorization boundary before creating it.');}catch(error){message(error.message,true);}};
$('wizardBack').onclick=()=>showWizard(Math.max(1,wizardPage-1));
for(let i=1;i<=3;i++)$('wizardTab'+i).onclick=()=>{if(i<=wizardPage)showWizard(i);};

let walletApi=null, walletProviders=[];
function compatibleWallets(){ return Object.entries(window.midnight??{}).filter(([,wallet])=>wallet&&typeof wallet.connect==='function'); }
function refresh(){ walletProviders=compatibleWallets(); const selector=$('walletProvider'); selector.replaceChildren(...walletProviders.map(([key,wallet])=>{const option=document.createElement('option'); option.value=key; option.textContent=wallet.name||key; return option;})); selector.hidden=walletProviders.length<2; $('walletState').textContent=walletProviders.length?`${walletProviders.length} compatible wallet${walletProviders.length===1?'':'s'} detected`:'No compatible wallet detected'; $('walletDetail').textContent=walletProviders.length?'Check a provider on Midnight Preprod. Local request actions remain browser-only.':'Wallet detection is optional; the walkthrough remains local.'; }
$('refreshWallet').onclick=refresh;
$('connectWallet').onclick=async()=>{ refresh(); const selected=$('walletProvider').value||walletProviders[0]?.[0]; const found=walletProviders.find(([key])=>key===selected); if(!found)return; $('connectWallet').disabled=true; $('connectWallet').textContent='Checking…'; $('walletState').textContent=`Waiting for ${found[1].name||found[0]}`; $('walletDetail').textContent='Approve the Preprod compatibility check in your wallet. No transaction will be submitted.'; try{ walletApi=await found[1].connect('preprod'); const state=await walletApi.getConnectionStatus(); if(state.status!=='connected'||state.networkId.toLowerCase()!=='preprod')throw new Error('Switch the selected wallet to Midnight Preprod.'); const {unshieldedAddress}=await walletApi.getUnshieldedAddress(); $('walletState').textContent=`${found[1].name||found[0]} checked · Preprod`; $('walletDetail').textContent=`${unshieldedAddress} · Local walkthrough only`; $('walletProvider').disabled=true; $('connectWallet').textContent='Checked'; }catch(error){ $('walletState').textContent='Compatibility check failed'; $('walletDetail').textContent=error.message; $('connectWallet').disabled=false; $('connectWallet').textContent='Check wallet'; } };
setTimeout(refresh,250);

if (demoStep) $('document').value=sampleDocument;
if (demoStep && demoStep !== 'initial') {
  await createRequest();
  if (demoStep === 'issued' || demoStep === 'consumed' || demoStep === 'evidence') {
    await issueCapability();
  }
  if (demoStep === 'consumed' || demoStep === 'evidence') {
    await processOnce();
  }
  if (demoStep === 'evidence') {
    document.querySelector('.hero').style.display = 'none';
    document.querySelector('.mode-banner').style.display = 'none';
    document.querySelector('.grid').style.display = 'none';
  }
}
if (demoStep) document.body.dataset.demoReady = demoStep;
