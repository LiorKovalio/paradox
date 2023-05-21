const { Server, Origins } = require('boardgame.io/server');
const { Paradox } = require('./Game');

const server = Server({
  // Provide the definitions for your game(s).
  games: [Paradox],

  // Provide the database storage class to use.
  db: new DbConnector(),

  origins: [
    // Allow your game site to connect.
    'https://www.mygame.domain',
    // Allow localhost to connect, except when NODE_ENV is 'production'.
    Origins.LOCALHOST_IN_DEVELOPMENT
  ],
});

server.run(8000);