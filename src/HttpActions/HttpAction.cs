using Core;

namespace HttpActions;

public class HttpAction : IAction<HttpActionRequest, HttpActionResponse>
{
    private readonly IHttpClientFactory _clientFactory;

    public HttpAction(IHttpClientFactory clientFactory)
    {
        _clientFactory = clientFactory;
    }

    public async Task<HttpActionResponse> ExecuteAsync(HttpActionRequest request,
        IReadOnlyDictionary<string, string> constants, IDictionary<string, string> variables)
    {
        using var client = _clientFactory.CreateClient(nameof(HttpAction));
        if (string.IsNullOrWhiteSpace(request.Request))
            throw new Exception($"Invalid {nameof(HttpActionRequest)}.{request.Method} value ({request.Method})");
        using var httpRequest = new HttpRequestMessage(request.Method, new Uri(request.Request));
        foreach (var header in request.Headers) httpRequest.Headers.Add(header.Key, header.Value);
        if (request.Payload != null) httpRequest.Content = new StringContent(request.PayloadString!);
        var response = await client.SendAsync(httpRequest);
        return new HttpActionResponse
        {
            StatusCode = response.StatusCode,
            Payload = await response.Content.ReadAsStringAsync()
        };
    }
}