using Terminal.Gui;
using TerminalUI.Windows;

namespace TerminalUI;

public class App : Toplevel
{
    public App()
    {
        var topWindow = new Window("Jenni");
        topWindow.Add(new WorkspacesPickerWindow());
        Add(topWindow);
        var statusBarManager = new StatusBarManager();
        Add(statusBarManager.GetStatusBar());
    }

    public sealed override void Add(View view)
    {
        base.Add(view);
    }
}