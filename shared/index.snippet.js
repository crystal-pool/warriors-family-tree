// This file contains the original js snippet that is inlined to index.html.

(function () {
    var traceQueue = [];
    var _drainBacklog = '__drainBacklog';
    var pushTrace = function () {
        traceQueue.push([new Date()].concat(Array.from(arguments)));
    }
    function registerResourceLoadCallback(name, callbackSuffix) {
        var globalName = "__rlc_" + callbackSuffix;
        window[globalName] = function () {
            const target = window.event.currentTarget;
            emitResourceLoadStatus(name, target.src || target.href, window.event.type === "load");
            delete window[globalName];
        }
    }
    function emitResourceLoadStatus(name, src, success) {
        pushTrace("_RL", name, new URL(src, document.location).href, success);
    }
    window[_drainBacklog] = function (cb) {
        traceQueue.forEach(cb);
        traceQueue = undefined;
        pushTrace = function () {
            cb([new Date()].concat(Array.from(arguments)));
        }
        delete window[_drainBacklog];
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
    registerResourceLoadCallback("index-js", "ij");
    registerResourceLoadCallback("index-css", "ic");
    registerResourceLoadCallback("index1-css", "ic1");
})();
