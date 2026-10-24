// ================= SETTINGS (edit these) =================
// Your WhatsApp number: country code, no + or spaces (South Africa = 27, drop the first 0)
var WHATSAPP = "27713875231";
// Bread choices shown on every sandwich page
var BREADS = ["Sourdough", "Ciabatta", "Seed loaf", "White", "Brown"];
// Delivery / collection times
var TIMES = ["14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
// =========================================================

var KEY = "freshSandwichesCart", memCart = [];
function loadCart() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return memCart; }
}
function saveCart(c) {
  memCart = c;
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
}
function $(id) { return document.getElementById(id); }
function el(tag, attrs, kids) {
  var e = document.createElement(tag);
  Object.keys(attrs || {}).forEach(function (k) { if (k === "text") e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); });
  (kids || []).forEach(function (c) { e.appendChild(c); });
  return e;
}
function updateBar() {
  var bar = $("bar"); if (!bar) return;
  var n = loadCart().reduce(function (a, l) { return a + l.qty; }, 0);
  $("count").textContent = n;
  bar.classList.toggle("show", n > 0);
}

var page = document.body.getAttribute("data-page");

// ---------- Sandwich page ----------
if (page === "item") {
  var bread = $("bread");
  BREADS.forEach(function (b) { bread.appendChild(el("option", { text: b })); });
  var qty = 1;
  $("minus").onclick = function () { if (qty > 1) { qty--; $("qty").textContent = qty; } };
  $("plus").onclick = function () { if (qty < 20) { qty++; $("qty").textContent = qty; } };
  $("add").onclick = function () {
    var cart = loadCart();
    cart.push({ name: document.body.getAttribute("data-name"), bread: bread.value, qty: qty, note: $("note").value.trim() });
    saveCart(cart);
    $("added").classList.add("show");
    $("add").hidden = true;
    updateBar();
    $("added").scrollIntoView({ behavior: "smooth", block: "center" });
  };
}

// ---------- Build your own page ----------
if (page === "build") {
  var bbread = $("bread");
  BREADS.forEach(function (b) { bbread.appendChild(el("option", { text: b })); });
  var bq = 1;
  $("minus").onclick = function () { if (bq > 1) { bq--; $("qty").textContent = bq; } };
  $("plus").onclick = function () { if (bq < 20) { bq++; $("qty").textContent = bq; } };
  [].slice.call(document.querySelectorAll(".chips input")).forEach(function (c) {
    var sub = document.querySelector('select.sub[data-for="' + c.value + '"]');
    if (sub) c.addEventListener("change", function () { sub.classList.toggle("show", c.checked); });
  });
  var picked = function (name) {
    return [].slice.call(document.querySelectorAll('input[name="' + name + '"]:checked')).map(function (x) {
      var sub = document.querySelector('select.sub[data-for="' + x.value + '"]');
      return sub ? x.value + " (" + sub.value + ")" : x.value;
    });
  };
  $("add").onclick = function () {
    var groups = [["Fillings", "fillings"], ["Cheese", "cheese"], ["Salad / extras", "salad"], ["Sauces", "sauces"]], lines = [];
    groups.forEach(function (g) { var p = picked(g[1]); if (p.length) lines.push(g[0] + ": " + p.join(", ")); });
    if (!lines.length) { $("builderr").style.display = "block"; return; }
    $("builderr").style.display = "none";
    var cart = loadCart();
    cart.push({ name: "Build your own", bread: bbread.value, qty: bq, note: $("note").value.trim(), details: lines.join("\n") });
    saveCart(cart);
    $("added").classList.add("show");
    $("add").hidden = true;
    updateBar();
    $("added").scrollIntoView({ behavior: "smooth", block: "center" });
  };
}

// ---------- Order page ----------
if (page === "order") {
  var d = $("date"), t = new Date(); t.setDate(t.getDate() + 1);
  var iso = t.getFullYear() + "-" + ("0" + (t.getMonth() + 1)).slice(-2) + "-" + ("0" + t.getDate()).slice(-2);
  d.min = iso; d.value = iso;
  TIMES.forEach(function (x) { $("time").appendChild(el("option", { text: x })); });
  var v = function (id) { return $(id).value.trim(); };

  var render = function () {
    var cart = loadCart(), lines = $("lines"); lines.textContent = "";
    cart.forEach(function (l, i) {
      var left = el("div", {}, [el("b", { text: l.qty + " × " + l.name }), el("small", { text: l.bread })]);
      if (l.details) l.details.split("\n").forEach(function (d) { left.appendChild(el("small", { text: d })); });
      if (l.note) left.appendChild(el("small", { text: "Note: " + l.note }));
      var minus = el("button", { type: "button", "aria-label": "Fewer", text: "−" });
      var plus = el("button", { type: "button", "aria-label": "More", text: "+" });
      minus.onclick = function () { if (l.qty > 1) { l.qty--; saveCart(cart); render(); } };
      plus.onclick = function () { if (l.qty < 20) { l.qty++; saveCart(cart); render(); } };
      var rm = el("button", { type: "button", "class": "link", text: "Remove" });
      rm.onclick = function () { cart.splice(i, 1); saveCart(cart); render(); };
      lines.appendChild(el("div", { "class": "line" }, [left, el("div", { "class": "ctl" }, [el("div", { "class": "qty" }, [minus, el("output", { text: String(l.qty) }), plus]), rm])]));
    });
    $("empty").hidden = cart.length > 0;
    $("details").hidden = cart.length === 0;
  };

  $("send").onclick = function () {
    var cart = loadCart(), err = $("err");
    var fail = function (m) { err.textContent = m; err.style.display = "block"; };
    if (!cart.length) return fail("Please add a sandwich first.");
    if (!v("name") || !v("phone") || !v("date")) return fail("Please fill in your name, phone number and date.");
    if (v("how").indexOf("Delivery") === 0 && !v("address")) return fail("Please add your house number for delivery.");
    if (v("date") < iso) return fail("Sorry, orders need to be placed at least a day in advance.");
    err.style.display = "none";
    var msg = "Hi! I’d like to order:\n\n";
    cart.forEach(function (l) {
      msg += "🥪 " + l.qty + " × " + l.name + "\n   " + l.bread + "\n" + (l.details ? "   " + l.details.split("\n").join("\n   ") + "\n" : "") + (l.note ? "   Note: " + l.note + "\n" : "") + "\n";
    });
    msg += "Name: " + v("name") + "\nPhone: " + v("phone") + "\n" + v("how") + (v("address") ? " – " + v("address") : "") + "\nDate: " + v("date") + " at " + v("time");
    if (v("gnotes")) msg += "\nExtra notes: " + v("gnotes");
    window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(msg), "_blank");
  };
  render();
}

updateBar();
