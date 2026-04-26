using CoCoSy.Hubs;

var builder = WebApplication.CreateBuilder(args);
//builder.Logging.ClearProviders();
//builder.Logging.AddConsole();

// Add services to the container.

//builder.Services.AddControllersWithViews();
builder.Services.AddSignalR();
builder.Services.AddSingleton<CoCoSy.Hubs.BlobGameStore>();

//builder.Services.AddLogging();

var app = builder.Build();

// Configure the HTTP request pipeline.
//if (!app.Environment.IsDevelopment())
//{
//    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
//    app.UseHsts();
//}

//app.UseHttpsRedirection();
app.UseStaticFiles();
//app.UseRouting();

//app.MapControllerRoute(
//    name: "default",
//    pattern: "{controller}/{action=Index}/{id?}");

//app.UseHttpLogging();

app.MapHub<RelayHub>("/relayhub");

app.MapFallbackToFile("index.html");


app.Run();