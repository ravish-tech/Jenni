using System.Text.Json;
using System.Text.Json.Serialization;
using Core;

namespace HttpActions;

public class HttpActionRequest : IActionRequest<HttpActionResponse>
{
    public HttpActionRequest(string id, string request)
    {
        Id = id;
        Request = request;
    }

    public string Id { get; set; }

    [JsonConverter(typeof(HttpMethodJsonConverter))]
    public HttpMethod Method { get; set; } = HttpMethod.Get;

    public string Request { get; set; }
    public IDictionary<string, string> Headers { get; } = new Dictionary<string, string>();

    public object? Payload { get; set; } = null;
    public string? PayloadString => JsonSerializer.Serialize(Payload);
}