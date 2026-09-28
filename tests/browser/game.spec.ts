import { test, expect, type Page } from '@playwright/test';
const state=(page:Page)=>page.evaluate(()=>(window as any).__ember());
for(const [name,width,height,touch] of [['phone',390,844,true],['small-phone',360,640,true],['tablet',1024,768,true],['desktop',1440,900,false],['landscape-phone',844,390,true]] as const){
  test(`${name}: layout, controls, failure and repeated restart`,async({browser})=>{
    const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch});
    const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('/?test');await expect(page.locator('#start')).toBeVisible();
    const layout=await page.evaluate(()=>{
      const arena=document.getElementById('arena')!.getBoundingClientRect();
      const ids=['start','mute','fullscreen'];
      return {width:innerWidth,height:innerHeight,scroll:document.documentElement.scrollHeight,arena:{x:arena.x,y:arena.y,right:arena.right,bottom:arena.bottom},buttons:ids.map(id=>{const b=document.getElementById(id)!.getBoundingClientRect();return {id,x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height};})};
    });
    expect(layout.scroll).toBeLessThanOrEqual(height+1);
    expect(layout.arena.x).toBeGreaterThanOrEqual(0);expect(layout.arena.bottom).toBeLessThanOrEqual(height);
    for(const b of layout.buttons){expect(b.x).toBeGreaterThanOrEqual(0);expect(b.right).toBeLessThanOrEqual(width);expect(b.bottom).toBeLessThanOrEqual(height);expect(b.height).toBeGreaterThanOrEqual(40);}
    await page.screenshot({path:`test-results/${name}-start.png`});
    if(touch)await page.locator('#start').tap();else await page.keyboard.press('Space');
    await expect(page.locator('#arena')).toHaveAttribute('data-phase','playing');
    await page.waitForTimeout(350);
    if(touch)await page.locator('canvas').tap({position:{x:80,y:150}});else await page.keyboard.press('Space');
    expect((await state(page)).velocity).toBeLessThan(0);
    await expect(page.locator('#retry')).toBeVisible({timeout:5000});
    for(let i=0;i<2;i++){
      await page.locator('#retry').click();expect((await state(page)).score).toBe(0);
      await expect(page.locator('#retry')).toBeVisible({timeout:5000});
    }
    await page.screenshot({path:`test-results/${name}-end.png`});
    expect(errors).toEqual([]);await context.close();
  });
}
test('real input pilot scores; pause, mute, fullscreen and resize preserve run',async({page})=>{
  await page.goto('/?test');await page.locator('#start').click();
  for(let i=0;i<170;i++){
    const s=await state(page);expect(s.phase).toBe('playing');if(s.score>=3)break;
    const gate=s.gates.find((g:any)=>g.x+54>=83);
    if(s.y>(gate?.center??295)+14&&s.velocity>0)await page.keyboard.press('Space');
    await page.waitForTimeout(50);
  }
  expect((await state(page)).score).toBeGreaterThanOrEqual(3);
  await page.keyboard.press('KeyP');const frozen=await state(page);await page.waitForTimeout(250);
  expect((await state(page)).y).toBe(frozen.y);expect(frozen.phase).toBe('paused');
  await page.locator('#mute').click();expect((await state(page)).muted).toBe(true);
  await page.locator('#mute').click();expect((await state(page)).muted).toBe(false);
  await page.locator('#fullscreen').click();await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(true);
  await page.screenshot({path:'test-results/fullscreen.png'});
  await page.locator('#fullscreen').click();await expect.poll(()=>page.evaluate(()=>!!document.fullscreenElement)).toBe(false);
  await page.setViewportSize({width:1024,height:768});expect((await state(page)).score).toBe(frozen.score);
  await page.locator('#resume').click();await expect(page.locator('#arena')).toHaveAttribute('data-phase','playing');
  await expect.poll(async()=>(await state(page)).audioState).toBe('running');
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  await expect(page.locator('#arena')).toHaveAttribute('data-phase','paused');
  await expect.poll(async()=>(await state(page)).audioState).toBe('suspended');
});
test('holding Space does not repeat boost; mute is not a gameplay tap',async({page})=>{
  await page.goto('/?test');await page.keyboard.press('Space');await page.keyboard.down('Space');
  await page.waitForTimeout(200);const before=await state(page);
  await page.keyboard.down('Space');const repeated=await state(page);expect(repeated.velocity).toBeGreaterThanOrEqual(before.velocity);
  await page.keyboard.up('Space');await page.locator('#mute').click();
  expect((await state(page)).velocity).toBeGreaterThan(-200);
});
