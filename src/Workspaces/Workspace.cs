using System.Text.Json;
using Core;
using HttpActions;

namespace Workspaces;

public class Workspace
{
    public string? Name { get; init; }
    public List<Environment>? Environments { get; set; }
    public Environment? SelectedEnvironment { get; set; }
    public Dictionary<string, string>? Constants { get; set; }
    public List<HttpActionRequest>? Requests { get; set; }
}