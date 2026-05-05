using System.Runtime.CompilerServices;
using System.Text.Json;

namespace WarriorsFamilyTree.DataBuilder.TimelineBuilder.Contracts;

internal static class JsonContractHelper
{

    [UnsafeAccessor(UnsafeAccessorKind.Method, Name = "set_AppendPathInformation")]
    private static extern void SetAppendPathInformation(JsonException ex, bool value);

    public static JsonException CreateJsonException(string message, Exception? innerException = null)
    {
        var ex = new JsonException(message, innerException);
        SetAppendPathInformation(ex, true);
        return ex;
    }

}
