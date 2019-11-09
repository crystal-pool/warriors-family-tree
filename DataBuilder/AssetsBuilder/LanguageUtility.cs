using System;
using System.Collections.Generic;
using System.Text;

namespace WarriorsFamilyTree.DataBuilder
{
    internal static class LanguageUtility
    {

        private static readonly Dictionary<string, string> knownLanguageFallbacks = new Dictionary<string, string>
        {
            { "zh-cn", "zh-hans" },
            { "zh-tw", "zh-hant" },
        };

        public static string? GetTextWithFallback(string language, IDictionary<string, string> languageTextCandidates)
        {
            var lang = (string?)language;
            while (lang != null)
            {
                if (languageTextCandidates.TryGetValue(lang, out var text))
                    return text;
                lang = FallbackLanguageCode(lang);
            }
            lang = "en-us";
            while (lang != null)
            {
                if (languageTextCandidates.TryGetValue(lang, out var text))
                    return text;
                lang = FallbackLanguageCode(lang);
            }
            return null;
        }

        public static string? FallbackLanguageCode(string? language, bool suppressKnownFallbacks = false)
        {
            if (string.IsNullOrEmpty(language))
                return null;
            FALLBACK:
            if (!suppressKnownFallbacks && knownLanguageFallbacks.TryGetValue(language, out var fb))
            {
                language = fb;
            }
            else
            {
                var dashPos = language.LastIndexOf('-');
                if (dashPos >= 0)
                    language = language.Substring(0, dashPos);
                else
                    return null;
            }
            if (language.EndsWith("-x", StringComparison.OrdinalIgnoreCase))
                goto FALLBACK;
            return language;
        }

    }
}
