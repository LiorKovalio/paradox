// import { Server, Origins } from 'boardgame.io/server';
import { Server, SocketIO } from 'boardgame.io/server';
import { Paradox } from './Game';

const socketOpts = {};
// const socketOpts = {
//   cors: {
//     origin: "http://localhost:8000",
//     methods: ["GET", "POST"]
//   }
// };

const server = Server({
  // Provide the definitions for your game(s).
  games: [Paradox],

  // Provide the database storage class to use.
  // db: new DbConnector(),

  transport: new SocketIO({
    socketOpts: socketOpts
  })
});

server.router.get('/healthz', (ctx, next) => {
  // This must be always set first before status, since null | undefined
  // body automatically sets the status to 204
  ctx.body = null;
  // Now we override the 204 status with the desired one
  ctx.status = 200;
});

server.run(8000, () => console.log("server running..."));