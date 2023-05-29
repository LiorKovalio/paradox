import { Server, Origins } from 'boardgame.io/server';
import { Paradox } from './Game';

const { FRONTEND_DOMAIN } = process.env;
const server = Server({
  // Provide the definitions for your game(s).
  games: [Paradox],

  // Provide the database storage class to use.
  // db: new DbConnector(),

  origins: [
    // Allow your game site to connect.
    FRONTEND_DOMAIN, // 'https://paradox-game.onrender.com',

    // Allow localhost to connect, except when NODE_ENV is 'production'.
    Origins.LOCALHOST_IN_DEVELOPMENT
  ],
});

server.router.get('/healthz', (ctx, next) => {
  // This must be always set first before status, since null | undefined
  // body automatically sets the status to 204
  ctx.body = null;
  // Now we override the 204 status with the desired one
  ctx.status = 200;
});

server.run(8000, () => console.log("server running..."));