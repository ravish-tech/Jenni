using Terminal.Gui;

Application.Init();

var win = new Window("MyApp")
{
    X = 0,
    Y = 0, // Leave one row for the toplevel menu

    // By using Dim.Fill(), it will automatically resize without manual intervention
    Width = Dim.Fill(),
    Height = Dim.Fill()
};


Application.Top.Add(win);
Application.Run();
Application.Shutdown();