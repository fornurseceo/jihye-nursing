// 지혜간호학원 — 화면 동작
(function () {
  // 1) 스크롤하면 상단 메뉴에 흰 배경
  var header = document.getElementById('header');
  var floatBox = document.querySelector('.float');
  function onScroll() {
    header.classList.toggle('is-solid', window.scrollY > 40);
    floatBox.classList.toggle('is-shown', window.scrollY > window.innerHeight * 0.6);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 2) 모바일 메뉴 열고 닫기
  var toggle = document.querySelector('.menu-toggle');
  var mobileNav = document.getElementById('mobileNav');
  toggle.addEventListener('click', function () {
    var open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    toggle.setAttribute('aria-label', open ? '메뉴 열기' : '메뉴 닫기');
    mobileNav.hidden = open;
  });
  mobileNav.addEventListener('click', function (e) {
    if (e.target.closest('a')) { mobileNav.hidden = true; toggle.setAttribute('aria-expanded', 'false'); }
  });

  // 3) 첫 화면 배경 영상: 파일이 있으면 재생, 없으면 사진 그대로
  var video = document.querySelector('.hero-video');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (video && video.dataset.src && !reduce) {
    video.src = video.dataset.src;
    video.addEventListener('canplay', function () {
      video.play().then(function () { video.classList.add('is-playing'); }).catch(function () {});
    }, { once: true });
    video.addEventListener('error', function () { video.remove(); }, { once: true });
  }

  // 4) 부엉이가 날아와 열쇠 위에 앉기 (스크롤에 맞춰 움직임, 위로 올리면 다시 날아감)
  //    처음: 첫 화면 노선도 '수유' 역 위에 작게 앉아 있음
  //    스크롤 앞 절반: 수유 → 미아 → 청량리 → 송내 → 부산 위를 날갯짓하며 통통 지나감
  //    스크롤 뒤 절반: 부산에서 크게 곡선을 그리며 아래 '교육 특징' 칸의 열쇠로 내려와 앉음
  //    위로 스크롤하면 거꾸로 날아감
  var flyer = document.querySelector('.owl-flyer');
  var owlBox = document.querySelector('.owl');
  var dots = document.querySelectorAll('.route-stops .dot');
  if (flyer && owlBox && dots.length) {
    var bird = flyer.querySelector('.owl-bird');
    var wingL = flyer.querySelector('.wing-l'), wingR = flyer.querySelector('.wing-r');
    var FEET = 0.82;           // 그림에서 발끝 높이(0~1)
    var STATIONS = 0.5;        // 전체 비행 중 역 5개를 지나는 비율
    var cur = 0, landed = false;

    var place = function (x, y, s, rot) {   // (x,y) = 발끝 위치(페이지 기준)
      var W = owlBox.offsetWidth;
      flyer.style.transform = 'translate(' + (x - W * s / 2) + 'px,' + (y - W * FEET * s) + 'px) ' +
        'rotate(' + rot + 'deg) scale(' + s + ')';
    };

    if (reduce) {               // 움직임 줄이기: 처음부터 열쇠 위에 앉아 있음
      var setStill = function () {
        var r = owlBox.getBoundingClientRect(), W = owlBox.offsetWidth;
        place(r.left + scrollX + W / 2, r.top + scrollY + W * FEET, 1, 0);
        flyer.style.opacity = 1;
      };
      setStill(); window.addEventListener('resize', setStill);
    } else {
      setTimeout(function () { flyer.style.transition = 'opacity .6s'; flyer.style.opacity = 1; }, 1600);
      window.addEventListener('scroll', function () { flyer.style.opacity = 1; }, { once: true, passive: true });

      var frame = function (now) {
        var vh = window.innerHeight, sy = window.scrollY, sx = window.scrollX;
        var W = owlBox.offsetWidth;
        var pts = Array.prototype.map.call(dots, function (d) {
          var r = d.getBoundingClientRect();
          return { x: r.left + sx + r.width / 2, y: r.top + sy + r.height / 2 };
        });
        var lr = owlBox.getBoundingClientRect();
        var land = { x: lr.left + sx + W / 2, y: lr.top + sy + W * FEET };
        var s0 = W < 200 ? 0.42 : 0.48;  // 역 위에 있을 때 크기

        // 스크롤 → 비행 진행도 (열쇠 자리가 화면 45% 높이에 오면 도착)
        var maxScroll = document.documentElement.scrollHeight - vh;   // 페이지 끝에선 그 전에 도착
        var end = Math.max(1, Math.min(lr.top + sy - vh * 0.45, maxScroll - 20));
        var target = Math.max(0, Math.min(1, sy / end));
        cur += (target - cur) * 0.1;                     // 부드럽게 따라감
        if (Math.abs(target - cur) < 0.0005) cur = target;

        var x, y, s, rot, t = cur;
        if (t <= STATIONS) {                             // 역 위를 지나감
          var u = t / STATIONS * (pts.length - 1);
          var i = Math.min(pts.length - 2, Math.floor(u)), f = u - i;
          var a = pts[i], b = pts[i + 1];
          var k = W / 240;                                // 화면 크기에 맞춰 뛰는 높이 조절
          var lift = (26 * k + 46 * k * Math.sin(Math.PI * f)) * Math.min(1, t * 40);
          x = a.x + (b.x - a.x) * f;
          y = a.y + (b.y - a.y) * f - lift;
          s = s0;
          rot = 9 * Math.min(1, t * 40);                 // 오른쪽으로 기울어 날아감
        } else {                                         // 부산에서 열쇠로 곡선 비행
          var v = (t - STATIONS) / (1 - STATIONS);
          var e = 0.5 - Math.cos(Math.PI * v) / 2;
          var p0 = { x: pts[pts.length - 1].x, y: pts[pts.length - 1].y - 26 * W / 240 };
          var c = { x: (p0.x + land.x) / 2 + (p0.x - land.x) * 0.25, y: p0.y - 140 };
          x = (1 - e) * (1 - e) * p0.x + 2 * (1 - e) * e * c.x + e * e * land.x;
          y = (1 - e) * (1 - e) * p0.y + 2 * (1 - e) * e * c.y + e * e * land.y;
          s = s0 + (1 - s0) * e;
          rot = (9 + (-16 - 9) * Math.min(1, v * 3)) * (1 - e * e * e);
        }

        var flying = t > 0.002 && t < 0.998;
        flyer.classList.toggle('is-flying', flying);
        if (flying) {
          var ph = now / 1000 * 17;                        // 날갯짓 속도
          var flap = Math.sin(ph);
          wingL.style.transform = 'rotate(' + (-10 + flap * 50) + 'deg)';
          wingR.style.transform = 'rotate(' + (10 - flap * 50) + 'deg)';
          y += Math.cos(ph) * 5 * s;                        // 날갯짓에 맞춰 몸이 들썩
          bird.style.transform = 'scale(' + (1 + flap * 0.03) + ',' + (1 - flap * 0.04) + ')';
          landed = false; bird.classList.remove('is-landed');
        } else {
          bird.style.transform = '';
          if (t >= 0.998 && !landed) { landed = true; bird.classList.add('is-landed'); }
        }
        place(x, y, s, flying ? rot : 0);
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }
  }

  // 6) 지점 목록 접기·펼치기 (처음엔 모두 접힘, 누르면 펼쳐짐, 다시 누르면 접힘)
  var branches = document.querySelectorAll('.branch');
  function setBranch(li, open) {
    var btn = li.querySelector('.branch-toggle');
    var body = li.querySelector('.branch-body');
    li.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    body.inert = !open;               // 접혀 있을 땐 안쪽 버튼으로 이동 안 됨
  }
  branches.forEach(function (li) {
    setBranch(li, false);
    li.querySelector('.branch-toggle').addEventListener('click', function () {
      setBranch(li, !li.classList.contains('is-open'));
    });
  });
  // 첫 화면 노선도의 역을 누르면 그 지점을 펼쳐서 보여줌
  function openFromHash() {
    var li = location.hash && document.querySelector('.branch' + location.hash);
    if (li) setBranch(li, true);
  }
  window.addEventListener('hashchange', openFromHash);
  openFromHash();

  // 7) 팝업 열기·닫기 (시험일정 그림 등) — data-dialog-open="팝업 id"
  document.querySelectorAll('[data-dialog-open]').forEach(function (btn) {
    var dlg = document.getElementById(btn.getAttribute('data-dialog-open'));
    if (!dlg || !dlg.showModal) return;
    btn.addEventListener('click', function () { dlg.showModal(); });
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('[data-dialog-close]')) dlg.close();  // 바깥 누르거나 닫기 누르면 닫힘
    });
  });

  // 8) 실습 협력 의료기관: 병원급/의원급 탭 + '전체 보기'
  // 로고 벽 '따다닥' 효과: 왼쪽 위 칸부터 대각선 방향으로 차례차례 나타남
  var STEP = 0.16;                       // 대각선 한 칸마다 늦어지는 시간(초). 클수록 천천히 퍼짐
  function playLogos(grid) {
    if (reduce || !grid) return;          // 로고 벽이 없는 탭(지점 페이지 커리큘럼 등)은 건너뜀
    var cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    var i = 0;
    grid.querySelectorAll('li').forEach(function (li) {
      if (!li.offsetParent) return;      // 숨어 있는 칸(전체 보기 전)은 건너뜀
      li.style.setProperty('--d', ((Math.floor(i / cols) + i % cols) * STEP).toFixed(2) + 's');
      i++;
    });
    grid.classList.remove('is-playing');
    void grid.offsetWidth;               // 애니메이션 처음부터 다시
    grid.classList.add('is-playing');
  }
  if ('IntersectionObserver' in window) {  // 화면에 들어올 때마다 다시
    var logoIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) playLogos(en.target);
        else en.target.classList.remove('is-playing');
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.logo-grid').forEach(function (g) { logoIO.observe(g); });
  }

  var tabs = document.querySelectorAll('.practice-tab');
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !on;
      if (on) playLogos(panel.querySelector('.logo-grid'));   // 탭 바꾸면 다시 따다닥
    });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {   // 키보드 좌우 화살표로 탭 이동
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      selectTab(next); next.focus();
    });
  });
  document.querySelectorAll('.practice-more').forEach(function (btn) {
    var grid = btn.previousElementSibling, label = btn.textContent;
    btn.addEventListener('click', function () {
      var all = grid.classList.toggle('is-all');
      btn.setAttribute('aria-expanded', String(all));
      btn.textContent = all ? '접기' : label;
      if (all) playLogos(grid);
      else grid.scrollIntoView({ block: 'start' });
    });
  });

  // 9) 상담 신청서
  //    받을 곳이 정해지면 아래 FORM_ENDPOINT 에 주소를 넣으세요(예: Formspree 주소).
  //    비어 있으면 신청이 전송되지 않고 전화·카톡 안내만 보여요.
  var FORM_ENDPOINT = '';
  var form = document.getElementById('contactForm');
  if (form) {
    var msg = form.querySelector('.form-msg');
    var say = function (text, kind) { msg.textContent = text; msg.className = 'form-msg is-' + kind; };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name, phone = form.elements.phone, agree = form.elements.agree;
      [name, phone].forEach(function (el) { el.closest('.field').classList.remove('is-error'); });
      if (!name.value.trim()) { name.closest('.field').classList.add('is-error'); name.focus(); return say('이름을 입력해 주세요.', 'error'); }
      if (!/[0-9]{3,4}-?[0-9]{3,4}-?[0-9]{4}/.test(phone.value.replace(/\s/g, ''))) {
        phone.closest('.field').classList.add('is-error'); phone.focus(); return say('연락처를 010-0000-0000 형식으로 입력해 주세요.', 'error');
      }
      if (!agree.checked) { agree.focus(); return say('개인정보 이용에 동의해 주세요.', 'error'); }
      if (!FORM_ENDPOINT) {
        return say('온라인 신청은 준비 중입니다. 대표 전화 02-980-1005 또는 카카오톡 @지혜간호학원으로 문의해 주세요.', 'error');
      }
      var btn = form.querySelector('.form-submit'); btn.disabled = true;
      fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) })
        .then(function (r) {
          if (!r.ok) throw new Error();
          form.reset(); say('상담 신청이 접수되었습니다. 24시간 내 연락드리겠습니다.', 'ok');
        })
        .catch(function () { say('신청을 보내지 못했습니다. 대표 전화 02-980-1005로 문의해 주세요.', 'error'); })
        .then(function () { btn.disabled = false; });
    });
  }

  // 5) 숫자 올라가는 효과 (화면에 보일 때 한 번)
  var counts = document.querySelectorAll('.count');
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        // data-from(시작 숫자), data-to(끝 숫자), data-dur(걸리는 시간, 1000=1초)
        var el = en.target, from = +(el.dataset.from || 0), to = +el.dataset.to;
        var run = (el._run || 0) + 1; el._run = run;   // 새로 시작하면 이전 움직임은 멈춤
        if (!en.isIntersecting) {                     // 화면 밖으로 나가면 시작 숫자로 되돌려 둠
          el.textContent = from.toLocaleString('ko-KR');
          return;
        }
        var start = performance.now(), dur = +(el.dataset.dur || 1400);
        (function tick(now) {
          if (el._run !== run) return;
          var p = Math.min((now - start) / dur, 1);
          var v = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
          el.textContent = v.toLocaleString('ko-KR');
          if (p < 1) requestAnimationFrame(tick);
        })(start);
      });
    }, { threshold: 0.6 });   // 숫자가 60% 이상 보일 때마다 다시 올라감
    counts.forEach(function (c) { c.textContent = c.dataset.from || '0'; io.observe(c); });
  }

  // 10) 지점 페이지: 페이지 안 바로가기 — 지금 보고 있는 칸에 주황 밑줄
  var subLinks = document.querySelectorAll('.bp-subnav a');
  if (subLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    subLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var subIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        subLinks.forEach(function (a) { a.classList.remove('is-active'); });
        var a = byId[en.target.id];
        if (a) {
          a.classList.add('is-active');
          var ul = a.closest('ul');           // 모바일: 메뉴 줄을 옆으로 밀어 지금 칸이 보이게
          ul.scrollTo({ left: a.offsetLeft - ul.clientWidth / 2 + a.offsetWidth / 2 });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) subIO.observe(s); });
  }

  // 11) 지점 페이지: 시설 사진 넘기기 (손가락으로 밀어도 되고 ‹ › 버튼도 됨)
  document.querySelectorAll('.bp-gallery').forEach(function (g) {
    var track = g.querySelector('.bp-gallery-track'), count = g.querySelector('.bp-gallery-count');
    var n = track.children.length;
    function idx() { return Math.round(track.scrollLeft / track.clientWidth); }
    function go(i) { track.scrollTo({ left: ((i + n) % n) * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' }); }
    g.querySelector('.bp-gallery-prev').addEventListener('click', function () { go(idx() - 1); });
    g.querySelector('.bp-gallery-next').addEventListener('click', function () { go(idx() + 1); });
    track.addEventListener('scroll', function () { count.textContent = (idx() + 1) + ' / ' + n; }, { passive: true });
  });
})();
