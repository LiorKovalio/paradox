# Paradox
Paradox is a 2-players game, white and black.\
The goal is to make a straight sequence of 4 stones of the player's color.\
Each turn, the player has to pick 2 adjacent stones of different colors and either move them in the same orientation, or switch them.\
A player may not play the exact opposite move the the last move played.

For switching, click on either of the previously selected stones.\
Note that moving is done by clicking the destination of the <b>2nd</b> stone.

## Demo
See demo pass-around version at [Paradox](https://paradox-bgio.vercel.app/) on [Vercel](https://vercel.com/)
## Boardgame.io
This project is powered by [boardgame.io](https://boardgame.io/) and was made using the [basic Tic-Tac-Toe tutorial](https://boardgame.io/documentation/#/tutorial)

## Hexagons
Hexagons are the bestagons! Check out [Honeycomb (honeycomb-grid)](https://abbekeultjes.nl/honeycomb/)

## Dev
This project was created by following the boardgame.io tutorial, using [Parcel](https://parceljs.org/).\
Install using ```npm install```\
and run using ```npm start```


## Multiplayer
Switch to branch X
Run server using ```ts-node --transpileOnly .\src\Server.ts```\
Make sure the clients use the correct server address in the constructor LINK\
than separetly run clients (same as before, ```npm start```) and use the "new game" and "join" buttons

### TODO
* Set schedualed task for clearing dead matches
* Fill in the multiplayer readme names and links
* Make lobby UI. Maybe list active games
* Deploy separate branch. web service on render.com and front on vercel?
