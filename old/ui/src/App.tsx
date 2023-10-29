import { Button, TextField } from '@mui/material';
import './App.css';
import Typography from '@mui/material/Typography';
import React, { useState } from 'react';

type Vote = 
{
  id : string
}

type Yolo =
{
  againsts: Vote[]
  name: string,
  supporters: Vote[],
  support: number,
}

const testState : Yolo[] = [{
  name:"hello",
  againsts: [
    {id:"Colin"}
  ],
  supporters : [
    {id:"Colin"}
  ],
  support: 0
},{
  name:"world",
  againsts: [
    {id:"Colin"}
  ],
  supporters: [
    {id:"Colin"}
  ],
  support: 0
}];

type VoteAction = {
  id: string,
  optionName: string,
  at: Date,
  support: boolean,
}

type SetNameAction = 
{
  id: string,
  at: Date,
  name: string;
}

type AddOptionAction = {
  name :string;
  at: Date,
}

function getUniqueStrings(list: string[]): string[] {
  const uniqueStrings = list.filter((string) => {
    return !list.includes(string);
  });
  return uniqueStrings;
}

function compareDates(a: Date, b: Date): number {
  return a.getTime() - b.getTime();
}

function TryRemove<T>(array: T[], element: T): boolean {
  const index = array.indexOf(element);
  if (index === -1) {
    return false;
  }

  array.splice(index, 1);
  return true;
}

function BuildState2( namings: SetNameAction[]){
  const player = new Map<string, string>();

  for (let naming of namings.sort((x,y)=>compareDates(x.at, y.at))) {
    player.set(naming.id, naming.name);
  }
}

function BuildState(votes: VoteAction[], options: AddOptionAction[]) : Yolo[] {
  const now = Date.now();

  const optionMap =new Map<string, Yolo>();;
  for (let optionName of getUniqueStrings(options.map(x=>x.name))){
    optionMap.set(optionName, {
      name: optionName,
      againsts: [],
      supporters: [],
      support: 0,
    });
  }

  for (let voteAction of votes.sort((x,y)=>compareDates(x.at, y.at))){
    const target = optionMap.get(voteAction.optionName)!;
    const vote = {id: voteAction.id};
    if (voteAction.support){
      if (!TryRemove(target.againsts, vote)){
        target.supporters.push()
      }
      target.support += now - voteAction.at.getTime(); 
    }else{
      if (!TryRemove(target.supporters, vote)){
        target.againsts.push({id: vote.id})
      }
      target.support -= now - voteAction.at.getTime(); 
    }
  }

  return Array.from(optionMap.values());
} 


function App() {
  const [options, setOptions] = useState(testState);
  const [toAdd, setToAdd] = useState("");

  return (
    <>
      <Typography variant="h1" component="h2">
        COCOSY
      </Typography >
      <TextField 
        value={toAdd}
        onChange={(value)=> setToAdd(value.target.value)}
      />
      {options.map(option =>
        <div>
          <Typography>{option.name}</Typography>
          <Button>{"<"}</Button>
          {option.againsts.map(against =>
            <Typography>{against.id}</Typography>
          )}
          <Button>{">"}</Button>
          {option.supporters.map(supporter =>
            <Typography>{supporter.id}</Typography>
          )}
        </div>
      )}
    </>
  );
}

export default App;
