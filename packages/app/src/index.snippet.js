// This file contains the original js snippet that is inlined to index.html.

// Polyfills
// Production steps of ECMA-262, Edition 6, 22.1.2.1
if (!Array.from) {
    Array.from = (function () {
        var toStr = Object.prototype.toString;
        var isCallable = function (fn) {
            return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
        };
        var toInteger = function (value) {
            var number = Number(value);
            if (isNaN(number)) { return 0; }
            if (number === 0 || !isFinite(number)) { return number; }
            return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
        };
        var maxSafeInteger = Math.pow(2, 53) - 1;
        var toLength = function (value) {
            var len = toInteger(value);
            return Math.min(Math.max(len, 0), maxSafeInteger);
        };

        // The length property of the from method is 1.
        return function from(arrayLike/*, mapFn, thisArg */) {
            // 1. Let C be the this value.
            var C = this;

            // 2. Let items be ToObject(arrayLike).
            var items = Object(arrayLike);

            // 3. ReturnIfAbrupt(items).
            if (arrayLike == null) {
                throw new TypeError('Array.from requires an array-like object - not null or undefined');
            }

            // 4. If mapfn is undefined, then let mapping be false.
            var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
            var T;
            if (typeof mapFn !== 'undefined') {
                // 5. else
                // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
                if (!isCallable(mapFn)) {
                    throw new TypeError('Array.from: when provided, the second argument must be a function');
                }

                // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.
                if (arguments.length > 2) {
                    T = arguments[2];
                }
            }

            // 10. Let lenValue be Get(items, "length").
            // 11. Let len be ToLength(lenValue).
            var len = toLength(items.length);

            // 13. If IsConstructor(C) is true, then
            // 13. a. Let A be the result of calling the [[Construct]] internal method 
            // of C with an argument list containing the single item len.
            // 14. a. Else, Let A be ArrayCreate(len).
            var A = isCallable(C) ? Object(new C(len)) : new Array(len);

            // 16. Let k be 0.
            var k = 0;
            // 17. Repeat, while k < len… (also steps a - h)
            var kValue;
            while (k < len) {
                kValue = items[k];
                if (mapFn) {
                    A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
                } else {
                    A[k] = kValue;
                }
                k += 1;
            }
            // 18. Let putStatus be Put(A, "length", len, true).
            A.length = len;
            // 20. Return A.
            return A;
        };
    }());
}
// from:https://github.com/jserz/js_piece/blob/master/DOM/ChildNode/remove()/remove().md
(function (arr) {
    arr.forEach(function (item) {
        if (item.hasOwnProperty('remove')) {
            return;
        }
        Object.defineProperty(item, 'remove', {
            configurable: true,
            enumerable: true,
            writable: true,
            value: function remove() {
                if (this.parentNode === null) {
                    return;
                }
                this.parentNode.removeChild(this);
            }
        });
    });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

// TODO Also need Promise polyfill to run on IE.
// Bootstrapper
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
        try {
            // new URL is not supported on IE.
            src = new URL(src, document.location).href
        } catch (err) {

        }
        pushTrace("_RL", name, src, success);
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
                document.head.appendChild(lf);
                pushTrace("Added fallback CDN link.", trackId);
            }, 1500);
        }
        document.head.appendChild(l);
        pushTrace("Added CDN link.", trackId, nominalUrl);
    }
    if (location.search) {
        if (location.search !== "?") {
            var dict;
            if (typeof URLSearchParams === "function") {
                var sp = new URLSearchParams(location.search);
                dict = {};
                sp.forEach(function (v, k) {
                    if (!dict[k]) {
                        dict[k] = v;
                    } else if (Array.isArray(k)) {
                        dict[k].push(v);
                    } else {
                        dict[k] = [dict[k], v];
                    }
                });
            }
            pushTrace("location.search", location.search, dict);
        }
        // Remove search params (our "search" is inside hash)
        if (typeof URL === "function" && history.replaceState) {
            var u = new URL(location.href);
            u.search = "";
            history.replaceState(history.state, document.title, u.href);
        } else {
            location.search = null;
        }
    }
    addCDNLink("mui-css", "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap");
    addCDNLink("mui-icon", "https://fonts.googleapis.com/icon?family=Material+Icons");
    registerResourceLoadCallback("index-js", "ij");
    registerResourceLoadCallback("index-css", "ic");
    registerResourceLoadCallback("index1-css", "ic1");
})();
