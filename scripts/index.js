// Continuation version — bump the +lc.N once per change-set (N = the newest
// CHANGES.md entry). The base "1.1.37" is the original author's (spotky1004)
// version line and is never changed. See www/README.md "Versioning".
var gameVersion = "v1.1.37+lc.5";
const $ = _ => document.querySelector(_);
const D = Decimal;

// dirty-checked DOM writers: remember the last value written to a node and skip
// identical writes (the renderers run many times per second; skipping unchanged
// writes avoids style/layout churn for both the browser and the JS engine).
// Rule: one node, one writer — once a property of a node is written through
// these helpers, never write that property directly anywhere else, or the cache
// silently desyncs. (commandTxt spans are created/removed constantly: plain
// direct writes there, no helpers.)
function setHTML(el, html) {           // string that may contain markup
  if (el.__c === undefined) el.__c = {};
  if (el.__c.html !== html) el.innerHTML = el.__c.html = html;
}
function setText(el, text) {           // plain text only (no markup in the string)
  if (el.__c === undefined) el.__c = {};
  if (el.__c.text !== text) el.textContent = el.__c.text = text;
}
function setDisplay(el, v) {           // 'block' | 'none' | 'inline-block' | ...
  if (el.__c === undefined) el.__c = {};
  if (el.__c.disp !== v) el.style.display = el.__c.disp = v;
}
function setClassName(el, c) {         // whole className (replaces everything)
  if (el.__c === undefined) el.__c = {};
  if (el.__c.cls !== c) el.className = el.__c.cls = c;
}
function setHasClass(el, cls, on) {    // classList add/remove of one class
  if (el.__c === undefined) el.__c = {};
  var key = 'c' + cls;
  if (el.__c[key] !== on) { el.classList[on ? "add" : "remove"](cls); el.__c[key] = on; }
}
function setStyle(el, prop, val) {     // camelCase style prop, e.g. 'filter','width'
  if (el.__c === undefined) el.__c = {};
  var key = 's' + prop;
  if (el.__c[key] !== val) { el.style[prop] = val; el.__c[key] = val; }
}
function setCssVar(el, name, val) {    // custom property, e.g. '--s', '--progress'
  if (el.__c === undefined) el.__c = {};
  var key = 'v' + name;
  if (el.__c[key] !== val) { el.style.setProperty(name, val); el.__c[key] = val; }
}

String.prototype.replaceAt=function(index, char) {
    var a = this.split("");
    a[index] = char;
    return a.join("");
}
function copyText(str) {
  var tempElem = document.createElement('textarea');
  tempElem.value = str;  
  document.body.appendChild(tempElem);

  tempElem.select();
  document.execCommand("copy");
  document.body.removeChild(tempElem);
}

// all
function renderAll() {
  renderBasic();
  renderInfo();

  switch (tabNow) {
    case 0:
    renderModule();
      break;
    case 1:
    renderShop();
      break;
    case 2:
    renderResearch();
      break;
    case 3:
    renderAchievements()
      break;
    case 4:
    renderOption();
      break;
    case 5:
    renderQunatum();
      break;
    case 6:
    renderStat();
      break;
    case 7:
    renderSingularity();
      break;
    case 8:
      renderInfinity();
      break;
  }
}
function renderInfo() {
  $('#infoArea').style.display = (game.t2toggle ? 'block' : 'none')
  renderBasicInfo();
  renderOverclockInfo();
  renderSingularityInfo();
  renderInfinityInfo();
}
function calcAll(dt=0) {
  calcToggleTabs();

  game.mDigits = calcMaxDigit();

  calcAchievements();
  calcInfinity();
  calcSingularity(dt);
  calcQuantum(dt);
  calcProgram(dt);
  calcResearch(dt);
}

//visual effect
function rainbowEffect(sel, pow=1) {
  if (!game.optionToggle[0]) {
    delRainbowEffect(sel);
    return;
  }
  var ele = $(sel);
  if (ele.__c === undefined) ele.__c = {};
  var thisHue = (ele.__c.hue !== undefined) ? ele.__c.hue : 0;   // same 1deg/tick speed
  ele.style.filter = 'hue-rotate(' + (thisHue+1) + 'deg)';
  ele.__c.hue = thisHue+1;
}
function delRainbowEffect(sel) {
  var ele = $(sel);
  if (ele.__c !== undefined && ele.__c.hue !== undefined) {      // clear once, not every tick
    ele.style.filter = '';                                       // '' == identity, no repaint churn
    ele.__c.hue = undefined;
  }
}
function commandAppend(str, hue=0, out=0) {
  if (!game.optionToggle[0]) {
    return;
  }
  commandFloat(14);
  commandTxt = document.createElement('span');
  commandTxt.className += 'commandTxt';
  commandTxt.innerHTML = ((!out) ? '> ' : '') + `_<span style="opacity:0">${str}</span>`;
  commandTxt.ticks = 0;
  commandTxt.style.bottom = '0vh';
  commandTxt.style.opacity = 1;
  commandTxt.style.filter = 'hue-rotate(' + hue + 'deg)';
  $('#commandArea').appendChild(commandTxt);
}
function commandFloat(speed=0.8) {
  eleArr = document.getElementsByClassName("commandTxt");
  var isRender = (speed == 0.8);                       // per-render pass (from renderBasic);
                                                       // the commandAppend(14) bump stays unscaled
  var fSpeed = isRender ? speed*renderEvery : speed;   // keep fade/rise per-second at lower render rate
  var fadeMul = isRender ? Math.pow(0.995, renderEvery) : 0.995;
  for (var i = 0; i < eleArr.length; i++) {
    if (speed != 0.8) {
      eleArr[i].style.bottom = (Number(eleArr[i].style.bottom.replace('vh', ''))+tSpeed*5*speed) + 'vh';
      eleArr[i].ticks += speed;
    }
    eleArr[i].style.opacity = (eleArr[i].style.opacity-tSpeed/8*fSpeed)*fadeMul;
    if (eleArr[i].innerHTML.indexOf('_<span') != -1) {         // skip once fully typed
      for (var k = 0; k < (isRender ? renderEvery : 1); k++) { // chars/sec unchanged
        eleArr[i].innerHTML = eleArr[i].innerHTML.replace(/(_<span style="opacity:0">([^<\/>]+)<\/span>)/, function(match, p1, p2){return `${p2[0]}_<span style="opacity:0">${p2.substring(1, 9999)}</span>`});
      }
    }
    if (eleArr[i].style.opacity < 0 || eleArr[i].ticks > 100) {  // was commandTxt.ticks (newest msg's count)
      eleArr[i].remove();
    }
  }
}

// etc
function hsvToRgb(h, s, v) {
  var r, g, b;

  var i = Math.floor(h * 6);
  var f = h * 6 - i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }
  return '#' + Math.floor(r*255).toString(16).padStart(2, Math.floor(r*255).toString(16)) + Math.floor(g*255).toString(16).padStart(2, Math.floor(g*255).toString(16)) + Math.floor(b*255).toString(16).padStart(2, Math.floor(b*255).toString(16));
}

var pauseFixes = ["t5resetTime", "tLast", "startTime", "rebootTime", "quantumTime", "singularityTime"];
function gamePauseFix(dt) {
  for (var i = 0, l = pauseFixes.length; i < l; i++) game[pauseFixes[i]] += dt;
}

// idk how to call these lol
window.onblur = () => blurSettings();
function blurSettings() {
  keyDowns = {};
  documentHold = 0;
}

//hotkey
// resolve a KeyboardEvent to a legacy keyCode; virtual keyboards (e.g. iPhone
// Mirroring into Safari) can deliver events with a zeroed keyCode, so fall
// back to e.key. Desktop browsers always supply keyCode: no change there.
function keyCodeOf(e) {
  return e.keyCode || { End: 35, PageDown: 34, Home: 36, Clear: 12 }[e.key]
    || (typeof e.key === "string" && e.key.length === 1 ? e.key.toUpperCase().charCodeAt(0) : 0);
}
(function(){
  keyDowns = {};
  document.addEventListener('keydown', function(e){
    if (e.repeat) return; // OS key-repeat: holding a key must not re-fire its action
    const keyCode = keyCodeOf(e);
    keyDowns[keyCode] = true;
    if (keyCode == 12 || keyCode == 32 || keyCode == 34 || keyCode == 35 || keyCode == 36) e.preventDefault(); // bound nav/space keys: don't also scroll the page
    if (!keyDowns[16]) {
      if (keyCode == 49 || keyCode == 35) activeProgram(0); // 1
      if (keyCode == 50) activeProgram(1); // 2 (arrow aliases removed)
      if (keyCode == 51 || keyCode == 34) activeProgram(2); // 3
      if (keyCode == 52) activeProgram(3); // 4 (arrow aliases removed)
      if (keyCode == 53 || keyCode == 12) activeProgram(4); // 5
      if (keyCode == 54) activeProgram(5); // 6 (arrow aliases removed)
      if (keyCode == 55 || keyCode == 36) activeProgram(6); // 7
      if (keyCode == 56) for (var i = 0; i < 7; i++) { // 8: enable programs 1→7 in order, stop at the first blocked one
        if (game.programActive[i]) continue;
        if (calcProcessLeft() < 1) break;
        activeProgram(i);
        if (!game.programActive[i]) break;
      }
    }

    if (keyCode == 80 || keyCode == 32) gamePaused ^= 1; // p / space: pause (shift+p also works)
    if (keyCode == 82) reboot(); // r
    if (keyCode == 81) quantum(); // q
    if (keyCode == 90) singularity(); // z / Z (keyCode ignores caps lock and shift)

    if (keyCode == 65) goTab(0); // a
    if (keyCode == 83) goTab(1); // s
    if (keyCode == 68) goTab(3); // d
    if (keyCode == 70) goTab(2); // f
    if (keyCode == 71) goTab(5); // g
    if (keyCode == 74) goTab(8); // j
    if (keyCode == 72) !keyDowns[16] ? goTab(7) : game.hyperMode ^= 1; // h
  })
  document.addEventListener('keyup', function(e){
    const keyCode = keyCodeOf(e);
    keyDowns[keyCode] = false;
  })
})();
function calcExtraHotkeys() {
  if (keyDowns[16] && keyDowns[56]) researchBuy(7); // shift + 8: buy research 8 (still repeats while held)
}

// override
Element.prototype.remove = function() {
  this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
  for(var i = this.length - 1; i >= 0; i--) {
      if(this[i] && this[i].parentElement) {
          this[i].parentElement.removeChild(this[i]);
      }
  }
}