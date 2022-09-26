using Microsoft.Extensions.Hosting;
using Terminal.Gui;

namespace TerminalUI;

public class UiManagerService : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await Task.CompletedTask;
        Application.Init();
        Application.Top.Add(new Window
        {
            X = 0, Y = 0, Width = Dim.Fill(), Height = Dim.Fill()
        });
        Application.Run();
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        await Task.CompletedTask;
        Application.Shutdown();
    }
}