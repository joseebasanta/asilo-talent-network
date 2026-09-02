
/* ==========================================================================
   ASCII background — El Ávila + Caracas skyline rendered as breathing glyphs.
   Adapted from the mushenzhen ascii-portrait technique: sample a source into a
   coarse luminance grid, pick one glyph per cell by brightness, add a small
   time-wobble so the picture shimmers without moving. Source here is drawn
   procedurally (no photo needed); swap SRC for an <img> to use a real photo.
   ========================================================================== */
(function () {
  "use strict";

  /* ═══════════════════════════════════════════════════════════════════════
     SWAP THE BACKGROUND IMAGE HERE ↓
     Paste an image as a data URI (or a URL) between the quotes to render it
     as ASCII. Leave "" to use the built-in procedural El Ávila + Caracas
     skyline. Real photos self-adjust (histogram equalisation).
     ═══════════════════════════════════════════════════════════════════════ */
  var IMAGE_SRC = "/ascii-skyline.png";

  var CONFIG = {
    cell: 7,
    ramp: " .·:;-=+|",          // dots + line/vertical strokes only (no block glyphs)
    color: getVar("--ink", "#6f7075"),
    blue: getVar("--accent-blue", "#0066FF"),
    blueFrac: 0.06,   // fraction of the *brightest* glyphs that glow blue
    background: getVar("--bg", "#0a0a0b"),
    gamma: 0.82,
    skyTop: 0.40, skyBot: 0.58,   // vertical band where sky fades out → mountain fades in (fractions of height)
    minScale: 1.0, maxScale: 1.5,
    fps: 24, wave: 0.045, twinkle: 0.045,
    revealMs: 1400, revealAmp: 0.55,
  };
  function getVar(name, dflt){
    try{ var v=getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return v||dflt; }
    catch(e){ return dflt; }
  }

  var canvas = document.getElementById("ascii");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ---- Procedural source: a grayscale El Ávila + Caracas scene. Brighter =
     more ink. Sky/ground stay near-black so they read as empty. ---- */
  var SRC = null;   // resolved at boot: procedural scene, or a loaded image
  function buildScene(W, H){
    var cv = document.createElement("canvas"); cv.width=W; cv.height=H;
    var g = cv.getContext("2d");
    g.fillStyle="#000"; g.fillRect(0,0,W,H);

    var rnd = mulberry32(20261120);
    var cl = function(l){ l=l|0; return l<0?0:l>255?255:l; };
    var put = function(x,y,l){ if(x<0||y<0||x>=W||y>=H)return; g.fillStyle="rgb("+cl(l)+","+cl(l)+","+cl(l)+")"; g.fillRect(x|0,y|0,1,1); };
    var box = function(x,y,w,h,l){ g.fillStyle="rgb("+cl(l)+","+cl(l)+","+cl(l)+")"; g.fillRect(x|0,y|0,Math.max(1,w|0),Math.max(1,h|0)); };
    var line = function(x0,y0,x1,y1,l){ var dx=x1-x0,dy=y1-y0,n=Math.max(1,Math.max(Math.abs(dx),Math.abs(dy))); for(var k=0;k<=n;k++) put(x0+dx*k/n, y0+dy*k/n, l); };
    var blob = function(cx,cy,r,l){ for(var yy=-r;yy<=r;yy++)for(var xx=-r;xx<=r;xx++){ if(xx*xx+yy*yy<=r*r && rnd()<0.72) put(cx+xx,cy+yy, l*(0.55+rnd()*0.45)); } };

    var street = H*0.70;   // where the buildings meet the ground

    // A building with bright edges (reads as an outline) and floors of windows.
    function building(bx, bw, top, body, winL, floor, gap){
      box(bx, top, bw, street-top, body);
      box(bx, top, 1, street-top, body+45);          // left edge
      box(bx+bw-1, top, 1, street-top, body+45);      // right edge
      box(bx, top, bw, 1, body+75);                   // roofline
      for (var wy=top+3; wy<street-2; wy+=floor){
        for (var wx=bx+2; wx<bx+bw-2; wx+=gap){
          if (rnd()<0.72) box(wx, wy, Math.max(1,gap-2), Math.max(1,floor-2), winL-(rnd()<0.3?55:0));
        }
      }
    }

    // --- El Ávila: faint mass behind the city, with a crisp ridgeline ---
    function ridgeY(x){
      var t=x/W;
      var a=Math.sin(t*Math.PI*1.1+0.6);
      var b=Math.sin(t*Math.PI*3.0+1.2)*0.28;
      var c=Math.sin(t*Math.PI*6.5)*0.06;
      return H*0.30 - (a*0.13 + b*0.12 + c) * H;
    }
    for (var x=0; x<W; x++){
      var ry=ridgeY(x);
      for (var y=Math.floor(ry); y<street; y++){
        var d=(y-ry)/(street-ry);
        put(x, y, (34 - d*28) + (rnd()*2-1)*5);
      }
    }
    for (var x2=0; x2<W; x2++){ var rr=Math.floor(ridgeY(x2)); put(x2,rr,92); put(x2,rr+1,58); }

    // --- Background skyline: many thin, faint towers ---
    var bx=-6;
    while (bx<W+6){
      var bw=6+Math.floor(rnd()*16);
      var bh=40+Math.floor(rnd()*rnd()*(H*0.42));
      building(bx, bw, Math.max(H*0.14, street-bh), 44+rnd()*22, 120+rnd()*40, 4, 3);
      bx += bw + Math.floor(rnd()*3);
    }
    // --- Midground skyline: taller, brighter, more detailed ---
    bx=-8;
    while (bx<W+8){
      var bw2=14+Math.floor(rnd()*30);
      var bh2=70+Math.floor(rnd()*rnd()*(H*0.6));
      var top2=Math.max(H*0.08, street-bh2);
      building(bx, bw2, top2, 78+rnd()*28, 190+rnd()*45, 6, 5);
      if (rnd()<0.4){ box(bx+bw2/2-1, top2-8-Math.floor(rnd()*10), 2, 12, 150); } // antenna/tank
      bx += bw2 + Math.floor(rnd()*10);
    }
    // --- Signature towers ---
    for (var t2=0;t2<6;t2++){
      var tx=40+Math.floor(rnd()*(W-80));
      var tw=8+Math.floor(rnd()*10);
      var th=H*0.42+Math.floor(rnd()*H*0.32);
      building(tx, tw, Math.max(H*0.05, street-th), 95, 235, 6, 4);
      box(tx+tw/2-1, street-th-14, 2, 14, 210); // antenna
    }
    // --- Billboards / signage ---
    for (var s2=0;s2<10;s2++){
      var sx=20+Math.floor(rnd()*(W-140)), sy=H*0.18+rnd()*H*0.35, sw=26+rnd()*48, sh=12+rnd()*20;
      box(sx,sy,1,sh,200); box(sx+sw-1,sy,1,sh,200); box(sx,sy,sw,1,200); box(sx,sy+sh-1,sw,1,200);
      for (var yy=sy+3; yy<sy+sh-2; yy+=3) for (var xx=sx+3; xx<sx+sw-2; xx+=2) if (rnd()<0.5) put(xx,yy,150);
    }

    // --- Elevated rail / boulevard across the scene ---
    var railY=street-7;
    box(0,railY,W,3,120);
    for (var rx=0;rx<W;rx+=6) put(rx,railY+1,205);
    for (var sp=20;sp<W;sp+=94){ box(sp,railY+3, 3, street-(railY+3), 88); }

    // ================= FOREGROUND — fills to the bottom edge =================
    box(0, street, W, H-street, 15);                  // ground base
    var vpx=W*0.5, vpy=street+3;
    for (var i=-6;i<=6;i++){                           // road converging to VP
      line(vpx, vpy, vpx + i*W*0.095, H, 58 + (i%2?0:22));
    }
    for (var ly=street+18; ly<H; ly+=Math.max(7,(ly-street)*0.13)){ // centre dashes
      box(vpx-1, ly, 2, Math.max(2,(ly-street)*0.05), 175);
    }
    for (var cw=0; cw<W; cw+=28){ box(cw, H*0.88, 13, 6, 195); box(cw+6, H*0.985, 15, 7, 150); } // crosswalks
    for (var gy=street+6; gy<H; gy+=3) for (var gx=0; gx<W; gx+=4) if (rnd()< (gy>H*0.85?0.32:0.14)) put(gx,gy, 28+rnd()*34);
    for (var pty=H-Math.floor(H*0.15); pty<H; pty+=7) box(0,pty,W,1,36);   // plaza tiling at the very front

    for (var tr=0; tr<30; tr++){                       // trees
      var trx=rnd()*W, try_=street+10+rnd()*(H-street-18), rad=5+rnd()*11;
      blob(trx,try_,rad, 66+rnd()*30); box(trx-1,try_+rad,2,rad*0.6,58);
    }
    for (var sl=0; sl<16; sl++){                        // streetlights
      var slx=rnd()*W, sly=street+12+rnd()*(H-street-44), slh=18+rnd()*16;
      box(slx,sly-slh,2,slh,118); put(slx+2,sly-slh,220); put(slx+3,sly-slh,175);
    }
    for (var ca=0; ca<9; ca++){                         // cars
      var cx=rnd()*W, cyy=street+30+rnd()*(H-street-42), cwd=14+rnd()*10;
      box(cx,cyy,cwd,6,88); box(cx+2,cyy-3,cwd-6,3,66);
      put(cx+cwd-1,cyy+2,230); put(cx,cyy+2,200);
      put(cx+2,cyy+6,140); put(cx+cwd-3,cyy+6,140);
    }

    // --- Sky: sparse stars ---
    for (var st=0; st<130; st++){ var stx=rnd()*W, sty=rnd()*ridgeY(stx)*0.85; put(stx,sty, 50+rnd()*90); }

    return { data: g.getImageData(0,0,W,H).data, w:W, h:H };
  }
  function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

  var grid=null, cssW=0, cssH=0, cols=0, rows=0;
  var USE_EQUALIZE=false;   // photo mode uses histogram equalisation
  var PHOTO_INVERT=false;   // false = true-tone (keep the photo's light↔shadow); sky killed by a positional mask instead
  // Cool-grey brightness LUT: glyph ink brightness encodes the photo's tone
  // (lit → bright glyph, shadow → dim), so light and shadow read like the photo.
  var LUTG=(function(){ var a=[]; for(var i=0;i<32;i++){ var t=i/31,
      r=Math.round(46+t*(232-46)), g=Math.round(48+t*(234-48)), b=Math.round(54+t*(240-54));
      a.push("rgb("+r+","+g+","+b+")"); } return a; })();
  var STEPS=8, fonts=null, bufX=null, bufY=null, bufC=null, bufN=null, chars=null;
  var bufBX=null, bufBY=null, bufBC=null, bufBN=null;   // parallel buffers for blue glyphs
  var bufV=null;   // per-cell brightness (tone) for the normal glyphs

  function buildGrid(w,h){
    // resample the source scene to the glyph grid (cover-fit)
    var off=document.createElement("canvas"); off.width=w; off.height=h;
    var g=off.getContext("2d",{willReadFrequently:true});
    var tmp=document.createElement("canvas"); tmp.width=SRC.w; tmp.height=SRC.h;
    tmp.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(SRC.data), SRC.w, SRC.h),0,0);
    g.imageSmoothingEnabled=true; g.imageSmoothingQuality="high";
    var scale=Math.max(w/SRC.w, h/SRC.h), dw=SRC.w*scale, dh=SRC.h*scale;
    g.drawImage(tmp,(w-dw)/2,(h-dh)/2,dw,dh);
    var data=g.getImageData(0,0,w,h).data;
    var lum=new Float32Array(w*h);
    for(var i=0;i<lum.length;i++){ var o=i*4; lum[i]=(data[o]*0.299+data[o+1]*0.587+data[o+2]*0.114)/255; }
    /* This source is authored (not a halftone photo), so keep its structure:
       normalise to its own peak and apply a gentle contrast + gamma. The large
       black sky/ground stay at 0 and map to the ramp's leading blank, so the
       skyline reads as a silhouette instead of allover static. (Equalisation —
       ranking every cell by cumulative count — would lift the black areas into
       mid-ink; that's right for a full-frame photo, wrong for a silhouette.) */
    if(USE_EQUALIZE){
      // Histogram equalisation — for real photographs. Ranks each cell by its
      // place in the tone distribution, so any photo self-adjusts to the ramp.
      var BINS=256, hist=new Uint32Array(BINS);
      for(var hb=0;hb<lum.length;hb++) hist[Math.min(255,(lum[hb]*255)|0)]++;
      var cdf=new Float32Array(BINS), run=0;
      for(var b=0;b<BINS;b++){ run+=hist[b]; cdf[b]=run/lum.length; }
      for(var k=0;k<lum.length;k++){ var vv=cdf[Math.min(255,(lum[k]*255)|0)]; lum[k]=Math.pow(vv, CONFIG.gamma); }
    } else {
      // Authored silhouette — keep black areas black (normalise + contrast).
      var maxL=0; for(var mi=0;mi<lum.length;mi++) if(lum[mi]>maxL) maxL=lum[mi];
      var inv=maxL>0?1/maxL:1;
      for(var k2=0;k2<lum.length;k2++){
        var v=lum[k2]*inv; v=(v-0.04)/0.96; if(v<0) v=0; if(v>1) v=1;
        lum[k2]=Math.pow(v, CONFIG.gamma);
      }
    }
    var lumB = lum.slice();   // equalized tone → drives glyph BRIGHTNESS (light/shadow)
    if(USE_EQUALIZE){
      // True-tone photo mode: keep the mountain's light↔shadow gradient and
      // remove the bright sky by POSITION (a soft vertical mask) rather than by
      // inverting (which would swap lit and shadowed areas). `lum` decides where
      // ink appears and how dense; `lumB` decides how bright each glyph is.
      var stop=CONFIG.skyTop, sbot=CONFIG.skyBot, span=(sbot-stop)||1;
      for(var r=0;r<h;r++){
        var f=(r/(h-1)-stop)/span; if(f<0)f=0; else if(f>1)f=1;
        var m=f*f*(3-2*f);                       // 0 at top (sky) → 1 lower (mountain)
        for(var c=0;c<w;c++){
          var gi=r*w+c;
          var d=(PHOTO_INVERT ? 1-lum[gi] : lum[gi]) * m;
          d=(d-0.05)/0.95; if(d<0) d=0; else if(d>1) d=1;
          lum[gi]=Math.pow(d, 1.12);             // gentle contrast, gradient preserved
          lumB[gi]*=m;
        }
      }
    }
    var phase=new Float32Array(w*h);
    for(var p=0;p<phase.length;p++) phase[p]=Math.random()*6.2831853;
    var blue=new Uint8Array(w*h);
    for(var q=0;q<blue.length;q++) blue[q]= Math.random()<CONFIG.blueFrac ? 1 : 0;
    grid={w:w,h:h,lum:lum,lumB:lumB,phase:phase,blue:blue};
  }

  function layout(){
    var w=canvas.clientWidth, h=canvas.clientHeight;
    if(!w||!h) return false;
    if(w===cssW&&h===cssH&&grid) return true;
    cssW=w; cssH=h;
    var dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(w*dpr); canvas.height=Math.round(h*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    var cell=CONFIG.cell; cols=Math.ceil(w/cell); rows=Math.ceil(h/cell);
    buildGrid(cols,rows);
    var n=cols*rows;
    fonts=new Array(STEPS); bufX=new Array(STEPS); bufY=new Array(STEPS); bufC=new Array(STEPS); bufN=new Int32Array(STEPS);
    bufBX=new Array(STEPS); bufBY=new Array(STEPS); bufBC=new Array(STEPS); bufBN=new Int32Array(STEPS);
    bufV=new Array(STEPS);
    for(var s=0;s<STEPS;s++){
      var mid=(s+0.5)/STEPS, size=cell*(CONFIG.minScale+mid*(CONFIG.maxScale-CONFIG.minScale));
      fonts[s]=size.toFixed(2)+'px ui-monospace, "SFMono-Regular", Menlo, monospace';
      bufX[s]=new Float32Array(n); bufY[s]=new Float32Array(n); bufC[s]=new Uint8Array(n);
      bufBX[s]=new Float32Array(n); bufBY[s]=new Float32Array(n); bufBC[s]=new Uint8Array(n);
      bufV[s]=new Float32Array(n);
    }
    chars=CONFIG.ramp.split("");
    return true;
  }

  function paint(t, extra){
    ctx.fillStyle=CONFIG.background; ctx.fillRect(0,0,cssW,cssH);
    ctx.textAlign="center"; ctx.textBaseline="middle";
    var cell=CONFIG.cell, half=cell/2, lum=grid.lum, lumB=grid.lumB, phase=grid.phase, blue=grid.blue, gw=grid.w;
    var last=CONFIG.ramp.length-1, nRamp=CONFIG.ramp.length, waveAmp=CONFIG.wave, twAmp=CONFIG.twinkle+extra;
    var blueMin=last-2;  // only the brightest few glyphs may go blue
    for(var s=0;s<STEPS;s++){ bufN[s]=0; bufBN[s]=0; }
    for(var r=0;r<rows;r++){
      var y=r*cell+half, wa=r*0.09-t*1.6, wb=-r*0.13+t*1.1, base=r*gw;
      for(var c=0;c<cols;c++){
        var i=base+c;
        var v=lum[i]+waveAmp*(Math.sin(c*0.16+wa)*0.6+Math.sin(c*0.07+wb)*0.4)+twAmp*Math.sin(t*2.6+phase[i]);
        if(v<=0) continue; if(v>0.999) v=0.999;
        var idx=(v*nRamp)|0; if(idx>last) idx=last; if(idx===0) continue;
        var step=(v*STEPS)|0; if(step>STEPS-1) step=STEPS-1;
        var x=c*cell+half;
        if(blue[i] && idx>=blueMin){ var mb=bufBN[step]++; bufBX[step][mb]=x; bufBY[step][mb]=y; bufBC[step][mb]=idx; }
        else { var m=bufN[step]++; bufX[step][m]=x; bufY[step][m]=y; bufC[step][m]=idx; bufV[step][m]=lumB[i]; }
      }
    }
    for(var k=0;k<STEPS;k++){
      var count=bufN[k], cb=bufBN[k];
      if(!count && !cb) continue;
      ctx.font=fonts[k];
      if(count){
        var xs=bufX[k], ys=bufY[k], cs=bufC[k], vs=bufV[k];
        for(var mm=0;mm<count;mm++){
          var bi=(vs[mm]*31)|0; if(bi<0) bi=0; else if(bi>31) bi=31;
          ctx.fillStyle=LUTG[bi];                 // glyph brightness = photo tone
          ctx.fillText(chars[cs[mm]], xs[mm], ys[mm]);
        }
      }
      if(cb){ ctx.fillStyle=CONFIG.blue; var xb=bufBX[k], yb=bufBY[k], cbs=bufBC[k]; for(var nb=0;nb<cb;nb++) ctx.fillText(chars[cbs[nb]], xb[nb], yb[nb]); }
    }
  }

  var running=false, rafId=0, startedAt=0, lastFrame=0;
  function frame(now){
    if(!running){ rafId=0; return; }
    rafId=requestAnimationFrame(frame);
    if(now-lastFrame < 1000/CONFIG.fps-1) return;
    lastFrame=now;
    var elapsed=now-startedAt, p=Math.min(1,elapsed/CONFIG.revealMs);
    var extra=p>=1?0:CONFIG.revealAmp*Math.pow(1-p,2.2);
    paint(elapsed/1000, extra);
  }
  function start(){ if(running||!layout()) return; running=true; startedAt=performance.now(); lastFrame=0; rafId=requestAnimationFrame(frame); }
  function stop(){ running=false; if(rafId) cancelAnimationFrame(rafId); rafId=0; }
  function sync(){ if(reduced.matches){ stop(); if(layout()) paint(0,0); return; } if(document.visibilityState==="visible"&&canvas.clientWidth>0) start(); else stop(); }

  function boot(){
    if(layout()) paint(0,0);
    document.addEventListener("visibilitychange", sync);
    if(reduced.addEventListener) reduced.addEventListener("change", sync);
    var lastW=0,lastH=0;
    new ResizeObserver(function(){ var w=canvas.clientWidth,h=canvas.clientHeight; if(w===lastW&&h===lastH) return; lastW=w; lastH=h; if(!layout()) return; if(running) return; sync(); if(!running) paint(0,0); }).observe(canvas);
    sync();
  }

  // Resolve the source: a pasted image (photo mode) or the procedural skyline.
  if(IMAGE_SRC){
    USE_EQUALIZE = true;
    var im = new Image(); im.crossOrigin="anonymous"; im.decoding="async";
    im.onload = function(){
      var iw=im.naturalWidth, ih=im.naturalHeight;
      var cv=document.createElement("canvas"); cv.width=iw; cv.height=ih;
      var g2=cv.getContext("2d"); g2.drawImage(im,0,0);
      SRC = { data: g2.getImageData(0,0,iw,ih).data, w:iw, h:ih };
      boot();
    };
    im.onerror = function(){ USE_EQUALIZE=false; SRC = buildScene(1500,760); boot(); };
    im.src = IMAGE_SRC;
  } else {
    SRC = buildScene(1500, 760);
    boot();
  }
})();
