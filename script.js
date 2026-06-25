/**
 * POLAROID IMAGES v2 — Full Featured Studio
 * script.js — Complete Application with All Features
 */
'use strict';

/* ============================================================ STATE */
const App = {
  images: [],       // {id,file,dataURL,caption,_el}
  frames: [],       // {id,x,y,rotation,imgIndex,imgOffsetX,imgOffsetY,locked,filter,brightness,contrast,saturation,blur}
  textElements: [], // {id,text,x,y,rotation,fontSize,color,font,opacity}
  stickers: [],     // {id,emoji,x,y,size}
  history: [], historyIdx: -1,
  layoutStyle: 'classic', frameStyle: 'classic',
  zoom: 0.75, theme: 'dark', exportFormat: 'svg',
  canvasGenerated: false,
  selectedFrameIdx: -1, selectedTextIdx: -1, selectedStickerIdx: -1,
  isDragging: false, dragType: '', dragStartMx: 0, dragStartMy: 0,
  dragStartX: 0, dragStartY: 0,
  filter: 'none', brightness: 100, contrast: 100, saturation: 100, blur: 0,
  bgType: 'solid', bgColor: '#1c1b2e',
  bgGrad1: '#1c1b2e', bgGrad2: '#2a1f4a', bgGradDir: 'to bottom',
  bgPattern: 'dots', bgPatternColor: '#1c1b2e', bgPatternDotColor: '#2a2a3d',
  bgImageDataURL: null, bgImageOpacity: 100,
  watermark: false, watermarkText: '', watermarkSize: 16, watermarkColor: '#fff', watermarkOpacity: 30, watermarkPosition: 'bottom-right',
  captionBold: false, captionItalic: false, captionUnderline: false,
  snapGrid: true, showGuides: true, showRulers: true,
  autoSaveTimer: null,
  PX_PER_IN: 96, DPI: 300,
  PAGE_SIZES: {a4:{w:8.27,h:11.69},a3:{w:11.69,h:16.54},'12x18':{w:12,h:18},letter:{w:8.5,h:11},legal:{w:8.5,h:14},tabloid:{w:11,h:17},square10:{w:10,h:10},square12:{w:12,h:12}},
  PAGE_LIMITS: {a4:{r:2,c:3},a3:{r:3,c:3},'12x18':{r:3,c:3},letter:{r:2,c:3},legal:{r:2,c:3},tabloid:{r:3,c:3},square10:{r:2,c:2},square12:{r:3,c:3},custom:{r:10,c:10}},
  PRESETS: {
    wedding:{frameColor:'#fff8f0',captionFont:'Playfair Display',captionColor:'#8b6914',shadow:true,filter:'none'},
    travel:{frameColor:'#ffffff',captionFont:'Syne',captionColor:'#2a2a3d',shadow:true,filter:'vintage'},
    birthday:{frameColor:'#fff0f5',captionFont:'Syne',captionColor:'#cc3355',shadow:true,filter:'warm'},
    minimal:{frameColor:'#ffffff',captionFont:'DM Mono',captionColor:'#333',shadow:false,filter:'none'},
    vintage:{frameColor:'#f5efe0',captionFont:'Georgia',captionColor:'#5a4020',shadow:true,filter:'sepia'},
    moody:{frameColor:'#1a1a2e',captionFont:'Playfair Display',captionColor:'#c8a96e',shadow:true,filter:'dramatic'},
  },
  FILTER_MAPS: {
    none:     {brightness:100,contrast:100,saturation:100,blur:0},
    grayscale:{brightness:100,contrast:110,saturation:0,  blur:0},
    sepia:    {brightness:105,contrast:90, saturation:30, blur:0},
    vintage:  {brightness:110,contrast:85, saturation:70, blur:0},
    cool:     {brightness:100,contrast:100,saturation:110,blur:0},
    warm:     {brightness:108,contrast:95, saturation:120,blur:0},
    fade:     {brightness:120,contrast:80, saturation:70, blur:0},
    dramatic: {brightness:90, contrast:150,saturation:80, blur:0},
  },
  settings: {
    pageW:12,pageH:18,rows:3,cols:3,spacing:.25,
    frameW:3.5,frameH:4.25,imgW:3.1,imgH:3.1,marginTop:.2,
    frameColor:'#ffffff',borderThickness:0,borderColor:'#cccccc',
    borderOpacity:100,cornerRadius:2,shadow:true,shadowIntensity:40,
    captions:true,captionSameForAll:false,globalCaption:'',
    captionFontSize:14,captionColor:'#333333',captionFont:'Playfair Display',
  },
};

/* ============================================================ HELPERS */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
function hexToRgba(hex,a){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return `rgba(${r},${g},${b},${a})`}
function escXML(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function roundRect(ctx,x,y,w,h,r){r=Math.min(r,w/2,h/2,4);ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath()}
function loadImage(obj){return new Promise((res,rej)=>{if(obj._el&&obj._el.complete){res(obj._el);return}const i=new Image();i.onload=()=>{obj._el=i;res(i)};i.onerror=rej;i.src=obj.dataURL})}
function snapVal(v,grid){return App.snapGrid?Math.round(v/grid)*grid:v}

/* ============================================================ CURSOR */
(function(){
  const ring=$('cursorRing'),dot=$('cursorDot');
  let rx=0,ry=0,tx=0,ty=0;
  document.addEventListener('mousemove',e=>{tx=e.clientX;ty=e.clientY;dot.style.left=tx+'px';dot.style.top=ty+'px'});
  (function anim(){rx+=(tx-rx)*.12;ry+=(ty-ry)*.12;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(anim)})();
})();

/* ============================================================ LOADER */
(function(){
  const overlay=$('loaderOverlay'),bar=$('loaderBar'),pct=$('loaderPercent'),title=$('loaderTitle');
  const text='Polaroid Images';let ci=0,p=0;
  const ti=setInterval(()=>{title.textContent+=text[ci++];if(ci>=text.length)clearInterval(ti)},55);
  const pi=setInterval(()=>{p=Math.min(p+Math.random()*16,100);bar.style.width=p+'%';pct.textContent=Math.floor(p)+'%';if(p>=100){clearInterval(pi);setTimeout(()=>{overlay.classList.add('hide');checkFirstVisit()},400)}},100);
})();

/* ============================================================ TUTORIAL */
const TUTORIAL_STEPS=[
  {title:'Welcome to Polaroid Images!',text:'This is your professional layout studio. Let\'s take a quick tour to get you started.'},
  {title:'Step 1 — Upload Images',text:'Click the Upload tab and drag & drop your photos into the drop zone, or click to browse files.'},
  {title:'Step 2 — Choose a Layout',text:'Go to the Layout tab. Pick page size, layout style (Classic, Offset, Angled, Scatter, Diagonal, Masonry), rows and columns.'},
  {title:'Step 3 — Customize Style',text:'In the Style tab, choose frame style, colors, borders, shadows, captions, and apply color palettes.'},
  {title:'Step 4 — Add Text & Stickers',text:'Use the Text tab to add free text, watermarks, and decorative emoji stickers anywhere on the canvas.'},
  {title:'Step 5 — Set Background',text:'The BG tab lets you choose solid color, gradient, pattern, or custom image backgrounds.'},
  {title:'Step 6 — Generate & Export',text:'Click Generate Layout, then export as SVG (CorelDRAW compatible), PNG, JPEG, or PDF. Drag frames to reposition them!'},
];
let tutStep=0;
function checkFirstVisit(){if(!localStorage.getItem('pi_toured')){showTutorial()}}
function showTutorial(){tutStep=0;renderTutStep();$('tutorialOverlay').style.display='flex'}
function renderTutStep(){
  const dots=TUTORIAL_STEPS.map((_,i)=>`<div class="tut-step-dot${i===tutStep?' active':''}"></div>`).join('');
  $('tutStepIndicator').innerHTML=dots;
  const s=TUTORIAL_STEPS[tutStep];
  $('tutContent').innerHTML=`<h3>${s.title}</h3><p>${s.text}</p>`;
  $('tutNext').textContent=tutStep===TUTORIAL_STEPS.length-1?'Get Started →':'Next →';
}
$('tutNext').addEventListener('click',()=>{tutStep++;if(tutStep>=TUTORIAL_STEPS.length){$('tutorialOverlay').style.display='none';localStorage.setItem('pi_toured','1')}else renderTutStep()});
$('tutSkip').addEventListener('click',()=>{$('tutorialOverlay').style.display='none';localStorage.setItem('pi_toured','1')});
$('tourBtn').addEventListener('click',showTutorial);

/* ============================================================ SHORTCUTS PANEL */
$('shortcutsBtn').addEventListener('click',e=>{e.preventDefault();$('shortcutsPanel').style.display='block'});
$('shortcutsClose').addEventListener('click',()=>$('shortcutsPanel').style.display='none');

/* ============================================================ THEME */
function initTheme(){const s=localStorage.getItem('pi_theme')||'dark';setTheme(s,false);$('themeToggle').addEventListener('click',()=>setTheme(App.theme==='dark'?'light':'dark'))}
function setTheme(t,save=true){document.documentElement.setAttribute('data-theme',t);App.theme=t;if(save)localStorage.setItem('pi_theme',t);if(App.canvasGenerated)renderCanvas()}

/* ============================================================ TABS */
function initTabs(){
  $$('.ptab').forEach(btn=>{
    btn.addEventListener('click',()=>{
      $$('.ptab').forEach(b=>b.classList.remove('active'));
      $$('.tab-content').forEach(t=>t.classList.remove('active'));
      btn.classList.add('active');
      $('tab-'+btn.dataset.tab).classList.add('active');
    });
  });
}

/* ============================================================ READ SETTINGS */
function readSettings(){
  const ps=$('pageSizeSelect').value;
  if(ps==='custom'){App.settings.pageW=parseFloat($('customWidth').value)||12;App.settings.pageH=parseFloat($('customHeight').value)||18}
  else{const sz=App.PAGE_SIZES[ps];App.settings.pageW=sz.w;App.settings.pageH=sz.h}
  App.settings.rows=parseInt($('rowsInput').value)||3;
  App.settings.cols=parseInt($('colsInput').value)||3;
  App.settings.spacing=parseFloat($('spacingInput').value)||.25;
  App.settings.frameW=parseFloat($('frameWidth').value)||3.5;
  App.settings.frameH=parseFloat($('frameHeight').value)||4.25;
  App.settings.imgW=parseFloat($('imgAreaWidth').value)||3.1;
  App.settings.imgH=parseFloat($('imgAreaHeight').value)||3.1;
  App.settings.marginTop=parseFloat($('marginTop').value)||.2;
  App.settings.frameColor=$('frameColor').value;
  App.settings.borderThickness=parseFloat($('borderThickness').value)||0;
  App.settings.borderColor=$('borderColor').value;
  App.settings.borderOpacity=parseInt($('borderOpacity').value);
  App.settings.cornerRadius=parseInt($('cornerRadius').value)||0;
  App.settings.shadow=$('shadowToggle').checked;
  App.settings.shadowIntensity=parseInt($('shadowIntensity').value)||40;
  App.settings.captions=$('captionToggle').checked;
  App.settings.captionSameForAll=$('captionSameToggle').checked;
  App.settings.globalCaption=$('globalCaption').value;
  App.settings.captionFontSize=parseInt($('captionFontSize').value)||14;
  App.settings.captionColor=$('captionColor').value;
  App.settings.captionFont=$('captionFont').value;
  App.snapGrid=$('snapGrid').checked;
  App.showGuides=$('showGuides').checked;
  App.showRulers=$('showRulers').checked;
}

/* ============================================================ VALIDATION */
function validateLayout(){
  const ps=$('pageSizeSelect').value;
  const lim=App.PAGE_LIMITS[ps]||{r:10,c:10};
  const rows=parseInt($('rowsInput').value),cols=parseInt($('colsInput').value);
  const errs=[];
  if(rows>lim.r)errs.push('rows');
  if(cols>lim.c)errs.push('cols');
  if(!errs.length)return true;
  showError(`Exceeds page limit. Max ${lim.r}×${lim.c} for this page size.`);
  errs.forEach(f=>{const el=$(f==='rows'?'rowsInput':'colsInput');el.classList.add('error');setTimeout(()=>el.classList.remove('error'),2500)});
  return false;
}

/* ============================================================ UPLOAD */
function initUpload(){
  const dz=$('dropZone'),inp=$('fileInput');
  dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('drag-over')});
  dz.addEventListener('dragleave',()=>dz.classList.remove('drag-over'));
  dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('drag-over');handleFiles(e.dataTransfer.files)});
  inp.addEventListener('change',()=>handleFiles(inp.files));
  $('clearImagesBtn').addEventListener('click',()=>{App.images=[];renderThumbnails()});
  // BG image
  const bgdz=$('bgDropZone'),bginp=$('bgFileInput');
  bgdz.addEventListener('dragover',e=>{e.preventDefault();bgdz.classList.add('drag-over')});
  bgdz.addEventListener('dragleave',()=>bgdz.classList.remove('drag-over'));
  bgdz.addEventListener('drop',e=>{e.preventDefault();bgdz.classList.remove('drag-over');handleBGFile(e.dataTransfer.files[0])});
  bginp.addEventListener('change',()=>handleBGFile(bginp.files[0]));
}
function handleFiles(files){
  const arr=Array.from(files).filter(f=>f.type.startsWith('image/'));
  if(!arr.length)return;
  let done=0;
  arr.forEach(file=>{
    const r=new FileReader();
    r.onload=e=>{App.images.push({id:Date.now()+Math.random(),file,dataURL:e.target.result,caption:file.name.replace(/\.[^.]+$/,''),_el:null});done++;if(done===arr.length)renderThumbnails()};
    r.readAsDataURL(file);
  });
}
function handleBGFile(file){
  if(!file||!file.type.startsWith('image/'))return;
  const r=new FileReader();
  r.onload=e=>{App.bgImageDataURL=e.target.result;if(App.canvasGenerated)renderCanvas()};
  r.readAsDataURL(file);
}
function renderThumbnails(){
  const grid=$('thumbnailGrid');
  grid.innerHTML='';
  App.images.forEach((img,i)=>{
    const d=document.createElement('div');d.className='thumb-item';d.style.animationDelay=(i*.04)+'s';
    d.innerHTML=`<img src="${img.dataURL}" loading="lazy"/><button class="thumb-remove" data-idx="${i}">✕</button>`;
    grid.appendChild(d);
  });
  grid.querySelectorAll('.thumb-remove').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();App.images.splice(+btn.dataset.idx,1);renderThumbnails()}));
  $('uploadActions').style.display=App.images.length?'flex':'none';
  $('uploadCount').textContent=App.images.length+' image'+(App.images.length!==1?'s':'');
}

/* ============================================================ FILTERS */
function initFilters(){
  $$('.filter-btn').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    App.filter=btn.dataset.filter;
    const fm=App.FILTER_MAPS[App.filter]||App.FILTER_MAPS.none;
    $('imgBrightness').value=fm.brightness;$('imgBrightnessVal').textContent=fm.brightness+'%';
    $('imgContrast').value=fm.contrast;$('imgContrastVal').textContent=fm.contrast+'%';
    $('imgSaturation').value=fm.saturation;$('imgSaturationVal').textContent=fm.saturation+'%';
    $('imgBlur').value=fm.blur;$('imgBlurVal').textContent=fm.blur+'px';
    App.brightness=fm.brightness;App.contrast=fm.contrast;App.saturation=fm.saturation;App.blur=fm.blur;
    if(App.canvasGenerated){updateFrameFilters();renderCanvas()}
  }));
  [['imgBrightness','imgBrightnessVal','%','brightness'],
   ['imgContrast','imgContrastVal','%','contrast'],
   ['imgSaturation','imgSaturationVal','%','saturation'],
   ['imgBlur','imgBlurVal','px','blur']].forEach(([rid,vid,unit,prop])=>{
    $(rid).addEventListener('input',()=>{$(vid).textContent=$(rid).value+unit;App[prop]=+$(rid).value;if(App.canvasGenerated){updateFrameFilters();renderCanvas()}});
  });
}
function updateFrameFilters(){
  const applyTo=$('filterApplyTo').value;
  App.frames.forEach((f,i)=>{
    if(applyTo==='all'||(applyTo==='selected'&&i===App.selectedFrameIdx)){
      f.brightness=App.brightness;f.contrast=App.contrast;f.saturation=App.saturation;f.blur=App.blur;
    }
  });
}

/* ============================================================ LAYOUT STYLE */
function initLayoutStyle(){
  $$('.layout-btn').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.layout-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    App.layoutStyle=btn.dataset.style;if(App.canvasGenerated)generateLayout();
  }));
  $$('.frame-style-btn').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.frame-style-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    App.frameStyle=btn.dataset.fs;if(App.canvasGenerated)renderCanvas();
  }));
}

/* ============================================================ PRESETS */
function initPresets(){
  $$('.preset-btn').forEach(btn=>btn.addEventListener('click',()=>applyPreset(btn.dataset.preset)));
  $('savePresetBtn').addEventListener('click',saveCustomPreset);
  $('loadPresetBtn').addEventListener('click',()=>$('presetFileInput').click());
  $('presetFileInput').addEventListener('change',e=>{
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();r.onload=ev=>{try{const p=JSON.parse(ev.target.result);applyRawPreset(p);showSuccess('Preset loaded!')}catch{showError('Invalid preset file')}};r.readAsText(f);
  });
  renderSavedPresets();
}
function applyPreset(name){
  const p=App.PRESETS[name];if(!p)return;applyRawPreset(p);showSuccess(`${name.charAt(0).toUpperCase()+name.slice(1)} preset applied!`)
}
function applyRawPreset(p){
  if(p.frameColor){$('frameColor').value=p.frameColor;App.settings.frameColor=p.frameColor}
  if(p.captionFont){$('captionFont').value=p.captionFont;App.settings.captionFont=p.captionFont}
  if(p.captionColor){$('captionColor').value=p.captionColor;App.settings.captionColor=p.captionColor}
  if(p.shadow!==undefined){$('shadowToggle').checked=p.shadow;App.settings.shadow=p.shadow}
  if(p.filter){App.filter=p.filter;const fm=App.FILTER_MAPS[p.filter]||App.FILTER_MAPS.none;App.brightness=fm.brightness;App.contrast=fm.contrast;App.saturation=fm.saturation;App.blur=fm.blur}
  if(App.canvasGenerated){readSettings();updateFrameFilters();renderCanvas()}
}
function saveCustomPreset(){
  const name=prompt('Name this preset:');if(!name)return;
  readSettings();const p={frameColor:App.settings.frameColor,captionFont:App.settings.captionFont,captionColor:App.settings.captionColor,shadow:App.settings.shadow,filter:App.filter};
  const saved=JSON.parse(localStorage.getItem('pi_custom_presets')||'{}');saved[name]=p;
  localStorage.setItem('pi_custom_presets',JSON.stringify(saved));renderSavedPresets();showSuccess('Preset saved!');
}
function renderSavedPresets(){
  const saved=JSON.parse(localStorage.getItem('pi_custom_presets')||'{}');
  const cont=$('savedPresets');cont.innerHTML='';
  Object.entries(saved).forEach(([name,p])=>{
    const d=document.createElement('div');d.className='saved-preset-item';
    d.innerHTML=`<span>${name}</span><div><button data-name="${name}" class="sp-load-btn">Load</button><button data-name="${name}" class="sp-del-btn">✕</button></div>`;
    cont.appendChild(d);
  });
  cont.querySelectorAll('.sp-load-btn').forEach(b=>b.addEventListener('click',()=>{const p=JSON.parse(localStorage.getItem('pi_custom_presets')||'{}')[b.dataset.name];if(p)applyRawPreset(p)}));
  cont.querySelectorAll('.sp-del-btn').forEach(b=>b.addEventListener('click',()=>{const s=JSON.parse(localStorage.getItem('pi_custom_presets')||'{}');delete s[b.dataset.name];localStorage.setItem('pi_custom_presets',JSON.stringify(s));renderSavedPresets()}));
}

/* ============================================================ PALETTE */
function initPalette(){
  const PALETTES={
    pastel:{frameColor:'#fef9f0',borderColor:'#f0d0b0',bgColor:'#fff8f5'},
    moody:{frameColor:'#1a1a2e',borderColor:'#444',bgColor:'#0d0d1a'},
    vintage:{frameColor:'#f5efe0',borderColor:'#c0a878',bgColor:'#e8dfc8'},
    neon:{frameColor:'#0a0a0f',borderColor:'#7c6aff',bgColor:'#050510'},
    minimal:{frameColor:'#ffffff',borderColor:'#e0e0e0',bgColor:'#f5f5f5'},
    earth:{frameColor:'#f0e8d8',borderColor:'#a08060',bgColor:'#e0d0b8'},
  };
  $$('.palette-btn').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.palette-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    const p=PALETTES[btn.dataset.palette];if(!p)return;
    $('frameColor').value=p.frameColor;App.settings.frameColor=p.frameColor;
    $('borderColor').value=p.borderColor;App.settings.borderColor=p.borderColor;
    $('bgColor').value=p.bgColor;App.bgColor=p.bgColor;
    if(App.canvasGenerated){readSettings();renderCanvas()}
  }));
}

/* ============================================================ BACKGROUND */
function initBackground(){
  $$('.bg-type-btn').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.bg-type-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    App.bgType=btn.dataset.bg;
    $$('.bg-option').forEach(o=>o.style.display='none');
    $('bg-'+App.bgType).style.display='block';
    if(App.canvasGenerated)renderCanvas();
  }));
  $('bgColor').addEventListener('input',()=>{App.bgColor=$('bgColor').value;if(App.canvasGenerated)renderCanvas()});
  $('bgGrad1').addEventListener('input',()=>{App.bgGrad1=$('bgGrad1').value;if(App.canvasGenerated)renderCanvas()});
  $('bgGrad2').addEventListener('input',()=>{App.bgGrad2=$('bgGrad2').value;if(App.canvasGenerated)renderCanvas()});
  $('bgGradDir').addEventListener('change',()=>{App.bgGradDir=$('bgGradDir').value;if(App.canvasGenerated)renderCanvas()});
  $$('.pattern-btn').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.pattern-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    App.bgPattern=btn.dataset.pattern;if(App.canvasGenerated)renderCanvas();
  }));
  $('bgPatternColor').addEventListener('input',()=>{App.bgPatternColor=$('bgPatternColor').value;if(App.canvasGenerated)renderCanvas()});
  $('bgPatternDotColor').addEventListener('input',()=>{App.bgPatternDotColor=$('bgPatternDotColor').value;if(App.canvasGenerated)renderCanvas()});
  $('bgImageOpacity').addEventListener('input',()=>{$('bgImageOpacityVal').textContent=$('bgImageOpacity').value+'%';App.bgImageOpacity=+$('bgImageOpacity').value;if(App.canvasGenerated)renderCanvas()});
}

/* ============================================================ WATERMARK */
function initWatermark(){
  $('watermarkToggle').addEventListener('change',()=>{App.watermark=$('watermarkToggle').checked;$('watermarkControls').style.display=App.watermark?'block':'none';if(App.canvasGenerated)renderCanvas()});
  ['watermarkText','watermarkSize','watermarkColor','watermarkOpacity','watermarkPosition'].forEach(id=>{
    $(id).addEventListener('input',()=>{
      App[id]=$(id).type==='range'||$(id).type==='number'?+$(id).value:$(id).value;
      if(id==='watermarkOpacity')$('watermarkOpacityVal').textContent=$(id).value+'%';
      if(App.canvasGenerated)renderCanvas();
    });
  });
}

/* ============================================================ STICKERS */
function initStickers(){
  $$('.sticker-btn').forEach(btn=>btn.addEventListener('click',()=>{
    if(!App.canvasGenerated){showError('Generate layout first.');return}
    const s=App.settings;
    App.stickers.push({id:Date.now(),emoji:btn.dataset.sticker,x:s.pageW/2,y:s.pageH/2,size:+$('stickerSize').value||40});
    saveHistory();renderCanvas();showSuccess('Sticker added! Drag it to position.');
  }));
}

/* ============================================================ FREE TEXT */
function initFreeText(){
  $('addTextBtn').addEventListener('click',()=>{
    if(!App.canvasGenerated){showError('Generate layout first.');return}
    const text=$('freeTextContent').value.trim();if(!text){showError('Enter text first.');return}
    const s=App.settings;
    App.textElements.push({id:Date.now(),text,x:s.pageW/2,y:s.pageH/2,rotation:+$('freeTextRotation').value||0,fontSize:+$('freeTextSize').value||24,color:$('freeTextColor').value,font:$('freeTextFont').value,opacity:+$('freeTextOpacity').value/100});
    saveHistory();renderCanvas();showSuccess('Text added! Drag it to position.');
  });
  $('freeTextOpacity').addEventListener('input',()=>$('freeTextOpacityVal').textContent=$('freeTextOpacity').value+'%');
  // Font style toggles
  ['captionBold','captionItalic','captionUnderline'].forEach(id=>{
    $(id).addEventListener('click',()=>{const key=id.replace('caption','').toLowerCase();App[id]=!App[id];$(id).classList.toggle('active',App[id]);if(App.canvasGenerated)renderCanvas()});
  });
}

/* ============================================================ CAPTION CONTROLS */
function initCaptionControls(){
  $('captionToggle').addEventListener('change',()=>{$('captionControls').style.display=$('captionToggle').checked?'block':'none';if(App.canvasGenerated){readSettings();renderCanvas()}});
  $('captionSameToggle').addEventListener('change',()=>{$('globalCaptionRow').style.display=$('captionSameToggle').checked?'flex':'none';if(App.canvasGenerated){readSettings();renderCanvas()}});
}

/* ============================================================ RANGES */
function initRanges(){
  [['borderOpacity','borderOpacityVal','%'],['shadowIntensity','shadowIntensityVal','%'],['exportQuality','exportQualityVal','%']].forEach(([rid,vid,u])=>{
    $(rid).addEventListener('input',()=>{$(vid).textContent=$(rid).value+u;if(App.canvasGenerated&&rid!=='exportQuality'){readSettings();renderCanvas()}});
  });
}

/* ============================================================ LIVE PREVIEW */
function initLivePreview(){
  ['frameColor','borderColor','borderThickness','cornerRadius','captionFontSize','captionColor','captionFont','globalCaption','shadowToggle','frameWidth','frameHeight','imgAreaWidth','imgAreaHeight','marginTop'].forEach(id=>{
    const el=$(id);if(el)el.addEventListener('change',()=>{if(App.canvasGenerated){readSettings();renderCanvas()}});
  });
}

/* ============================================================ PAGE SIZE */
function initPageSize(){$('pageSizeSelect').addEventListener('change',()=>{$('customSizeRow').style.display=$('pageSizeSelect').value==='custom'?'grid':'none'})}

/* ============================================================ GENERATE LAYOUT */
function generateLayout(){
  if(!App.images.length){showError('Upload at least one image first.');return}
  if(!validateLayout())return;
  readSettings();
  const {rows,cols,frameW,frameH,spacing,pageW,pageH}=App.settings;
  const totalW=cols*frameW+(cols-1)*spacing,totalH=rows*frameH+(rows-1)*spacing;
  const startX=(pageW-totalW)/2,startY=(pageH-totalH)/2;
  App.frames=[];let idx=0;

  for(let r=0;r<rows;r++){for(let c=0;c<cols;c++){
    let x=startX+c*(frameW+spacing),y=startY+r*(frameH+spacing),rot=0;
    if(App.layoutStyle==='offset'){x+=(c%2===1)?frameW*.07:0;y+=(r%2===1)?frameH*.05:0}
    else if(App.layoutStyle==='angled'){rot=(Math.random()-.5)*9;x+=(Math.random()-.5)*spacing*.6;y+=(Math.random()-.5)*spacing*.6}
    else if(App.layoutStyle==='scatter'){x+=(Math.random()-.5)*frameW*.4;y+=(Math.random()-.5)*frameH*.3;rot=(Math.random()-.5)*15}
    else if(App.layoutStyle==='diagonal'){x+=c*frameW*.1;y+=r*frameH*.05}
    else if(App.layoutStyle==='masonry'){y+=c%2===1?frameH*.3:0}
    const f={id:`${r}_${c}`,x:snapVal(x,.05),y:snapVal(y,.05),rotation:rot,imgIndex:idx%App.images.length,imgOffsetX:0,imgOffsetY:0,locked:false,brightness:App.brightness,contrast:App.contrast,saturation:App.saturation,blur:App.blur};
    App.frames.push(f);idx++;
  }}

  App.canvasGenerated=true;App.selectedFrameIdx=-1;
  $('downloadBtn').disabled=false;$('copyClipboardBtn').disabled=false;$('printBtn').disabled=false;
  $('statsSection').style.display='block';$('shareSection').style.display='block';
  updateStats();updatePreviewDims();saveHistory();renderCanvas();
  startAutoSave();
}

/* ============================================================ RENDER CANVAS */
async function renderCanvas(){
  if(!App.canvasGenerated)return;
  const s=App.settings,PPI=App.PX_PER_IN;
  const pw=Math.round(s.pageW*PPI),ph=Math.round(s.pageH*PPI);
  const canvas=$('mainCanvas');
  canvas.width=pw;canvas.height=ph;canvas.style.display='block';
  $('emptyState').style.display='none';
  applyZoomStyle(canvas,pw,ph);

  if(App.showRulers)$('canvasViewport').classList.add('rulers-visible');
  else $('canvasViewport').classList.remove('rulers-visible');

  const ctx=canvas.getContext('2d');
  // Background
  await drawBackground(ctx,pw,ph,PPI);
  // Pre-load images
  await Promise.all(App.images.map(o=>loadImage(o).catch(()=>null)));
  // Draw frames
  for(const frame of App.frames)await drawPolaroidFrame(ctx,frame,s,PPI);
  // Draw text elements
  for(const te of App.textElements)drawTextElement(ctx,te,PPI);
  // Draw stickers
  for(const st of App.stickers)drawSticker(ctx,st,PPI);
  // Watermark
  if(App.watermark)drawWatermark(ctx,pw,ph);
  // Selection highlight
  if(App.selectedFrameIdx>=0)drawSelectionHighlight(ctx,App.frames[App.selectedFrameIdx],s,PPI);
  // Guides
  if(App.showGuides)drawGuides(ctx,pw,ph);

  attachCanvasEvents(canvas,PPI);
  $('autoSaveIndicator').textContent='Auto-saved ✓';
}

/* ---- Background ---- */
async function drawBackground(ctx,pw,ph,PPI){
  ctx.save();
  switch(App.bgType){
    case 'solid':ctx.fillStyle=App.bgColor;ctx.fillRect(0,0,pw,ph);break;
    case 'gradient':{
      let grad;
      if(App.bgGradDir==='radial'){grad=ctx.createRadialGradient(pw/2,ph/2,0,pw/2,ph/2,Math.max(pw,ph)/2)}
      else{const a=App.bgGradDir==='135deg'?135:App.bgGradDir==='to right'?90:0;const rad=a*Math.PI/180;grad=ctx.createLinearGradient(pw/2-Math.cos(rad)*pw/2,ph/2-Math.sin(rad)*ph/2,pw/2+Math.cos(rad)*pw/2,ph/2+Math.sin(rad)*ph/2)}
      grad.addColorStop(0,App.bgGrad1);grad.addColorStop(1,App.bgGrad2);
      ctx.fillStyle=grad;ctx.fillRect(0,0,pw,ph);break;
    }
    case 'pattern':drawBgPattern(ctx,pw,ph);break;
    case 'image':{
      ctx.fillStyle='#1c1b2e';ctx.fillRect(0,0,pw,ph);
      if(App.bgImageDataURL){
        const img=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.src=App.bgImageDataURL});
        ctx.globalAlpha=App.bgImageOpacity/100;
        const sc=Math.max(pw/img.width,ph/img.height);
        ctx.drawImage(img,(pw-img.width*sc)/2,(ph-img.height*sc)/2,img.width*sc,img.height*sc);
        ctx.globalAlpha=1;
      }break;
    }
  }
  ctx.restore();
}
function drawBgPattern(ctx,pw,ph){
  ctx.fillStyle=App.bgPatternColor;ctx.fillRect(0,0,pw,ph);
  ctx.save();
  switch(App.bgPattern){
    case 'dots':for(let x=10;x<pw;x+=20)for(let y=10;y<ph;y+=20){ctx.fillStyle=App.bgPatternDotColor;ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill()}break;
    case 'grid':ctx.strokeStyle=App.bgPatternDotColor;ctx.lineWidth=.5;for(let x=0;x<pw;x+=20){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,ph);ctx.stroke()}for(let y=0;y<ph;y+=20){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(pw,y);ctx.stroke()}break;
    case 'lines':ctx.strokeStyle=App.bgPatternDotColor;ctx.lineWidth=.5;for(let y=0;y<ph;y+=16){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(pw,y);ctx.stroke()}break;
    case 'diagonal':ctx.strokeStyle=App.bgPatternDotColor;ctx.lineWidth=.5;for(let i=-ph;i<pw+ph;i+=18){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+ph,ph);ctx.stroke()}break;
    case 'linen':for(let y=0;y<ph;y+=3){ctx.fillStyle=`rgba(${y%6===0?255:0},${y%6===0?255:0},${y%6===0?255:0},0.015)`;ctx.fillRect(0,y,pw,2)}break;
    case 'cork':for(let i=0;i<800;i++){ctx.fillStyle=`rgba(160,120,60,${Math.random()*.08})`;ctx.beginPath();ctx.arc(Math.random()*pw,Math.random()*ph,Math.random()*4+1,0,Math.PI*2);ctx.fill()}break;
  }
  ctx.restore();
}

/* ---- Draw One Polaroid Frame ---- */
async function drawPolaroidFrame(ctx,frame,s,PPI){
  const fx=frame.x*PPI,fy=frame.y*PPI,fw=s.frameW*PPI,fh=s.frameH*PPI;
  const iw=s.imgW*PPI,ih=s.imgH*PPI,mt=s.marginTop*PPI;
  const ix=(fw-iw)/2,iy=mt;const cr=Math.max(0,s.cornerRadius);
  ctx.save();
  ctx.translate(fx+fw/2,fy+fh/2);ctx.rotate(frame.rotation*Math.PI/180);ctx.translate(-fw/2,-fh/2);

  // Shadow
  if(s.shadow){
    const si=s.shadowIntensity/100;
    ctx.save();ctx.shadowColor=`rgba(0,0,0,${si*.7})`;ctx.shadowBlur=20*si;ctx.shadowOffsetX=4*si;ctx.shadowOffsetY=8*si;
    roundRect(ctx,0,0,fw,fh,cr);ctx.fillStyle=s.frameColor;ctx.fill();ctx.restore();
  }

  // Frame body
  roundRect(ctx,0,0,fw,fh,cr);ctx.fillStyle=s.frameColor;ctx.fill();

  // Frame style extras
  if(App.frameStyle==='instant'){roundRect(ctx,0,0,fw,fh*.04,0);ctx.fillStyle='rgba(0,0,0,.05)';ctx.fill()}
  if(App.frameStyle==='filmstrip'){for(let i=0;i<6;i++){ctx.fillStyle='rgba(0,0,0,.15)';ctx.fillRect(-8,fh*.1+i*(fh*.13),7,fh*.08);ctx.fillRect(fw+1,fh*.1+i*(fh*.13),7,fh*.08)}}
  if(App.frameStyle==='double'){roundRect(ctx,3,3,fw-6,fh-6,Math.max(0,cr-2));ctx.strokeStyle='rgba(200,169,110,.4)';ctx.lineWidth=1;ctx.stroke()}

  // Border
  if(s.borderThickness>0){roundRect(ctx,0,0,fw,fh,cr);ctx.strokeStyle=hexToRgba(s.borderColor,s.borderOpacity/100);ctx.lineWidth=s.borderThickness;ctx.stroke()}

  // Image area with clipping
  ctx.save();roundRect(ctx,ix,iy,iw,ih,2);ctx.clip();
  const imgObj=App.images[frame.imgIndex];
  if(imgObj&&imgObj._el){
    const img=imgObj._el;
    // Apply image filters via offscreen canvas
    const filtered=applyImageFilter(img,iw,ih,frame);
    const scale=Math.max(iw/img.width,ih/img.height);
    const sw=img.width*scale,sh=img.height*scale;
    const dx=ix+(iw-sw)/2+frame.imgOffsetX*PPI,dy=iy+(ih-sh)/2+frame.imgOffsetY*PPI;
    if(filtered){ctx.drawImage(filtered,dx,dy,sw,sh)}
    else{ctx.drawImage(img,dx,dy,sw,sh)}
  }else{
    const g=ctx.createLinearGradient(ix,iy,ix+iw,iy+ih);g.addColorStop(0,'#2a2a3d');g.addColorStop(1,'#1a1a26');ctx.fillStyle=g;ctx.fillRect(ix,iy,iw,ih);
  }
  ctx.restore();

  // Caption
  if(s.captions){
    const ct=s.captionSameForAll?s.globalCaption:(imgObj?.caption||'');
    if(ct){
      const captY=iy+ih+(fh-iy-ih)/2;
      let fstyle='';
      if(App.captionBold)fstyle+='bold ';if(App.captionItalic)fstyle+='italic ';
      const fs=Math.round(s.captionFontSize*(PPI/72));
      ctx.font=`${fstyle}${fs}px "${s.captionFont}",serif`;
      ctx.fillStyle=s.captionColor;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(ct,fw/2,captY,fw*.88);
      if(App.captionUnderline){const tw=ctx.measureText(ct).width;ctx.beginPath();ctx.moveTo(fw/2-tw/2,captY+fs*.6);ctx.lineTo(fw/2+tw/2,captY+fs*.6);ctx.strokeStyle=s.captionColor;ctx.lineWidth=1;ctx.stroke()}
    }
  }
  // Frame locked badge
  if(frame.locked){ctx.font=`${Math.round(12*PPI/72)}px sans-serif`;ctx.fillStyle='rgba(255,107,138,.8)';ctx.fillText('🔒',fw-20,14)}
  ctx.restore();
}

/* ---- Image filter via offscreen canvas ---- */
function applyImageFilter(img,iw,ih,frame){
  if(frame.brightness===100&&frame.contrast===100&&frame.saturation===100&&frame.blur===0)return null;
  const oc=document.createElement('canvas');oc.width=img.width;oc.height=img.height;
  const octx=oc.getContext('2d');
  let f=`brightness(${frame.brightness}%) contrast(${frame.contrast}%) saturate(${frame.saturation}%)`;
  if(frame.blur>0)f=`blur(${frame.blur}px) `+f;
  octx.filter=f;octx.drawImage(img,0,0);return oc;
}

/* ---- Text Element ---- */
function drawTextElement(ctx,te,PPI){
  ctx.save();
  const x=te.x*PPI,y=te.y*PPI;
  ctx.translate(x,y);ctx.rotate(te.rotation*Math.PI/180);
  ctx.globalAlpha=te.opacity;
  const fs=Math.round(te.fontSize*(PPI/72));
  ctx.font=`bold ${fs}px "${te.font}",sans-serif`;
  ctx.fillStyle=te.color;ctx.textAlign='center';ctx.textBaseline='middle';
  te.text.split('\n').forEach((line,i)=>ctx.fillText(line,0,i*fs*1.3));
  ctx.restore();
}

/* ---- Sticker ---- */
function drawSticker(ctx,st,PPI){
  ctx.save();
  const x=st.x*PPI,y=st.y*PPI,sz=st.size*(PPI/96);
  ctx.font=`${sz}px serif`;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(st.emoji,x,y);
  ctx.restore();
}

/* ---- Watermark ---- */
function drawWatermark(ctx,pw,ph){
  if(!App.watermarkText)return;
  ctx.save();
  const fs=Math.round(App.watermarkSize*(App.PX_PER_IN/72));
  ctx.font=`${fs}px sans-serif`;ctx.fillStyle=App.watermarkColor;ctx.globalAlpha=App.watermarkOpacity/100;
  const pos=App.watermarkPosition,m=20;
  if(pos==='tiled'){
    ctx.rotate(-Math.PI/6);for(let x=-ph;x<pw+ph;x+=200)for(let y=0;y<pw+ph;y+=100)ctx.fillText(App.watermarkText,x,y);
  }else{
    ctx.textAlign=pos.includes('right')?'right':pos.includes('left')?'left':'center';
    ctx.textBaseline=pos.includes('bottom')?'bottom':pos.includes('top')?'top':'middle';
    const tx=pos.includes('right')?pw-m:pos.includes('left')?m:pw/2;
    const ty=pos.includes('bottom')?ph-m:pos.includes('top')?m:ph/2;
    ctx.fillText(App.watermarkText,tx,ty);
  }
  ctx.restore();
}

/* ---- Selection highlight ---- */
function drawSelectionHighlight(ctx,frame,s,PPI){
  if(!frame)return;
  ctx.save();
  const fx=frame.x*PPI,fy=frame.y*PPI,fw=s.frameW*PPI,fh=s.frameH*PPI;
  ctx.translate(fx+fw/2,fy+fh/2);ctx.rotate(frame.rotation*Math.PI/180);ctx.translate(-fw/2,-fh/2);
  roundRect(ctx,-3,-3,fw+6,fh+6,4);
  ctx.strokeStyle='#7c6aff';ctx.lineWidth=2;ctx.setLineDash([6,3]);ctx.stroke();
  ctx.setLineDash([]);ctx.restore();
}

/* ---- Alignment guides ---- */
function drawGuides(ctx,pw,ph){
  ctx.save();ctx.strokeStyle='rgba(200,169,110,.12)';ctx.lineWidth=.5;ctx.setLineDash([4,4]);
  ctx.beginPath();ctx.moveTo(pw/2,0);ctx.lineTo(pw/2,ph);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,ph/2);ctx.lineTo(pw,ph/2);ctx.stroke();
  ctx.setLineDash([]);ctx.restore();
}

/* ============================================================ CANVAS EVENTS */
function attachCanvasEvents(canvas,PPI){
  if(canvas._mdHandler)canvas.removeEventListener('mousedown',canvas._mdHandler);
  if(canvas._mmHandler)canvas.removeEventListener('mousemove',canvas._mmHandler);
  if(canvas._muHandler)canvas.removeEventListener('mouseup',canvas._muHandler);
  if(canvas._dbHandler)canvas.removeEventListener('dblclick',canvas._dbHandler);
  if(canvas._rcHandler)canvas.removeEventListener('contextmenu',canvas._rcHandler);

  const getXY=e=>{const r=canvas.getBoundingClientRect();return{mx:(e.clientX-r.left)*(canvas.width/r.width),my:(e.clientY-r.top)*(canvas.height/r.height)}};
  const hitFrame=(mx,my)=>{
    const s=App.settings,fw=s.frameW*PPI,fh=s.frameH*PPI;
    for(let i=App.frames.length-1;i>=0;i--){const f=App.frames[i];if(mx>=f.x*PPI&&mx<=f.x*PPI+fw&&my>=f.y*PPI&&my<=f.y*PPI+fh)return{type:'frame',idx:i}}
    for(let i=App.textElements.length-1;i>=0;i--){const t=App.textElements[i];const fs=t.fontSize*(PPI/72)*2;if(Math.abs(mx-t.x*PPI)<100&&Math.abs(my-t.y*PPI)<fs)return{type:'text',idx:i}}
    for(let i=App.stickers.length-1;i>=0;i--){const st=App.stickers[i];const sz=st.size*(PPI/96);if(Math.abs(mx-st.x*PPI)<sz&&Math.abs(my-st.y*PPI)<sz)return{type:'sticker',idx:i}}
    return null;
  };

  canvas._mdHandler=e=>{
    $('captionEditorPopup').style.display='none';$('contextMenu').style.display='none';
    const {mx,my}=getXY(e);const hit=hitFrame(mx,my);
    if(hit){
      if(hit.type==='frame'&&App.frames[hit.idx].locked)return;
      App.isDragging=true;App.dragType=hit.type;
      const obj=hit.type==='frame'?App.frames[hit.idx]:hit.type==='text'?App.textElements[hit.idx]:App.stickers[hit.idx];
      App.dragStartMx=mx;App.dragStartMy=my;App.dragStartX=obj.x;App.dragStartY=obj.y;
      if(hit.type==='frame'){App.selectedFrameIdx=hit.idx;App.selectedTextIdx=-1;App.selectedStickerIdx=-1;updateSelectedInfo(hit.idx)}
      else if(hit.type==='text'){App.selectedTextIdx=hit.idx;App.selectedFrameIdx=-1}
      else{App.selectedStickerIdx=hit.idx;App.selectedFrameIdx=-1}
      renderCanvas();
    }else{App.selectedFrameIdx=-1;App.selectedTextIdx=-1;App.selectedStickerIdx=-1;$('selectedInfo').style.display='none';renderCanvas()}
  };

  canvas._mmHandler=e=>{
    if(!App.isDragging)return;
    const {mx,my}=getXY(e);
    const dx=(mx-App.dragStartMx)/PPI,dy=(my-App.dragStartMy)/PPI;
    const newX=snapVal(App.dragStartX+dx,.05),newY=snapVal(App.dragStartY+dy,.05);
    if(App.dragType==='frame'&&App.selectedFrameIdx>=0){App.frames[App.selectedFrameIdx].x=newX;App.frames[App.selectedFrameIdx].y=newY}
    else if(App.dragType==='text'&&App.selectedTextIdx>=0){App.textElements[App.selectedTextIdx].x=newX;App.textElements[App.selectedTextIdx].y=newY}
    else if(App.dragType==='sticker'&&App.selectedStickerIdx>=0){App.stickers[App.selectedStickerIdx].x=newX;App.stickers[App.selectedStickerIdx].y=newY}
    renderCanvas();
  };

  canvas._muHandler=()=>{if(App.isDragging){App.isDragging=false;saveHistory()}};

  canvas._dbHandler=e=>{
    const {mx,my}=getXY(e);const hit=hitFrame(mx,my);
    if(hit&&hit.type==='frame')showCaptionEditor(hit.idx,e.clientX,e.clientY);
  };

  canvas._rcHandler=e=>{
    e.preventDefault();const {mx,my}=getXY(e);const hit=hitFrame(mx,my);
    if(hit&&hit.type==='frame'){App.selectedFrameIdx=hit.idx;showContextMenu(e.clientX,e.clientY);renderCanvas()}
  };

  canvas.addEventListener('mousedown',canvas._mdHandler);
  canvas.addEventListener('mousemove',canvas._mmHandler);
  canvas.addEventListener('mouseup',canvas._muHandler);
  canvas.addEventListener('dblclick',canvas._dbHandler);
  canvas.addEventListener('contextmenu',canvas._rcHandler);
}

/* ============================================================ SELECTION INFO */
function updateSelectedInfo(idx){
  const info=$('selectedInfo');
  info.style.display='inline';info.textContent=`Frame ${idx+1} selected`;
}

/* ============================================================ CONTEXT MENU */
function showContextMenu(cx,cy){
  const m=$('contextMenu');m.style.display='block';
  m.style.left=Math.min(cx,window.innerWidth-180)+'px';m.style.top=Math.min(cy,window.innerHeight-220)+'px';
}
$('cmEdit').addEventListener('click',()=>{if(App.selectedFrameIdx>=0){const c=$('contextMenu');showCaptionEditor(App.selectedFrameIdx,parseInt(c.style.left),parseInt(c.style.top))}$('contextMenu').style.display='none'});
$('cmDuplicate').addEventListener('click',()=>{duplicateFrame(App.selectedFrameIdx);$('contextMenu').style.display='none'});
$('cmLock').addEventListener('click',()=>{if(App.selectedFrameIdx>=0){App.frames[App.selectedFrameIdx].locked=!App.frames[App.selectedFrameIdx].locked;saveHistory();renderCanvas()}$('contextMenu').style.display='none'});
$('cmRotateCW').addEventListener('click',()=>{if(App.selectedFrameIdx>=0){App.frames[App.selectedFrameIdx].rotation=(App.frames[App.selectedFrameIdx].rotation+15)%360;saveHistory();renderCanvas()}$('contextMenu').style.display='none'});
$('cmRotateCCW').addEventListener('click',()=>{if(App.selectedFrameIdx>=0){App.frames[App.selectedFrameIdx].rotation=(App.frames[App.selectedFrameIdx].rotation-15+360)%360;saveHistory();renderCanvas()}$('contextMenu').style.display='none'});
$('cmDelete').addEventListener('click',()=>{deleteSelectedFrame();$('contextMenu').style.display='none'});
document.addEventListener('click',e=>{if(!e.target.closest('.context-menu'))$('contextMenu').style.display='none'});

/* ============================================================ TOOLBAR ACTIONS */
$('deleteFrameBtn').addEventListener('click',deleteSelectedFrame);
$('duplicateFrameBtn').addEventListener('click',()=>duplicateFrame(App.selectedFrameIdx));
$('lockFrameBtn').addEventListener('click',()=>{if(App.selectedFrameIdx>=0){App.frames[App.selectedFrameIdx].locked=!App.frames[App.selectedFrameIdx].locked;saveHistory();renderCanvas()}});
$('alignLeftBtn').addEventListener('click',()=>{if(App.selectedFrameIdx>=0){App.frames[App.selectedFrameIdx].x=0.1;saveHistory();renderCanvas()}});
$('alignCenterBtn').addEventListener('click',()=>{if(App.selectedFrameIdx>=0){const s=App.settings;App.frames[App.selectedFrameIdx].x=(s.pageW-s.frameW)/2;saveHistory();renderCanvas()}});
$('alignRightBtn').addEventListener('click',()=>{if(App.selectedFrameIdx>=0){const s=App.settings;App.frames[App.selectedFrameIdx].x=s.pageW-s.frameW-0.1;saveHistory();renderCanvas()}});

function deleteSelectedFrame(){if(App.selectedFrameIdx<0)return;App.frames.splice(App.selectedFrameIdx,1);App.selectedFrameIdx=-1;$('selectedInfo').style.display='none';saveHistory();renderCanvas()}
function duplicateFrame(idx){
  if(idx<0||idx>=App.frames.length)return;
  const f=JSON.parse(JSON.stringify(App.frames[idx]));f.id=Date.now()+'';f.x+=.2;f.y+=.2;App.frames.push(f);saveHistory();renderCanvas();showSuccess('Frame duplicated!');
}

/* ============================================================ CAPTION EDITOR */
let _editIdx=-1;
function showCaptionEditor(idx,cx,cy){
  _editIdx=idx;const frame=App.frames[idx];const img=App.images[frame.imgIndex];
  $('captionEditorInput').value=img?(img.caption||''):'';
  const p=$('captionEditorPopup');p.style.display='block';
  p.style.left=Math.min(cx,window.innerWidth-240)+'px';p.style.top=Math.min(cy+10,window.innerHeight-130)+'px';
}
$('captionEditorSave').addEventListener('click',()=>{
  if(_editIdx>=0){const f=App.frames[_editIdx];if(App.images[f.imgIndex])App.images[f.imgIndex].caption=$('captionEditorInput').value;$('captionEditorPopup').style.display='none';saveHistory();renderCanvas()}
});
$('captionEditorClose').addEventListener('click',()=>$('captionEditorPopup').style.display='none');

/* ============================================================ ZOOM */
function initZoom(){
  $('zoomInBtn').addEventListener('click',()=>{App.zoom=Math.min(+(App.zoom+.1).toFixed(2),3);const c=$('mainCanvas');if(c.width)applyZoomStyle(c,c.width,c.height)});
  $('zoomOutBtn').addEventListener('click',()=>{App.zoom=Math.max(+(App.zoom-.1).toFixed(2),.1);const c=$('mainCanvas');if(c.width)applyZoomStyle(c,c.width,c.height)});
  $('zoomFitBtn').addEventListener('click',()=>{const vw=$('canvasViewport').clientWidth-80;const c=$('mainCanvas');if(c.width){App.zoom=Math.min(+(vw/c.width).toFixed(2),2);applyZoomStyle(c,c.width,c.height)}});
}
function applyZoomStyle(canvas,pw,ph){canvas.style.width=Math.round(pw*App.zoom)+'px';canvas.style.height=Math.round(ph*App.zoom)+'px';$('zoomLabel').textContent=Math.round(App.zoom*100)+'%'}
function updatePreviewDims(){const s=App.settings;$('previewDims').textContent=`${s.pageW}"×${s.pageH}" — ${s.rows}×${s.cols}`}

/* ============================================================ HISTORY (Undo/Redo) */
function saveHistory(){
  const state=JSON.stringify({frames:App.frames,textElements:App.textElements,stickers:App.stickers});
  App.history=App.history.slice(0,App.historyIdx+1);
  App.history.push(state);if(App.history.length>50)App.history.shift();
  App.historyIdx=App.history.length-1;
  updateUndoRedoBtns();
}
function undo(){if(App.historyIdx<=0)return;App.historyIdx--;restoreHistory()}
function redo(){if(App.historyIdx>=App.history.length-1)return;App.historyIdx++;restoreHistory()}
function restoreHistory(){
  const state=JSON.parse(App.history[App.historyIdx]);
  App.frames=state.frames;App.textElements=state.textElements;App.stickers=state.stickers;
  renderCanvas();updateUndoRedoBtns();
}
function updateUndoRedoBtns(){$('undoBtn').disabled=App.historyIdx<=0;$('redoBtn').disabled=App.historyIdx>=App.history.length-1}
$('undoBtn').addEventListener('click',undo);$('redoBtn').addEventListener('click',redo);

/* ============================================================ AUTO-SAVE */
function startAutoSave(){clearInterval(App.autoSaveTimer);App.autoSaveTimer=setInterval(()=>{if(App.canvasGenerated)saveToPastWorks()},120000)}

/* ============================================================ EXPORT */
function initExport(){
  $$('.export-fmt-btn').forEach(btn=>btn.addEventListener('click',()=>{
    $$('.export-fmt-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');
    App.exportFormat=btn.dataset.fmt;
    const info={svg:'SVG — CorelDRAW 2018 compatible. Editable groups, clipPaths, inch dimensions.',png:'PNG — Lossless at 300 DPI. Best for print.',jpeg:'JPEG — Adjust quality. Smaller file size.',pdf:'PDF — Print-ready single-page PDF.'};
    $('exportInfo').innerHTML=`<p>${info[App.exportFormat]}</p>`;
    $('qualityRow').style.display=App.exportFormat==='jpeg'?'flex':'none';
  }));
  $('downloadBtn').addEventListener('click',doExport);
  $('headerExportBtn').addEventListener('click',doExport);
  $('copyClipboardBtn').addEventListener('click',copyToClipboard);
  $('printBtn').addEventListener('click',printLayout);
  $('shareSettingsBtn').addEventListener('click',shareSettings);
  $('copyShareLink').addEventListener('click',()=>{$('shareLinkInput').select();document.execCommand('copy');showSuccess('Link copied!')});
}

async function doExport(){
  if(!App.canvasGenerated){showError('Generate a layout first.');return}
  if($('exportIndividual').checked){await exportIndividualFrames();return}
  readSettings();
  switch(App.exportFormat){
    case 'png': await exportRaster('png');break;
    case 'jpeg':await exportRaster('jpeg');break;
    case 'pdf': await exportPDF();break;
    case 'svg': exportSVG();break;
  }
}

async function buildHiResCanvas(){
  const s=App.settings,PPI=App.DPI;
  const pw=Math.round(s.pageW*PPI),ph=Math.round(s.pageH*PPI);
  const oc=document.createElement('canvas');oc.width=pw;oc.height=ph;
  const ctx=oc.getContext('2d');
  await drawBackground(ctx,pw,ph,PPI);
  await Promise.all(App.images.map(o=>loadImage(o).catch(()=>null)));
  for(const frame of App.frames)await drawPolaroidFrame(ctx,frame,s,PPI);
  for(const te of App.textElements)drawTextElement(ctx,te,PPI);
  for(const st of App.stickers)drawSticker(ctx,st,PPI);
  if(App.watermark)drawWatermark(ctx,pw,ph);
  if($('exportCropMarks').checked)drawCropMarks(ctx,pw,ph,PPI);
  if($('exportBleed').checked)drawBleedMarks(ctx,pw,ph,PPI);
  return oc;
}

function drawCropMarks(ctx,pw,ph,PPI){
  const m=PPI*.125,l=PPI*.1875;
  ctx.strokeStyle='#000';ctx.lineWidth=1;
  [[0,0],[pw,0],[0,ph],[pw,ph]].forEach(([x,y])=>{
    ctx.beginPath();ctx.moveTo(x+Math.sign(pw/2-x)*m,y);ctx.lineTo(x+Math.sign(pw/2-x)*(m+l),y);ctx.stroke();
    ctx.beginPath();ctx.moveTo(x,y+Math.sign(ph/2-y)*m);ctx.lineTo(x,y+Math.sign(ph/2-y)*(m+l));ctx.stroke();
  });
}
function drawBleedMarks(ctx,pw,ph,PPI){
  const b=PPI*.125;ctx.strokeStyle='rgba(200,0,0,.3)';ctx.lineWidth=1;ctx.setLineDash([4,4]);
  ctx.strokeRect(b,b,pw-b*2,ph-b*2);ctx.setLineDash([]);
}

async function exportRaster(fmt){
  showSuccess('Rendering high-res…');
  const oc=await buildHiResCanvas(),q=parseInt($('exportQuality').value)/100;
  const mime=fmt==='jpeg'?'image/jpeg':'image/png';
  const a=document.createElement('a');a.download=`polaroid-${Date.now()}.${fmt==='jpeg'?'jpg':'png'}`;a.href=oc.toDataURL(mime,q);a.click();showSuccess(`${fmt.toUpperCase()} downloaded!`);
}

async function exportPDF(){
  showSuccess('Building PDF…');
  const oc=await buildHiResCanvas(),s=App.settings,wPt=s.pageW*72,hPt=s.pageH*72;
  const imgData=oc.toDataURL('image/jpeg',.93),base64=imgData.split(',')[1];
  const raw=atob(base64),imgLen=raw.length;
  const stream=`q\n${wPt.toFixed(2)} 0 0 ${hPt.toFixed(2)} 0 0 cm\n/Im1 Do\nQ`;
  let body='%PDF-1.4\n';const offs=[0,0,0,0,0,0];
  offs[1]=body.length;body+=`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  offs[2]=body.length;body+=`2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  offs[3]=body.length;body+=`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wPt.toFixed(2)} ${hPt.toFixed(2)}] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> >> >>\nendobj\n`;
  offs[4]=body.length;body+=`4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`;
  const imgHdr=`5 0 obj\n<< /Type /XObject /Subtype /Image /Width ${oc.width} /Height ${oc.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgLen} >>\nstream\n`;
  offs[5]=body.length+imgHdr.length;
  const hb=new TextEncoder().encode(body+imgHdr);
  const ib=new Uint8Array(imgLen);for(let i=0;i<imgLen;i++)ib[i]=raw.charCodeAt(i);
  const tStr=`\nendstream\nendobj\n`;const xStart=hb.length+imgLen+tStr.length;
  let xref=`xref\n0 6\n0000000000 65535 f \n`;for(let i=1;i<=5;i++)xref+=String(offs[i]).padStart(10,'0')+' 00000 n \n';
  xref+=`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xStart}\n%%EOF`;
  const tb=new TextEncoder().encode(tStr+xref);
  const pdf=new Uint8Array(hb.length+imgLen+tb.length);pdf.set(hb,0);pdf.set(ib,hb.length);pdf.set(tb,hb.length+imgLen);
  const url=URL.createObjectURL(new Blob([pdf],{type:'application/pdf'}));
  const a=document.createElement('a');a.href=url;a.download=`polaroid-${Date.now()}.pdf`;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),2000);showSuccess('PDF downloaded!');
}

async function exportIndividualFrames(){
  showSuccess(`Exporting ${App.frames.length} individual frames…`);
  const s=App.settings,PPI=App.DPI;
  const fw=Math.round(s.frameW*PPI),fh=Math.round(s.frameH*PPI);
  await Promise.all(App.images.map(o=>loadImage(o).catch(()=>null)));
  for(let i=0;i<App.frames.length;i++){
    const oc=document.createElement('canvas');oc.width=fw;oc.height=fh;
    const ctx=oc.getContext('2d');ctx.fillStyle=s.frameColor;ctx.fillRect(0,0,fw,fh);
    const savedX=App.frames[i].x,savedY=App.frames[i].y,savedRot=App.frames[i].rotation;
    App.frames[i].x=0;App.frames[i].y=0;App.frames[i].rotation=0;
    await drawPolaroidFrame(ctx,App.frames[i],s,PPI);
    App.frames[i].x=savedX;App.frames[i].y=savedY;App.frames[i].rotation=savedRot;
    const a=document.createElement('a');a.download=`frame_${i+1}_${Date.now()}.png`;a.href=oc.toDataURL('image/png');a.click();
    await new Promise(r=>setTimeout(r,200));
  }
  showSuccess('All frames exported!');
}

/* ---- SVG Export ---- */
function exportSVG(){
  readSettings();const s=App.settings,PPI=96,pw=s.pageW*PPI,ph=s.pageH*PPI;
  let defs=`<filter id="fs" x="-15%" y="-15%" width="140%" height="150%"><feDropShadow dx="3" dy="6" stdDeviation="7" flood-color="rgba(0,0,0,.38)"/></filter>`;
  let groups='';
  App.frames.forEach((frame,fi)=>{
    const fw=s.frameW*PPI,fh=s.frameH*PPI,iw=s.imgW*PPI,ih=s.imgH*PPI,mt=s.marginTop*PPI;
    const ix=(fw-iw)/2,iy=mt,cr=s.cornerRadius,fx=frame.x*PPI,fy=frame.y*PPI;
    const clipId=`c${fi}`;
    defs+=`<clipPath id="${clipId}"><rect x="${ix.toFixed(1)}" y="${iy.toFixed(1)}" width="${iw.toFixed(1)}" height="${ih.toFixed(1)}" rx="${cr}"/></clipPath>`;
    const rot=frame.rotation!==0?` transform="rotate(${frame.rotation.toFixed(2)},${(fw/2).toFixed(1)},${(fh/2).toFixed(1)})"` :'';
    const imgObj=App.images[frame.imgIndex],imgSrc=imgObj?imgObj.dataURL:'';
    const bAttr=s.borderThickness>0?`stroke="${s.borderColor}" stroke-opacity="${(s.borderOpacity/100).toFixed(2)}" stroke-width="${s.borderThickness}"`:'stroke="none"';
    const shAttr=s.shadow?' filter="url(#fs)"':'';
    const ct=s.captions?(s.captionSameForAll?s.globalCaption:(imgObj?.caption||'')):'';
    const captSVG=ct?`<text x="${(fw/2).toFixed(1)}" y="${(iy+ih+(fh-iy-ih)/2).toFixed(1)}" font-family="${escXML(s.captionFont)},serif" font-size="${s.captionFontSize}" fill="${s.captionColor}" text-anchor="middle" dominant-baseline="middle">${escXML(ct)}</text>`:'';
    const imgSVG=imgSrc?`<image href="${imgSrc}" x="${(ix+frame.imgOffsetX*PPI).toFixed(1)}" y="${(iy+frame.imgOffsetY*PPI).toFixed(1)}" width="${iw.toFixed(1)}" height="${ih.toFixed(1)}" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice"/>`:'';
    groups+=`<g id="p${fi}" transform="translate(${fx.toFixed(1)},${fy.toFixed(1)})"><g${rot}${shAttr}><rect x="0" y="0" width="${fw.toFixed(1)}" height="${fh.toFixed(1)}" rx="${cr}" fill="${s.frameColor}" ${bAttr}/>${imgSVG}${captSVG}</g></g>`;
  });
  // Text elements
  App.textElements.forEach((te,i)=>{groups+=`<text id="txt${i}" x="${(te.x*PPI).toFixed(1)}" y="${(te.y*PPI).toFixed(1)}" font-family="${escXML(te.font)},sans-serif" font-size="${Math.round(te.fontSize*PPI/72)}" fill="${te.color}" opacity="${te.opacity}" text-anchor="middle" dominant-baseline="middle" transform="rotate(${te.rotation},${(te.x*PPI).toFixed(1)},${(te.y*PPI).toFixed(1)})">${escXML(te.text)}</text>`});
  const svg=`<?xml version="1.0" encoding="UTF-8"?>\n<!-- Polaroid Images — CorelDRAW 2018 Compatible -->\n<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="${s.pageW}in" height="${s.pageH}in" viewBox="0 0 ${pw} ${ph}">\n<defs>${defs}</defs>\n<rect width="${pw}" height="${ph}" fill="${App.bgColor}"/>\n<g id="layout">${groups}</g>\n</svg>`;
  const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=`polaroid-${Date.now()}.svg`;a.click();
  setTimeout(()=>URL.revokeObjectURL(url),2000);showSuccess('SVG downloaded!');
}

/* ---- Clipboard ---- */
async function copyToClipboard(){
  if(!App.canvasGenerated){showError('Generate layout first.');return}
  try{
    const canvas=$('mainCanvas');
    canvas.toBlob(async blob=>{
      await navigator.clipboard.write([new ClipboardItem({'image/png':blob})]);showSuccess('Copied to clipboard!');
    },'image/png');
  }catch(e){showError('Clipboard copy failed. Try PNG download instead.')}
}

/* ---- Print ---- */
async function printLayout(){
  if(!App.canvasGenerated){showError('Generate layout first.');return}
  const canvas=$('mainCanvas');const url=canvas.toDataURL('image/png');
  const win=window.open('');
  win.document.write(`<html><body style="margin:0"><img src="${url}" style="max-width:100%;print-color-adjust:exact"/></body></html>`);
  win.document.close();win.focus();setTimeout(()=>win.print(),500);
}

/* ---- Share Settings ---- */
function shareSettings(){
  readSettings();
  const state={settings:App.settings,layoutStyle:App.layoutStyle,frameStyle:App.frameStyle,bgType:App.bgType,bgColor:App.bgColor,filter:App.filter};
  const encoded=btoa(JSON.stringify(state));
  const url=`${window.location.href.split('?')[0]}?preset=${encoded}`;
  $('shareLinkBox').style.display='flex';$('shareLinkInput').value=url;
}

/* ---- Load shared preset from URL ---- */
function loadFromURL(){
  const params=new URLSearchParams(window.location.search);const p=params.get('preset');
  if(!p)return;
  try{const state=JSON.parse(atob(p));Object.assign(App.settings,state.settings||{});if(state.layoutStyle)App.layoutStyle=state.layoutStyle;if(state.bgColor)App.bgColor=state.bgColor;showSuccess('Settings loaded from link!')}catch(e){}
}

/* ============================================================ PAST WORKS */
function saveToPastWorks(){
  try{
    const canvas=$('mainCanvas');const tc=document.createElement('canvas');
    const sc=Math.min(200/canvas.width,260/canvas.height);tc.width=Math.round(canvas.width*sc);tc.height=Math.round(canvas.height*sc);
    tc.getContext('2d').drawImage(canvas,0,0,tc.width,tc.height);
    const entry={id:Date.now(),thumb:tc.toDataURL('image/jpeg',.45),date:new Date().toLocaleString(),label:`${App.settings.rows}×${App.settings.cols} — ${App.settings.pageW}"×${App.settings.pageH}" (${App.layoutStyle})`,settings:JSON.parse(JSON.stringify(App.settings)),layoutStyle:App.layoutStyle};
    const saved=JSON.parse(localStorage.getItem('pi_past_works')||'[]');saved.unshift(entry);if(saved.length>20)saved.length=20;
    localStorage.setItem('pi_past_works',JSON.stringify(saved));renderPastWorks();
  }catch(e){}
}
function renderPastWorks(){
  const grid=$('pastWorksGrid'),empty=$('pwEmpty');
  try{
    const saved=JSON.parse(localStorage.getItem('pi_past_works')||'[]');grid.innerHTML='';
    if(!saved.length){grid.appendChild(empty);return}
    saved.forEach((entry,i)=>{
      const card=document.createElement('div');card.className='pw-card';card.style.animationDelay=(i*.05)+'s';
      card.innerHTML=`<img class="pw-card-img" src="${entry.thumb}" loading="lazy"/><div class="pw-card-info"><span class="pw-card-date">${entry.date}</span><span class="pw-card-label">${entry.label}</span><div class="pw-card-actions"><button data-id="${entry.id}" data-action="load">Load</button><button data-id="${entry.id}" data-action="del">Delete</button></div></div>`;
      grid.appendChild(card);
    });
    grid.querySelectorAll('button[data-action]').forEach(btn=>btn.addEventListener('click',()=>btn.dataset.action==='del'?deletePastWork(+btn.dataset.id):loadPastWork(+btn.dataset.id)));
  }catch(e){grid.innerHTML='';grid.appendChild(empty)}
}
function deletePastWork(id){try{const s=JSON.parse(localStorage.getItem('pi_past_works')||'[]').filter(e=>e.id!==id);localStorage.setItem('pi_past_works',JSON.stringify(s));renderPastWorks()}catch(e){}}
function loadPastWork(id){
  try{
    const entry=JSON.parse(localStorage.getItem('pi_past_works')||'[]').find(e=>e.id===id);if(!entry)return;
    const s=entry.settings;Object.assign(App.settings,s);
    $('rowsInput').value=s.rows;$('colsInput').value=s.cols;$('spacingInput').value=s.spacing;
    $('frameWidth').value=s.frameW;$('frameHeight').value=s.frameH;$('frameColor').value=s.frameColor;
    App.layoutStyle=entry.layoutStyle;$$('.layout-btn').forEach(b=>b.classList.toggle('active',b.dataset.style===entry.layoutStyle));
    showSuccess('Settings restored!');window.scrollTo({top:0,behavior:'smooth'});
  }catch(e){}
}
$('clearPastWorksBtn').addEventListener('click',()=>{localStorage.removeItem('pi_past_works');renderPastWorks()});

/* ============================================================ STATS */
function updateStats(){const s=App.settings;$('statFrames').textContent=App.frames.length;$('statPage').textContent=`${s.pageW}"×${s.pageH}"`;$('statStyle').textContent=App.layoutStyle.charAt(0).toUpperCase()+App.layoutStyle.slice(1);$('statImages').textContent=App.images.length}

/* ============================================================ TOASTS */
function showError(msg){const t=$('errorToast');$('errorMsg').textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),5000)}
function showSuccess(msg){const t=$('successToast');$('successMsg').textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),3000)}
$('errorClose').addEventListener('click',()=>$('errorToast').classList.remove('show'));

/* ============================================================ RESET */
$('resetBtn').addEventListener('click',()=>{
  App.images=[];App.frames=[];App.textElements=[];App.stickers=[];
  App.canvasGenerated=false;App.zoom=.75;App.selectedFrameIdx=-1;
  App.history=[];App.historyIdx=-1;
  renderThumbnails();$('mainCanvas').style.display='none';$('emptyState').style.display='flex';
  $('downloadBtn').disabled=true;$('copyClipboardBtn').disabled=true;$('printBtn').disabled=true;
  $('statsSection').style.display='none';$('shareSection').style.display='none';
  $('previewDims').textContent='—';updateUndoRedoBtns();showSuccess('Reset complete.');
});

/* ============================================================ GENERATE */
$('generateBtn').addEventListener('click',generateLayout);

/* ============================================================ NAV */
$$('.nav-link').forEach(link=>link.addEventListener('click',e=>{
  const href=link.getAttribute('href');if(href&&href.startsWith('#')&&href.length>1){e.preventDefault();document.querySelector(href)?.scrollIntoView({behavior:'smooth'});$$('.nav-link').forEach(l=>l.classList.remove('active'));link.classList.add('active')}
}));

/* ============================================================ KEYBOARD SHORTCUTS */
document.addEventListener('keydown',e=>{
  const tag=document.activeElement?.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
  if(e.ctrlKey||e.metaKey){
    switch(e.key){
      case 'g':e.preventDefault();generateLayout();break;
      case 's':e.preventDefault();doExport();break;
      case 'z':e.preventDefault();undo();break;
      case 'y':e.preventDefault();redo();break;
      case '=':case '+':e.preventDefault();$('zoomInBtn').click();break;
      case '-':e.preventDefault();$('zoomOutBtn').click();break;
      case '0':e.preventDefault();$('zoomFitBtn').click();break;
      case 'a':e.preventDefault();if(App.frames.length)App.selectedFrameIdx=0;renderCanvas();break;
    }return;
  }
  if(e.key==='Delete'||e.key==='Backspace'){deleteSelectedFrame();return}
  if(e.key==='Escape'){$('captionEditorPopup').style.display='none';$('contextMenu').style.display='none';$('shortcutsPanel').style.display='none';$('errorToast').classList.remove('show');return}
  if(e.key==='?'){$('shortcutsPanel').style.display='block';return}
});

/* ============================================================ INIT */
function init(){
  initTheme();initTabs();initUpload();initFilters();initLayoutStyle();initPresets();
  initPalette();initBackground();initWatermark();initStickers();initFreeText();
  initCaptionControls();initRanges();initZoom();initExport();initLivePreview();initPageSize();
  renderPastWorks();loadFromURL();
  console.log('%cPolaroid Images Studio v2 ✓','color:#c8a96e;font-weight:bold;font-size:16px');
  console.log('All features loaded. Press ? for shortcuts.');
}
document.addEventListener('DOMContentLoaded',init);
