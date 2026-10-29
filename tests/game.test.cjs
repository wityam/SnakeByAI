'use strict';

// Exercise game rules without a browser or external packages.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const elements = {};
function element(id) {
  return elements[id] ||= { hidden: false, disabled: false, textContent: '', innerHTML: '', tagName: 'DIV', addEventListener() {}, replaceChildren() {} };
}
const context2d = new Proxy({}, {
  get: (target, key) => target[key] || (() => {}),
  set: (target, key, value) => (target[key] = value, true)
});
element('game').width = 600;
element('game').height = 600;
element('game').getContext = () => context2d;
const document = {
  getElementById: element,
  querySelector: element,
  querySelectorAll: () => [],
  createElement: () => ({}),
  createTextNode: text => text,
  addEventListener() {}
};
const storage = {};
const sandbox = vm.createContext({
  document, Math,
  localStorage: { getItem: key => storage[key], setItem: (key, value) => { storage[key] = value; } },
  setTimeout: () => 1, clearTimeout() {}
});
const game = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
vm.runInContext(game + `
  if (state !== 'ready' || snake.length !== 3) throw Error('initialization');
  start();
  if (state !== 'playing') throw Error('start');
  food = { x: 10, y: 10 }; tick();
  if (score !== 1 || snake.length !== 4 || best !== 1) throw Error('eating');
  steer('left'); if (nextDirection !== directions.right) throw Error('reverse direction');
  togglePause(); if (state !== 'paused') throw Error('pause');
  togglePause(); if (state !== 'playing') throw Error('resume');
  snake = [{x: 19, y: 10}]; direction = nextDirection = directions.right; tick();
  if (state !== 'over') throw Error('wall collision');
  start(); if (state !== 'playing' || score !== 0) throw Error('play again');
  snake = [{x: 2, y: 2}, {x: 2, y: 3}, {x: 1, y: 3}, {x: 1, y: 2}, {x: 1, y: 1}];
  direction = nextDirection = directions.left; food = {x: 0, y: 0}; tick();
  if (state !== 'over') throw Error('self collision');
  reset(); start();
  snake = [{x: 18, y: 19}];
  for (let y = 0; y < gridSize; y++) for (let x = 0; x < gridSize; x++) {
    if (!(x === 18 && y === 19) && !(x === 19 && y === 19)) snake.push({x, y});
  }
  direction = nextDirection = directions.right; food = {x: 19, y: 19}; tick();
  if (state !== 'over' || food !== null || snake.length !== 400) throw Error('win');
`, sandbox);
assert.equal(storage['snake-best'], '1');
console.log('Game logic tests passed.');
