using System.Collections.ObjectModel;
using System.Text.Json;

namespace Workspaces;

public class WorkspacesManager
{
    private WorkspacesManager() { }

    public static async Task<WorkspacesManager> CreateInstanceBinder()
    {
        var workspaceManager = new WorkspacesManager();
        var workspacesFilePath = Path.Combine(Directory.GetCurrentDirectory(), "workspaces.json");
        workspaceManager._workspaces =
            JsonSerializer.Deserialize<List<Workspace>>(await File.ReadAllTextAsync(workspacesFilePath));
        return workspaceManager;
    }

    private List<Workspace>? _workspaces;
    private Workspace? _selectedWorkspace;

    // TODO: Possible performance cost?
    public IReadOnlyList<Workspace> Workspaces =>
        new ReadOnlyCollection<Workspace>(_workspaces ?? new List<Workspace>());

    public Workspace SelectedWorkspace
    {
        get
        {
            if (_selectedWorkspace != null) return _selectedWorkspace!;
            if (_workspaces == null || _workspaces.Count < 1) throw new Exception("No workspaces found.");
            _selectedWorkspace = _workspaces.FirstOrDefault();
            return _selectedWorkspace!;
        }
    }
}