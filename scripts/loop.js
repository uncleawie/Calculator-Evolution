var tickDone = 0, tSpeed = 0.033, renderEvery = 2;  // render UI every Nth tick (2 = ~15fps; raise to 3 on weak phones)
var calcMsAvg = 0, renderMsAvg = 0;                 // smoothed calc/render ms, shown by renderCalcDebugInfo
setInterval( function () {
  var dt = (new Date().getTime()-game.tLast)/1000*game.gameSpeed;
  if (dt >= 60*game.gameSpeed) {
    commandAppend(`${timeNotation(dt/game.gameSpeed)} of progress done!`, 0, 1);
  }
  if (!gamePaused) {
    game.tLast = new Date().getTime();
    var t0 = performance.now();
    calcAll(dt);
    calcMsAvg = calcMsAvg*0.9 + (performance.now()-t0)*0.1;
  } else {
    gamePauseFix(new Date().getTime() - game.tLast);
    game.tLast = new Date().getTime();
  }
  calcExtraHotkeys();
  if (tickDone % renderEvery == 0 || gamePaused) {  // UI refresh throttled; the simulation above stays at 30fps
    var t1 = performance.now();
    renderAll();
    renderMsAvg = renderMsAvg*0.9 + (performance.now()-t1)*0.1;
  }
  renderCalcDebugInfo();
  bugFixer();
  tickDone++;
  tpsRecording++;   // counts sim ticks here so the TPS meter stays ~30 despite throttled renders
}, tSpeed*1000);
setInterval( function () {
  save();
}, 20000);

load();
initAchievements();
basicInits();
