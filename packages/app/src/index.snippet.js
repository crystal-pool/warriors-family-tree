// This file contains the original js snippet that is inlined to index.html.
// The Vite plugin (resourceLoadTrackingPlugin in vite.config.ts) adds
// onload/onerror attributes to Vite-injected script/CSS tags that call
// window.__rlc(name, element, event) directly.

// No more polyfills for IE or Edge Legacy. Sorry 🌚

(function () {
    var traceQueue = [];
    var pushTrace = function () {
        traceQueue.push([new Date()].concat(Array.from(arguments)));
    }
    function emitResourceLoadStatus(name, src, success) {
        pushTrace("_RL", name, new URL(src, document.location).href, success);
    }
    window.__rlc = function (name, el, ev) {
        emitResourceLoadStatus(name, el.src || el.href, ev.type === "load");
    }
    window.__drainBacklog = function (cb) {
        traceQueue.forEach(cb);
        traceQueue = undefined;
        pushTrace = function () {
            cb([new Date()].concat(Array.from(arguments)));
        }
        delete window.__drainBacklog;
    }
    function addCDNLink(trackId, nominalUrl) {
        var l = document.createElement("link");
        var lf = document.createElement("link");
        var loaded = false;
        l.rel = lf.rel = "stylesheet";
        l.onload = function () {
            loaded = true;
            emitResourceLoadStatus(trackId, nominalUrl, true);
            lf.remove();
        }
        l.onerror = function (e) {
            console.log(e);
            emitResourceLoadStatus(trackId, nominalUrl, false);
        }
        l.href = nominalUrl;
        var fallbackUrl = nominalUrl.replace("fonts.googleapis.com", "fonts.proxy.ustclug.org");
        if (fallbackUrl !== nominalUrl) {
            window.setTimeout(function () {
                if (loaded) { return; }
                lf.onload = function () {
                    emitResourceLoadStatus(trackId, fallbackUrl, true);
                    l.remove();
                }
                l.onerror = function () {
                    emitResourceLoadStatus(trackId, fallbackUrl, false);
                }
                lf.href = fallbackUrl;
                document.head.append(lf);
                pushTrace("Added fallback CDN link.", trackId);
            }, 1500);
        }
        document.head.append(l);
        pushTrace("Added CDN link.", trackId, nominalUrl);
    }
    addCDNLink("mui-css", "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap");
    addCDNLink("mui-icon", "https://fonts.googleapis.com/icon?family=Material+Icons");
})();
