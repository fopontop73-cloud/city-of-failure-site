/* =========================
   City of Failure - Script
   عربي فقط
========================= */

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx9FInuzxcmHplHd0rMSIRIOiYPGCqujIcgBtLS7No4/exec";


/* أسماء الوحوش بالترتيب */
const MONSTERS = [
  { id: 1, name: "الراحة اللذيذة (الطفل)", page: "monster-01.html", img: "images/monster-01.png" },
  { id: 2, name: "الببغاء (التقليد)", page: "monster-02.html", img: "images/monster-02.png" },
  { id: 3, name: "الصديق (التأجيل)", page: "monster-03.html", img: "images/monster-03.png" },
  { id: 4, name: "المرأة اللعوب (الهوى)", page: "monster-04.html", img: "images/monster-04.png" },
  { id: 5, name: "العملاق (الخوف)", page: "monster-05.html", img: "images/monster-05.png" },
  { id: 6, name: "السجّان (الماضي)", page: "monster-06.html", img: "images/monster-06.png" },
  { id: 7, name: "التوأم (التسويف)", page: "monster-07.html", img: "images/monster-07.png" },
  { id: 8, name: "الساحر (التشتت)", page: "monster-08.html", img: "images/monster-08.png" },
  { id: 9, name: "القرد (الزمن/الدوبامين)", page: "monster-09.html", img: "images/monster-09.png" },
  { id: 10, name: "وحش الداعم (الملاك الكاذب)", page: "monster-10.html", img: "images/monster-10.png" },
  { id: 11, name: "الثعبان (التردد)", page: "monster-11.html", img: "images/monster-11.png" },
  { id: 12, name: "العنكبوت (خلط المفاهيم)", page: "monster-12.html", img: "images/monster-12.png" },
];

/* =========================
   1) بناء شبكة الوحوش
========================= */
function renderMonstersGrid() {
  const grid = document.getElementById("monstersGrid");
  if (!grid) return;

  grid.innerHTML = "";

  MONSTERS.forEach(m => {
    const tile = document.createElement("div");
    tile.className = "monster-tile";
    tile.onclick = () => window.location.href = m.page;

    tile.innerHTML = `
      <img src="${m.img}" alt="${m.name}">
      <div class="info">
        <div class="num">الوحش رقم ${m.id}</div>
        <div class="name">${m.name}</div>
      </div>
    `;

    grid.appendChild(tile);
  });
}

/* =========================
   2) تعبئة select الوحوش في الاستبيان
========================= */
function fillMonsterSelect() {
  const select = document.getElementById("monsterVote");
  if (!select) return;

  select.innerHTML = `<option value="">-- اختر الوحش الأخطر --</option>`;

  MONSTERS.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = `(${m.id}) ${m.name}`;
    select.appendChild(opt);
  });
}

/* =========================
   3) إرسال الاستبيان إلى Google Sheet
========================= */
async function submitSurvey(e) {
  e.preventDefault();

  const msg = document.getElementById("formMsg");
  msg.className = "msg";
  msg.textContent = "⏳ جاري إرسال البيانات...";

  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("PUT_YOUR")) {
    msg.className = "msg err";
    msg.textContent = "❌ لم يتم وضع رابط Apps Script داخل ملف script.js";
    return;
  }

  const name = document.getElementById("visitorName").value.trim();
  const age = document.getElementById("visitorAge").value.trim();
  const status = document.getElementById("visitorStatus").value;
  const monster = document.getElementById("monsterVote").value;
  const story = document.getElementById("visitorStory").value.trim();

  if (!age || !monster) {
    msg.className = "msg err";
    msg.textContent = "❌ العمر واختيار الوحش إجبارية.";
    return;
  }

  const payload = {
    action: "submit",
    name,
    age,
    status,
    monster,
    story
  };

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.ok) {
      msg.className = "msg ok";
      msg.textContent = "✅ تم إرسال الاستبيان بنجاح! شكراً لك.";
      document.getElementById("surveyForm").reset();

      // تحديث الرسم البياني بعد الإرسال
      loadVotesChart();
    } else {
      msg.className = "msg err";
      msg.textContent = "❌ حدث خطأ أثناء الإرسال: " + (data.error || "غير معروف");
    }
  } catch (err) {
    msg.className = "msg err";
    msg.textContent = "❌ فشل الاتصال بـ Apps Script. تأكد من الرابط والنشر.";
  }
}

/* =========================
   4) تحميل التصويتات للرسم البياني
========================= */
async function loadVotesChart() {
  const canvas = document.getElementById("votesChart");
  if (!canvas) return;

  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL.includes("PUT_YOUR")) return;

  try {
    const res = await fetch(APPS_SCRIPT_URL + "?action=votes", { method: "GET" });
    const data = await res.json();

    if (!data.ok) return;

    const counts = data.counts || {};
    const labels = MONSTERS.map(m => `(${m.id})`);
    const values = MONSTERS.map(m => Number(counts[m.id] || 0));

    drawBarChart(canvas, labels, values);
  } catch (e) {
    // لا نعمل رسالة مزعجة هنا
  }
}

/* =========================
   5) رسم بياني بالأعمدة (بدون مكتبات)
========================= */
function drawBarChart(canvas, labels, values) {
  const ctx = canvas.getContext("2d");

  // إعدادات
  const W = canvas.width = 900;
  const H = canvas.height = 420;

  ctx.clearRect(0, 0, W, H);

  // خلفية
  ctx.fillStyle = "#0b0f14";
  ctx.fillRect(0, 0, W, H);

  // إطار
  ctx.strokeStyle = "#1e2a3a";
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, W - 20, H - 20);

  const maxVal = Math.max(1, ...values);

  const padding = 60;
  const chartW = W - padding * 2;
  const chartH = H - padding * 2;

  const barCount = values.length;
  const barW = chartW / barCount;

  // عنوان
  ctx.fillStyle = "#e9eef5";
  ctx.font = "bold 18px Tahoma";
  ctx.fillText("الرسم البياني: من هو الوحش الأخطر؟", 40, 42);

  // أعمدة
  for (let i = 0; i < barCount; i++) {
    const x = padding + i * barW + 8;
    const barH = (values[i] / maxVal) * chartH;
    const y = H - padding - barH;

    // لون متغير بسيط
    ctx.fillStyle = `hsl(${(i * 25) % 360}, 70%, 55%)`;
    ctx.fillRect(x, y, barW - 16, barH);

    // رقم التصويت فوق العمود
    ctx.fillStyle = "#e9eef5";
    ctx.font = "bold 14px Tahoma";
    ctx.fillText(values[i], x + 8, y - 6);

    // لابل تحت
    ctx.fillStyle = "#b9c6d6";
    ctx.font = "13px Tahoma";
    ctx.fillText(labels[i], x + 8, H - padding + 20);
  }
}

/* =========================
   تشغيل عند فتح الصفحة
========================= */
document.addEventListener("DOMContentLoaded", () => {
  renderMonstersGrid();
  fillMonsterSelect();

  const form = document.getElementById("surveyForm");
  if (form) form.addEventListener("submit", submitSurvey);

  loadVotesChart();
});
