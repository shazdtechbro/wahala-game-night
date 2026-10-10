const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
  const s=await(await browser.newContext()).newPage(),n=await(await browser.newContext()).newPage();
  if(process.env.TEST_OLD_APP){const old=require('node:child_process').execFileSync('git',['show','HEAD:dist/app.js'],{encoding:'utf8'});await s.route('**/app.js',r=>r.fulfill({contentType:'application/javascript',body:old}));}
  await s.goto('http://127.0.0.1:8001/dist/?emulator=1');await s.waitForFunction(()=>window.Room);
  await s.locator('#create-room').click();await s.waitForFunction(()=>Room.active);
  await n.goto(await s.evaluate(()=>Room.invite()));await n.waitForFunction(()=>Room.active);
  await s.locator('#room-ready').click();await n.locator('#room-ready').click();
  await s.locator('[data-guess="anike"]').click();await n.locator('[data-guess="anike"]').click();
  await Promise.all([s.locator('.result').waitFor(),n.locator('.result').waitFor()]);
  await s.evaluate(()=>{
   addEventListener('roomstate',e=>window.__lastRoomEvent=structuredClone(e.detail));
   window.__release=null;window.__held=false;
   const gate=()=>new Promise(resolve=>{window.__held=true;window.__release=resolve;});
   const patch=Room.patch.bind(Room),next=Room.nextRound.bind(Room);window.__originalNext=next;
   Room.patch=async data=>{if(data.quoteRound!==Room.state.quoteRound)await gate();return patch(data);};
   Room.nextRound=async(...args)=>{await gate();return next(...args);};
  });
  // A real message snapshot arrives while the next-round request is held.
  await n.evaluate(()=>Room.chat('Before next round','test'));
  await s.waitForFunction(()=>window.__lastRoomEvent?.messages.some(m=>m.text==='Before next round'));
  await s.locator('[data-action="quote-next"]').click();await s.waitForFunction(()=>window.__held);
  await s.evaluate(()=>dispatchEvent(new CustomEvent('roomstate',{detail:window.__lastRoomEvent})));
  assert.equal(await s.locator('#section-progress').innerText(),'1 / 8','An unconfirmed round must not show new name buttons');
  assert.equal(await s.locator('[data-guess]').count(),0);
  await s.evaluate(()=>window.__release());
  await s.waitForFunction(()=>Room.state.quoteRound===1);await n.waitForFunction(()=>Room.state.quoteRound===1);
  await s.locator('[data-guess="shazily"]').click();await n.locator('[data-guess="shazily"]').click();
  await Promise.all([s.locator('.result').waitFor(),n.locator('.result').waitFor()]);
  // Both people pressing Next together must advance one round, not skip one.
  await s.evaluate(()=>{Room.nextRound=window.__originalNext;});
  await Promise.all([s.evaluate(()=>Room.nextRound('quote',1)),n.evaluate(()=>Room.nextRound('quote',1))]);
  await s.waitForFunction(()=>Room.state.quoteRound===2);await n.waitForFunction(()=>Room.state.quoteRound===2);
  await n.evaluate(()=>Room.nextRound('quote',1));assert.equal(await n.evaluate(()=>Room.state.quoteRound),2);
  console.log('PASS: delayed Next plus chat update, working next-round names, concurrent and stale Next requests');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
