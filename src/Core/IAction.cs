namespace Core;

public interface IAction<in TRequest, TResponse> where TRequest : IActionRequest<TResponse>
    where TResponse : IActionResponse
{
    Task<TResponse> ExecuteAsync(TRequest request, IReadOnlyDictionary<string, string> constants,
        IDictionary<string, string> variables);
}