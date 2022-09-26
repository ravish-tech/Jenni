using System.Text.Json;

namespace HttpActions;

public static class HttpActionsLoader
{
    private static IEnumerable<string> GetListOfFiles(string actionTypeFolderName)
    {
        var actionFilePath = Path.Join(Directory.GetCurrentDirectory(), actionTypeFolderName);
        return Directory.Exists(actionFilePath) ? Directory.GetFiles(actionFilePath) : Array.Empty<string>();
    }

    public static async IAsyncEnumerable<HttpActionRequest?> LoadHttpRequests(string? httpRequestFolder = null)
    {
        var files = GetListOfFiles(httpRequestFolder ?? "http");
        foreach (var file in files)
        {
            var requests = JsonSerializer.Deserialize<IList<HttpActionRequest>>(await File.ReadAllTextAsync(file));
            if (requests == null) continue;
            foreach (var request in requests)
            {
                yield return request;
            }
        }
    }
}