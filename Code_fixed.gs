/* =========================
   City of Failure - Apps Script (CORS-SAFE)
   - يدعم GET/POST
   - يدعم JSONP عبر ?callback=
   - مناسب لـ GitHub Pages بدون مشاكل CORS
========================= */

var ADMIN_KEY = "CHANGE_ME"; // غيّره لمفتاح سري

function doGet(e) {
  try {
    var action = String(e.parameter.action || "").toLowerCase();

    if (action === "votes") return handleVotes(e);
    if (action === "stories") return handleStories(e);

    // دعم إرسال التصويت عبر GET (بديل لـ POST لتفادي CORS)
    if (action === "submit") return handleSubmitFromGet(e);

    return jsonResponse(e, {
      ok: true,
      message: "City of Failure API is running",
      usage: {
        submit_get: "GET ?action=submit&age=..&status=..&monster=..&name=..&story=..",
        submit_post: "POST JSON {action:'submit', ...}",
        votes: "GET ?action=votes"
      }
    });
  } catch (err) {
    return jsonResponse(e, { ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    var sheet = getSheet_();
    var data = JSON.parse(e.postData.contents || "{}");

    if (!data || data.action !== "submit") {
      return jsonResponse({ parameter: {} }, { ok: false, error: "Invalid action" });
    }

    sheet.appendRow([
      new Date(),
      data.name || "",
      data.age || "",
      data.status || "",
      data.monster || "",
      data.story || ""
    ]);

    return jsonResponse({ parameter: {} }, { ok: true });
  } catch (err) {
    return jsonResponse({ parameter: {} }, { ok: false, error: String(err) });
  }
}

function handleSubmitFromGet(e) {
  var sheet = getSheet_();

  var age = (e.parameter.age || "").trim();
  var status = (e.parameter.status || "").trim();
  var monster = (e.parameter.monster || "").trim();

  if (!age || !status || !monster) {
    return jsonResponse(e, { ok: false, error: "age, status, monster are required" });
  }

  sheet.appendRow([
    new Date(),
    (e.parameter.name || "").trim(),
    age,
    status,
    monster,
    (e.parameter.story || "").trim()
  ]);

  return jsonResponse(e, { ok: true });
}

function handleVotes(e) {
  var sheet = getSheet_();
  var values = sheet.getDataRange().getValues();

  var counts = {};
  for (var i = 1; i < values.length; i++) {
    var monsterId = values[i][4];
    if (!monsterId) continue;
    monsterId = String(monsterId).trim();
    if (!monsterId) continue;
    counts[monsterId] = (counts[monsterId] || 0) + 1;
  }

  return jsonResponse(e, { ok: true, counts: counts });
}


function handleStories(e) {
  // حماية بسيطة: مفتاح إدارة
  var key = String((e.parameter.key || "")).trim();
  if (!ADMIN_KEY || ADMIN_KEY === "CHANGE_ME") {
    return jsonResponse(e, { ok: false, error: "ADMIN_KEY not set" });
  }
  if (key !== ADMIN_KEY) {
    return jsonResponse(e, { ok: false, error: "Unauthorized" });
  }

  var sheet = getSheet_();
  var values = sheet.getDataRange().getValues();

  // ترتيب الأعمدة: [0]=timestamp, [1]=name, [2]=age, [3]=status, [4]=monster, [5]=story
  var stories = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var story = row[5];
    if (story === null || story === undefined) story = "";
    story = String(story).trim();
    if (!story) continue;

    stories.push({
      timestamp: row[0] ? String(row[0]) : "",
      name: row[1] ? String(row[1]) : "",
      age: row[2] ? String(row[2]) : "",
      status: row[3] ? String(row[3]) : "",
      monster: row[4] ? String(row[4]) : "",
      story: story
    });
  }

  // أحدث القصص أولاً
  stories.reverse();

  // limit اختياري
  var limit = parseInt(e.parameter.limit || "200", 10);
  if (isNaN(limit) || limit <= 0) limit = 200;
  if (stories.length > limit) stories = stories.slice(0, limit);

  return jsonResponse(e, { ok: true, stories: stories, count: stories.length });
}

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Sheet1");
  if (!sheet) sheet = ss.getSheets()[0];
  return sheet;
}

/* =========================
   JSON / JSONP Response
========================= */
function jsonResponse(e, obj) {
  var callback = e && e.parameter ? (e.parameter.callback || "") : "";
  var payload = JSON.stringify(obj);

  if (callback) {
    return ContentService
      .createTextOutput(callback + "(" + payload + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(payload)
    .setMimeType(ContentService.MimeType.JSON);
}
