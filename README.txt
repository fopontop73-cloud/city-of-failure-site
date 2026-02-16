خطوات تشغيل الرسم البياني عند الزائر (حل مشكلة عدم الظهور)

المشكلة الأساسية:
- رابط Google Apps Script الحالي يرجّع صفحة تسجيل دخول (غير منشور للعامة)، فيفشل الجلب عند الزائر.
- حتى لو كان الرابط صحيحًا، CORS قد يمنع fetch في GitHub Pages.

الحل الموجود في هذه النسخة:
1) ملف app.js تم تعديله ليستخدم JSONP في جلب التصويتات وإرسال الاستبيان (GET) لتفادي CORS.
2) أضفت ملف Code_fixed.gs (بديل للـ Code.gs) يدعم:
   - action=votes (إرجاع counts)
   - action=submit عبر GET (لتفادي CORS) + ما زال يدعم POST
   - JSONP عبر ?callback=

ماذا تفعل أنت الآن؟
A) في مشروع Google Apps Script:
   1. افتح Apps Script المرتبط بالـ Google Sheet
   2. استبدل محتوى Code.gs بالكامل بمحتوى Code_fixed.gs
   3. Deploy -> New deployment
   4. Select type: Web app
   5. Execute as: Me
   6. Who has access: Anyone (أو Anyone with Google account)
   7. Deploy ثم انسخ رابط /exec وضعه في app.js (المتغير APPS_SCRIPT_URL)

B) ارفع ملفات الموقع على GitHub Pages:
   - index.html
   - app.js
   - 404.html
   (ومجلدات الصور/monsters إن وجدت)

ملاحظة عن مشكلة لون نص الاختيارات:
- تم إضافة CSS داخل index.html ليجبر لون option داخل select أن يكون أبيض وخلفيته داكنة.


============================
ميزة جديدة: صفحة الإدارة (عرض كل القصص)

- تم إضافة صفحة: admin.html
- هذه الصفحة تجلب كل القصص المحفوظة داخل Google Sheet.

مهم جدًا للأمان:
- لا يوجد "أمان حقيقي" لصفحات الإدارة على GitHub Pages (Static Hosting).
- لذلك تم إضافة حماية بسيطة بمفتاح:
  1) داخل Apps Script (Code_fixed.gs) يوجد متغير: ADMIN_KEY
     غيّره من "CHANGE_ME" إلى أي كلمة سر طويلة.
  2) عند فتح admin.html اكتب نفس المفتاح في خانة Admin Key ثم اضغط "تحميل القصص".

API المستخدم:
- GET ?action=stories&key=ADMIN_KEY&limit=200
- يرجع JSON/JSONP: { ok:true, stories:[...], count:n }

نصيحة:
- لا تضع رابط admin.html في القائمة الرئيسية، وشاركها فقط مع من تثق به.
============================
