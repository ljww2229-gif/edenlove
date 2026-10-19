(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const desktop = $('#desktop');
  const tasks = $('#tasks');
  const isMobile = () => window.matchMedia('(max-width: 760px)').matches;

  /* ---------- 저장소 (실패해도 동작) ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* 무시 */ } },
  };

  /* ---------- 토스트 ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2200);
  }

  /* ---------- 시계 (이야기 속 날짜 6/20) ---------- */
  const clock = $('#clock');
  function tick() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    clock.textContent = `SAT 6/20 ${hh}:${mm}`;
  }
  tick();
  setInterval(tick, 10000);

  /* ---------- 창 관리 ---------- */
  let z = 20;
  const titles = {};

  function place(win) {
    const dw = desktop.clientWidth;
    const dh = desktop.clientHeight;
    const w = Math.min(Number(win.dataset.w) || 480, dw - 16);
    win.style.width = w + 'px';
    if (isMobile()) return;
    const rx = win.dataset.x;
    const ry = win.dataset.y;
    let x = rx === 'center' ? (dw - w) / 2 : rx.endsWith('%') ? dw * parseFloat(rx) / 100 : parseFloat(rx);
    let y = ry === 'center' ? dh * 0.3 : parseFloat(ry);
    // 양옆 아이콘 열을 가리지 않도록
    const gutter = dw - w >= 240 ? 116 : 8;
    x = Math.max(gutter, Math.min(x, dw - w - gutter));
    y = Math.max(8, Math.min(y, dh - 80));
    win.style.left = x + 'px';
    win.style.top = y + 'px';
  }

  function focus(win) {
    $$('.win.active').forEach(w => w.classList.remove('active'));
    win.classList.add('active');
    win.style.zIndex = ++z;
    $$('button', tasks).forEach(b => b.classList.toggle('on', b.dataset.win === win.id));
  }

  function open(id) {
    const win = document.getElementById(id);
    if (!win) return;
    if (win.hidden) {
      win.hidden = false;
      place(win);
      addTask(win);
    }
    win.classList.remove('min');
    focus(win);
  }

  function close(win) {
    win.hidden = true;
    win.classList.remove('min', 'active');
    const t = $(`button[data-win="${win.id}"]`, tasks);
    if (t) t.remove();
  }

  function minimize(win) {
    win.classList.add('min');
    win.classList.remove('active');
    const t = $(`button[data-win="${win.id}"]`, tasks);
    if (t) t.classList.remove('on');
  }

  function addTask(win) {
    if ($(`button[data-win="${win.id}"]`, tasks)) return;
    const b = document.createElement('button');
    b.dataset.win = win.id;
    b.textContent = titles[win.id];
    b.addEventListener('click', () => {
      if (win.classList.contains('min') || !win.classList.contains('active')) open(win.id);
      else minimize(win);
    });
    tasks.appendChild(b);
  }

  $$('.win').forEach(win => {
    const name = $('.t-name', win).textContent;
    titles[win.id] = $('.t-ico', win).textContent + ' ' + name.split(' — ')[0];
    win.addEventListener('pointerdown', () => focus(win));
    $('.b-close', win).addEventListener('click', e => { e.stopPropagation(); close(win); });
    const min = $('.b-min', win);
    if (min) min.addEventListener('click', e => { e.stopPropagation(); minimize(win); });

    // 드래그
    const bar = $('.titlebar', win);
    bar.addEventListener('pointerdown', e => {
      if (isMobile() || e.target.closest('button')) return;
      const sx = e.clientX - win.offsetLeft;
      const sy = e.clientY - win.offsetTop;
      bar.setPointerCapture(e.pointerId);
      bar.style.cursor = 'grabbing';
      const move = ev => {
        const x = Math.max(-win.offsetWidth + 80, Math.min(ev.clientX - sx, desktop.clientWidth - 80));
        const y = Math.max(0, Math.min(ev.clientY - sy, desktop.clientHeight - 30));
        win.style.left = x + 'px';
        win.style.top = y + 'px';
      };
      const up = () => {
        bar.style.cursor = '';
        bar.removeEventListener('pointermove', move);
        bar.removeEventListener('pointerup', up);
      };
      bar.addEventListener('pointermove', move);
      bar.addEventListener('pointerup', up);
    });
  });

  $$('[data-open]').forEach(el => el.addEventListener('click', () => open(el.dataset.open)));

  /* ---------- 시작 다이얼로그 ---------- */
  const noBtn = $('#hello-no');
  let noCount = 0;
  noBtn.addEventListener('click', () => {
    noCount++;
    $('#hello-err').hidden = false;
    if (noCount >= 2) noBtn.textContent = 'はい / 네';
    if (noCount >= 3) enter();
  });
  $('#hello-yes').addEventListener('click', enter);
  function enter() {
    close($('#win-hello'));
    open('win-player');
    toast('707호에 오신 것을 환영합니다 ♥');
  }

  /* ---------- 서사 트랙 ---------- */
  const TRACKS = [
    ['01', '6/12', '찾았네 — 강제 각인', '폐허 한가운데, 폭주 직전의 아샤. 총성과 함께 윈드-스테빌라이저 특수탄이 박히고, 담배를 문 남자가 내려다본다. “…찾았네.” 임시 가이딩 이후 아샤의 파장은 에덴 외의 모든 가이드를 튕겨 낸다. 하모니 부서의 판정은 ‘해제 불가’. 파트너를 5년간 거부해 온 남자와 그 센티넬은 S급 전용관 707호에 함께 살게 된다.'],
    ['02', '6/13', '707호 — 커피 4.5점', '동거 첫 아침. 아샤의 단말기에 뜬 ‘오빠’라는 이름에 에덴은 이유도 모른 채 날을 세우지만, 알고 보니 R.S.T. 동료 아벨은 그녀의 친오빠였다. 비상계단에서 쏟아낸 냉소에 돌아온 대답은 “에덴님만 빼고 재미있는 일 없어요!” 그날 저녁 아샤의 알리오 올리오. “울면서 짜다곤 안 했으니까, 실격은 아니야.” 두 사람만의 5점 만점 점수제가 시작된다.'],
    ['03', '6/13–14', '낙원 — 총을 쏘는 이유', '각성의 대가로 손이 떨려 금메달리스트의 커리어를 잃은 남자. 모든 걸 잃은 인간에게 주어진 낙원이라서, 코드네임은 에덴. 사람을 쏘는 자신을 혐오하던 그에게 아샤는 말한다. “폭주하는 센티넬을 쏴서 진정시키잖아요. 살리는 거잖아요.” 그리고 그는 고백한다. “요즘은… 낙원이 좀 시끄러워졌어.” 사랑 없는 가이딩은 하지 않는다는 그의 신념을 지켜 주려고, 아샤는 스스로 가이딩 수치를 조절하기 시작한다.'],
    ['04', '6/15', '거기 있어 — 소파 위의 낮잠', '새벽 옥상에서 ‘님’을 떼어 낸 호칭. 다음 날 소파에서 나란히 든 낮잠 속에서, 잠결의 아샤가 그의 품으로 파고든다. 5년 만의 깊은 잠, 그리고 멎어 버린 손떨림. “그래. 거기 있어.”'],
    ['05', '6/16', '소유물 — 선을 넘은 밤', '안정을 알게 된 남자의 집착이 선을 넘는다. 아샤는 처음으로 707호에서 도망친다. 쫓아온 그에게 그녀가 건넨 건 케이크 한 조각과 한마디. “에덴의 소유물은 되고 싶지 않아요. …싫지는 않거든요.”'],
    ['06', '6/17–19', '태백 — 울보 오빠와 아가', '3박 4일 긴급 출장. 다시 고개를 든 통제에 아샤는 “에덴 가이드님”으로 멀어지고, “저 버려도 됩니다”라고 말한다. 무너진 쪽은 에덴이었다. 울면서 사과하는 남자의 입에 그녀는 레몬 사탕을 넣어 준다. “에덴을 제가 왜 포기해요.” 5점 만점의 보상으로 소원권 한 장, 그리고 호칭 계약. 그녀는 ‘아가’가 되고, 그는 ‘오빠’가 된다. “오빠는 너만 부를 수 있는 거니까.”'],
    ['07', '6/20', '사겨요 — 홍예준, 이별하', '707호로 돌아온 밤, 미뤄 둔 대답. “응… 저도 에덴 좋아해요. 그, 그러니까 사겨요.” 코드네임 대신 건넨 본명은 홍예준과 이별하. 다음 날 아벨에게 연애 보고 문자가 날아간다.'],
    ['08', 'NOW', 'Steady Hands — 지금', '사격장 데이트, 동유럽 파견, 칭찬으로 꽉 찬 별점 수첩. 아샤의 가이딩 필요 수치는 0%이고, 707호 부엌은 여전히 예준 차지다. “사귄 이후로 계속, 계~속 오빠만 요리하니까. 내가 할게.”'],
  ];
  const list = $('#tracks');
  let cur = 0;
  TRACKS.forEach(([n, d, t], i) => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option');
    li.tabIndex = 0;
    li.innerHTML = `<span class="n">${n}</span><span>${t.split(' — ')[0]}</span><span class="d">${d}</span>`;
    li.addEventListener('click', () => show(i));
    li.addEventListener('keydown', e => { if (e.key === 'Enter') show(i); });
    list.appendChild(li);
  });
  function show(i) {
    cur = (i + TRACKS.length) % TRACKS.length;
    const [n, d, t, body] = TRACKS[cur];
    $('#tv-no').textContent = n;
    $('#tv-date').textContent = d;
    $('#tv-title').textContent = t;
    $('#tv-text').textContent = body;
    $$('li', list).forEach((li, k) => li.classList.toggle('on', k === cur));
  }
  $('#tv-prev').addEventListener('click', () => show(cur - 1));
  $('#tv-next').addEventListener('click', () => show(cur + 1));
  show(0);

  /* ---------- 가짜 재생 ---------- */
  const playBtn = $('#play-btn');
  const fill = $('.seek-fill');
  const timeEl = $('#song-time');
  let sec = 0, playing = null;
  playBtn.addEventListener('click', () => {
    if (playing) {
      clearInterval(playing); playing = null; playBtn.textContent = '▶';
      return;
    }
    playBtn.textContent = '⏸';
    playing = setInterval(() => {
      sec = (sec + 1) % 271;
      fill.style.width = (sec / 270 * 100) + '%';
      timeEl.textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
    }, 1000);
  });

  /* ---------- 별점수첩 ---------- */
  const MSG = ['', '…1점? 에덴이 담배 한 대 피우러 나갔습니다.', '2점. 아샤가 볼을 부풀렸습니다.', '3점. “다음에 더 잘하면 5점.”', '4점! 아벨 오빠보다는 후하네요.', '5점 만점! 예준 오빠가 울보가 됐습니다.'];
  const stars = $$('#stars button');
  function rate(v) {
    stars.forEach(s => s.classList.toggle('on', Number(s.dataset.v) <= v));
    $('#rate-msg').textContent = MSG[v] || '별을 눌러 주세요.';
  }
  stars.forEach(s => s.addEventListener('click', () => {
    const v = Number(s.dataset.v);
    rate(v);
    store.set('edenlove-rate', v);
  }));
  rate(Number(store.get('edenlove-rate')) || 0);

  /* ---------- 레몬 사탕 ---------- */
  let candy = Number(store.get('edenlove-candy')) || 0;
  const candyCount = $('#candy-count');
  candyCount.textContent = candy;
  const CANDY_MSG = ['아샤가 레몬 사탕을 건넸다!', '“간식 서비스입니다.”', '에덴의 주머니에 사탕이 쌓여 간다…', '“…또 사탕이냐.”'];
  $('#candy-icon').addEventListener('click', e => {
    candy++;
    candyCount.textContent = candy;
    store.set('edenlove-candy', candy);
    toast(`🍋 ${CANDY_MSG[candy % CANDY_MSG.length]} (${candy}개)`);
    for (let i = 0; i < 6; i++) {
      const c = document.createElement('span');
      c.className = 'candy-fx';
      c.textContent = i % 2 ? '🍬' : '🍋';
      c.style.left = e.clientX + 'px';
      c.style.top = e.clientY + 'px';
      c.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
      c.style.setProperty('--r', (Math.random() * 360) + 'deg');
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 1000);
    }
  });

  /* ---------- 휴지통 ---------- */
  $('#trash-empty').addEventListener('click', () => toast('⚠ 강제각인_해제요청.pdf 는 삭제할 수 없습니다.'));

  /* ---------- 우클릭 · 저장 방지 ---------- */
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('dragstart', e => { if (e.target.tagName === 'IMG') e.preventDefault(); });
  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    const mod = e.ctrlKey || e.metaKey;
    if (e.key === 'F12' || (mod && ['s', 'u', 'p'].includes(k)) || (mod && e.shiftKey && ['i', 'j', 'c'].includes(k))) {
      e.preventDefault();
    }
  });

  /* ---------- 부팅 ---------- */
  window.addEventListener('load', () => {
    setTimeout(() => {
      $('#boot').classList.add('done');
      open('win-hello');
    }, 1500);
  });

  window.addEventListener('resize', () => {
    $$('.win:not([hidden])').forEach(w => {
      const max = desktop.clientWidth - 16;
      if (w.offsetWidth > max || isMobile()) place(w);
    });
  });
})();
