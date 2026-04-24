const canvas = document.querySelector("#game");
const displayCtx = canvas.getContext("2d", { alpha: false });
const heartsEl = document.querySelector("#hearts");
const fruitEl = document.querySelector("#fruit");
const fruitTotalEl = document.querySelector("#fruitTotal");
const scoreEl = document.querySelector("#score");
const weaponHudEl = document.querySelector("#weaponHud");
const startButton = document.querySelector("#startButton");
const audioButton = document.querySelector("#audioButton");
const touchControls = document.querySelector("#touchControls");
const difficultyPanel = document.querySelector("#difficultyPanel");
const difficultyButtons = Array.from(document.querySelectorAll("[data-difficulty]"));

const W = canvas.width;
const H = canvas.height;
const PIXEL_SCALE = 1;
const pixelCanvas = document.createElement("canvas");
pixelCanvas.width = W;
pixelCanvas.height = H;
const pixelCtx = pixelCanvas.getContext("2d", { alpha: true });
let ctx = pixelCtx;
displayCtx.imageSmoothingEnabled = false;
pixelCtx.imageSmoothingEnabled = false;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ASSET_ROOT = "./assets/generated/";

const assets = {
  bg: loadImage(`${ASSET_ROOT}forest-ruins-panorama.png`),
  heroRef: loadImage(`${ASSET_ROOT}hero-sprite-reference.png`),
  enemyRef: loadImage(`${ASSET_ROOT}enemy-pickup-reference.png`),
};

const keys = new Set();
const touch = new Set();
const controller = {
  left: false,
  right: false,
  jump: false,
  dash: false,
  weapon: false,
  prevStart: false,
  prevCycle: false,
  prevSword: false,
  prevGun: false,
};
const rand = mulberry32(0x4f58a21);

const GRAVITY = 2300;
const FLOOR_Y = 458;
const TILE = 48;
const DIFFICULTIES = {
  easy: {
    label: "Easy",
    enemyDensity: 0.68,
    speedScale: 0.78,
    patrolScale: 0.82,
    hoverScale: 0.72,
    hpDelta: -1,
    playerHealth: 4,
    hardExtras: false,
  },
  normal: {
    label: "Normal",
    enemyDensity: 1,
    speedScale: 1,
    patrolScale: 1,
    hoverScale: 1,
    hpDelta: 0,
    playerHealth: 3,
    hardExtras: false,
  },
  hard: {
    label: "Hard",
    enemyDensity: 1,
    speedScale: 1.24,
    patrolScale: 1.16,
    hoverScale: 1.28,
    hpDelta: 1,
    playerHealth: 3,
    hardExtras: true,
  },
};

const STAGES = [
  buildStageOne(),
  buildStageTwo(),
  buildStageThree(),
  buildStageFour(),
  buildStageFive(),
  buildStageSix(),
  buildStageSeven(),
  buildStageEight(),
  buildStageNine(),
];
let worldW = STAGES[0].worldW;
let platforms = [];
let fruit = [];
let weaponPickups = [];
let keyItems = [];
let locks = [];
let enemies = [];
let goal = { x: 0, y: FLOOR_Y - 96, w: 44, h: 96 };
const particles = [];
const explosions = [];
const projectiles = [];
const afterimages = [];
const scorePopups = [];
const clouds = Array.from({ length: 16 }, (_, i) => ({
  x: i * 360 + rand() * 220,
  y: 55 + rand() * 170,
  r: 18 + rand() * 28,
  speed: 5 + rand() * 18,
}));

const player = {
  x: 120,
  y: FLOOR_Y - 74,
  w: 50,
  h: 70,
  vx: 0,
  vy: 0,
  dir: 1,
  grounded: false,
  coyote: 0,
  jumpBuffer: 0,
  health: 3,
  invuln: 0,
  attack: 0,
  dashCooldown: 0,
  weapon: null,
  weapons: { sword: false, gun: false },
  weaponAttack: 0,
  weaponCooldown: 0,
  attackId: 0,
  ghostTimer: 0,
  landTime: 0,
  turnTime: 0,
  pickupTimer: 0,
  state: "idle",
  runTime: 0,
  idleTime: 0,
  win: false,
};

const camera = { x: 0, y: 0 };
const audio = createAudioEngine();
const game = { started: false, over: false, won: false, time: 0, last: 0, fruitCount: 0, score: 0, stageIndex: 0, stageBanner: 2, shake: 0, hitStop: 0, difficulty: "normal" };
loadStage(0, { keepHealth: false });
syncHud();
syncDifficulty();

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "Digit1", "Digit2"].includes(event.code)) event.preventDefault();
  const difficultyByKey = { KeyE: "easy", KeyN: "normal", KeyH: "hard" }[event.code];
  if (!game.started && difficultyByKey) setDifficulty(difficultyByKey);
  if (event.code === "Digit1") selectWeapon("sword");
  if (event.code === "Digit2") selectWeapon("gun");
  keys.add(event.code);
  if (!game.started && (event.code === "Space" || event.code === "Enter")) startGame();
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

startButton.addEventListener("click", startGame);
audioButton.addEventListener("click", () => {
  if (!audio.ready) audio.start();
  else audio.toggle();
});
difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setDifficulty(button.dataset.difficulty);
  });
});

touchControls.querySelectorAll("[data-action]").forEach((button) => {
  const action = button.dataset.action;
  const add = (event) => {
    event.preventDefault();
    if (action === "cycle") {
      cycleWeapon();
      return;
    }
    touch.add(action);
    if (!game.started) startGame();
  };
  const remove = (event) => {
    event.preventDefault();
    touch.delete(action);
  };
  button.addEventListener("pointerdown", add);
  button.addEventListener("pointerup", remove);
  button.addEventListener("pointercancel", remove);
  button.addEventListener("pointerleave", remove);
});

requestAnimationFrame(loop);

function loadImage(src) {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  return img;
}

function pollController() {
  const pads = typeof navigator.getGamepads === "function" ? navigator.getGamepads() : [];
  const pad = Array.from(pads).find((item) => item && item.connected);
  if (!pad) {
    Object.assign(controller, { left: false, right: false, jump: false, dash: false, weapon: false });
    controller.prevStart = false;
    controller.prevCycle = false;
    controller.prevSword = false;
    controller.prevGun = false;
    return;
  }

  const button = (index) => Boolean(pad.buttons[index]?.pressed);
  const axisX = Math.abs(pad.axes[0] || 0) > 0.34 ? pad.axes[0] || 0 : 0;
  controller.left = axisX < -0.34 || button(14);
  controller.right = axisX > 0.34 || button(15);
  controller.jump = button(0) || button(12);
  controller.dash = button(1) || button(7);
  controller.weapon = button(2);

  const startNow = button(9) || button(0);
  const cycleNow = button(3);
  const swordNow = button(4);
  const gunNow = button(5);
  if (startNow && !controller.prevStart && (!game.started || game.over || game.won)) startGame();
  if (cycleNow && !controller.prevCycle) cycleWeapon();
  if (swordNow && !controller.prevSword) selectWeapon("sword");
  if (gunNow && !controller.prevGun) selectWeapon("gun");
  controller.prevStart = startNow;
  controller.prevCycle = cycleNow;
  controller.prevSword = swordNow;
  controller.prevGun = gunNow;
}

function selectWeapon(type) {
  if (!player.weapons[type]) return;
  player.weapon = type;
  syncHud();
}

function cycleWeapon() {
  const owned = ["sword", "gun"].filter((type) => player.weapons[type]);
  if (!owned.length) return;
  const next = owned[(owned.indexOf(player.weapon) + 1) % owned.length];
  selectWeapon(next);
}

function setDifficulty(mode) {
  if (!DIFFICULTIES[mode]) return;
  const nextStageIndex = game.won ? 0 : game.stageIndex;
  game.difficulty = mode;
  if (game.won) game.stageIndex = 0;
  syncDifficulty();
  if (!game.started || game.over || game.won) {
    loadStage(nextStageIndex, { keepHealth: false });
    startButton.textContent = "Start";
    showStartControls(true);
  }
}

function syncDifficulty() {
  difficultyButtons.forEach((button) => {
    button.classList.toggle("selected", button.dataset.difficulty === game.difficulty);
  });
}

function showStartControls(show) {
  startButton.classList.toggle("hidden", !show);
  difficultyPanel.classList.toggle("hidden", !show);
}

function currentDifficulty() {
  return DIFFICULTIES[game.difficulty] || DIFFICULTIES.normal;
}

function startGame() {
  if (game.started && !game.over && !game.won) return;
  if (game.over || game.won) resetGame();
  game.started = true;
  showStartControls(false);
  audio.start();
}

function resetGame() {
  if (game.won) game.stageIndex = 0;
  loadStage(game.stageIndex, { keepHealth: false });
}

function enemiesForDifficulty(baseEnemies, stageWidth) {
  const settings = currentDifficulty();
  let selected = baseEnemies;
  if (settings.enemyDensity < 1) {
    selected = baseEnemies.filter((enemy, index) => index % 3 !== 1 || index === baseEnemies.length - 1);
  }
  if (settings.hardExtras) {
    const extras = baseEnemies
      .filter((enemy, index) => index % 4 === 2)
      .map((enemy, index) => hardEnemyClone(enemy, index, stageWidth));
    selected = selected.concat(extras);
  }
  return selected.map((enemy, index) => tuneEnemyForDifficulty(enemy, index, stageWidth));
}

function hardEnemyClone(enemy, index, stageWidth) {
  const offset = (index % 2 === 0 ? 1 : -1) * (150 + (index % 3) * 54);
  const startX = clamp(enemy.startX + offset, Math.max(0, enemy.min + 12), Math.min(stageWidth - enemy.w, enemy.max - 12));
  return {
    ...enemy,
    x: startX,
    startX,
    dir: -enemy.dir,
    t: enemy.t + 1.4 + index * 0.27,
  };
}

function tuneEnemyForDifficulty(enemy, index, stageWidth) {
  const settings = currentDifficulty();
  const center = (enemy.min + enemy.max) / 2;
  const range = Math.max(80, (enemy.max - enemy.min) * settings.patrolScale);
  const min = clamp(center - range / 2, 0, Math.max(0, stageWidth - enemy.w - 20));
  const max = clamp(center + range / 2, min + 60, stageWidth - enemy.w);
  return {
    ...enemy,
    min,
    max,
    speed: enemy.speed * settings.speedScale * (1 + (index % 3) * 0.025),
    hp: Math.max(1, enemy.hp + settings.hpDelta),
    hover: 28 * settings.hoverScale,
  };
}

function loadStage(index, { keepHealth }) {
  const stage = STAGES[index];
  const previousWeapons = { ...player.weapons };
  const previousWeapon = player.weapon;
  worldW = stage.worldW;
  platforms = stage.platforms.map((p) => ({ ...p }));
  fruit = stage.fruit.map((item) => ({ ...item, got: false }));
  weaponPickups = stage.weapons.map((item) => ({ ...item, got: false }));
  keyItems = stage.keys.map((item) => ({ ...item, got: false }));
  locks = stage.locks.map((item) => ({ ...item, open: false }));
  enemies = enemiesForDifficulty(stage.enemies, stage.worldW).map((enemy) => ({
    ...enemy,
    dead: false,
    hit: 0,
    stun: 0,
    hurtDir: 0,
    lastHitId: 0,
    hp: enemy.hp,
    x: enemy.startX,
    y: enemy.startY,
  }));
  goal = { ...stage.goal };
  Object.assign(player, {
    x: stage.startX,
    y: stage.startY,
    vx: 0,
    vy: 0,
    dir: 1,
    grounded: false,
    coyote: 0,
    jumpBuffer: 0,
    health: keepHealth ? Math.max(1, player.health) : currentDifficulty().playerHealth,
    invuln: 0,
    attack: 0,
    dashCooldown: 0,
    weapon: keepHealth && previousWeapon ? previousWeapon : null,
    weapons: keepHealth ? previousWeapons : { sword: false, gun: false },
    weaponAttack: 0,
    weaponCooldown: 0,
    attackId: 0,
    ghostTimer: 0,
    landTime: 0,
    turnTime: 0,
    pickupTimer: 0,
    state: "idle",
    runTime: 0,
    idleTime: 0,
    win: false,
  });
  camera.x = 0;
  camera.y = 0;
  game.over = false;
  game.won = false;
  game.fruitCount = 0;
  if (!keepHealth) game.score = 0;
  game.stageBanner = 2.2;
  fruitTotalEl.textContent = String(fruit.length);
  particles.length = 0;
  explosions.length = 0;
  projectiles.length = 0;
  afterimages.length = 0;
  scorePopups.length = 0;
  game.shake = 0;
  game.hitStop = 0;
  syncHud();
}

function loop(now) {
  pollController();
  const dt = Math.min(0.033, (now - (game.last || now)) / 1000);
  game.last = now;
  if (game.started && !game.over && !game.won) update(dt);
  draw();
  requestAnimationFrame(loop);
}

function update(dt) {
  const frozen = game.hitStop > 0;
  game.hitStop = Math.max(0, game.hitStop - dt);
  const simDt = frozen ? 0 : dt;
  game.time += frozen ? dt * 0.12 : dt;
  game.stageBanner = Math.max(0, game.stageBanner - dt);
  game.shake = Math.max(0, game.shake - dt * 24);
  audio.update(dt, player.x / worldW, player.grounded ? 1 : 0.65);
  if (simDt > 0) {
    updatePlayer(simDt);
    updateProjectiles(simDt);
    updateEnemies(simDt);
    collectFruit();
    collectWeaponPickups();
    collectKeyItems();
  }
  updateParticles(dt);
  camera.x = clamp(lerp(camera.x, player.x - 310, 1 - Math.pow(0.0007, dt)), 0, worldW - W);
  camera.y = lerp(camera.y, Math.max(-40, player.y - 330), 1 - Math.pow(0.002, dt));
  if (overlap(player, goal) && locks.every((lock) => lock.open)) win();
}

function updatePlayer(dt) {
  const left = keys.has("ArrowLeft") || keys.has("KeyA") || touch.has("left") || controller.left;
  const right = keys.has("ArrowRight") || keys.has("KeyD") || touch.has("right") || controller.right;
  const jump = keys.has("Space") || keys.has("ArrowUp") || keys.has("KeyW") || touch.has("jump") || controller.jump;
  const dash = keys.has("ShiftLeft") || keys.has("ShiftRight") || touch.has("dash") || controller.dash;
  const weapon = keys.has("KeyJ") || keys.has("KeyK") || touch.has("attack") || controller.weapon;

  const accel = player.grounded ? 3400 : 2350;
  const maxSpeed = player.attack > 0 ? 520 : 330;
  const drag = player.grounded ? 0.82 : 0.95;
  let axis = 0;
  if (left) axis -= 1;
  if (right) axis += 1;
  if (axis) {
    player.vx += axis * accel * dt;
    if (player.dir !== axis) player.turnTime = 0.12;
    player.dir = axis;
  } else {
    player.vx *= Math.pow(drag, dt * 60);
  }
  player.vx = clamp(player.vx, -maxSpeed, maxSpeed);

  if (jump) player.jumpBuffer = 0.12;
  else player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
  player.coyote = player.grounded ? 0.1 : Math.max(0, player.coyote - dt);
  if (player.jumpBuffer > 0 && player.coyote > 0) {
    player.vy = -820;
    player.grounded = false;
    player.coyote = 0;
    player.jumpBuffer = 0;
    burst(player.x + player.w * 0.5, player.y + player.h, "#ffe2a4", 10, 260);
    audio.sfx("jump");
  }
  if (!jump && player.vy < -200) player.vy += 1450 * dt;

  if (dash && player.dashCooldown <= 0) {
    player.attack = 0.2;
    player.attackId += 1;
    player.dashCooldown = 0.5;
    player.vx = player.dir * 640;
    game.shake = Math.max(game.shake, 9);
    audio.sfx("dash");
    burst(player.x + player.w * 0.5, player.y + 35, "#ffb32c", 20, 440);
  }
  if (weapon) triggerWeapon();
  player.attack = Math.max(0, player.attack - dt);
  player.dashCooldown = Math.max(0, player.dashCooldown - dt);
  player.weaponAttack = Math.max(0, player.weaponAttack - dt);
  player.weaponCooldown = Math.max(0, player.weaponCooldown - dt);
  player.invuln = Math.max(0, player.invuln - dt);
  player.turnTime = Math.max(0, player.turnTime - dt);
  player.landTime = Math.max(0, player.landTime - dt);
  player.pickupTimer = Math.max(0, player.pickupTimer - dt);

  player.vy += GRAVITY * dt;
  const wasGrounded = player.grounded;
  moveAndCollide(player, dt);
  if (!wasGrounded && player.grounded) {
    player.landTime = 0.14;
    burst(player.x + player.w * 0.5, player.y + player.h - 4, "#d4ff8a", 8, 180);
  }

  if (Math.abs(player.vx) > 45 && player.grounded) player.runTime += dt * (0.8 + Math.abs(player.vx) / 160);
  else player.idleTime += dt;

  if (!player.grounded) player.state = player.vy < 0 ? "jump" : "fall";
  else if (player.attack > 0) player.state = "dash";
  else if (Math.abs(player.vx) > 45) player.state = "run";
  else player.state = "idle";

  player.ghostTimer = Math.max(0, player.ghostTimer - dt);
  if (!reducedMotion && player.ghostTimer <= 0 && (Math.abs(player.vx) > 210 || player.attack > 0 || player.weaponAttack > 0)) {
    afterimages.push({
      x: player.x,
      y: player.y,
      dir: player.dir,
      weapon: player.weapon,
      life: 0.16,
      maxLife: 0.16,
    });
    player.ghostTimer = 0.035;
  }

  if (player.y > H + 360) hurtPlayer(2);
}

function moveAndCollide(body, dt) {
  body.x += body.vx * dt;
  body.x = clamp(body.x, 0, worldW - body.w);
  const solids = platforms.concat(locks.filter((lock) => !lock.open));
  for (const p of solids) {
    if (!overlap(body, p)) continue;
    if (body.vx > 0) body.x = p.x - body.w;
    if (body.vx < 0) body.x = p.x + p.w;
    body.vx = 0;
  }

  body.y += body.vy * dt;
  body.grounded = false;
  for (const p of solids) {
    if (!overlap(body, p)) continue;
    if (body.vy > 0) {
      body.y = p.y - body.h;
      body.vy = 0;
      body.grounded = true;
    } else if (body.vy < 0) {
      body.y = p.y + p.h;
      body.vy = 0;
    }
  }
}

function updateEnemies(dt) {
  for (const enemy of enemies) {
    if (enemy.dead) continue;
    enemy.t += dt;
    enemy.hit = Math.max(0, enemy.hit - dt);
    enemy.stun = Math.max(0, enemy.stun - dt);
    if (enemy.stun > 0) continue;
    if (enemy.kind === "drone") {
      enemy.x += enemy.dir * enemy.speed * dt;
      enemy.y = enemy.startY + Math.sin(enemy.t * 2.4) * enemy.hover;
    } else {
      enemy.x += enemy.dir * enemy.speed * dt;
    }
    if (enemy.x < enemy.min || enemy.x > enemy.max) enemy.dir *= -1;
    const bodyHit = overlap(player, enemy);
    const attackHit = player.attack > 0 && overlap(playerAttackBox(), enemy);
    const swordHit = player.weapon === "sword" && player.weaponAttack > 0 && overlap(playerSwordBox(), enemy);
    if (!bodyHit && !attackHit && !swordHit) continue;
    const stomp = player.vy > 120 && player.y + player.h - enemy.y < 22;
    if (stomp || attackHit || swordHit) {
      if ((attackHit || swordHit) && enemy.lastHitId === player.attackId) continue;
      enemy.lastHitId = player.attackId;
      player.vy = -520;
      hitEnemy(enemy, swordHit ? 2 : attackHit ? 2 : 1, player.dir, swordHit ? "sword" : attackHit ? "dash" : "stomp");
    } else {
      hurtPlayer(1);
    }
  }
}

function triggerWeapon() {
  if (!player.weapon || !player.weapons[player.weapon] || player.weaponCooldown > 0) return;
  player.attackId += 1;
  player.weaponAttack = player.weapon === "sword" ? 0.24 : 0.12;
  player.weaponCooldown = player.weapon === "sword" ? 0.34 : 0.42;
  if (player.weapon === "sword") {
    game.shake = Math.max(game.shake, reducedMotion ? 0 : 5);
    player.vx += player.dir * 120;
    audio.sfx("sword");
    burst(player.x + player.w / 2 + player.dir * 48, player.y + 30, "#fff1cf", 18, 290);
    return;
  }
  const muzzleX = player.x + player.w / 2 + player.dir * 43;
  const muzzleY = player.y + 23;
  projectiles.push({
    x: muzzleX,
    y: muzzleY,
    w: 16,
    h: 8,
    vx: player.dir * 760,
    life: 1.4,
    dir: player.dir,
  });
  game.shake = Math.max(game.shake, reducedMotion ? 0 : 4);
  burst(muzzleX, muzzleY, "#8dd9ff", 14, 310);
  audio.sfx("gun");
}

function collectWeaponPickups() {
  for (const item of weaponPickups) {
    if (item.got || !overlap(player, item)) continue;
    item.got = true;
    player.weapons[item.type] = true;
    player.weapon = item.type;
    player.pickupTimer = 0.45;
    player.attackId += 1;
    burst(item.x + item.w / 2, item.y + item.h / 2, item.type === "sword" ? "#fff1cf" : "#8dd9ff", 18, 320);
    audio.sfx("fruit");
    syncHud();
  }
}

function collectKeyItems() {
  for (const item of keyItems) {
    if (item.got || !overlap(player, item)) continue;
    item.got = true;
    locks.forEach((lock) => {
      lock.open = true;
    });
    game.shake = Math.max(game.shake, reducedMotion ? 0 : 5);
    burst(item.x + item.w / 2, item.y + item.h / 2, "#ffe2a4", 26, 360);
    audio.sfx("win");
  }
}

function updateProjectiles(dt) {
  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    const shot = projectiles[i];
    shot.life -= dt;
    shot.x += shot.vx * dt;
    if (shot.life <= 0 || shot.x < camera.x - 120 || shot.x > camera.x + W + 120) {
      projectiles.splice(i, 1);
      continue;
    }
    for (const enemy of enemies) {
      if (enemy.dead || !overlap(shot, enemy)) continue;
      hitEnemy(enemy, 1, shot.dir, "gun");
      projectiles.splice(i, 1);
      break;
    }
  }
}

function hitEnemy(enemy, damage, dir, source) {
  enemy.hp -= damage;
  enemy.hit = 0.18;
  enemy.stun = source === "gun" ? 0.05 : 0.1;
  enemy.hurtDir = dir;
  enemy.x = clamp(enemy.x + dir * (source === "gun" ? 10 : 22), enemy.min, enemy.max);
  const x = enemy.x + enemy.w / 2;
  const y = enemy.y + enemy.h / 2;
  const color = source === "gun" ? "#8dd9ff" : source === "sword" ? "#fff1cf" : "#ffe2a4";
  impactBurst(x + dir * enemy.w * 0.32, y, color, dir, source);
  game.hitStop = Math.max(game.hitStop, reducedMotion ? 0.015 : source === "gun" ? 0.028 : 0.06);
  game.shake = Math.max(game.shake, reducedMotion ? 0 : source === "gun" ? 7 : 10);
  audio.sfx(enemy.hp <= 0 ? "enemy" : "hit");
  if (enemy.hp <= 0) defeatEnemy(enemy, dir, source);
}

function defeatEnemy(enemy, dir = player.dir, source = "dash") {
  enemy.dead = true;
  const score = enemyScore(enemy, source);
  game.score += score;
  scorePopups.push({
    x: enemy.x + enemy.w / 2 + dir * 36,
    y: enemy.y - 20,
    points: score,
    source,
    life: reducedMotion ? 1.0 : 1.25,
    maxLife: reducedMotion ? 1.0 : 1.25,
  });
  game.shake = Math.max(game.shake, reducedMotion ? 0 : 12);
  game.hitStop = Math.max(game.hitStop, reducedMotion ? 0.02 : 0.075);
  spawnExplosion(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.color, enemy.kind, dir);
  burst(enemy.x + enemy.w / 2 + dir * 10, enemy.y + enemy.h / 2, source === "gun" ? "#8dd9ff" : enemy.color, 36, 520);
  audio.sfx("enemy");
  syncHud();
}

function enemyScore(enemy, source) {
  const base = { beetle: 100, slime: 150, drone: 180, pod: 130 }[enemy.kind] || 100;
  const bonus = source === "sword" ? 25 : source === "gun" ? 15 : source === "stomp" ? 40 : 20;
  return base + bonus;
}

function hurtPlayer(amount) {
  if (player.invuln > 0) return;
  player.health -= amount;
  player.invuln = 1.1;
  player.vx = -player.dir * 360;
  player.vy = -450;
  game.shake = Math.max(game.shake, reducedMotion ? 0 : 11);
  burst(player.x + player.w * 0.5, player.y + 35, "#fff4df", 14, 260);
  audio.sfx("hurt");
  syncHud();
  if (player.health <= 0) {
    game.over = true;
    startButton.textContent = "Retry";
    showStartControls(true);
  }
}

function collectFruit() {
  for (const item of fruit) {
    if (item.got) continue;
    const hit = circleRect(item.x, item.y, item.r + 8, player);
    if (!hit) continue;
    item.got = true;
    game.fruitCount += 1;
    burst(item.x, item.y, item.color, 10, 260);
    audio.sfx("fruit");
    syncHud();
  }
}

function win() {
  if (game.stageIndex < STAGES.length - 1) {
    audio.sfx("win");
    burst(goal.x + goal.w / 2, goal.y + 16, "#ffe2a4", 36, 420);
    game.stageIndex += 1;
    loadStage(game.stageIndex, { keepHealth: true });
    return;
  }
  game.won = true;
  player.win = true;
  startButton.textContent = "Again";
  showStartControls(true);
  audio.sfx("win");
  burst(goal.x + goal.w / 2, goal.y + 16, "#ffe2a4", 36, 420);
}

function syncHud() {
  heartsEl.textContent = "♥".repeat(Math.max(0, player.health));
  fruitEl.textContent = String(game.fruitCount);
  scoreEl.textContent = formatScore(game.score);
  weaponHudEl.querySelectorAll("[data-weapon]").forEach((slot) => {
    const type = slot.dataset.weapon;
    slot.classList.toggle("owned", player.weapons[type]);
    slot.classList.toggle("selected", player.weapon === type && player.weapons[type]);
  });
}

function formatScore(score) {
  return String(score).padStart(5, "0");
}

function draw() {
  ctx = displayCtx;
  displayCtx.save();
  displayCtx.setTransform(1, 0, 0, 1, 0, 0);
  displayCtx.imageSmoothingEnabled = true;
  displayCtx.clearRect(0, 0, W, H);
  drawBackground();

  ctx = pixelCtx;
  pixelCtx.save();
  pixelCtx.setTransform(1 / PIXEL_SCALE, 0, 0, 1 / PIXEL_SCALE, 0, 0);
  pixelCtx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  const shakeX = game.shake > 0 && !reducedMotion ? (rand() - 0.5) * game.shake : 0;
  const shakeY = game.shake > 0 && !reducedMotion ? (rand() - 0.5) * game.shake : 0;
  ctx.translate(shakeX - camera.x, shakeY - camera.y);
  drawWorld();
  drawFruit();
  drawWeaponPickups();
  drawKeyItems();
  drawLocks();
  drawEnemies();
  drawProjectiles();
  drawGoal();
  drawAfterimages();
  drawPlayer();
  drawExplosions();
  drawParticles();
  drawScorePopups();
  ctx.restore();
  pixelCtx.restore();

  displayCtx.imageSmoothingEnabled = false;
  displayCtx.drawImage(pixelCanvas, 0, 0, W, H);
  ctx = displayCtx;
  drawSceneGrade();
  drawForeground();
  drawStageBanner();
  if (!game.started || game.over || game.won) drawOverlay();
  displayCtx.restore();
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#7b655f");
  sky.addColorStop(0.42, "#c88945");
  sky.addColorStop(1, "#283b31");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  if (assets.bg.complete && assets.bg.naturalWidth) {
    const img = assets.bg;
    const scale = H / img.naturalHeight;
    const drawW = img.naturalWidth * scale;
    const layerX = -(camera.x * (reducedMotion ? 0.03 : 0.16)) % drawW;
    ctx.globalAlpha = 0.84;
    for (let x = layerX - drawW; x < W + drawW; x += drawW) {
      ctx.drawImage(img, x, 0, drawW, H);
    }
    ctx.globalAlpha = 1;
  }

  drawDistantHills(0.22, "#314b37", 172, 0.45);
  drawDistantHills(0.36, "#203929", 234, 0.52);
  ctx.fillStyle = "rgba(255, 240, 196, 0.15)";
  for (const c of clouds) {
    const x = (c.x - camera.x * (reducedMotion ? 0.01 : 0.08) + game.time * c.speed) % (W + 180) - 90;
    softBlob(x, c.y, c.r * 2.7, c.r, "rgba(255,244,223,0.18)");
  }
}

function drawPixelClouds() {
  const offset = Math.floor(camera.x * 0.04);
  for (let i = 0; i < 8; i += 1) {
    const x = ((i * 190 - offset) % (W + 240)) - 120;
    const y = 54 + (i % 3) * 29;
    px(x, y + 12, 84, 15, "rgba(238, 216, 167, 0.38)");
    px(x + 21, y, 45, 15, "rgba(238, 216, 167, 0.42)");
    px(x + 63, y + 18, 54, 12, "rgba(238, 216, 167, 0.32)");
  }
}

function drawPixelHillLayer(factor, base, light, dark) {
  const offset = Math.floor(camera.x * factor);
  for (let x = -180; x < W + 180; x += 96) {
    const y = base + ((x + offset) % 5) * 4;
    px(x - (offset % 96), y, 120, H - y, dark);
    px(x + 24 - (offset % 96), y - 24, 72, 24, light);
    px(x + 48 - (offset % 96), y - 42, 45, 18, light);
  }
}

function drawPixelTrees(factor, base, trunk, leaf) {
  const offset = Math.floor(camera.x * factor);
  for (let x = -120; x < W + 180; x += 138) {
    const sx = x - (offset % 138);
    px(sx + 38, base + 28, 18, 190, trunk);
    px(sx + 20, base + 4, 54, 24, leaf);
    px(sx + 2, base + 28, 88, 24, leaf);
    px(sx + 28, base - 18, 48, 22, "#687844");
    px(sx + 54, base + 48, 42, 18, "#334b31");
  }
}

function drawDistantHills(factor, color, base, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, H);
  const offset = -camera.x * factor;
  for (let x = -120; x <= W + 120; x += 90) {
    const y = base + Math.sin((x + offset) * 0.006) * 34 + Math.sin((x + offset) * 0.014) * 18;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawWorld() {
  for (const p of platforms) {
    drawPlatform(p);
  }
}

function drawPlatform(p) {
  px(p.x, p.y, p.w, p.h, "#4a3228");
  px(p.x, p.y, p.w, 15, "#7db64b");
  px(p.x, p.y + 15, p.w, 8, "#38552d");
  for (let x = p.x; x < p.x + p.w; x += 48) {
    px(x + 3, p.y + 25, 40, 34, "#604434");
    px(x + 8, p.y + 30, 29, 4, "#76523d");
    px(x + 8, p.y + 38, 4, 16, "#35251f");
    px(x + 28, p.y + 38, 4, 16, "#35251f");
    px(x + 14, p.y - 8, 8, 17, "#a7d75d");
    px(x + 32, p.y - 6, 7, 15, "#8fc34f");
  }
}

function drawFruit() {
  for (const item of fruit) {
    if (item.got) continue;
    const bob = Math.sin(game.time * 4 + item.x * 0.05) * 5;
    ctx.save();
    ctx.translate(item.x, item.y + bob);
    px(-6, -18, 12, 6, "#fff0a0");
    px(-12, -12, 24, 6, item.color);
    px(-18, -6, 36, 12, item.color);
    px(-12, 6, 24, 6, "#d6872d");
    px(-6, 12, 12, 6, "#8f5a26");
    px(-4, -8, 8, 8, "#fff4df");
    ctx.restore();
  }
}

function drawWeaponPickups() {
  for (const item of weaponPickups) {
    if (item.got) continue;
    const bob = Math.sin(game.time * 3.4 + item.x * 0.04) * 5;
    ctx.save();
    ctx.translate(item.x + item.w / 2, item.y + item.h / 2 + bob);
    px(-28, -28, 56, 56, "rgba(255, 232, 122, 0.18)");
    if (item.type === "sword") drawPickupSword("#e8f6ff");
    else drawPickupGun("#8dd9ff");
    ctx.restore();
  }
}

function drawKeyItems() {
  for (const item of keyItems) {
    if (item.got) continue;
    const bob = Math.sin(game.time * 3.8 + item.x * 0.05) * 5;
    ctx.save();
    ctx.translate(item.x + item.w / 2, item.y + item.h / 2 + bob);
    px(-25, -25, 50, 50, "rgba(255, 226, 164, 0.18)");
    px(-12, -8, 21, 16, "#ffe2a4");
    px(-8, -4, 10, 8, "#7b4b1f");
    px(6, -3, 25, 7, "#ffb32c");
    px(22, 4, 6, 12, "#ffb32c");
    px(12, 4, 5, 8, "#ffb32c");
    px(-14, -10, 25, 4, "#fff4df");
    ctx.restore();
  }
}

function drawLocks() {
  for (const lock of locks) {
    ctx.save();
    ctx.globalAlpha = lock.open ? 0.34 : 1;
    ctx.translate(lock.x, lock.y);
    px(0, 0, lock.w, lock.h, lock.open ? "rgba(255,226,164,0.2)" : "#2d2118");
    px(6, 8, lock.w - 12, lock.h - 16, lock.open ? "rgba(125,182,75,0.22)" : "#6a4528");
    px(10, 16, lock.w - 20, 10, "#ffe2a4");
    px(lock.w / 2 - 8, 38, 16, 18, lock.open ? "#8fc34f" : "#ffb32c");
    px(lock.w / 2 - 4, 54, 8, 20, "#241814");
    for (let y = 84; y < lock.h - 12; y += 18) {
      px(9, y, lock.w - 18, 5, "rgba(255,244,223,0.2)");
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawPickupSword(color) {
  ctx.save();
  px(-4, -31, 8, 39, color);
  px(4, -25, 5, 27, "#9fb8c9");
  px(-15, 4, 30, 8, "#d78728");
  px(-4, 12, 8, 18, "#5b3426");
  px(-2, -37, 4, 6, "#fff4df");
  ctx.restore();
}

function drawPickupGun(color) {
  ctx.save();
  px(-24, -10, 34, 16, "#2e2830");
  px(10, -7, 29, 10, "#1f1b20");
  px(-14, -5, 14, 7, color);
  px(-8, 6, 12, 22, "#71422b");
  px(34, -4, 5, 5, "#fff4df");
  ctx.restore();
}

function drawEnemies() {
  for (const enemy of enemies) {
    if (enemy.dead) continue;
    if (enemy.kind === "beetle") drawBeetle(enemy);
    else if (enemy.kind === "slime") drawSlime(enemy);
    else if (enemy.kind === "drone") drawDrone(enemy);
    else drawPod(enemy);
  }
}

function drawProjectiles() {
  for (const shot of projectiles) {
    ctx.save();
    ctx.translate(shot.x + shot.w / 2, shot.y + shot.h / 2);
    ctx.scale(shot.dir, 1);
    px(-18, -10, 34, 20, "rgba(141,217,255,0.22)");
    for (let i = 0; i < 4; i += 1) {
      px(-36 - i * 10, -2 + (i % 2) * 3, 8, 4, "rgba(255,244,223,0.36)");
    }
    px(-9, -4, 18, 8, "#8dd9ff");
    px(-2, -2, 10, 4, "#fff4df");
    ctx.restore();
  }
}

function drawAfterimages() {
  for (const ghost of afterimages) {
    const alpha = Math.max(0, ghost.life / ghost.maxLife) * 0.34;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(ghost.x + player.w / 2, ghost.y + player.h - 4);
    ctx.scale(ghost.dir, 1);
    ctx.fillStyle = "#fff1cf";
    ctx.fillRect(-25, -58, 50, 54);
    ctx.fillStyle = "#ffb32c";
    ctx.fillRect(-18, -56, 36, 50);
    ctx.fillStyle = "#fff1cf";
    ctx.fillRect(20, -86, 38, 18);
    ctx.fillRect(-82, -50, 55, 22);
    if (ghost.weapon === "sword") ctx.fillRect(34, -45, 76, 7);
    if (ghost.weapon === "gun") ctx.fillRect(25, -43, 50, 13);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawBeetle(e) {
  const flash = e.hit > 0 ? "#fff4df" : e.color;
  ctx.save();
  ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
  ctx.translate(enemyHurtOffset(e), e.hit > 0 ? -2 : 0);
  ctx.scale(e.dir, 1);
  const step = Math.sin(e.t * 12);
  px(-31, 13, 62, 7, "rgba(20, 12, 9, 0.32)");
  px(-32, -17, 64, 35, "#0d1015");
  px(-27, -13, 54, 28, "#252a31");
  px(-24, -27, 48, 7, "#10131a");
  px(-18, -31, 10, 8, "#4b5660");
  px(8, -31, 10, 8, "#4b5660");
  px(-22, -24, 44, 22, flash);
  px(-18, -18, 14, 20, "#7b3430");
  px(2, -18, 14, 20, "#7b3430");
  px(20, -8, 8, 8, "#ff6046");
  px(22, -6, 3, 3, "#fff1cf");
  for (let i = -1; i <= 1; i += 1) {
    px(-18 + i * 16, 12 + step * 2 * i, 8, 12, "#17100f");
  }
  px(-19, -10, 8, 8, "#9aa4a8");
  px(-17, -8, 4, 4, "#ff6046");
  ctx.restore();
}

function drawSlime(e) {
  const wobble = Math.sin(e.t * 7) * 4;
  const flash = e.hit > 0 ? "#fff4df" : "#6f6fac";
  ctx.save();
  ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
  ctx.translate(enemyHurtOffset(e), e.hit > 0 ? 4 : 0);
  const squash = e.hit > 0 ? 1.18 : 1;
  ctx.scale(squash, e.hit > 0 ? 0.78 : 1);
  px(-31, 16, 62, 7, "rgba(20, 12, 9, 0.32)");
  px(-32, -18 + wobble * 0.25, 64, 38 - wobble * 0.25, "#12151f");
  px(-28, -14 + wobble * 0.25, 56, 34 - wobble * 0.25, "#343a52");
  px(-18, -28 + wobble * 0.2, 36, 18, flash);
  px(-24, -8, 8, 11, "#67708c");
  px(17, -8, 8, 11, "#67708c");
  px(-12, -12, 8, 8, "#ffc15b");
  px(8, -12, 8, 8, "#ffc15b");
  px(-10, -10, 4, 4, "#ff4d3d");
  px(10, -10, 4, 4, "#ff4d3d");
  px(-8, 4, 22, 4, "#1b1624");
  ctx.restore();
}

function drawDrone(e) {
  ctx.save();
  ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
  ctx.translate(enemyHurtOffset(e), e.hit > 0 ? -4 : 0);
  ctx.scale(e.dir, 1);
  const wing = Math.sin(e.t * 18) * 0.7;
  const body = e.hit > 0 ? "#fff4df" : "#b6bd68";
  px(-39, -18 + wing * 3, 28, 8, "rgba(141,217,255,0.55)");
  px(11, -18 - wing * 3, 28, 8, "rgba(141,217,255,0.55)");
  px(-23, -22, 46, 44, "#11151c");
  px(-19, -18, 38, 36, "#505c52");
  px(-13, -10, 26, 20, body);
  px(-5, -26, 10, 9, "#ff6046");
  px(-25, -4, 8, 14, "#2f3841");
  px(17, -4, 8, 14, "#2f3841");
  px(-9, -5, 5, 5, "#ffde87");
  px(6, -5, 5, 5, "#ffde87");
  px(-7, -3, 2, 2, "#ff4d3d");
  px(8, -3, 2, 2, "#ff4d3d");
  ctx.restore();
}

function drawPod(e) {
  ctx.save();
  ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
  ctx.translate(enemyHurtOffset(e), 0);
  const spin = e.t * 4.8 * (e.dir || 1);
  ctx.rotate(spin);
  const core = e.hit > 0 ? "#fff4df" : "#d07738";
  px(-30, 18, 60, 7, "rgba(20, 12, 9, 0.32)");
  px(-32, -8, 64, 16, "#11151c");
  px(-8, -32, 16, 64, "#11151c");
  px(-28, -6, 56, 12, "#4d555d");
  px(-6, -28, 12, 56, "#4d555d");
  if (Math.sin(spin * 2) > 0) {
    px(-22, -22, 12, 12, "#2b3038");
    px(10, -22, 12, 12, "#2b3038");
    px(-22, 10, 12, 12, "#2b3038");
    px(10, 10, 12, 12, "#2b3038");
  }
  px(-20, -20, 40, 40, "#171b22");
  px(-18, -18, 36, 36, "#915035");
  px(-9, -9, 18, 18, core);
  px(4, -4, 7, 7, "#ff6046");
  ctx.restore();
}

function enemyHurtOffset(enemy) {
  if (enemy.hit <= 0) return 0;
  return Math.sin(enemy.hit * 95) * 5 + enemy.hurtDir * 5;
}

function drawGoal() {
  ctx.save();
  ctx.translate(goal.x, goal.y);
  px(4, 0, 8, 96, "#2c2118");
  px(12, 8, 44, 10, "#ffe2a4");
  px(12, 18, 58, 12, "#ff8d23");
  px(12, 30, 38, 10, "#ffe2a4");
  px(56, 20 + Math.sin(game.time * 5) * 3, 10, 9, "#fff4df");
  ctx.restore();
}

function drawPlayer() {
  const blink = player.invuln > 0 && Math.floor(game.time * 18) % 2 === 0;
  if (blink) return;
  drawPixelFox();
  return;
  const phase = player.state === "run" ? player.runTime * 12 : player.idleTime * 2;
  const run = player.state === "run" ? Math.sin(phase) : 0;
  const run2 = Math.sin(phase + Math.PI);
  const squash = player.grounded ? 1 + Math.abs(run) * 0.045 : 0.94;
  const stretch = player.grounded ? 1 - Math.abs(run) * 0.035 : 1.08;
  const attack = player.attack > 0 ? 1 : 0;
  const idleBob = player.state === "idle" ? Math.sin(player.idleTime * 3) * 2 : 0;

  ctx.save();
  ctx.translate(player.x + player.w / 2, player.y + player.h - 4 + idleBob);
  ctx.scale(player.dir * (squash + attack * 0.08), stretch);

  const tailLift = player.state === "run" ? Math.sin(phase - 0.8) * 12 : Math.sin(player.idleTime * 2) * 5;
  ctx.save();
  ctx.translate(-22, -39 + tailLift * 0.15);
  ctx.rotate(0.3 - tailLift * 0.016 + attack * 0.34);
  roundedRect(-62, -15, 64, 30, 8, "#b75f24");
  roundedRect(-83, -12, 30, 24, 6, "#fff0cb");
  ctx.fillStyle = "rgba(79, 38, 22, 0.26)";
  ctx.beginPath();
  ctx.ellipse(-42, -1, 16, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawLeg(-13, run, attack);
  drawLeg(12, run2, attack);
  roundedRect(-25, -58, 50, 54, 11, "#ec841d");
  roundedRect(-18, -56, 36, 50, 10, "#f3a32c");
  roundedRect(-13, -39, 26, 36, 7, "#fff0cb");

  drawArm(-24, -33, run2 * 0.5 - attack * 1.2);
  drawArm(23, -33, run * 0.5 + attack * 1.4);
  drawWeapon();

  ctx.save();
  ctx.translate(-2 + attack * 3, -75);
  ctx.rotate(player.state === "fall" ? 0.08 : player.state === "jump" ? -0.08 : run * 0.02);
  roundedRect(-30, -28, 60, 48, 11, "#f39122");

  drawEar(-17, -23, -0.24 + run * 0.05);
  drawEar(20, -24, 0.28 + run2 * 0.05);

  ctx.save();
  ctx.translate(26, -1);
  ctx.rotate(0.03);
  ctx.fillStyle = "#fff1cf";
  ctx.beginPath();
  ctx.moveTo(-14, -16);
  ctx.quadraticCurveTo(18, -17, 32, 0);
  ctx.quadraticCurveTo(16, 16, -15, 14);
  ctx.quadraticCurveTo(-6, 1, -14, -16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#2b1714";
  ctx.beginPath();
  ctx.ellipse(31, 0, 8, 6, 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawCheekTuft(-24, 4, -1);
  drawCheekTuft(21, 7, 1);

  ctx.fillStyle = "#261612";
  ctx.beginPath();
  ctx.ellipse(10, -13, 3, 7, 0.12, 0, Math.PI * 2);
  ctx.ellipse(24, -10, 4, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#261612";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(19, 4);
  ctx.quadraticCurveTo(29, 8, 40, 2);
  ctx.stroke();
  ctx.restore();

  if (attack) {
    ctx.strokeStyle = "rgba(255,226,164,0.85)";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(31, -39, 49, -0.9, 0.36);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPixelFox() {
  const phase = player.state === "run" ? player.runTime * 14 : player.idleTime * 2;
  const run = player.state === "run" ? Math.sin(phase) : 0;
  const run2 = player.state === "run" ? Math.sin(phase + Math.PI) : 0;
  const legA = run * 5.5;
  const legB = run2 * 5.5;
  const bob = player.grounded && player.state === "run" ? Math.abs(Math.sin(phase)) * 2.2 : player.state === "idle" ? Math.sin(player.idleTime * 4) * 2 : 0;
  const attackLean = player.attack > 0 ? 7 : 0;
  const landSquash = player.landTime > 0 ? Math.sin((player.landTime / 0.14) * Math.PI) : 0;
  const turnLean = player.turnTime > 0 ? player.turnTime / 0.12 : 0;
  const x = player.x + player.w / 2;
  const y = player.y + player.h - 2 + bob;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(player.dir * (1 + landSquash * 0.08), 1 - landSquash * 0.06);
  ctx.rotate((player.grounded ? -0.04 : 0.08) * turnLean * -player.dir);

  px(-32, 0, 64, 8, "rgba(20, 12, 9, 0.34)");

  // Tail behind body, large white tip for fox read.
  px(-73 - attackLean, -51, 51, 20, "#3a2118");
  px(-70 - attackLean, -48, 48, 16, "#7b3a1d");
  px(-82 - attackLean, -51, 20, 22, "#f3e2b5");
  px(-54 - attackLean, -39, 34, 13, "#b85b22");
  px(-44 - attackLean, -51, 10, 8, "#f89a2f");

  // Legs with 8-frame-style offset.
  px(-18 + legA, -20, 12, 24, "#6b331f");
  px(-22 + legA, 0, 18, 9, "#a55b2a");
  px(6 + legB, -20, 12, 24, "#6b331f");
  px(2 + legB, 0, 18, 9, "#a55b2a");

  // Body and belly.
  px(-27, -61, 54, 48, "#3a2118");
  px(-24, -58, 48, 44, "#b85820");
  px(-18, -66, 36, 12, "#f68f28");
  px(-19, -54, 38, 38, "#f68f28");
  px(-10, -42, 20, 29, "#f4d8a5");
  px(-23, -27, 8, 12, "#7b3a1d");
  px(15, -28, 8, 13, "#7b3a1d");

  // Arms.
  px(-30, -47 + legB * 0.4, 12, 30, "#b85820");
  px(-32, -19 + legB * 0.4, 12, 8, "#241814");
  px(19, -45 + legA * 0.3, 13, 28, "#b85820");
  px(25, -19 + legA * 0.3, 11, 8, "#241814");

  drawPixelWeapon();

  // Head, ears, muzzle.
  px(-30, -101, 60, 49, "#3a2118");
  px(-27, -98, 54, 43, "#e8761f");
  px(-20, -108, 14, 16, "#813b21");
  px(-16, -102, 8, 10, "#f4a13b");
  px(10, -111, 15, 19, "#813b21");
  px(14, -104, 8, 11, "#f4a13b");
  px(18, -82, 40, 20, "#f3e2b5");
  px(48, -77, 12, 9, "#241814");
  px(4, -84, 8, 12, "#241814");
  px(27, -83, 5, 5, "#241814");
  px(18, -62, 25, 4, "#241814");
  px(-29, -68, 12, 8, "#f3e2b5");
  px(18, -65, 17, 8, "#f3e2b5");

  if (player.attack > 0) {
    px(42, -53, 28, 7, "#fff0a0");
    px(66, -48, 18, 6, "#ffb32c");
  }

  if (player.pickupTimer > 0) {
    const t = player.pickupTimer / 0.45;
    ctx.globalAlpha = t;
    px(-42, -112, 84, 7, "#fff1cf");
    px(-48, -104, 96, 4, "#ffb32c");
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawPixelWeapon() {
  if (!player.weapon || !player.weapons[player.weapon]) return;
  const active = player.weaponAttack > 0;
  if (player.weapon === "sword") {
    const lift = active ? -16 : 0;
    px(30, -45 + lift, 12, 7, "#5b3426");
    px(39, -48 + lift, 10, 10, "#d78728");
    px(48, -49 + lift, active ? 98 : 48, 7, "#dff7ff");
    px(53, -47 + lift, active ? 90 : 39, 2, "#ffffff");
    if (active) {
      px(70, -69, 82, 6, "#fff0a0");
      px(96, -58, 70, 5, "#ffb32c");
      px(124, -48, 38, 4, "#fff4df");
    }
    return;
  }
  const recoil = active ? -7 : 0;
  px(29 + recoil, -48, 34, 15, "#2e2830");
  px(58 + recoil, -45, 28, 8, "#1f1b20");
  px(37 + recoil, -35, 12, 18, "#71422b");
  px(30 + recoil, -43, 13, 7, "#8dd9ff");
  if (active) {
    px(85, -49, 22, 5, "#fff4df");
    px(101, -53, 18, 13, "#8dd9ff");
    px(119, -48, 12, 5, "#fff0a0");
  }
}

function drawLeg(x, phase, attack) {
  ctx.save();
  ctx.translate(x + attack * 8, -9);
  ctx.rotate(phase * 0.55);
  roundedRect(-7, 0, 14, 24, 5, "#7b422b");
  roundedRect(-12, 18, 24, 15, 6, "#a15e39");
  ctx.restore();
}

function drawArm(x, y, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  roundedRect(-5, -3, 10, 35, 5, "#c96c25");
  roundedRect(-7, 24, 14, 13, 5, "#2b1a17");
  ctx.restore();
}

function drawWeapon() {
  if (!player.weapon || !player.weapons[player.weapon]) return;
  const active = player.weaponAttack > 0;
  const recoil = active ? 5 : 0;
  ctx.save();
  ctx.translate(26, -35);
  if (player.weapon === "sword") {
    const swing = active ? Math.sin((player.weaponAttack / 0.24) * Math.PI) : 0;
    ctx.rotate(-0.35 - swing * 1.15);
    roundedRect(-3, -3, 16, 7, 3, "#5b3426");
    roundedRect(9, -4, 9, 9, 2, "#ffb32c");
    ctx.fillStyle = "#dff7ff";
    ctx.beginPath();
    ctx.moveTo(17, -5);
    ctx.lineTo(72, -3 - swing * 7);
    ctx.lineTo(78, 0);
    ctx.lineTo(72, 5 + swing * 7);
    ctx.lineTo(17, 5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(23, -2);
    ctx.lineTo(65, -1 - swing * 4);
    ctx.stroke();
    if (active) {
      ctx.strokeStyle = "rgba(255,241,207,0.72)";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(32, 4, 62, -0.75, 0.35);
      ctx.stroke();
    }
  } else {
    ctx.translate(-recoil, 0);
    roundedRect(-1, -8, 38, 18, 6, "#3a3138");
    roundedRect(22, -5, 23, 10, 4, "#2b252b");
    roundedRect(8, 7, 13, 20, 4, "#71422b");
    roundedRect(3, -4, 14, 8, 3, "#8dd9ff");
    if (active) {
      ctx.fillStyle = "#8dd9ff";
      ctx.beginPath();
      ctx.moveTo(45, 0);
      ctx.lineTo(68, -8);
      ctx.lineTo(60, 0);
      ctx.lineTo(68, 8);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawEar(x, y, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = "#9a4f2c";
  ctx.beginPath();
  ctx.moveTo(-10, 5);
  ctx.quadraticCurveTo(0, -34, 14, 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f1ad55";
  ctx.beginPath();
  ctx.moveTo(-5, 2);
  ctx.quadraticCurveTo(1, -20, 8, 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCheekTuft(x, y, dir) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  ctx.fillStyle = "#fff0cb";
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(15, -5);
  ctx.lineTo(4, 1);
  ctx.lineTo(17, 7);
  ctx.lineTo(0, 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawExplosions() {
  for (const explosion of explosions) {
    const t = 1 - explosion.life / explosion.maxLife;
    const alpha = Math.max(0, 1 - t);
    ctx.save();
    ctx.translate(explosion.x, explosion.y);
    ctx.globalAlpha = alpha;
    const ring = 12 + t * 62;
    px(-ring, -4, ring * 2, 8, "#fff1cf");
    px(-4, -ring, 8, ring * 2, "#fff1cf");
    px(-ring * 0.7, -ring * 0.7, 12, 12, "#ffb32c");
    px(ring * 0.7 - 12, -ring * 0.7, 12, 12, "#ffb32c");
    px(-ring * 0.7, ring * 0.7 - 12, 12, 12, "#ffb32c");
    px(ring * 0.7 - 12, ring * 0.7 - 12, 12, 12, "#ffb32c");

    for (const chunk of explosion.chunks) {
      const x = chunk.vx * t;
      const y = chunk.vy * t + t * t * 45;
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = chunk.color;
      px(-chunk.size / 2, -chunk.size / 2, chunk.size, chunk.size, chunk.color);
      ctx.restore();
    }

    for (let i = 0; i < 5; i += 1) {
      const a = explosion.seed + i * 1.26;
      const r = 16 + t * (30 + i * 8);
      px(Math.cos(a) * r - 12, Math.sin(a) * r * 0.55 - 8, 24 + t * 14, 14 + t * 8, `rgba(70, 54, 42, ${0.28 * alpha})`);
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    const size = Math.max(3, Math.round(p.size));
    ctx.fillRect(Math.round(p.x - size / 2), Math.round(p.y - size / 2), size, size);
  }
  ctx.globalAlpha = 1;
}

function updateParticles(dt) {
  for (let i = afterimages.length - 1; i >= 0; i -= 1) {
    afterimages[i].life -= dt;
    if (afterimages[i].life <= 0) afterimages.splice(i, 1);
  }
  for (let i = explosions.length - 1; i >= 0; i -= 1) {
    explosions[i].life -= dt;
    if (explosions[i].life <= 0) explosions.splice(i, 1);
  }
  for (let i = scorePopups.length - 1; i >= 0; i -= 1) {
    const popup = scorePopups[i];
    popup.life -= dt;
    popup.y -= (reducedMotion ? 18 : 44) * dt;
    if (popup.life <= 0) scorePopups.splice(i, 1);
  }
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 640 * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawScorePopups() {
  if (!scorePopups.length) return;
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const popup of scorePopups) {
    const t = Math.max(0, popup.life / popup.maxLife);
    const appear = Math.min(1, (1 - t) * 7);
    const alpha = Math.min(1, t * 1.65);
    const scale = 0.84 + appear * 0.16 + Math.sin((1 - t) * Math.PI) * 0.06;
    const x = popup.x;
    const y = popup.y - (1 - t) * (reducedMotion ? 12 : 34);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;
    ctx.font = "900 30px Inter, system-ui, sans-serif";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.82)";
    ctx.strokeText(formatScore(popup.points), 0, 0);
    ctx.fillStyle = "#fff1cf";
    ctx.fillText(formatScore(popup.points), 0, 0);
    ctx.restore();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function spawnExplosion(x, y, color, kind = "beetle", dir = 1) {
  const count = reducedMotion ? 8 : kind === "drone" ? 26 : 22;
  const chunks = [];
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2 + rand() * 0.35;
    const s = (kind === "pod" ? 58 : 42) + rand() * (kind === "slime" ? 92 : 74);
    chunks.push({
      vx: Math.cos(a) * s + dir * 26,
      vy: Math.sin(a) * s - 34,
      size: 4 + rand() * (kind === "slime" ? 16 : 12),
      spin: (rand() - 0.5) * 8,
      color: i % 3 === 0 ? "#fff1cf" : i % 2 === 0 ? "#ffb32c" : color,
    });
  }
  explosions.push({
    x,
    y,
    color,
    chunks,
    seed: rand() * Math.PI * 2,
    life: reducedMotion ? 0.32 : 0.58,
    maxLife: reducedMotion ? 0.32 : 0.58,
  });
}

function impactBurst(x, y, color, dir, source) {
  const count = reducedMotion ? 5 : source === "gun" ? 16 : 24;
  for (let i = 0; i < count; i += 1) {
    const spread = source === "gun" ? 0.65 : 1.1;
    const a = Math.PI + (rand() - 0.5) * spread;
    const s = (source === "gun" ? 300 : 430) * (0.35 + rand() * 0.75);
    particles.push({
      x,
      y,
      vx: Math.cos(a) * s * dir,
      vy: Math.sin(a) * s - 80,
      size: 3 + rand() * 5,
      life: 0.18 + rand() * 0.22,
      maxLife: 0.4,
      color: i % 4 === 0 ? "#fff4df" : color,
    });
  }
}

function burst(x, y, color, count, speed) {
  if (reducedMotion) count = Math.ceil(count * 0.35);
  for (let i = 0; i < count; i += 1) {
    const a = rand() * Math.PI * 2;
    const s = speed * (0.28 + rand() * 0.72);
    particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 120,
      size: 2 + rand() * 4,
      life: 0.35 + rand() * 0.35,
      maxLife: 0.7,
      color,
    });
  }
}

function drawForeground() {
  ctx.save();
  px(0, 0, W, 6, "rgba(15,10,8,0.2)");
  px(0, H - 9, W, 9, "rgba(15,10,8,0.26)");
  px(0, 0, 9, H, "rgba(15,10,8,0.18)");
  px(W - 9, 0, 9, H, "rgba(15,10,8,0.18)");
  ctx.restore();
}

function drawSceneGrade() {
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgba(53, 74, 42, 0.12)";
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "source-over";
  const vignette = ctx.createRadialGradient(W * 0.52, H * 0.42, W * 0.2, W * 0.52, H * 0.42, W * 0.72);
  vignette.addColorStop(0, "rgba(255, 240, 196, 0.06)");
  vignette.addColorStop(0.72, "rgba(30, 38, 26, 0.06)");
  vignette.addColorStop(1, "rgba(10, 8, 6, 0.22)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawStageBanner() {
  if (game.stageBanner <= 0 || game.over || game.won) return;
  const alpha = Math.min(1, game.stageBanner / 0.55);
  const stage = STAGES[game.stageIndex];
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff4df";
  ctx.font = "900 28px Inter, system-ui, sans-serif";
  ctx.fillText(stage.label, W / 2, 104);
  ctx.font = "800 16px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#ffe2a4";
  ctx.fillText(stage.name, W / 2, 132);
  ctx.restore();
}

function drawOverlay() {
  ctx.save();
  ctx.fillStyle = "rgba(16, 13, 11, 0.48)";
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "left";
  ctx.fillStyle = "#fff4df";
  ctx.font = "900 56px Inter, system-ui, sans-serif";
  const stage = STAGES[game.stageIndex];
  ctx.fillText(game.won ? "ALL CLEAR" : game.over ? "MISS" : `${stage.label} ${stage.name}`.toUpperCase(), 58, 130);
  ctx.font = "800 22px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#ffe2a4";
  const line = game.won
    ? `${game.fruitCount}/${fruit.length} fruit`
    : game.over
      ? "try again"
      : `session ${stage.label} / ${STAGES[STAGES.length - 1].label}`;
  ctx.fillText(line, 62, 172);
  ctx.restore();
}

function roundedRect(x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.fill();
}

function px(x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function softBlob(x, y, w, h, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
  ctx.ellipse(x - w * 0.22, y + h * 0.1, w * 0.32, h * 0.36, 0, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.2, y - h * 0.04, w * 0.35, h * 0.34, 0, 0, Math.PI * 2);
  ctx.fill();
}

function createAudioEngine() {
  let ac;
  let master;
  let musicGain;
  let muted = false;
  let timer = 0;
  let step = 0;
  const scale = [0, 2, 3, 5, 7, 10];
  const roots = [41, 41, 36, 39, 43, 39, 36, 38];

  return {
    ready: false,
    start() {
      if (!ac) {
        ac = new AudioContext();
        master = ac.createGain();
        musicGain = ac.createGain();
        master.gain.value = 0.52;
        musicGain.gain.value = 0.24;
        musicGain.connect(master);
        master.connect(ac.destination);
        this.ready = true;
      }
      ac.resume();
      muted = false;
      master.gain.setTargetAtTime(0.52, ac.currentTime, 0.05);
      audioButton.textContent = "♪";
    },
    toggle() {
      if (!ac) return this.start();
      muted = !muted;
      master.gain.setTargetAtTime(muted ? 0 : 0.52, ac.currentTime, 0.05);
      audioButton.textContent = muted ? "×" : "♪";
    },
    update(dt, progress, air) {
      if (!ac || muted) return;
      timer -= dt;
      if (timer > 0) return;
      const bpm = 96;
      const beat = 60 / bpm / 2;
      timer += beat;
      const root = roots[Math.floor(step / 8) % roots.length];
      const degree = scale[(step * 2 + Math.floor(progress * 7)) % scale.length];
      const note = root + degree + (step % 16 === 14 ? 12 : 0);
      const t = ac.currentTime + 0.015;
      if (step % 2 === 0) tone(midi(root - 12), t, 0.42, "sine", 0.14 * air, musicGain, 0.02, 0.4);
      if (step % 4 === 1) tone(midi(root + 7), t, 0.55, "triangle", 0.07, musicGain, 0.12, 0.5);
      pluck(midi(note + 24), t, 0.18, 0.08 + progress * 0.04);
      if (step % 8 === 0) noise(t, 0.04, 0.2);
      if (step % 8 === 4) noise(t, 0.025, 0.14);
      step += 1;
    },
    sfx(type) {
      if (!ac || muted) return;
      const t = ac.currentTime;
      if (type === "jump") tone(440, t, 0.12, "square", 0.12, master, 0.005, 0.08);
      if (type === "dash") sweep(210, 680, t, 0.12, 0.16);
      if (type === "sword") sweep(860, 310, t, 0.1, 0.1);
      if (type === "gun") {
        tone(1200, t, 0.05, "square", 0.1, master, 0.004, 0.04);
        sweep(640, 160, t, 0.08, 0.08);
      }
      if (type === "fruit") pluck(880, t, 0.16, 0.16);
      if (type === "enemy") sweep(360, 90, t, 0.18, 0.16);
      if (type === "hit") {
        tone(880, t, 0.04, "square", 0.09, master, 0.003, 0.04);
        noise(t, 0.025, 0.1);
      }
      if (type === "hurt") sweep(180, 65, t, 0.24, 0.22);
      if (type === "win") {
        [523, 659, 784, 1046].forEach((f, i) => tone(f, t + i * 0.08, 0.32, "triangle", 0.12, master, 0.01, 0.2));
      }
    },
  };

  function pluck(freq, t, dur, gain) {
    const osc = ac.createOscillator();
    const filter = ac.createBiquadFilter();
    const g = ac.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2800, t);
    filter.frequency.exponentialRampToValueAtTime(700, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(filter);
    filter.connect(g);
    g.connect(musicGain);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  function tone(freq, t, dur, type, gain, out, attack, release) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + release);
    osc.connect(g);
    g.connect(out);
    osc.start(t);
    osc.stop(t + dur + release + 0.02);
  }

  function sweep(from, to, t, dur, gain) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noise(t, dur, gain) {
    const buffer = ac.createBuffer(1, ac.sampleRate * dur, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = rand() * 2 - 1;
    const src = ac.createBufferSource();
    const filter = ac.createBiquadFilter();
    const g = ac.createGain();
    src.buffer = buffer;
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(musicGain);
    src.start(t);
  }
}

function midi(n) {
  return 440 * Math.pow(2, (n - 69) / 12);
}

function rect(x, y, w, h) {
  return { x, y, w, h };
}

function buildStageOne() {
  return {
    label: "1-1",
    name: "Forest Run",
    worldW: 9000,
    startX: 120,
    startY: FLOOR_Y - 74,
    platforms: [
      rect(0, FLOOR_Y, 940, 90),
      rect(1020, FLOOR_Y, 620, 90),
      rect(1740, FLOOR_Y, 900, 90),
      rect(2760, FLOOR_Y, 740, 90),
      rect(3620, FLOOR_Y, 780, 90),
      rect(4520, FLOOR_Y, 800, 90),
      rect(5440, FLOOR_Y, 720, 90),
      rect(6280, FLOOR_Y, 840, 90),
      rect(7240, FLOOR_Y, 680, 90),
      rect(8040, FLOOR_Y, 960, 90),
      rect(450, 360, 210, 28),
      rect(1160, 346, 250, 28),
      rect(1920, 346, 260, 28),
      rect(2260, 338, 190, 28),
      rect(3100, 352, 260, 28),
      rect(3880, 342, 290, 28),
      rect(4780, 342, 250, 28),
      rect(5660, 342, 260, 28),
      rect(6540, 346, 280, 28),
      rect(7420, 338, 260, 28),
      rect(8260, 342, 270, 28),
    ],
    fruit: [
      gem(525, 315), gem(610, 315), gem(1190, 285), gem(1260, 285),
      gem(1370, 285), gem(1988, 292), gem(2355, 235), gem(3185, 306),
      gem(3965, 274), gem(4070, 274), gem(4880, 298), gem(5030, 298),
      gem(5720, 272), gem(6650, 284), gem(6760, 284), gem(7510, 248),
      gem(8340, 298), gem(8460, 298), gem(8820, 398),
    ],
    weapons: [
      weaponItem("sword", 285, FLOOR_Y - 58),
      weaponItem("gun", 1480, FLOOR_Y - 58),
    ],
    keys: [
      keyItem(4320, FLOOR_Y - 58),
    ],
    locks: [
      lockGate(8760),
    ],
    enemies: [
      beetle(835, FLOOR_Y - 38, 760, 910),
      beetle(1110, FLOOR_Y - 38, 1040, 1420),
      slime(1320, FLOOR_Y - 42, 1080, 1460),
      drone(2030, 270, 1860, 2220),
      drone(2320, 306, 2180, 2560),
      beetle(2535, FLOOR_Y - 38, 1830, 2620),
      pod(3340, FLOOR_Y - 36, 2790, 3470),
      slime(3710, FLOOR_Y - 42, 3630, 4300),
      drone(4010, 250, 3760, 4210),
      slime(4960, FLOOR_Y - 42, 4550, 5260),
      pod(5320, FLOOR_Y - 36, 4860, 5360),
      beetle(5890, FLOOR_Y - 38, 5480, 6100),
      drone(6650, 258, 6360, 6900),
      beetle(7040, FLOOR_Y - 38, 6660, 7120),
      pod(7690, FLOOR_Y - 36, 7280, 7880),
      slime(8520, FLOOR_Y - 42, 8100, 8900),
    ],
    goal: { x: 8880, y: FLOOR_Y - 96, w: 44, h: 96 },
  };
}

function buildStageTwo() {
  return {
    label: "1-2",
    name: "Canopy Ruins",
    worldW: 6500,
    startX: 110,
    startY: FLOOR_Y - 74,
    platforms: [
      rect(0, FLOOR_Y, 820, 90),
      rect(900, FLOOR_Y, 600, 90),
      rect(1600, FLOOR_Y, 660, 90),
      rect(2380, FLOOR_Y, 600, 90),
      rect(3100, FLOOR_Y, 760, 90),
      rect(3980, FLOOR_Y, 640, 90),
      rect(4740, FLOOR_Y, 620, 90),
      rect(5480, FLOOR_Y, 1020, 90),
      rect(620, 346, 230, 28),
      rect(1120, 342, 210, 28),
      rect(1740, 342, 270, 28),
      rect(2480, 342, 230, 28),
      rect(3300, 338, 280, 28),
      rect(4130, 342, 250, 28),
      rect(4930, 338, 280, 28),
      rect(5720, 346, 270, 28),
    ],
    fruit: [
      gem(670, 282), gem(760, 282), gem(1160, 246), gem(1840, 252),
      gem(1960, 252), gem(2550, 300), gem(3380, 240), gem(3500, 240),
      gem(4210, 280), gem(5030, 232), gem(5140, 232), gem(5820, 286),
      gem(6120, 398),
    ],
    weapons: [
      weaponItem("sword", 560, FLOOR_Y - 58),
      weaponItem("gun", 1740, FLOOR_Y - 58),
    ],
    keys: [
      keyItem(3680, FLOOR_Y - 58),
    ],
    locks: [
      lockGate(6240),
    ],
    enemies: [
      drone(760, 260, 620, 880),
      pod(1230, FLOOR_Y - 36, 930, 1400),
      drone(1480, 278, 1180, 1540),
      beetle(1960, FLOOR_Y - 38, 1650, 2140),
      beetle(2240, FLOOR_Y - 38, 1960, 2260),
      slime(2630, FLOOR_Y - 42, 2400, 2820),
      drone(3440, 220, 3180, 3640),
      slime(3740, FLOOR_Y - 42, 3180, 3840),
      pod(4300, FLOOR_Y - 36, 4010, 4500),
      drone(4740, 258, 4480, 5060),
      beetle(5120, FLOOR_Y - 38, 4780, 5240),
      slime(6040, FLOOR_Y - 42, 5520, 6420),
    ],
    goal: { x: 6360, y: FLOOR_Y - 96, w: 44, h: 96 },
  };
}

function buildStageThree() {
  return {
    label: "1-3",
    name: "Moonlit Grove",
    worldW: 7600,
    startX: 110,
    startY: FLOOR_Y - 74,
    platforms: [
      rect(0, FLOOR_Y, 700, 90),
      rect(800, FLOOR_Y, 590, 90),
      rect(1510, FLOOR_Y, 590, 90),
      rect(2220, FLOOR_Y, 720, 90),
      rect(3060, FLOOR_Y, 540, 90),
      rect(3720, FLOOR_Y, 840, 90),
      rect(4680, FLOOR_Y, 640, 90),
      rect(5440, FLOOR_Y, 660, 90),
      rect(6220, FLOOR_Y, 1380, 90),
      rect(520, 348, 230, 28),
      rect(980, 338, 220, 28),
      rect(1680, 342, 260, 28),
      rect(2360, 338, 230, 28),
      rect(3180, 350, 230, 28),
      rect(3920, 338, 310, 28),
      rect(4850, 342, 230, 28),
      rect(5620, 338, 260, 28),
      rect(6500, 342, 280, 28),
      rect(7000, 338, 220, 28),
    ],
    fruit: [
      gem(600, 302), gem(1040, 246), gem(1130, 246), gem(1760, 268),
      gem(2460, 215), gem(3260, 304), gem(4010, 246), gem(4140, 246),
      gem(4920, 296), gem(5700, 240), gem(5800, 240), gem(6600, 272),
      gem(7110, 222), gem(7440, 398),
    ],
    weapons: [
      weaponItem("sword", 470, FLOOR_Y - 58),
      weaponItem("gun", 2260, FLOOR_Y - 58),
    ],
    keys: [
      keyItem(4320, FLOOR_Y - 58),
    ],
    locks: [
      lockGate(7350),
    ],
    enemies: [
      beetle(1020, FLOOR_Y - 38, 830, 1280),
      slime(1350, FLOOR_Y - 42, 830, 1390),
      drone(1750, 252, 1560, 1980),
      pod(2580, FLOOR_Y - 36, 2240, 2830),
      drone(2910, 284, 2360, 3040),
      slime(3300, FLOOR_Y - 42, 3090, 3460),
      drone(4080, 230, 3820, 4340),
      pod(4460, FLOOR_Y - 36, 3780, 4560),
      beetle(5050, FLOOR_Y - 38, 4710, 5210),
      slime(5340, FLOOR_Y - 42, 4720, 5420),
      pod(5780, FLOOR_Y - 36, 5480, 5940),
      drone(6640, 250, 6260, 6840),
      slime(7190, FLOOR_Y - 42, 6810, 7540),
    ],
    goal: { x: 7480, y: FLOOR_Y - 96, w: 44, h: 96 },
  };
}

function buildStageFour() {
  const stage = buildStageOne();
  return remixStage(stage, {
    label: "2-1",
    name: "Riverfall Outpost",
    keyX: 5120,
    lockX: 8760,
    extraFruit: [gem(1510, 285), gem(3740, 398), gem(6140, 286), gem(7770, 296)],
    extraEnemies: [
      drone(1510, 300, 1260, 1640),
      slime(2190, FLOOR_Y - 42, 1760, 2630),
      beetle(4560, FLOOR_Y - 38, 4520, 5300),
      drone(6100, 250, 5760, 6300),
      pod(8440, FLOOR_Y - 36, 8060, 8840),
    ],
  });
}

function buildStageFive() {
  const stage = buildStageTwo();
  return remixStage(stage, {
    label: "2-2",
    name: "Mossworks Lift",
    keyX: 4210,
    lockX: 6240,
    extraFruit: [gem(930, 398), gem(2290, 398), gem(3910, 286), gem(5350, 398)],
    extraEnemies: [
      beetle(1040, FLOOR_Y - 38, 920, 1450),
      slime(2120, FLOOR_Y - 42, 1640, 2230),
      pod(2860, FLOOR_Y - 36, 2400, 2960),
      drone(3880, 246, 3540, 4210),
      beetle(5620, FLOOR_Y - 38, 5500, 6340),
    ],
  });
}

function buildStageSix() {
  const stage = buildStageThree();
  return remixStage(stage, {
    label: "2-3",
    name: "Amber Gate",
    keyX: 4920,
    lockX: 7350,
    extraFruit: [gem(900, 398), gem(2130, 398), gem(3690, 398), gem(6150, 398)],
    extraEnemies: [
      pod(1210, FLOOR_Y - 36, 830, 1390),
      beetle(2140, FLOOR_Y - 38, 1540, 2100),
      drone(3560, 268, 3180, 3920),
      slime(4620, FLOOR_Y - 42, 3740, 5310),
      beetle(6320, FLOOR_Y - 38, 6240, 7200),
    ],
  });
}

function buildStageSeven() {
  const stage = buildStageOne();
  return remixStage(stage, {
    label: "3-1",
    name: "Cinderroot Run",
    keyX: 5660,
    lockX: 8760,
    extraFruit: [gem(1620, 398), gem(2810, 398), gem(5260, 398), gem(7140, 398), gem(8640, 398)],
    extraEnemies: [
      pod(1460, FLOOR_Y - 36, 1030, 1640),
      drone(2860, 238, 2460, 3360),
      slime(4540, FLOOR_Y - 42, 4540, 5280),
      beetle(6220, FLOOR_Y - 38, 5480, 7120),
      drone(8070, 258, 7280, 8840),
      slime(8740, FLOOR_Y - 42, 8060, 8900),
    ],
  });
}

function buildStageEight() {
  const stage = buildStageTwo();
  return remixStage(stage, {
    label: "3-2",
    name: "Fossil Canopy",
    keyX: 4930,
    lockX: 6240,
    extraFruit: [gem(1540, 398), gem(3000, 398), gem(4680, 398), gem(6410, 398)],
    extraEnemies: [
      slime(980, FLOOR_Y - 42, 900, 1490),
      drone(2320, 250, 1940, 2780),
      beetle(3060, FLOOR_Y - 38, 2400, 3840),
      pod(4620, FLOOR_Y - 36, 4000, 5240),
      drone(5900, 246, 5500, 6420),
    ],
  });
}

function buildStageNine() {
  const stage = buildStageThree();
  return remixStage(stage, {
    label: "3-3",
    name: "Moon Crown",
    keyX: 6500,
    lockX: 7350,
    extraFruit: [gem(1420, 398), gem(2980, 398), gem(4560, 398), gem(6100, 398), gem(7340, 398)],
    extraEnemies: [
      drone(1320, 260, 820, 1900),
      pod(2180, FLOOR_Y - 36, 1540, 2920),
      beetle(3820, FLOOR_Y - 38, 3060, 4560),
      slime(5180, FLOOR_Y - 42, 4700, 6100),
      drone(6220, 228, 5440, 7200),
      pod(7040, FLOOR_Y - 36, 6240, 7540),
    ],
  });
}

function remixStage(stage, { label, name, keyX, lockX, extraFruit = [], extraEnemies = [] }) {
  return {
    ...stage,
    label,
    name,
    fruit: stage.fruit.concat(extraFruit),
    keys: [keyItem(keyX, FLOOR_Y - 58)],
    locks: [lockGate(lockX)],
    enemies: stage.enemies.concat(extraEnemies),
  };
}

function gem(x, y) {
  const colors = ["#ffb32c", "#71d69a", "#8dd9ff", "#ffd56a"];
  return { x, y, r: 17, got: false, color: colors[Math.floor(rand() * colors.length)] };
}

function weaponItem(type, x, y) {
  return { type, x, y, w: 42, h: 42, got: false };
}

function keyItem(x, y) {
  return { x, y, w: 42, h: 42, got: false };
}

function lockGate(x) {
  return { x, y: FLOOR_Y - 118, w: 44, h: 118, open: false };
}

function beetle(x, y, min, max) {
  return { kind: "beetle", x, y, startX: x, startY: y, w: 58, h: 40, min, max, dir: -1, speed: 72, t: rand() * 5, color: "#d46b3f", hp: 2, dead: false, hit: 0 };
}

function slime(x, y, min, max) {
  return { kind: "slime", x, y, startX: x, startY: y, w: 58, h: 44, min, max, dir: 1, speed: 52, t: rand() * 5, color: "#6f6fac", hp: 3, dead: false, hit: 0 };
}

function drone(x, y, min, max) {
  return { kind: "drone", x, y, startX: x, startY: y, w: 46, h: 40, min, max, dir: 1, speed: 82, t: rand() * 5, color: "#b6bd68", hp: 2, dead: false, hit: 0 };
}

function pod(x, y, min, max) {
  return { kind: "pod", x, y, startX: x, startY: y, w: 58, h: 42, min, max, dir: -1, speed: 118, t: rand() * 5, color: "#a55c30", hp: 2, dead: false, hit: 0 };
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleRect(cx, cy, r, body) {
  const nx = clamp(cx, body.x, body.x + body.w);
  const ny = clamp(cy, body.y, body.y + body.h);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy <= r * r;
}

function playerAttackBox() {
  const reach = 46;
  return {
    x: player.dir > 0 ? player.x + player.w - 8 : player.x - reach + 8,
    y: player.y + 12,
    w: reach,
    h: 48,
  };
}

function playerSwordBox() {
  const reach = 132;
  return {
    x: player.dir > 0 ? player.x + player.w - 18 : player.x - reach + 18,
    y: player.y,
    w: reach,
    h: 64,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function mulberry32(seed) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
