(() => {
  console.log('script.js loaded');

  const container = document.getElementById('game-container');
  const bucket = document.getElementById('bucket');
  const scoreEl = document.getElementById('score');
  const timeEl = document.getElementById('time');
  const startBtn = document.getElementById('start-btn');
  const difficultySelect = document.getElementById('difficulty');
  const info = document.getElementById('game-info');

  if (!container || !bucket || !scoreEl || !timeEl || !startBtn || !difficultySelect || !info) {
    console.error('Missing one or more required DOM elements. Check IDs in index.html');
    if (info) info.textContent = 'Error: missing game elements (see console).';
    return;
  }

  let score = 0;
  let timeLeft = 30;
  let running = false;
  let drops = new Set();
  let spawnTimer = null;
  let gameTimer = null;
  let animationId = null;

  const settings = {
    easy:   { time:45, spawnInterval:900, speed:1.0, goal:120 },
    normal: { time:30, spawnInterval:700, speed:1.4, goal:200 },
    hard:   { time:20, spawnInterval:450, speed:1.9, goal:400 }
  };

  function applyDifficulty(){
    const d = difficultySelect.value;
    const s = settings[d] || settings.normal;
    timeLeft = s.time;
    timeEl.textContent = timeLeft;
    info.textContent = `Mode: ${d[0].toUpperCase()+d.slice(1)} — Reach ${s.goal} points to win.`;
  }

  difficultySelect.addEventListener('change', applyDifficulty);
  applyDifficulty();

  function setBucketCenter() {
    const rect = container.getBoundingClientRect();
    const half = Math.max(1, bucket.clientWidth / 2);
    bucket.style.left = (rect.width / 2) + 'px';
    bucket.dataset.half = String(half);
  }
  window.addEventListener('resize', setBucketCenter);
  setBucketCenter();

  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    let x = e.clientX - rect.left;
    const half = parseFloat(bucket.dataset.half) || (bucket.clientWidth/2);
    x = Math.max(half, Math.min(rect.width - half, x));
    bucket.style.left = x + 'px';
  });

  container.addEventListener('touchmove',(e)=>{
    const touch = e.touches[0];
    if(!touch) return;
    const rect = container.getBoundingClientRect();
    let x = touch.clientX - rect.left;
    const half = parseFloat(bucket.dataset.half) || (bucket.clientWidth/2);
    x = Math.max(half, Math.min(rect.width - half, x));
    bucket.style.left = x + 'px';
  });

  startBtn.addEventListener('click', ()=>{
    if(running) stopGame();
    else startGame();
  });

  function startGame(){
    if(running) return;
    running = true;
    console.log('startGame: difficulty=', difficultySelect.value);
    score = 0;
    scoreEl.textContent = score;
    const d = difficultySelect.value;
    const s = settings[d] || settings.normal;
    timeLeft = s.time;
    timeEl.textContent = timeLeft;
    info.textContent = 'Game running...';
    startBtn.textContent = 'Stop';
    clearAllDrops();

    // spawn one immediately so you can see / debug
    spawnDrop(s);

    spawnTimer = setInterval(()=> spawnDrop(s), Math.max(100, s.spawnInterval));
    gameTimer = setInterval(()=> {
      timeLeft--;
      timeEl.textContent = timeLeft;
      if(timeLeft <= 0) endGame();
    }, 1000);
    animationLoop();
  }

  function stopGame(){
    running = false;
    startBtn.textContent = 'Start Game';
    info.textContent = 'Stopped';
    clearInterval(spawnTimer);
    clearInterval(gameTimer);
    spawnTimer = null;
    gameTimer = null;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    clearAllDrops();
  }

  function endGame(){
    stopGame();
    const d = difficultySelect.value;
    const s = settings[d] || settings.normal;
    if(score >= s.goal){
      info.textContent = `You Win! Score ${score} — ${s.goal} required.`;
    } else {
      info.textContent = `Time's up. Score ${score}. Try again.`;
    }
  }

  function spawnDrop(setting){
    try {
      if (!container.clientWidth) {
        console.warn('spawnDrop: container width is 0, will still create a drop');
      }
      const type = Math.random() < 0.78 ? 'good' : 'bad';
      const el = document.createElement('div');
      el.className = `drop ${type}`;
      el.dataset.type = type;

      // inline fallback visuals so drops are visible even if CSS isn't applied
      el.style.position = 'absolute';
      el.style.width = '28px';
      el.style.height = '36px';
      el.style.top = '-40px';
      el.style.pointerEvents = 'auto';
      el.style.cursor = 'pointer';
      el.style.zIndex = 20;

      if (type === 'good') {
        el.style.background = 'linear-gradient(180deg,#4fc3f7,#1aa7e0)';
        el.style.borderRadius = '9px 9px 9px 9px / 12px 12px 8px 8px';
      } else {
        el.style.background = 'linear-gradient(180deg,#b71c1c,#8b0000)';
        el.style.borderRadius = '9px 9px 9px 9px / 12px 12px 8px 8px';
      }

      // random horizontal position
      const left = Math.floor(Math.random() * Math.max(1, (container.clientWidth - 40))) + 20;
      el.style.left = left + 'px';

      // speed and current position
      const speedBase = (20 + Math.random()*20) * (setting.speed || 1);
      el._speed = speedBase / 60;
      el._y = -40;

      el.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        collectDrop(el, true);
      });

      container.appendChild(el);
      drops.add(el);
      console.log('spawnDrop created', { type, left, speed: el._speed });
    } catch (err) {
      console.error('spawnDrop error', err);
    }
  }

  function animationLoop(){
    if (!running) {
      animationId = null;
      return;
    }
    animationId = requestAnimationFrame(animationLoop);
    drops.forEach(el => {
      if(!document.body.contains(el)){
        drops.delete(el);
        return;
      }
      el._y += el._speed * 1.2;
      el.style.top = el._y + 'px';

      if(el._y > container.clientHeight + 40){
        drops.delete(el);
        el.remove();
        return;
      }

      const bucketRect = bucket.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      if(rectOverlap(bucketRect, elRect)){
        collectDrop(el, false);
      }
    });
  }

  function rectOverlap(a,b){
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  }

  function collectDrop(el, clicked=false){
    if(!el || !el.dataset) return;
    const type = el.dataset.type;
    el.classList.add('pop');
    setTimeout(()=> {
      el.remove();
      drops.delete(el);
    }, 240);

    if(type === 'good'){
      score += clicked ? 2 : 1;
    } else {
      score -= clicked ? 1 : 2;
    }
    score = Math.max(0, score);
    scoreEl.textContent = score;
  }

  function clearAllDrops(){
    drops.forEach(d => { d.remove(); });
    drops.clear();
  }

  document.addEventListener('keydown',(e)=>{
    if(!running) return;
    const step = 28;
    const rect = container.getBoundingClientRect();
    const bRect = bucket.getBoundingClientRect();
    const half = parseFloat(bucket.dataset.half) || (bucket.clientWidth/2);
    let curLeft = (bRect.left - rect.left) + half;
    if(e.key === 'ArrowLeft'){
      curLeft = Math.max(half, curLeft - step);
      bucket.style.left = curLeft + 'px';
    } else if(e.key === 'ArrowRight'){
      curLeft = Math.min(rect.width - half, curLeft + step);
      bucket.style.left = curLeft + 'px';
    }
  });
})();