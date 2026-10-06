import {createRequire} from 'node:module';
const require=createRequire('/home/talvasconcelos/Work/lnbits_pg/');const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1440,height:1000}});await page.goto('https://royal-pebble-6azj.here.now/',{waitUntil:'networkidle'});console.log((await page.locator('body').innerText()).slice(0,7000));await page.screenshot({path:'/home/talvasconcelos/Work/wasm_games/bean-show/evidence/reference.png'});await browser.close();
