import { chromium } from '@playwright/test'
const FE='http://localhost:5173', API='http://localhost:8000/api', OUT='/tmp/booking-m'
const b=await chromium.launch()
const tok=await (await (await chromium.launch()).newContext()).request?.post ? null : null
// helper
async function ctxAt(w){ return b.newContext({viewport:{width:w,height:780},deviceScaleFactor:2,timezoneId:'UTC',locale:'en-GB',isMobile:true,hasTouch:true}) }
const login=async(ctx)=> (await ctx.request.post(`${API}/login`,{data:{email:'admin@example.com',password:'password'},headers:{Accept:'application/json'}})).json().then(j=>j.token)

// 390 logged-out (public) full page
let c=await ctxAt(390); let p=await c.newPage(); await p.goto(FE)
await p.locator('[data-testid="room-item"][data-room-name="Alpha"]').click(); await p.waitForTimeout(1600)
await p.screenshot({path:`${OUT}-390-public.png`, fullPage:true}); await c.close()

// 390 signed-in + form-filled (live preview) full page
c=await ctxAt(390); p=await c.newPage(); const t=await login(c)
await p.goto(FE); await p.evaluate(x=>localStorage.setItem('booking_token',x),t); await p.goto(FE)
await p.locator('[data-testid="room-item"][data-room-name="Alpha"]').click(); await p.waitForTimeout(1600)
await p.getByTestId('booking-name-input').fill('Daniel Carter')
await p.getByTestId('booking-start-input').fill('2026-07-10T12:30')
await p.getByTestId('booking-end-input').fill('2026-07-10T13:30')
await p.waitForTimeout(500)
await p.screenshot({path:`${OUT}-390-signedin.png`, fullPage:true}); await c.close()

// 360 dark, viewport only (header area)
c=await b.newContext({viewport:{width:360,height:740},deviceScaleFactor:2,timezoneId:'UTC',locale:'en-GB',isMobile:true,hasTouch:true,colorScheme:'dark'})
p=await c.newPage(); const t2=await login(c)
await p.goto(FE); await p.evaluate(x=>localStorage.setItem('booking_token',x),t2); await p.goto(FE)
await p.waitForTimeout(1400)
await p.screenshot({path:`${OUT}-360-dark-top.png`}); await c.close()

// 320 logged-out header (tightest)
c=await ctxAt(320); p=await c.newPage(); await p.goto(FE); await p.waitForTimeout(1200)
await p.screenshot({path:`${OUT}-320-top.png`}); await c.close()

await b.close(); console.log('done')
