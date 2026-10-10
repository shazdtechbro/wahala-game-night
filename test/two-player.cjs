const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
  const a=await browser.newContext(),b=await browser.newContext();
  const s=await a.newPage(),n=await b.newPage(),errors=[];
  for(const p of [s,n])p.on('pageerror',e=>errors.push(e.message));
  const hub=async()=>{await s.locator('#back-hub').click();await n.locator('#hub').waitFor();};
  const play=async id=>{await s.locator(`[data-module="${id}"]`).click();await n.waitForFunction(id=>Room.state.current===id,id);};
  await s.goto('http://127.0.0.1:8001/dist/?emulator=1');
  await s.waitForFunction(()=>window.Room);
  assert(!/defendant|court|hearing/i.test(await s.locator('#lobby').innerText()));
  await s.locator('#create-room').click();await s.waitForFunction(()=>Room.active);
  await n.goto(await s.evaluate(()=>Room.invite()));await n.waitForFunction(()=>Room.active);
  await s.locator('#create-room').waitFor({state:'hidden'});await n.locator('#join-room').waitFor({state:'hidden'});await s.locator('#room-ready').click();await n.locator('#room-ready').click();
  await Promise.all([s.locator('[data-guess]').first().waitFor(),n.locator('[data-guess]').first().waitFor()]);
  assert.equal(await s.evaluate(()=>Room.state.current),'quotes','Game should start with a quick guess');
  assert.equal(await s.locator('[data-player="anike"][data-guess]').count(),0,'Partner controls should not be on my phone');
  assert.equal(await n.locator('[data-player="shazily"][data-guess]').count(),0);
  console.log('PASS: both ready → quick guessing game, only own controls');

  await hub();await play('opening');await n.locator('.slide').waitFor();
  assert.equal(await s.locator('.timer,[data-action="pause"]').count(),0,'Optional recap should have no timer');
  await s.locator('[data-slide="3"]').click();await n.waitForFunction(()=>Room.state.slide===3);
  assert.equal(await n.evaluate(()=>Room.state.playback.paused),true);
  console.log('PASS: optional recap, manual shared navigation');

  await s.locator('#chat-toggle').click();await s.locator('#chat-input').fill('Anike, this card is reporting you 😹');
  await s.locator('#chat-form button').click();await n.locator('#chat-notice').waitFor();
  assert.match(await n.locator('#chat-preview').innerText(),/reporting you/);
  assert.equal(await n.locator('#chat-unread').innerText(),'1 new');
  await n.locator('#chat-notice-open').click();assert(await n.locator('#chat-unread').isHidden());
  await n.waitForFunction(()=>document.querySelector('#chat-messages').innerText.includes('reporting you'));
  assert.match(await n.locator('.chat-context').last().innerText(),/card 4/);
  await n.locator('#chat-input').fill('I can see your message live ❤️');await n.locator('#chat-form button').click();
  await s.waitForFunction(()=>document.querySelector('#chat-messages').innerText.includes('I can see your message live'));
  assert(await s.locator('#chat-notice').isHidden());
  await n.locator('#chat-close').click();await s.locator('#chat-input').fill('Second live message');
  await s.locator('#chat-form button').click();await n.locator('#chat-notice').waitFor();
  assert.equal(await n.locator('#chat-unread').innerText(),'1 new');
  await n.reload();await n.waitForFunction(()=>Room.active&&document.querySelector('#chat-messages').innerText.includes('Second live message'));
  assert(await n.locator('#chat-notice').isHidden());assert(await n.locator('#chat-unread').isHidden());
  await s.locator('#chat-close').click();console.log('PASS: live chat both ways, unread alerts and old-message baseline');

  await hub();await play('quotes');
  for(let round=0;round<8;round++){
   await s.waitForFunction(r=>Room.state.quoteRound===r,round);await n.waitForFunction(r=>Room.state.quoteRound===r,round);
   const right=await s.evaluate(r=>NIGHT_CONTENT.quotes[r][1],round);
   await s.locator(`[data-player="shazily"][data-guess="${right}"]`).click();
   await s.waitForFunction(()=>document.querySelector('[data-player="shazily"][data-guess]')===null);
   assert.equal(await n.locator('.result').count(),0,'Answer revealed before both guesses');
   await n.locator('[data-player="anike"][data-guess="shazily"]').click();
   await Promise.all([s.locator('.result').waitFor(),n.locator('.result').waitFor()]);
   await s.locator('[data-action="quote-next"]').click();
  }
  await Promise.all([s.locator('.completion').waitFor(),n.locator('.completion').waitFor()]);
  assert.match(await n.locator('.completion').innerText(),/Shazily wins/);
  assert.equal(await n.evaluate(()=>S.scores.shazily),8);
  assert.equal(await n.locator('[data-action="replay"]').count(),0,'Online saved answers cannot be replayed');
  console.log('PASS: eight guessing rounds, private guesses, scores and winner');

  await hub();await play('traps');
  await s.locator('[data-suggestion="0"]').click();
  assert((await s.locator('[name="question"]').inputValue()).length>10);
  assert((await s.locator('[name="answer"]').inputValue()).length>0);
  await s.locator('[name="question"]').fill('Anike, where did we go?');await s.locator('[name="answer"]').fill('Maryland');
  await s.locator('#trap-form button.primary').click();await n.locator('#trap-guess textarea').waitFor();
  assert(!(await n.locator('#stage').innerText()).includes('Maryland'),'Secret exposed before guess');
  await n.locator('#trap-guess textarea').fill('Maryland');await n.locator('#trap-guess button').click();
  await s.locator('[data-trap-result="remember"]').click();
  await n.waitForFunction(()=>S.traps.some(t=>t.author==='shazily'&&t.finished));
  assert.equal(await s.locator('#trap-form').count(),0,'Finished author should wait for partner');
  await n.locator('[data-suggestion="0"]').click();await n.locator('#trap-form button.primary').click();
  await s.locator('#trap-guess textarea').fill('Microbiology');await s.locator('#trap-guess button').click();
  await n.locator('[data-trap-result="remember"]').click();
  await Promise.all([s.locator('.completion').waitFor(),n.locator('.completion').waitFor()]);
  console.log('PASS: suggested questions, hidden answers, both authors and turn handoff');

  for(const [module,type] of [['replies','reply'],['stories','story'],['soft','soft']]){
   await hub();await play(module);await n.locator('.written-form').waitFor();
   assert.equal(await s.locator('.written-form').count(),1);
   assert.equal(await n.locator('.written-form').count(),1);
   await s.locator('.written-form textarea').fill('My secret answer');await s.locator('.written-form button').click();
   await s.waitForFunction(()=>document.querySelector('.written-form')===null);
   assert(!(await n.locator('#stage').innerText()).includes('My secret answer'));
   await n.locator('.written-form textarea').fill('My partner answer');await n.locator('.written-form button').click();
   await Promise.all([s.locator('.result').waitFor(),n.locator('.result').waitFor()]);
   assert.match(await n.locator('.result').innerText(),/My secret answer/);
   await s.locator('[data-action="written-next"]').click();await n.waitForFunction(type=>S[type+'Round']===1,type);
  }
  console.log('PASS: reply, memory and sweet games; private answers and shared next round');
  await s.setViewportSize({width:390,height:844});assert(await s.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow');
  await s.screenshot({path:'/workspace/scratch/wahala-live-mobile.png'});
  const local=await browser.newPage();local.on('pageerror',e=>errors.push(e.message));
  await local.goto('http://127.0.0.1:8001/dist/');
  await local.locator('#local-mode').click();
  await local.locator('[data-ready="shazily"]').click();await local.locator('[data-ready="anike"]').click();
  await local.locator('#begin').click();await local.locator('[data-guess]').first().waitFor();
  await local.locator('[data-player="shazily"][data-guess="anike"]').click();
  assert.equal(await local.locator('.result').count(),0);
  await local.locator('[data-player="anike"][data-guess="anike"]').click();await local.locator('.result').waitFor();
  await local.locator('#back-hub').click();await local.locator('[data-module="opening"]').click();
  await local.locator('[data-slide="6"]').click();
  await local.locator('[data-voter="shazily"][data-nominee="both"]').click();
  await local.locator('[data-voter="anike"][data-nominee="both"]').click();await local.locator('.jury .result').waitFor();
  assert.equal(await local.locator('.timer').count(),0);
  assert.deepEqual(errors,[]);console.log('PASS: all six activities, two-phone and one-phone play, live chat and mobile layout');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
