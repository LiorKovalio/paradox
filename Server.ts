import admin from 'firebase-admin';
import { Server } from 'boardgame.io/server';
import { Firestore } from 'bgio-firebase';
import { Paradox } from './src/Game';

const database = new Firestore({
    config: {
        credential: admin.credential.applicationDefault(),
        databaseURL: 'https://kovalio-test-77411010.firebaseio.com',
    },
});

const server = Server({
    games: [Paradox],
    db: database
    // transport: {cors: {origin:"localhost"}}
});

server.run(8000);
