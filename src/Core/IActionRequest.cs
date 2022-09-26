namespace Core;

public interface IActionRequest<TResponse> where TResponse : IActionResponse
{
    public string Id { get; set; }
}