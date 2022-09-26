namespace Workspaces;

public record Environment(
    string? Name,
    IDictionary<string, string>? Constants,
    IDictionary<string, string>? Variables);