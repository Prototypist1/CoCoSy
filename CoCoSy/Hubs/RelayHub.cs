using Microsoft.AspNetCore.SignalR;
using static System.Runtime.InteropServices.JavaScript.JSType;
using System.Xml.Linq;

namespace CoCoSy.Hubs
{
    public class RelayHub : Hub
    {
        public async Task VoteAction(VoteAction action) =>
            await Clients.All.SendAsync("VoteAction", action);
        public async Task SetNameAction(SetNameAction action) =>
            await Clients.All.SendAsync("SetNameAction", action);
        public async Task AddOptionAction(AddOptionAction action) =>
            await Clients.All.SendAsync("AddOptionAction", action);
    }

    public class VoteAction { 
        public string id { get; set; }
        public string optionName { get; set; }
        public double at { get; set; }
        public bool support { get; set; }
    }

    public class SetNameAction
    {
        public string id { get; set; }
        public string name { get; set; }
        public double at { get; set; }
    }
    public class AddOptionAction
    {
        public string name { get; set; }
        public double at { get; set; }
    }
}
