const $ = (s) => document.querySelector(s);
const log = (x) => { const el = $("#log"); el.textContent += `${x}\n`; };

let paymentToken = null;
let paymentId = null;

const BASE = "https://sandbox.gestpay.net/api/v1"; // Sandbox

async function callApi(path, method = "GET", body) {
  const apiKey = $("#apiKey").value.trim();
  if (!apiKey) throw new Error("ApiKey mancante (solo per test locale).");

  const resp = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Authorization": `apikey ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!resp.ok) throw new Error(`HTTP ${resp.status} - ${text}`);
  return json;
}

$("#btnCreate").addEventListener("click", async () => {
  $("#btnCreate").disabled = true;
  try {
    const body = {
      shopLogin: $("#shopLogin").value.trim(),
      amount: $("#amount").value.trim(),
      currency: $("#currency").value.trim(),
      shopTransactionID: $("#shopTxId").value.trim() || `demo_${Date.now()}`
    };

    log(`→ POST /payment/create\n${JSON.stringify(body, null, 2)}`);
    const res = await callApi("/payment/create", "POST", body);
    log(`← ${JSON.stringify(res, null, 2)}`);

    if (res?.payload) {
      paymentToken = res.payload.paymentToken;
      paymentId    = res.payload.paymentID;
      $("#btnMethods").disabled = false;
      $("#btnSubmit").disabled  = false;
      log(`paymentToken=${paymentToken}\npaymentId=${paymentId}`);
    } else {
      throw new Error("Payload mancante nella response.");
    }
  } catch (e) {
    log(`✖ Create error: ${e.message}`);
  } finally {
    $("#btnCreate").disabled = false;
  }
});

$("#btnMethods").addEventListener("click", async () => {
  if (!paymentId) return;
  try {
    const lang = 1; // 1=IT, 2=EN… (mappatura standard)
    const path = `/payment/methods/${paymentId}/${lang}`;
    log(`→ GET ${path}`);
    const res = await callApi(path, "GET");
    log(`← ${JSON.stringify(res, null, 2)}`);
  } catch (e) {
    log(`✖ Methods error: ${e.message}`);
  }
});

$("#btnSubmit").addEventListener("click", async () => {
  if (!paymentId || !paymentToken) return;
  try {
    const body = { paymentID: paymentId, paymentToken };
    log(`→ POST /payment/submit\n${JSON.stringify(body, null, 2)}`);
    const res = await callApi("/payment/submit", "POST", body);
    log(`← ${JSON.stringify(res, null, 2)}`);

    // Redirect/lightbox: se res.payload.userRedirect.href è valorizzato
    const href = res?.payload?.userRedirect?.href;
    if (href) {
      log(`↻ Redirect a ${href}`);
      window.location.href = href; // oppure apri in lightbox/iframe
    } else {
      log("Nessun redirect fornito (alcuni metodi APM lo gestiscono diversamente).");
    }
  } catch (e) {
    log(`✖ Submit error: ${e.message}`);
  }
});
``
