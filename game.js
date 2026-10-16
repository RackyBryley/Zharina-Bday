
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  if (!$("j-card")) { return; }
  var HBD = window.HBD || {};
  var PESO = "\u20b1";

  function pop() { if (HBD.confetti) { HBD.confetti(); } }
  function money(n) { return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function peso(n) { return PESO + money(n); }
  function r2(n) { return Math.round(n * 100) / 100; }
  function parseAmt(s) {
    var v = parseFloat(String(s).replace(/[^0-9.]/g, ""));
    return isNaN(v) ? NaN : r2(v);
  }

  /* ---------- chart of accounts ---------- */
  var ACC = {
    cash:    { n: "Cash" },
    ar:      { n: "Accounts Receivable" },
    equip:   { n: "Equipment" },
    ap:      { n: "Accounts Payable" },
    contrib: { n: "Team Contributions" },
    bexp:    { n: "Birthday Expense" },
    bank:    { n: "Bank Charges" }
  };
  var CHOICES = ["cash", "ar", "equip", "ap", "contrib", "bexp"];

  var TX = [
    { txt: "The team pooled " + PESO + "3,000.00 for the party and deposited it in the bank.",
      dr: "cash", cr: "contrib", amt: 3000, memo: "Team contributions deposited",
      hd: "The money came into the bank, so an asset grew. Assets increase with a debit.",
      hc: "The money came from the team's contributions. That is income, and income increases with a credit." },
    { txt: "The team bought the birthday cake for " + PESO + "1,200.00 and paid with check #0101.",
      dr: "bexp", cr: "cash", amt: 1200, memo: "Birthday cake, check #0101",
      hd: "The cake is a cost of the celebration. That is an expense, and expenses increase with a debit.",
      hc: "Money went out of the bank account, so the asset Cash went down. Assets decrease with a credit." },
    { txt: "The team ordered flowers for " + PESO + "800.00. The florist will be paid next week.",
      dr: "bexp", cr: "ap", amt: 800, memo: "Flowers, to be paid next week",
      hd: "Flowers are a party cost too. That is an expense, so it is a debit.",
      hc: "Nothing has been paid yet, so the team owes the florist. That is a liability, and liabilities increase with a credit." }
  ];

  /* ---------- ledger state ---------- */
  var entries = [];                       /* {dr, cr, amt, memo, kind: "tx" | "adj", i} */
  var posted = [false, false, false];
  var cur = 0, tries = 0, busy = false;
  function journalDone() { return posted[0] && posted[1] && posted[2]; }
  function post(e) { entries.push(e); }
  function bal(a) {
    var d = 0;
    entries.forEach(function (e) { if (e.dr === a) { d += e.amt; } if (e.cr === a) { d -= e.amt; } });
    return r2(d);
  }

  /* ---------- 1. journal entries ---------- */
  function fillSelect(sel) {
    var html = '<option value="">Choose an account...</option>';
    CHOICES.forEach(function (k) { html += '<option value="' + k + '">' + ACC[k].n + "</option>"; });
    sel.innerHTML = html;
  }
  function setMsg(el, text, cls) { el.textContent = text || ""; el.className = "gmsg" + (cls ? " " + cls : ""); }

  function renderTx() {
    var t = TX[cur];
    $("j-step").textContent = "Entry " + (cur + 1) + " of " + TX.length;
    $("j-tx").textContent = t.txt;
    $("j-dr").value = ""; $("j-cr").value = ""; $("j-dra").value = ""; $("j-cra").value = "";
    setMsg($("j-msg"), "");
    $("j-show").hidden = true;
    tries = 0; busy = false;
    $("j-post").disabled = false;
  }

  function renderJournal() {
    var body = "", td = 0;
    entries.filter(function (e) { return e.kind === "tx"; })
      .sort(function (a, b) { return a.i - b.i; })
      .forEach(function (e) {
        body += '<tr><td>' + ACC[e.dr].n + '</td><td class="n">' + money(e.amt) + '</td><td class="n"></td></tr>' +
                '<tr><td class="ind">' + ACC[e.cr].n + '</td><td class="n"></td><td class="n">' + money(e.amt) + '</td></tr>' +
                '<tr class="memo"><td colspan="3">' + e.memo + '</td></tr>';
        td += e.amt;
      });
    $("j-body").innerHTML = body;
    $("j-td").textContent = money(td); $("j-tc").textContent = money(td);
    $("j-table").hidden = entries.length === 0;
    return td;
  }

  function showJournalState() {
    var total = renderJournal();
    if (journalDone()) {
      $("j-card").hidden = true;
      $("j-done").hidden = false;
      $("j-done-t").textContent = "All three entries are posted. Total debits " + peso(total) + " equal total credits " + peso(total) + ".";
    } else {
      $("j-card").hidden = false;
      $("j-done").hidden = true;
      cur = posted.indexOf(false);
      renderTx();
    }
  }

  function onPost() {
    if (busy) { return; }
    var t = TX[cur];
    var dr = $("j-dr").value, cr = $("j-cr").value;
    var da = parseAmt($("j-dra").value), ca = parseAmt($("j-cra").value);
    var msg = null;
    if (!dr || !cr) { msg = "Choose an account for both the debit and the credit."; }
    else if (isNaN(da) || isNaN(ca)) { msg = "Enter an amount for both lines."; }
    else if (da !== ca) { msg = "Debits must equal credits. Check your amounts."; }
    else if (dr === cr) { msg = "The debit and the credit can't be the same account."; }
    else if (dr === t.cr && cr === t.dr) { msg = "The debit and credit look swapped. " + t.hd; }
    else if (dr !== t.dr) { msg = "The debit isn't right yet. " + t.hd; }
    else if (cr !== t.cr) { msg = "The credit isn't right yet. " + t.hc; }
    else if (da !== t.amt) { msg = "The accounts are right. Check the amount in the transaction."; }

    if (msg) {
      tries += 1;
      setMsg($("j-msg"), msg, "bad");
      if (tries >= 2) { $("j-show").hidden = false; }
      return;
    }
    busy = true;
    $("j-post").disabled = true;
    post({ dr: t.dr, cr: t.cr, amt: t.amt, memo: t.memo, kind: "tx", i: cur });
    posted[cur] = true;
    setMsg($("j-msg"), "Posted. Debits equal credits.", "ok");
    renderJournal();
    setTimeout(function () {
      if (journalDone()) { pop(); }
      showJournalState();
      refreshAll();
    }, 900);
  }

  function showAnswer() {
    var t = TX[cur];
    $("j-dr").value = t.dr; $("j-cr").value = t.cr;
    $("j-dra").value = money(t.amt); $("j-cra").value = money(t.amt);
    setMsg($("j-msg"), "That's the answer. Press Post entry to record it.", "ok");
  }

  function autoPostAll() {
    TX.forEach(function (t, i) {
      if (!posted[i]) { post({ dr: t.dr, cr: t.cr, amt: t.amt, memo: t.memo, kind: "tx", i: i }); posted[i] = true; }
    });
    showJournalState();
  }

  fillSelect($("j-dr")); fillSelect($("j-cr"));
  $("j-post").addEventListener("click", onPost);
  $("j-show").addEventListener("click", showAnswer);
  $("j-next").addEventListener("click", function () { if (HBD.next) { HBD.next(); } });
  ["j-dra", "j-cra"].forEach(function (id) {
    var el = $(id);
    el.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); onPost(); } });
    el.addEventListener("blur", function () { var v = parseAmt(el.value); if (!isNaN(v)) { el.value = money(v); } });
  });

  /* ---------- 2. bank reconciliation ---------- */
  var BANK = 2950;
  var RITEMS = [
    { id: "chk", amt: 1200, ok: "bank", label: "Check #0101",
      txt: "Check #0101 for the cake, 1,200.00. The team already recorded it, but the bank hasn't cleared it yet.",
      hint: "Our books already show this check, so they don't need fixing. It's the bank that hasn't caught up." },
    { id: "fee", amt: 50, ok: "books", label: "Bank service charge",
      txt: "Bank service charge, 50.00. The bank deducted it, but the team hasn't recorded it yet.",
      hint: "The bank already deducted this fee. It's our books that don't have it yet." }
  ];
  var assign = {}, recDone = false, recLocked = false;

  function booksBal() {
    var c = 0;
    entries.forEach(function (e) {
      if (e.kind !== "tx") { return; }
      if (e.dr === "cash") { c += e.amt; }
      if (e.cr === "cash") { c -= e.amt; }
    });
    return r2(c);
  }

  function buildItems() {
    var html = "";
    RITEMS.forEach(function (it) {
      html += '<div class="ritem"><p>' + it.txt + '</p><div class="seg" role="group" aria-label="Which side needs the adjustment?">' +
              '<button type="button" data-id="' + it.id + '" data-side="books" aria-pressed="false">Adjust books</button>' +
              '<button type="button" data-id="' + it.id + '" data-side="bank" aria-pressed="false">Adjust bank</button></div></div>';
    });
    $("r-items").innerHTML = html;
  }

  function renderRec() {
    var ready = journalDone();
    $("r-gate").hidden = ready;
    $("r-body").hidden = !ready;
    if (!ready) { return; }
    var bk = booksBal(), adjBk = bk, adjBn = BANK, lbk = "", lbn = "";
    RITEMS.forEach(function (it) {
      var side = assign[it.id];
      if (side === "books") { adjBk = r2(adjBk - it.amt); lbk += "<li><span>Less: " + it.label + "</span><span>" + money(it.amt) + "</span></li>"; }
      if (side === "bank")  { adjBn = r2(adjBn - it.amt); lbn += "<li><span>Less: " + it.label + "</span><span>" + money(it.amt) + "</span></li>"; }
    });
    $("r-bk").textContent = peso(bk); $("r-bn").textContent = peso(BANK);
    $("r-bk-adj").innerHTML = lbk; $("r-bn-adj").innerHTML = lbn;
    $("r-bk-t").textContent = peso(adjBk); $("r-bn-t").textContent = peso(adjBn);
    var v = r2(Math.abs(adjBn - adjBk));
    var all = RITEMS.every(function (it) { return assign[it.id]; });
    var ok = all && v === 0;
    $("r-var").textContent = ok ? "Variance " + peso(0) + ". Reconciled." : "Variance " + peso(v);
    $("r-var").className = "rvar" + (ok ? " ok" : "");
    [].slice.call($("r-items").querySelectorAll("button")).forEach(function (b) {
      b.setAttribute("aria-pressed", assign[b.getAttribute("data-id")] === b.getAttribute("data-side") ? "true" : "false");
      b.disabled = recDone;
    });
    $("r-done").hidden = !recDone;
    if (recDone) {
      $("r-done-t").textContent = "Both sides agree at " + peso(adjBk) + ". Adjusting entry posted: debit Bank Charges 50.00, credit Cash 50.00.";
      setMsg($("r-msg"), "");
    }
    return ok;
  }

  function finishRec(quiet) {
    if (recDone) { return; }
    recDone = true;
    post({ dr: "bank", cr: "cash", amt: 50, memo: "Bank service charge", kind: "adj", i: 99 });
    renderRec();
    if (!quiet) { pop(); }
  }

  function onAssign(e) {
    var b = e.target.closest && e.target.closest("button[data-id]");
    if (!b || recDone) { return; }
    var id = b.getAttribute("data-id"), side = b.getAttribute("data-side");
    var it = RITEMS.filter(function (x) { return x.id === id; })[0];
    assign[id] = side;
    var ok = renderRec();
    if (side !== it.ok) { setMsg($("r-msg"), it.hint, "bad"); }
    else if (!ok) { setMsg($("r-msg"), "Good. Now the other difference.", "ok"); }
    if (ok) { finishRec(false); }
  }

  function autoRec(quiet) {
    RITEMS.forEach(function (it) { assign[it.id] = it.ok; });
    renderRec();
    finishRec(quiet);
  }

  buildItems();
  $("r-items").addEventListener("click", onAssign);
  $("r-auto").addEventListener("click", function () { autoPostAll(); refreshAll(); });
  $("r-next").addEventListener("click", function () { if (HBD.next) { HBD.next(); } });

  /* ---------- 3. financial statements ---------- */
  var tab = "tb", signed = false;
  var TITLE = '<div class="fh"><b>Accounting Team Birthday Fund</b><span>';

  function fr(label, val, cls) { return '<div class="fr ' + (cls || "") + '"><span>' + label + '</span><span class="v">' + val + "</span></div>"; }

  function sheetTB() {
    var rows = "", td = 0, tc = 0;
    ["cash", "ar", "equip", "ap", "contrib", "bexp", "bank"].forEach(function (a) {
      var b = bal(a);
      if (b === 0) { return; }
      var d = b > 0 ? money(b) : "", c = b < 0 ? money(-b) : "";
      if (b > 0) { td += b; } else { tc += -b; }
      rows += '<div class="fr tb"><span>' + ACC[a].n + '</span><span class="v">' + d + '</span><span class="v">' + c + "</span></div>";
    });
    td = r2(td); tc = r2(tc);
    return { td: td, tc: tc,
      html: TITLE + 'Trial balance, after the bank reconciliation</span></div>' +
        '<div class="fr tb th"><span>Account</span><span class="v">Debit</span><span class="v">Credit</span></div>' + rows +
        '<div class="fr tb dtot"><span>Totals</span><span class="v">' + money(td) + '</span><span class="v">' + money(tc) + "</span></div>" };
  }

  function incomeParts() {
    var rev = r2(-bal("contrib")), e1 = bal("bexp"), e2 = bal("bank");
    return { rev: rev, e1: e1, e2: e2, exp: r2(e1 + e2), ni: r2(rev - e1 - e2) };
  }

  function sheetIS() {
    var p = incomeParts();
    return TITLE + 'Income statement, for the birthday month-end</span></div>' +
      fr("Revenue", "", "sec") + fr("Team Contributions", money(p.rev), "in") + fr("Total revenue", money(p.rev), "tot") +
      fr("Expenses", "", "sec") + fr("Birthday Expense", money(p.e1), "in") + fr("Bank Charges", money(p.e2), "in") +
      fr("Total expenses", money(p.exp), "tot") +
      fr("Net income", peso(p.ni), "dtot");
  }

  function sheetBS() {
    var p = incomeParts(), cash = bal("cash"), ap = r2(-bal("ap"));
    var assets = r2(cash + bal("ar") + bal("equip"));
    return { assets: assets, le: r2(ap + p.ni),
      html: TITLE + 'Balance sheet, at month-end</span></div>' +
        fr("Assets", "", "sec") + fr("Cash", money(cash), "in") + fr("Total assets", peso(assets), "dtot") +
        fr("Liabilities", "", "sec") + fr("Accounts Payable", money(ap), "in") +
        fr("Equity", "", "sec") + fr("Net income retained", money(p.ni), "in") +
        fr("Total liabilities and equity", peso(r2(ap + p.ni)), "dtot") };
  }

  function renderFS() {
    var ready = recDone;
    $("f-gate").hidden = ready;
    $("f-body").hidden = !ready;
    if (!ready) { return; }
    var tb = sheetTB(), bs = sheetBS(), check;
    if (tab === "tb") { $("f-sheet").innerHTML = tb.html; check = "Debits equal credits at " + peso(tb.td) + "."; }
    else if (tab === "is") { $("f-sheet").innerHTML = sheetIS(); check = "Net income of " + peso(incomeParts().ni) + " flows into equity on the balance sheet."; }
    else { $("f-sheet").innerHTML = bs.html; check = "Assets of " + peso(bs.assets) + " equal liabilities plus equity of " + peso(bs.le) + "."; }
    $("f-check").textContent = check;
    [].slice.call(document.querySelectorAll(".ftabs button")).forEach(function (b) {
      b.setAttribute("aria-selected", b.getAttribute("data-tab") === tab ? "true" : "false");
    });
    $("f-stamp").hidden = !signed;
    $("f-sign").parentNode.hidden = signed;
    if (signed) { $("f-final").textContent = "Reviewed and approved by Ma'am Zharina. The fund closes with " + peso(incomeParts().ni) + " net income, and every peso is accounted for."; }
  }

  document.querySelector(".ftabs").addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("button[data-tab]");
    if (!b) { return; }
    tab = b.getAttribute("data-tab");
    renderFS();
  });
  $("f-sign").addEventListener("click", function () { signed = true; renderFS(); pop(); });
  $("f-auto").addEventListener("click", function () { autoPostAll(); autoRec(true); refreshAll(); });

  /* ---------- wiring ---------- */
  function refreshAll() { renderRec(); renderFS(); }
  [".sg2", ".sg3"].forEach(function (sel) {
    var sec = document.querySelector(sel);
    if (!sec || !window.MutationObserver) { return; }
    new MutationObserver(function () { if (sec.classList.contains("active")) { refreshAll(); } })
      .observe(sec, { attributes: true, attributeFilter: ["class"] });
  });

  showJournalState();
  refreshAll();
})();
