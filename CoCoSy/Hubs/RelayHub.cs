using Microsoft.AspNetCore.SignalR;
using static System.Runtime.InteropServices.JavaScript.JSType;
using System.Xml.Linq;
using Prototypist.TaskChain;

namespace CoCoSy.Hubs
{
    public class RelayHub : Hub
    {
        private static ConcurrentLinkedList<(DateTime at, VoteAction action)> votes = new ConcurrentLinkedList<(DateTime at, VoteAction action)>();
        private static ConcurrentLinkedList<(DateTime at, SetNameAction action)> setNames = new ConcurrentLinkedList<(DateTime at, SetNameAction action)>();
        private static ConcurrentLinkedList<(DateTime at, AddOptionAction action)> addOptions = new ConcurrentLinkedList<(DateTime at, AddOptionAction action)>();

        public Task VoteAction(VoteAction action)
        {
            votes.Add((DateTime.UtcNow, action));
            return Clients.All.SendAsync("VoteAction", action);
        }
        public Task SetNameAction(SetNameAction action)
        {
            setNames.Add((DateTime.UtcNow, action));
            return Clients.All.SendAsync("SetNameAction", action);
        }
        public Task AddOptionAction(AddOptionAction action)
        {
            addOptions.Add((DateTime.UtcNow, action));
            return Clients.All.SendAsync("AddOptionAction", action);
        }

        public Task Clear(Clear clear)
        {
            votes = new ConcurrentLinkedList<(DateTime at, VoteAction action)> ();
            setNames = new ConcurrentLinkedList<(DateTime at, SetNameAction action)>();
            addOptions = new ConcurrentLinkedList<(DateTime at, AddOptionAction action)>();
            return Clients.All.SendAsync("Clear", clear);
        }

        public async Task Hello(Hello _)
        {
            RemoveOld();

            foreach (var (_, setNames) in setNames)
            {
                await Clients.Caller.SendAsync("SetNameAction", setNames);
            }
            foreach (var (_, addOption) in addOptions)
            {
                await Clients.Caller.SendAsync("AddOptionAction", addOption);
            }
            foreach (var (_, vote) in votes)
            {
                await Clients.Caller.SendAsync("VoteAction", vote);
            }
        }

        private static void RemoveOld()
        {
            var now = DateTime.UtcNow;
            foreach (var pair in votes.Where(x => x.at.AddHours(1) < now).ToArray())
            {
                votes.Remove(pair);
            }
            foreach (var pair in setNames.Where(x => x.at.AddHours(1) < now).ToArray())
            {
                setNames.Remove(pair);
            }
            foreach (var pair in addOptions.Where(x => x.at.AddHours(1) < now).ToArray())
            {
                addOptions.Remove(pair);
            }
        }
    }

    public class VoteAction { 
        public string voterId { get; set; }
        public string optionName { get; set; }
        public double at { get; set; }
        public bool support { get; set; }
        public string messageId { get; set; }
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

    public class Hello {
    }

    public class Clear { 
    }

}
