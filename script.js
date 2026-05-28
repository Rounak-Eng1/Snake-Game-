
const CELL = 25; 


const board      = document.querySelector('.board');
const scoreEl    = document.querySelector('.score');
const highScoreEl= document.querySelector('.high-score');
const timeEl     = document.querySelector('.time');
const startBtn   = document.getElementById('startBtn');
const pauseBtn   = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');

let snake, dir, nextDir, food, score, highScore, elapsed;
let gameLoop, timerLoop, running, paused;
function getCols() { return Math.floor(board.clientWidth  / CELL); }
function getRows() { return Math.floor(board.clientHeight / CELL); }

function makePiece(cls, x, y) {
  const el = document.createElement('div');
  el.className = cls;
  el.style.cssText = `
    position: absolute;
    width:  ${CELL}px;
    height: ${CELL}px;
    left:   ${x * CELL}px;
    top:    ${y * CELL}px;
    border-radius: 4px;
    transition: left 0s, top 0s;
  `;
  return el;
}

function clearBoard() {
  board.querySelectorAll('.snake-cell, .food-cell, .overlay').forEach(e => e.remove());
}

function renderSnake(dead = false) {
  board.querySelectorAll('.snake-cell').forEach(e => e.remove());
  snake.forEach(({ x, y }, i) => {
    const el = makePiece('snake-cell', x, y);
    if (i === 0) {
      // head
      el.style.background = dead ? '#e24b4a' : '#5DCAA5';
      el.style.zIndex = 2;
    } else {
      el.style.background = dead ? '#F09595' : '#1D9E75';
      el.style.opacity = Math.max(0.5, 1 - i * 0.04);
    }
    board.appendChild(el);
  });
}

function renderFood() {
  board.querySelectorAll('.food-cell').forEach(e => e.remove());
  const el = makePiece('food-cell', food.x, food.y);
  el.style.background = '#D85A30';
  el.style.borderRadius = '50%';
  el.style.transform = 'scale(0.75)';
  board.appendChild(el);
}

function showOverlay(text, sub = '') {
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.style.cssText = `
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 8px;
    background: rgba(29,28,28,0.82);
    border-radius: inherit;
    z-index: 10;
  `;
  ov.innerHTML = `
    <p style="font-size:22px;font-weight:600;color:#f0f0f0;">${text}</p>
    ${sub ? `<p style="font-size:13px;color:#888;">${sub}</p>` : ''}
  `;
  board.appendChild(ov);
}

// ─── Game logic ───────────────────────────────────────────────────────────────

function rnd(max) { return Math.floor(Math.random() * max); }

function spawnFood() {
  const cols = getCols(), rows = getRows();
  let f;
  do { f = { x: rnd(cols), y: rnd(rows) }; }
  while (snake.some(p => p.x === f.x && p.y === f.y));
  food = f;
}

function init() {
  clearBoard();
  const cols = getCols(), rows = getRows();
  const mx = Math.floor(cols / 2), my = Math.floor(rows / 2);
  snake   = [{ x: mx, y: my }, { x: mx - 1, y: my }, { x: mx - 2, y: my }];
  dir     = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score   = 0;
  elapsed = 0;
  updateScore();
  updateTime();
  spawnFood();
  renderSnake();
  renderFood();
}

function updateScore() {
  scoreEl.textContent     = String(score).padStart(2, '0');
  highScoreEl.textContent = String(highScore).padStart(2, '0');
}

function updateTime() {
  timeEl.textContent = String(elapsed).padStart(2, '0');
}

function speedInterval() {
  
  return Math.max(60, 160 - Math.floor(score / 30) * 5);
}

function step() {
  dir = nextDir;
  const cols = getCols(), rows = getRows();
  const head = {
    x: (snake[0].x + dir.x + cols) % cols,
    y: (snake[0].y + dir.y + rows) % rows,
  };


  if (snake.some(p => p.x === head.x && p.y === head.y)) {
    endGame(); return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('snakeHighScore', highScore);
    }
    updateScore();
    spawnFood();
    renderFood();

    clearInterval(gameLoop);
    gameLoop = setInterval(step, speedInterval());
  } else {
    snake.pop();
  }

  renderSnake();
}

function endGame() {
  clearInterval(gameLoop);
  clearInterval(timerLoop);
  running = false;
  renderSnake(true);
  showOverlay('Game Over', `Score: ${score} — Press Space to restart`);
  updateControlButtons();
}

function startGame() {
  if (gameLoop)  clearInterval(gameLoop);
  if (timerLoop) clearInterval(timerLoop);
  board.querySelectorAll('.overlay').forEach(e => e.remove());

  highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
  init();
  running = true;
  paused  = false;
  gameLoop  = setInterval(step, speedInterval());
  timerLoop = setInterval(() => { elapsed++; updateTime(); }, 1000);
  updateControlButtons();
}

function togglePause() {
  if (!running) return;
  if (paused) {
    gameLoop  = setInterval(step, speedInterval());
    timerLoop = setInterval(() => { elapsed++; updateTime(); }, 1000);
    paused = false;
    board.querySelectorAll('.overlay').forEach(e => e.remove());
  } else {
    clearInterval(gameLoop);
    clearInterval(timerLoop);
    paused = true;
    showOverlay('Paused', 'Press P to resume');
  }
  updateControlButtons();
}

const KEY_DIR = {
  ArrowUp:    { x:  0, y: -1 },
  ArrowDown:  { x:  0, y:  1 },
  ArrowLeft:  { x: -1, y:  0 },
  ArrowRight: { x:  1, y:  0 },
  w: { x:  0, y: -1 },
  s: { x:  0, y:  1 },
  a: { x: -1, y:  0 },
  d: { x:  1, y:  0 },
};

document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault();
    running ? (paused ? togglePause() : null) : startGame();
    if (!paused && !running) startGame();
    return;
  }
  if (e.key === 'p' || e.key === 'P') { togglePause(); return; }
  if (e.key === 'r' || e.key === 'R') { startGame();   return; }

  const d = KEY_DIR[e.key];
  if (!d || !running || paused) return;
  e.preventDefault();
  
  if (d.x !== -dir.x || d.y !== -dir.y) nextDir = d;
});

function updateControlButtons() {
  startBtn.textContent = running ? 'Playing' : 'Start';
  pauseBtn.textContent = paused ? 'Resume' : 'Pause';
  pauseBtn.disabled = !running;
  restartBtn.disabled = !running && !paused;
}

startBtn?.addEventListener('click', () => startGame());
pauseBtn?.addEventListener('click', () => togglePause());
restartBtn?.addEventListener('click', () => startGame());

board.style.position = 'relative';

highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
highScoreEl.textContent = String(highScore).padStart(2, '0');

updateControlButtons();
showOverlay('Snake', 'Press Space to start');