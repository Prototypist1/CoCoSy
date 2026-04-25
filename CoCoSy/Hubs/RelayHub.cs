using Microsoft.AspNetCore.SignalR;
using Prototypist.TaskChain;
using System.Collections.Concurrent;

namespace CoCoSy.Hubs
{
    public class GameState
    {
        public ConcurrentLinkedList<VoteAction> Votes = new();
        public ConcurrentLinkedList<SetNameAction> Names = new();
        public ConcurrentLinkedList<AddOptionAction> Options = new();
    }

    public class RelayHub : Hub
    {

        private static ConcurrentDictionary<string, Guid> connectionGames = new();

        private readonly BlobGameStore _store;
        public RelayHub(BlobGameStore store) { _store = store; }


        private Guid GameId() => connectionGames[Context.ConnectionId];
        private string GameGroup() => GameId().ToString();

        public override async Task OnConnectedAsync()
        {
            var raw = Context.GetHttpContext()?.Request.Query["gameId"].ToString();
            if (Guid.TryParse(raw, out var gameId))
            {
                connectionGames[Context.ConnectionId] = gameId;
                await Groups.AddToGroupAsync(Context.ConnectionId, gameId.ToString());
            }
            await base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            connectionGames.TryRemove(Context.ConnectionId, out _);
            return base.OnDisconnectedAsync(exception);
        }

        public async Task VoteAction(VoteAction action)
        {
            var game = await _store.GetGame(GameId());
            game.Votes.Add(action);
            await Clients.Group(GameGroup()).SendAsync("VoteAction", action);
            _store.MarkForSave(GameId());
        }

        public async Task SetNameAction(SetNameAction action)
        {
            var game = await _store.GetGame(GameId());
            game.Names.Add(action);
            await Clients.Group(GameGroup()).SendAsync("SetNameAction", action);
            _store.MarkForSave(GameId());
        }

        public async Task AddOptionAction(AddOptionAction action)
        {
            var game = await _store.GetGame(GameId());
            game.Options.Add(action);
            await Clients.Group(GameGroup()).SendAsync("AddOptionAction", action);
            _store.MarkForSave(GameId());
        }

        public async Task Hello(Hello _)
        {
            var game = await _store.GetGame(GameId());
            foreach (var name in game.Names)
                await Clients.Caller.SendAsync("SetNameAction", name);
            foreach (var option in game.Options)
                await Clients.Caller.SendAsync("AddOptionAction", option);
            foreach (var vote in game.Votes)
                await Clients.Caller.SendAsync("VoteAction", vote);
        }
    }

    public class VoteAction
    {
        public string voterId { get; set; }
        public string optionName { get; set; }
        public double at { get; set; }
        public bool support { get; set; }
        public string messageId { get; set; }
        public string voteId { get; set; }
        public bool add { get; set; }
    }

    public class SetNameAction
    {
        public string voterId { get; set; }
        public string name { get; set; }
        public double at { get; set; }
        public string messageId { get; set; }
    }

    public class AddOptionAction
    {
        public string name { get; set; }
        public double at { get; set; }
        public string messageId { get; set; }
    }

    public class Hello { }

}
