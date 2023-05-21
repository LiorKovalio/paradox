// import { Server, Origins } from 'boardgame.io/server';
import { Server } from 'boardgame.io/server';
import { Paradox } from './Game';

const server = Server({
  // Provide the definitions for your game(s).
  games: [Paradox],

  // Provide the database storage class to use.
  // db: new DbConnector(),

  // origins: [
  //   // Allow your game site to connect.
  //   // 'https://www.mygame.domain',

  //   // Allow localhost to connect, except when NODE_ENV is 'production'.
  //   // Origins.LOCALHOST_IN_DEVELOPMENT
  //   "localhost"
  // ],
});

server.router.get('/healthz', (ctx, next) => {
  ctx.body = 'alive';
});

server.run(8000, () => console.log("server running..."));