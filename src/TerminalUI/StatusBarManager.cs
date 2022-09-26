using Terminal.Gui;

namespace TerminalUI;

public class StatusBarManager
{
    private string _workspace = "sample";

    public StatusBar GetStatusBar()
    {
        return new StatusBar(
            new[]
            {
                new StatusItem(Key.W, $"Workspace: {_workspace}", () =>
                {
                    MessageBox.Query (50, 7, "Quit Demo", "Are you sure you want to quit this demo?", "_Yes", "_No");
                })
            }
        );
    }
}