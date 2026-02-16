/* =========================================================
   City of Failure - app.js
   - عربي فقط
   - ربط Google Apps Script (Google Sheet)
   - تصويت + إرسال قصة الزائر
   - جلب النتائج + رسم بياني بالأعمدة
   ========================================================= */

// 🔥 رابط Google Apps Script (كما أرسلته أنت)
const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwX8MQLQreZazVyuu5mIOqgjESmwNJ4N0WaCBIkUR_ch2wQD9Cp1CGuhvgxCDurbQL-FA/exec";

// =========================================================
// 1) بيانات الوحوش الـ 12 (بالترتيب)
// =========================================================
const MONSTERS = [
  { id: 1, name: "الراحة اللذيذة", symbol: "🎵", code: "monster-01" },
  { id: 2, name: "الببغاء (التقليد)", symbol: "🦜", code: "monster-02" },
  { id: 3, name: "الصديق (التأجيل)", symbol: "🕰️", code: "monster-03" },
  { id: 4, name: "المرأة اللعوب (الهوى)", symbol: "👠", code: "monster-04" },
  { id: 5, name: "العملاق (الخوف)", symbol: "🗿", code: "monster-05" },
  { id: 6, name: "السجّان (الماضي)", symbol: "🔑", code: "monster-06" },
  { id: 7, name: "التوأم (التسويف)", symbol: "🪞", code: "monster-07" },
  { id: 8, name: "الساحر (التشتت)", symbol: "✨", code: "monster-08" },
  { id: 9, name: "القرد (الزمن/الدوبامين)", symbol: "🐒", code: "monster-09" },
  { id: 10, name: "وحش الداعم (الملاك الكاذب)", symbol: "🪽", code: "monster-10" },
  { id: 11, name: "وحش التردد (الثعبان)", symbol: "🐍", code: "monster-11" },
  { id: 12, name: "وحش العنكبوت (الفلسفة)", symbol: "🕸️", code: "monster-12" },
];

// =========================================================
// 2) أدوات مساعدة
// =========================================================
function $(selector) {
  return document.querySelector(selector);
}
function escapeHTML(str) {
  if (!str) return "";
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// =========================================================
// 3) رسم أعمدة بسيط (Canvas) بدون مكتبات
// =========================================================
function drawBarChart(canvasId, labels, values) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // حجم مناسب للموبايل
  canvas.width = canvas.parentElement.offsetWidth;
  canvas.height = 360;

  const W = canvas.width;
  const H = canvas.height;

  // تنظيف
  ctx.clearRect(0, 0, W, H);

  // خلفية
  ctx.fillStyle = "#0b0f1a";
  ctx.fillRect(0, 0, W, H);

  const padding = 28;
  const chartW = W - padding * 2;
  const chartH = H - padding * 2;

  const maxVal = Math.max(...values, 1);
  const barCount = values.length;

  const gap = 10;
  const barW = Math.max(14, (chartW - gap * (barCount - 1)) / barCount);

  // خطوط خفيفة
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding + (chartH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + chartW, y);
    ctx.stroke();
  }

  // رسم الأعمدة
  for (let i = 0; i < barCount; i++) {
    const v = values[i];
    const barH = (v / maxVal) * (chartH - 60);

    const x = padding + i * (barW + gap);
    const y = padding + chartH - barH - 42;

    // عمود
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(x, y, barW, barH);

    // الرقم فوق العمود
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.fillText(String(v), x + barW / 2, y - 8);

    // الاسم تحت
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";

    // نكتب رقم الوحش فقط لتفادي تزاحم النص
    ctx.fillText(labels[i], x + barW / 2, padding + chartH - 16);
  }

  // عنوان
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "right";
  ctx.fillText("الأخطر حسب تصويت الزائرين", W - 18, 22);
}

// =========================================================
// 4) بناء قائمة الوحوش + البطاقات
// =========================================================
function buildMonstersGrid() {
  const grid = $("#monstersGrid");
  if (!grid) return;

  grid.innerHTML = "";

  MONSTERS.forEach((m) => {
    const card = document.createElement("a");
    card.className = "monster-card";
    card.href = `monsters/${m.code}.html`;

    card.innerHTML = `
      <div class="monster-img">
        <img src="images/${m.code}.png" alt="${escapeHTML(m.name)}" />
      </div>
      <div class="monster-meta">
        <div class="monster-title">
          <span class="monster-id">#${m.id}</span>
          <span class="monster-name">${escapeHTML(m.name)}</span>
        </div>
        <div class="monster-symbol">${escapeHTML(m.symbol)}</div>
      </div>
    `;

    grid.appendChild(card);
  });

  // ملحوظة لو الصور مش موجودة
  grid.querySelectorAll("img").forEach((img) => {
    img.onerror = () => {
      img.src = "images/placeholder.png";
    };
  });
}

// =========================================================
// 5) إرسال الاستبيان إلى Google Sheet
// =========================================================
async function submitSurvey(e) {
  e.preventDefault();

  const name = $("#visitorName")?.value?.trim() || "";
  const age = $("#visitorAge")?.value?.trim() || "";
  const status = $("#visitorStatus")?.value || "";
  const monster = $("#dangerMonster")?.value || "";
  const story = $("#visitorStory")?.value?.trim() || "";

  // تحقق بسيط
  if (!age) return alert("من فضلك أدخل العمر.");
  if (!status) return alert("من فضلك اختر: زائر أم مقيم.");
  if (!monster) return alert("من فضلك اختر الوحش الأخطر.");

  const btn = $("#submitBtn");
  if (btn) {
    btn.disabled = true;
    btn.innerText = "جارٍ الإرسال...";
  }

  try {
    // نستخدم GET لتفادي مشاكل CORS
    const params = new URLSearchParams({
      action: "submit",
      name,
      age,
      status,
      monster,
      story,
      ts: new Date().toISOString(),
    });

    const res = await fetch(`${APPS_SCRIPT_URL}?${params.toString()}`);
    const data = await res.json();

    if (data.status !== "success") {
      throw new Error(data.message || "حدث خطأ غير معروف.");
    }

    alert("تم إرسال إجابتك بنجاح ✅ شكراً لك!");

    // تفريغ
    $("#visitorStory").value = "";
    $("#dangerMonster").value = "";

    // تحديث الرسم البياني
    await loadVotesChart();
  } catch (err) {
    console.error(err);
    alert("للأسف حدث خطأ أثناء الإرسال. تأكد أن Apps Script منشور كـ Web App.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = "إرسال";
    }
  }
}

// =========================================================
// 6) جلب التصويتات من Google Sheet + رسم بياني
// =========================================================
async function loadVotesChart() {
  const loading = $("#chartLoading");
  if (loading) loading.style.display = "block";

  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=stats`);
    const data = await res.json();

    if (data.status !== "success") throw new Error("Stats failed");

    // data.votes: { "1": 5, "2": 10, ... }
    const votes = data.votes || {};

    const labels = MONSTERS.map((m) => String(m.id));
    const values = MONSTERS.map((m) => Number(votes[String(m.id)] || 0));

    drawBarChart("votesChart", labels, values);

    // عرض الأكثر خطورة
    const maxVal = Math.max(...values, 0);
    const maxIndex = values.indexOf(maxVal);
    const top = MONSTERS[maxIndex];

    const topBox = $("#topMonster");
    if (topBox) {
      if (maxVal === 0) {
        topBox.innerHTML = `لا توجد تصويتات بعد. كن أول من يصوّت 😄`;
      } else {
        topBox.innerHTML = `
          الوحش الأخطر حتى الآن هو:
          <b>#${top.id} — ${escapeHTML(top.name)}</b>
          (${maxVal} تصويت)
        `;
      }
    }
  } catch (err) {
    console.error(err);
    const topBox = $("#topMonster");
    if (topBox) topBox.innerHTML = "تعذر تحميل الرسم البياني حالياً.";
  } finally {
    if (loading) loading.style.display = "none";
  }
}

// =========================================================
// 7) تشغيل الصفحة
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
  buildMonstersGrid();

  // ربط الفورم
  const form = $("#surveyForm");
  if (form) form.addEventListener("submit", submitSurvey);

  // تحميل الرسم البياني
  loadVotesChart();
});
