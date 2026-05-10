export const isRegExUnicodeCategorySupported = (function () {
    try {
        new RegExp("\\p{Lo}", "u");
        return true;
    } catch {
        return false;
    }
})();
