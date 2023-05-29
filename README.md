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
See demo multiplayer version at [Paradox](https://paradox-game.onrender.com/) on [render](https://render.com/), deployed once as a static site and again as a web service.

### Dev
Switch to branch [render](https://github.com/LiorKovalio/paradox/tree/render)\
Run server using ```ts-node --transpileOnly .\src\Server.ts```\
Make sure the clients use the correct [SERVER_URL](src/App.ts#L30)\
than separetly run clients (same as before, ```npm start```) and use the "new game" and "join" buttons

### TODO
* Set schedualed task for clearing dead matches
    * no need while deployed as web service on render, as it shuts down on inactive
* Polish Lobby UI
* Merge back to main breaking updates and UI fixes
