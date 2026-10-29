'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');
const restartButton = document.getElementById('restart-button');
const panelStatus = document.querySelector('.panel-top > span:first-child');

const gridSize = 20;
const cell = canvas.width / gridSize;
const directions = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
let snake, direction, nextDirection, food, score, state, timer;
let best = 0;
try { best = Math.max(0, Number(localStorage.getItem('snake-best')) || 0); } catch (_) { /* Storage can be unavailable. */ }

function updateScores() {
  scoreEl.textContent = String(score).padStart(2, '0');
  bestEl.textContent = String(best).padStart(2, '0');
}

function placeFood() {
  const empty = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (!snake.some(part => part.x === x && part.y === y)) empty.push({ x, y });
    }
  }
  return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
}

function setStatus(text) {
  panelStatus.replaceChildren(Object.assign(document.createElement('span'), { className: 'status-dot' }), document.createTextNode(' ' + text));
}

function reset() {
  clearTimeout(timer);
  snake = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
  direction = directions.right;
  nextDirection = direction;
  score = 0;
  food = placeFood();
  state = 'ready';
  overlayTitle.textContent = 'Ready when you are.';
  overlayText.textContent = 'A good game starts with a single bite.';
  startButton.innerHTML = 'LET’S PLAY <span>↗</span>';
  overlay.hidden = false;
  pauseButton.disabled = true;
  pauseButton.innerHTML = 'PAUSE <span>Ⅱ</span>';
  setStatus('READY TO PLAY');
  updateScores();
  draw();
}

function draw() {
  ctx.fillStyle = '#1d3026';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#ffffff08';
  ctx.lineWidth = 1;
  for (let i = 0; i <= gridSize; i++) {
    ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(canvas.width, i * cell); ctx.stroke();
  }
  if (food) {
    ctx.fillStyle = '#f5a776';
    ctx.beginPath(); ctx.arc((food.x + .5) * cell, (food.y + .5) * cell, cell * .32, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c8f46d'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo((food.x + .5) * cell, (food.y + .22) * cell); ctx.lineTo((food.x + .64) * cell, (food.y + .1) * cell); ctx.stroke();
  }
  snake.forEach((part, index) => {
    ctx.fillStyle = index === 0 ? '#e0ff9d' : '#b8e765';
    ctx.fillRect(part.x * cell + 2, part.y * cell + 2, cell - 4, cell - 4);
    if (index === 0) {
      ctx.fillStyle = '#263c27';
      const cx = (part.x + .5) * cell, cy = (part.y + .5) * cell;
      const fx = direction.x * 5, fy = direction.y * 5;
      const px = -direction.y * 5, py = direction.x * 5;
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + fx + px * side, cy + fy + py * side, 2, 0, Math.PI * 2); ctx.fill(); }
    }
  });
}

function finish(won = false) {
  state = 'over';
  clearTimeout(timer);
  overlayTitle.textContent = won ? 'You filled the board!' : 'That was a good run.';
  overlayText.textContent = won ? 'Incredible work. You win!' : `You scored ${score}. Ready for another round?`;
  startButton.innerHTML = 'PLAY AGAIN <span>↗</span>';
  overlay.hidden = false;
  pauseButton.disabled = true;
  setStatus(won ? 'YOU WIN' : 'GAME OVER');
}

function tick() {
  if (state !== 'playing') return;
  direction = nextDirection;
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  const eating = food && head.x === food.x && head.y === food.y;
  // The tail moves away on a non-eating turn, so entering its old square is safe.
  const body = eating ? snake : snake.slice(0, -1);
  if (head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize || body.some(part => part.x === head.x && part.y === head.y)) {
    finish();
    return;
  }
  snake.unshift(head);
  if (eating) {
    score++;
    if (score > best) {
      best = score;
      try { localStorage.setItem('snake-best', String(best)); } catch (_) { /* Continue without persistence. */ }
    }
    updateScores();
    food = placeFood();
    if (!food) { draw(); finish(true); return; }
  } else snake.pop();
  draw();
  timer = setTimeout(tick, Math.max(65, 150 - score * 3));
}

function start() {
  if (state === 'over') reset();
  if (state !== 'ready' && state !== 'paused') return;
  state = 'playing';
  overlay.hidden = true;
  pauseButton.disabled = false;
  pauseButton.innerHTML = 'PAUSE <span>Ⅱ</span>';
  setStatus('IN PLAY');
  clearTimeout(timer);
  timer = setTimeout(tick, Math.max(65, 150 - score * 3));
}

function togglePause() {
  if (state === 'playing') {
    state = 'paused';
    clearTimeout(timer);
    overlayTitle.textContent = 'Taking a breather?';
    overlayText.textContent = 'Your game is right where you left it.';
    startButton.innerHTML = 'RESUME <span>↗</span>';
    overlay.hidden = false;
    pauseButton.innerHTML = 'RESUME <span>▶</span>';
    setStatus('PAUSED');
  } else if (state === 'paused') start();
}

function steer(name) {
  if (state !== 'playing') return;
  const next = directions[name];
  if (next && !(next.x === -direction.x && next.y === -direction.y)) nextDirection = next;
}

const keyMap = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' };
document.addEventListener('keydown', event => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (keyMap[key]) { event.preventDefault(); steer(keyMap[key]); }
  else if (event.code === 'Space' && (state === 'playing' || state === 'paused') && !event.repeat && event.target.tagName !== 'BUTTON') { event.preventDefault(); togglePause(); }
});
startButton.addEventListener('click', start);
pauseButton.addEventListener('click', togglePause);
restartButton.addEventListener('click', () => { reset(); start(); });
document.querySelectorAll('[data-direction]').forEach(button => button.addEventListener('click', () => steer(button.dataset.direction)));
// Do not let a game continue running unnoticed when the tab is hidden.
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') togglePause(); });
reset();
