using System.Net;
using Core;

namespace HttpActions;

public class HttpActionResponse : IActionResponse
{
    public HttpStatusCode StatusCode { get; set; }
    public string Payload { get; set; }
}