# CoCoSy

## Running locally

The backend and frontend run as separate processes.

### Prerequisites

- [.NET 7 SDK](https://dotnet.microsoft.com/download/dotnet/7.0)
- [Node.js](https://nodejs.org/) (v16+)
- A trusted ASP.NET Core dev certificate:

```powershell
dotnet dev-certs https --trust
```

If you get a certificate error, regenerate it:

```powershell
dotnet dev-certs https --clean
dotnet dev-certs https --trust
```

### Backend

```powershell
cd CoCoSy
dotnet run
```

Runs on `https://localhost:7277`.

### Frontend

```powershell
cd CoCoSy/ClientApp
npm install
npm start
```

Runs on `https://localhost:44472`.

Open `https://localhost:44472` in your browser.
