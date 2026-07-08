(function () {
  var COLLAPSED = { w: 96, h: 96 };
  var OPEN = { w: 400, h: 640 };
  var bootScript = document.currentScript;

  function widgetOrigin(script) {
    if (script && script.src) {
      try {
        return new URL(script.src).origin;
      } catch (_err) {
        // Fall through to same-origin fallback.
      }
    }
    return window.location.origin;
  }

  function mount() {
    if (window.__omniMounted) return;
    window.__omniMounted = true;

    var script = bootScript;
    var origin = widgetOrigin(script);
    var key = (script && script.dataset.widgetKey) || "wk_demo";
    var apiUrl = (script && script.dataset.apiUrl) || "http://localhost:8080";
    var host = window.location.origin;

    var frameUrl = new URL(origin + "/frame/");
    frameUrl.searchParams.set("key", key);
    frameUrl.searchParams.set("host", host);
    frameUrl.searchParams.set("api", apiUrl);

    var frame = document.createElement("iframe");
    frame.title = "OmniChat";
    frame.src = frameUrl.toString();
    frame.setAttribute("aria-label", "Chat widget");
    Object.assign(frame.style, {
      position: "fixed",
      bottom: "20px",
      right: "20px",
      width: COLLAPSED.w + "px",
      height: COLLAPSED.h + "px",
      maxWidth: "calc(100vw - 40px)",
      maxHeight: "calc(100vh - 40px)",
      border: "0",
      background: "transparent",
      colorScheme: "normal",
      zIndex: "2147483647",
    });

    document.body.appendChild(frame);

    window.addEventListener("message", function (event) {
      if (event.origin !== origin) return;
      var data = event.data;
      if (!data || data.type !== "omni:size") return;
      var size = data.open ? OPEN : COLLAPSED;
      frame.style.width = size.w + "px";
      frame.style.height = size.h + "px";
    });
  }

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
