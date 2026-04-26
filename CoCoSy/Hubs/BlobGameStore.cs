using Azure.Storage.Blobs;
using System.Collections.Concurrent;
using System.Text.Json;

namespace CoCoSy.Hubs
{
    public class StoredGameState
    {
        public List<VoteAction> Votes { get; set; } = new();
        public List<SetNameAction> Names { get; set; } = new();
        public List<AddOptionAction> Options { get; set; } = new();
    }

    public class BlobGameStore
    {
        // never evited for now
        private ConcurrentDictionary<Guid, Task<GameState>> games = new();

        private readonly BlobContainerClient _container;
        private readonly ILogger<BlobGameStore> _logger;

        private ConcurrentDictionary<Guid, Guid> toSave = new();

        private object? nextSave = null;

        public BlobGameStore(IConfiguration config, ILogger<BlobGameStore> logger)
        {
            _logger = logger;
            var connectionString = config["BlobConnectionString"];
            var client = new BlobServiceClient(connectionString);
            _container = client.GetBlobContainerClient("games");
            _container.CreateIfNotExists();
        }

        public void MarkForSave(Guid gameId)
        {
            toSave.TryAdd(gameId, gameId);
            var ourObject = new object();
            if (Interlocked.CompareExchange(ref nextSave, ourObject,  null) == null)
            {
                Task.Run(async () => await SaveLoopAsync(ourObject));
            }
        }

        private async Task SaveLoopAsync(object ourObject)
        {
            try
            {
                while (true)
                {
                    await Task.Delay(TimeSpan.FromMinutes(1));
                    nextSave = null;
                    var toSaveNow = Interlocked.Exchange(ref toSave, new ConcurrentDictionary<Guid, Guid>());
                    foreach (var gameId in toSaveNow)
                    {
                        await InnerSaveAsync(gameId.Key);
                    }

                    // stop if you didn't save anything
                    if (toSave.IsEmpty)
                    {
                        return;
                    }

                    // if someone else took the lock don't try agian
                    if (Interlocked.CompareExchange(ref nextSave, ourObject, null) !=  null)
                    {
                        return;
                    }
                }
            }
            catch (Exception ex)
            {
                Interlocked.CompareExchange(ref nextSave, null, ourObject);
                _logger.LogError(ex, "SaveLoop failed");
            }
        }

        private async Task InnerSaveAsync(Guid gameId)
        {
            var state = await GetGame(gameId);
            await SaveGameAsync(gameId, state);
        }

        private async Task SaveGameAsync(Guid gameId, GameState state)
        {
            var stored = new StoredGameState
            {
                Votes = state.Votes.ToList(),
                Names = state.Names.ToList(),
                Options = state.Options.ToList(),
            };
            var json = JsonSerializer.Serialize(stored);
            await _container.GetBlobClient($"{gameId}.json")
                .UploadAsync(BinaryData.FromString(json), overwrite: true);
        }

        public async Task<GameState> GetGame(Guid gameId)
        {
            var taskCompletionSource = new TaskCompletionSource<GameState>();

            var got = games.GetOrAdd(gameId, taskCompletionSource.Task);
            if (got != taskCompletionSource.Task)
            {
                return await got;
            }

            try
            {
                var blob = _container.GetBlobClient($"{gameId}.json");
                if (!await blob.ExistsAsync())
                {
                    var gameState = new GameState();
                    await SaveGameAsync(gameId, gameState);
                    taskCompletionSource.SetResult(gameState);
                    return gameState;
                }

                var response = await blob.DownloadContentAsync();
                var stored = JsonSerializer.Deserialize<StoredGameState>(response.Value.Content.ToString());
                if (stored == null)
                {
                    var gameState = new GameState();
                    await SaveGameAsync(gameId, gameState);
                    taskCompletionSource.SetResult(gameState);
                    return gameState;
                }

                var state = new GameState();
                foreach (var name in stored.Names) { state.Names.Add(name); }
                foreach (var option in stored.Options) { state.Options.Add(option); }
                foreach (var vote in stored.Votes) { state.Votes.Add(vote); }

                taskCompletionSource.SetResult(state);
                return state;
            }
            catch (Exception ex) 
            {
                _logger.LogError(ex, "GetGame failed");
                taskCompletionSource.SetException(ex);
                games.TryRemove(gameId, out _);
                throw;
            }
        }
    }
}
