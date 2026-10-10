const {chromium}=require('playwright'),{buildSync}=require('esbuild');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
  const a=await browser.newContext(),b=await browser.newContext(),s=await a.newPage(),n=await b.newPage();
  const errors=[];for(const p of [s,n])p.on('pageerror',e=>errors.push(e.message));
  // Let the initial chat snapshot load, then simulate a listener that stops updating.
  const source=fs.readFileSync('src/firebase-room.js','utf8').replace('s=>{receiveMessages(s);}', 's=>{if(!messagesReady)receiveMessages(s);}');
  assert.notEqual(source,fs.readFileSync('src/firebase-room.js','utf8'));
  const stalled=buildSync({stdin:{contents:source,resolveDir:process.cwd(),sourcefile:'chat-stalled.js'},bundle:true,format:'esm',write:false}).outputFiles[0].text;
  await n.route('**/firebase-room.js',r=>r.fulfill({contentType:'application/javascript',body:stalled}));
  await s.goto('http://127.0.0.1:8001/dist/?emulator=1');await s.waitForFunction(()=>window.Room);
  await s.locator('#create-room').click();await s.waitForFunction(()=>Room.active);
  await n.goto(await s.evaluate(()=>Room.invite()));await n.waitForFunction(()=>Room.active);
  await s.locator('#chat-toggle').click();await n.locator('#chat-toggle').click();
  // Chat must not depend on successful processing of a game update.
  await n.evaluate(()=>addEventListener('roomstate',e=>e.stopImmediatePropagation(),{capture:true}));
  const response=await n.waitForFunction(()=>document.querySelector('#chat-messages'));await response.dispose();
  await s.locator('#chat-input').fill('This should arrive without refreshing');await s.locator('#chat-form button').click();
  await n.locator('.chat-message').filter({hasText:'This should arrive without refreshing'}).waitFor({timeout:15000});
  const text='Long message to fill the chat. '.repeat(15);
  await s.evaluate(async text=>{for(let i=0;i<8;i++)await Room.chat(text+i,'test');},text);
  await n.locator('.chat-message').filter({hasText:text+'7'}).waitFor({timeout:15000});
  assert(await n.evaluate(()=>{const log=document.querySelector('#chat-messages');return log.scrollHeight-log.scrollTop-log.clientHeight<3;}),'New incoming message should be visible at the bottom');
  assert.equal(await n.locator('.chat-message').count(),9,'Recovery must not duplicate messages');
  assert(await n.locator('#chat-unread').isHidden(),'Open chat should not show unread notifications');
  await n.locator('#chat-input').fill('Live reply back');await n.locator('#chat-form button').click();
  await s.locator('.chat-message').filter({hasText:'Live reply back'}).waitFor();
  assert.equal(await n.locator('#chat-input').inputValue(),'');
  await n.setViewportSize({width:390,height:844});
  assert(await n.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Chat should fit a phone');
  assert.deepEqual(errors,[]);
  console.log('PASS: stalled listener recovery without refresh, independent chat updates, long-history auto-scroll, no duplicates, reply delivery and mobile width');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
