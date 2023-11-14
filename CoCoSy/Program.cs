using CoCoSy.Hubs;

var builder = WebApplication.CreateBuilder(args);
//builder.Logging.ClearProviders();
//builder.Logging.AddConsole();

// Add services to the container.

//builder.Services.AddCors(options =>
//{
//    options.AddPolicy(name: "ReactProxy",
//        builder =>
//        {
//            // react is served at 44472
//            // we are served at 7277
//            builder.WithOrigins("https://localhost:7277", "https://localhost:44472")
//            .AllowAnyMethod()
//            .AllowAnyHeader();
//        });
//});

//builder.Services.AddControllersWithViews();
builder.Services.AddSignalR();

//builder.Services.AddLogging();

var app = builder.Build();

// Configure the HTTP request pipeline.
//if (!app.Environment.IsDevelopment())
//{
//    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
//    app.UseHsts();
//}

//app.UseCors("ReactProxy");

//app.UseHttpsRedirection();
//app.UseStaticFiles();
//app.UseRouting();

//app.MapControllerRoute(
//    name: "default",
//    pattern: "{controller}/{action=Index}/{id?}");

//app.UseHttpLogging();

app.MapHub<RelayHub>("/relayhub");

//app.MapFallbackToFile("index.html");


app.Run();