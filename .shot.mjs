import { chromium } from '@playwright/test';
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const p=await b.newPage({reducedMotion:'reduce',...({viewport:{width:500,height:800},deviceScaleFactor:4})});
await p.goto('http://localhost:4199/');await p.waitForTimeout(800);
const c=await p.$('canvas');const box=await c.boundingBox();
await p.screenshot({path:process.argv[2]+'/title.png',clip:{x:box.x+box.width/2-70,y:box.y+box.height*0.42,width:140,height:130}});
await p.keyboard.press('Space');await p.waitForTimeout(400);
await p.screenshot({path:process.argv[2]+'/play.png'});
await b.close();
