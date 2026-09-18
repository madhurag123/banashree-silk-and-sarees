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
  assert.equal(store.products.length,12);
  assert.ok(store.products.every(p=>p.sample===1 && p.images[0].startsWith('/banashree-silk-and-sarees/images/')));
  assert.equal(store.user,null);
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
  document.documentElement.dataset.preview='';
  assert.equal(isPagesPreview(),false);
  assert.equal(previewAsset('/images/hero.jpg'),'/images/hero.jpg');
  console.log('PASS: sample catalogue, project-path assets, filters routing, local cart/quotes/wishlist, stock bounds, and blocked accounts/orders/payments/admin mutations.');
} finally { await fs.rm(scratch,{recursive:true,force:true}); }
