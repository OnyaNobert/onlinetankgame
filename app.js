const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { dir } = require('console');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const players = {};
const bullets = [];

// INPUT + SHOOT
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'client.html'));
});

io.on('connection', (socket) => {
    console.log('player joined:', socket.id);

    players[socket.id] = {
        x: Math.random() * 500,
        y: Math.random() * 500,
        hp: 100,
        dir: 'right'
    };

    socket.on('input', (keys) => {
        const p = players[socket.id];
        if (!p) return;

        if (keys.a) {p.x -= 5; p.dir = 'left';}
        else if (keys.d) {p.x += 5; p.dir = 'right';}
        else if (keys.w) {p.y -= 5; p.dir = 'up';}
        else if (keys.s) {p.y += 5; p.dir = 'down';}
    });

    socket.on('shoot', () => {
        const p = players[socket.id];
        if (!p) return;
        var setdx = 0;
        var setdy = 0;
        if (p.dir === 'right') setdx = 8;
        else if (p.dir === 'left') setdx = -8;
        else if (p.dir === 'up') setdy = -8;
        else if (p.dir === 'down') setdy = 8;


        bullets.push({
            x: p.x + setdx*2,
            y: p.y + setdy*2,
            dx: setdx,
            dy: setdy,
            owner: socket.id
        });
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
    });
});

// GAME LOOP
setInterval(() => {

    // MOVE BULLETS + COLLISION
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];

        b.x += b.dx;
        b.y += b.dy;

        // remove out of bounds
        if (b.x < 0 || b.x > 600) {
            bullets.splice(i, 1);
            continue;
        }

        // hit detection
        for (let id in players) {
            const p = players[id];

            if (Math.abs(b.x - p.x) < 15 && Math.abs(b.y - p.y) < 15) {

                p.hp -= 10;

                bullets.splice(i, 1);

                if (p.hp <= 0) {
                    delete players[id];
                }

                break;
            }
        }
    }

    io.emit('state', { players, bullets });

}, 1000 / 30);

server.listen(4000, '0.0.0.0', () => {
    console.log('server running');
});