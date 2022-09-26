using System.Collections.Concurrent;
using System.Collections.ObjectModel;
using Microsoft.Extensions.Logging;

namespace Core;

public class ActionManager
{
    private readonly Func<Type, object?> _serviceFactory;
    private readonly ConcurrentDictionary<Type, Type> _requestHandlerTypes = new();
    private readonly ILogger<ActionManager>? _logger;
    private readonly Dictionary<string, string> _variables = new();
    private readonly Dictionary<string, string> _constants = new();

    public ActionManager(Func<Type, object?> serviceFactory)
    {
        _serviceFactory = serviceFactory;
        _logger = _serviceFactory(typeof(ILogger<ActionManager>)) as ILogger<ActionManager>;
    }

    public void RegisterRequestHandler<TAction, TRequest, TResponse>()
        where TAction : IAction<TRequest, TResponse>
        where TRequest : IActionRequest<TResponse>
        where TResponse : IActionResponse => _requestHandlerTypes.GetOrAdd(typeof(TRequest), typeof(TAction));

    public void AddOrUpdateVariable(string key, string value) => _variables[key] = value;
    public void AddOrUpdateConstant(string key, string value) => _constants[key] = value;

    public async Task<TRes?> ExecuteRequest<TRes>(IActionRequest<TRes> request) where TRes : IActionResponse
    {
        if (_requestHandlerTypes.TryGetValue(request.GetType(), out var handlerType))
        {
            var executor = _serviceFactory(handlerType);
            if (executor != null)
            {
                var result = (Task<TRes?>)executor.GetType().GetMethod("ExecuteAsync")
                    ?.Invoke(executor,
                        new object[] { request, new ReadOnlyDictionary<string, string>(_constants), _variables })!;
                return await result;
            }
        }

        _logger?.LogError("Cannot find ActionExecutor for {RequestType} ", request.GetType());
        return default;
    }
}