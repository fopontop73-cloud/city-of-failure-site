/* =========================
   City of Failure - Apps Script
   يعمل مع GitHub Pages
========================= */

function doGet(e) {
  try {
    var action = (e.parameter.action || "").toLowerCase();

    // 1) جلب التصويتات للرسم البياني
    if (action === "votes") {
      return handleVotes();
    }

    // 2) اختبار سريع لو فتحت الرابط في المتصفح
    return jsonResponse({
      ok: true,
      message: "City of Failure API is running",
      usage: {
        submit: "POST to this URL",
        votes: "GET ?action=votes"
      }
    });

  } catch (err) {
    return jsonResponse({
      ok: false,
      error: err.toString()
    });
  }
}

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
    if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    var body = e.postData.contents;
    var data = JSON.parse(body);

    // حماية بسيطة
    if (!data || data.action !== "submit") {
      return jsonResponse({ ok: false, error: "Invalid action" });
    }

    sheet.appendRow([
      new Date(),
      data.name || "",
      data.age || "",
      data.status || "",
      data.monster || "",
      data.story || ""
    ]);

    return jsonResponse({ ok: true });

  } catch (err) {
    return jsonResponse({
      ok: false,
      error: err.toString()
    });
  }
}

/* =========================
   حساب التصويتات
========================= */
function handleVotes() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Sheet1");
  if (!sheet) sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  var values = sheet.getDataRange().getValues();

  // العمود الخامس = monster
  // [0]=timestamp, [1]=name, [2]=age, [3]=status, [4]=monster, [5]=story
  var counts = {};

  for (var i = 1; i < values.length; i++) {
    var monsterId = values[i][4];
    if (!monsterId) continue;

    monsterId = String(monsterId).trim();
    if (!monsterId) continue;

    counts[monsterId] = (counts[monsterId] || 0) + 1;
  }

  return jsonResponse({
    ok: true,
    counts: counts
  });
}

/* =========================
   JSON Response + CORS
========================= */
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
