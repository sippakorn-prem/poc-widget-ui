(function () {
  var DEFAULT_CONFIG = {
    displayName: "ZimpleOmni",
    color: "#4f46e5",
    welcome:
      "Hi! This widget is served cross-origin. Send a message and the local demo echo will reply.",
  };

  var params = new URLSearchParams(window.location.search);
  var apiUrl = params.get("api") || "http://localhost:8080";
  var host = params.get("host") || referrerOrigin();
  var key = params.get("key") || "wk_demo";

  var app = document.getElementById("app");
  var isOpen = false;
  var state = "loading";
  var config = Object.assign({}, DEFAULT_CONFIG);
  var messages = [{ from: "bot", text: DEFAULT_CONFIG.welcome }];

  var chatIcon =
    '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  var closeIcon =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  function escapeHtml(value) {
    var div = document.createElement("div");
    div.textContent = String(value);
    return div.innerHTML;
  }

  function referrerOrigin() {
    if (!document.referrer) return "";
    try {
      return new URL(document.referrer).origin;
    } catch (_err) {
      return "";
    }
  }

  function initials(name) {
    return String(name)
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (part) {
        return part.charAt(0).toUpperCase();
      })
      .join("");
  }

  function reportSize() {
    window.parent.postMessage({ type: "omni:size", open: isOpen }, "*");
  }

  function messagesHtml() {
    return messages
      .map(function (message) {
        return (
          '<div class="row ' +
          message.from +
          '"><div class="msg">' +
          escapeHtml(message.text) +
          "</div></div>"
        );
      })
      .join("");
  }

  function statusHtml() {
    if (state === "loading") {
      return '<div class="row bot"><div class="msg">Loading widget configuration...</div></div>';
    }
    if (state === "blocked") {
      return '<div class="row bot"><div class="msg">Blocked by API: origin not allowed.</div></div>';
    }
    return messagesHtml();
  }

  function render() {
    document.documentElement.style.setProperty("--brand", config.color);

    app.innerHTML =
      (isOpen
        ? '<section class="panel" role="dialog" aria-label="Chat with ' +
          escapeHtml(config.displayName) +
          '">' +
          '<header class="head">' +
          '<div class="who">' +
          '<span class="avatar">' +
          escapeHtml(initials(config.displayName) || "ZO") +
          "</span>" +
          "<div>" +
          '<div class="name">' +
          escapeHtml(config.displayName) +
          "</div>" +
          '<div class="status"><i></i> Online</div>' +
          "</div>" +
          "</div>" +
          '<button class="icon" data-act="toggle" aria-label="Close chat">' +
          closeIcon +
          "</button>" +
          "</header>" +
          '<div class="log" id="log">' +
          statusHtml() +
          "</div>" +
          '<form class="composer" id="composer">' +
          '<input id="input" autocomplete="off" placeholder="Write a message..." aria-label="Message" ' +
          (state === "ready" ? "" : "disabled") +
          " />" +
          '<button class="send" type="submit" aria-label="Send message">' +
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3.4 20.4 21 12 3.4 3.6l0 6.5L15 12 3.4 13.9z"/></svg>' +
          "</button>" +
          "</form>" +
          "</section>"
        : "") +
      '<button class="launcher ' +
      (isOpen ? "is-open" : "") +
      '" data-act="toggle" aria-label="' +
      (isOpen ? "Close chat" : "Open chat") +
      '">' +
      (isOpen ? closeIcon : chatIcon) +
      "</button>";

    var log = document.getElementById("log");
    if (log) log.scrollTop = log.scrollHeight;

    var input = document.getElementById("input");
    if (input) input.focus();

    reportSize();
  }

  function send(text) {
    if (state !== "ready") return;

    var clean = String(text).trim();
    if (!clean) return;

    messages.push({ from: "me", text: clean });
    render();

    window.setTimeout(function () {
      messages.push({ from: "bot", text: 'You said: "' + clean + '"' });
      render();
    }, 500);
  }

  app.addEventListener("click", function (event) {
    var target =
      event.target instanceof Element
        ? event.target.closest("[data-act]")
        : null;
    if (target && target.getAttribute("data-act") === "toggle") {
      isOpen = !isOpen;
      render();
    }
  });

  app.addEventListener("submit", function (event) {
    event.preventDefault();
    var input = document.getElementById("input");
    send(input.value);
    input.value = "";
  });

  render();

  fetch(
    apiUrl +
      "/widget/v1/bootstrap?key=" +
      encodeURIComponent(key) +
      "&host=" +
      encodeURIComponent(host),
  )
    .then(function (response) {
      if (!response.ok) throw new Error(String(response.status));
      return response.json();
    })
    .then(function (bootstrapConfig) {
      config = Object.assign({}, DEFAULT_CONFIG, bootstrapConfig);
      messages[0] = { from: "bot", text: config.welcome };
      state = "ready";
      render();
    })
    .catch(function () {
      state = "blocked";
      render();
    });
})();
