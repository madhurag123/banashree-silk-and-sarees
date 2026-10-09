import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const scratch = await fs.mkdtemp(path.join(os.tmpdir(), 'banashree-preview-test-'));
try {
  for (const name of ['catalog','pages-preview']) {
    const source = await fs.readFile(new URL('../lib/' + name + '.ts', import.meta.url),'utf8');
    const output = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace('"./catalog"','"./catalog.mjs"');
    await fs.writeFile(path.join(scratch,name+'.mjs'),output);
  }
  const values = new Map();
  globalThis.document = {documentElement:{dataset:{preview:'github-pages'}},querySelector:()=>({content:'/banashree-silk-and-sarees/'})};
  globalThis.localStorage = {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};
  globalThis.location = {hash:'#/shop?collection=Cotton',search:''};
  const {previewApi,previewAsset,previewSearch,isPagesPreview} = await import(pathToFileURL(path.join(scratch,'pages-preview.mjs')));
  assert.equal(isPagesPreview(),true);
  assert.equal(previewSearch(),'?collection=Cotton');
  assert.equal(previewAsset('/images/hero.jpg'),'/banashree-silk-and-sarees/images/hero.jpg');
  const store = await previewApi('store');
  assert.equal(store.products.length,24);
  assert.ok(store.products.every(p=>p.sample===1 && p.images[0].startsWith('/banashree-silk-and-sarees/images/')));
  assert.equal(store.user,null);
  assert.equal(new Set(store.products.map(p=>p.slug)).size,24);
  const mysore = store.products.filter(p=>p.collections.includes('Mysore Silk'));
  assert.equal(mysore.length,3);
  assert.ok(mysore.every(p=>p.variants.length===3));
  assert.equal(store.products.flatMap(p=>p.variants).length,30);
  for(const p of store.products) {
    assert.ok(p.price > 0 && Number.isInteger(p.price));
    for(const v of p.variants) {
      assert.ok(p.images.includes(v.image),'Each colour photograph belongs to the same product gallery');
      await fs.access(new URL('../public/images/'+v.image.split('/').pop(),import.meta.url));
    }
  }
  const [wine,emerald,navy] = mysore[0].variants;
  await previewApi('cart',{variantId:emerald.id,quantity:2,service:true});
  await previewApi('cart',{variantId:navy.id,quantity:1});
  let colourBag=(await previewApi('cart')).items;
  assert.equal(colourBag.length,2);
  assert.equal(colourBag[0].color,'Emerald');
  assert.equal(colourBag[0].images[0],emerald.image);
  assert.equal(colourBag[1].color,'Navy');
  assert.notEqual(colourBag[0].images[0],colourBag[1].images[0]);
  await assert.rejects(previewApi('cart',{variantId:emerald.id,quantity:3,service:false}),/stock/);
  const unavailable=mysore[1].variants.find(v=>v.stock===0);
  await assert.rejects(previewApi('cart',{variantId:unavailable.id,quantity:1}),/stock/);
  for(const line of colourBag)await previewApi('cart',{remove:line.id});
  const p=store.products[0],variantId=p.variants[0].id;
  await previewApi('cart',{variantId,quantity:1,service:true});
  assert.equal((await previewApi('cart')).items.length,1);
  const quote=await previewApi('checkout/quote',{coupon:'WELCOME10'});
  assert.equal(quote.subtotal,p.price+p.fall_pico);
  assert.equal(quote.discount,Math.floor(quote.subtotal/10));
  assert.equal(quote.total,quote.subtotal-quote.discount+quote.shipping);
  await assert.rejects(previewApi('cart',{variantId,quantity:999}),/quantity/);
  await assert.rejects(previewApi('checkout/quote',{coupon:'NOTVALID'}),/WELCOME10/);
  await previewApi('wishlist',{productId:p.id});
  assert.deepEqual((await previewApi('account')).wishlist,[p.id]);
  await previewApi('wishlist',{productId:p.id,remove:true});
  assert.deepEqual((await previewApi('account')).wishlist,[]);
  const before=JSON.stringify([...values]);
  for (const endpoint of ['checkout','login','register','password/reset','contact','admin/products','payment/start']) {
    await assert.rejects(previewApi(endpoint,{email:'must-not-be-saved@example.invalid',password:'not-a-real-password'}),/Client preview only/);
  }
  assert.equal(JSON.stringify([...values]),before,'Blocked actions must not store any customer details or orders.');
  const item=(await previewApi('cart')).items[0];
  await previewApi('cart',{remove:item.id});
  assert.equal((await previewApi('cart')).items.length,0);
  values.set('banashree-client-preview-v1',JSON.stringify({cart:[{variantId,quantity:1,service:true},{variantId,quantity:1,service:false}],wishlist:[]}));
  const legacy=(await previewApi('cart')).items;
  assert.equal(legacy.length,1);
  assert.equal(legacy[0].quantity,2);
  assert.equal(legacy[0].service,false);
  await previewApi('cart',{variantId,quantity:3,replace:true,service:false});
  assert.equal((await previewApi('cart')).items[0].quantity,3);
  document.documentElement.dataset.preview='';
  assert.equal(isPagesPreview(),false);
  assert.equal(previewAsset('/images/hero.jpg'),'/images/hero.jpg');
  console.log('PASS: sample catalogue, project-path assets, filters routing, local cart/quotes/wishlist, stock bounds, and blocked accounts/orders/payments/admin mutations.');
} finally { await fs.rm(scratch,{recursive:true,force:true}); }
