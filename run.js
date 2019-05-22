window.onload = main;
window.onresize = sizeCanvas;

let particles = [];

let holding = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    charge: 0
};

let particleTemplate = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    charge: 0
};
let previous = particles;

let view = {
    x: 0,
    y: 0
}

let radius = 20;
let speed = 1;

let canvas;
let ctx;

let mousemoveevent;
let messagediv = HTMLDivElement;
let clear = true;

let lastDraw = new Date();
let dt = 0;
let running = false;

/**
 * Main Function
 */
function main() {

    canvas = document.getElementById("draw-in")
    ctx = canvas.getContext('2d');

    holding = null;

    // Message div element
    messagediv = document.getElementById('message')

    // Key Bindings
    Mousetrap.bind('space', () => { running = !running });
    Mousetrap.bind('c', () => { particles = [] });
    Mousetrap.bind(['+', '='], () => { speed = speed * 2 });
    Mousetrap.bind('-', () => { speed = speed / 2 });
    Mousetrap.bind('up', () => { clear = true; view.y += 50 });
    Mousetrap.bind('down', () => { clear = true; view.y -= 50 });
    Mousetrap.bind('right', () => { clear = true; view.x -= 50 });
    Mousetrap.bind('left', () => { clear = true; view.x += 50 });

    window.requestAnimationFrame(draw);


    // Mouse events
    canvas.addEventListener('mousemove', e => {
        mousemoveevent = e;
    });

    window.addEventListener('DOMMouseScroll', e => {
        if (!holding)
            return;
        let change = e.detail >= 0 ? -1 : 1;
        holding.charge += change;
    })

    canvas.addEventListener('click', e => {
        if (holding) {
            particles.push(holding);
            holding = null;
            return;
        }

        // If on top of +
        if (e.clientX >= 5 && e.clientX <= 45 && e.clientY >= 5 && e.clientY <= 45) {
            holding = JSON.parse(JSON.stringify(particleTemplate));
            holding.charge = 1;
            drawCharge(holding);
        }

        // If on top of -
        if (e.clientX >= 5 && e.clientX <= 45 && e.clientY >= 55 && e.clientY <= 95) {
            holding = JSON.parse(JSON.stringify(particleTemplate));
            holding.charge = -1;
            drawCharge(holding);
        }
    });

    canvas.addEventListener('contextmenu', e => {
        e.preventDefault();
        for (let i = 0; i < particles.length; i++) {
            if (clicking(particles[i], e)) {
                particles.splice(i, 1);
                return;
            }
        }
    });

    lastDraw = new Date();
    sizeCanvas();

}

function drawCharge(particle, absolute) {
    let relpos = {
        x: particle.x,
        y: particle.y
    };
    if (!absolute) {
        relpos.x += view.x;
        relpos.y += view.y;
    }
    ctx.save()
    ctx.beginPath();
    ctx.arc(relpos.x, relpos.y, radius, 0, Math.PI * 2, true);
    ctx.fillStyle = (particle.charge >= 0) ? `rgb(0, 0, ${Math.min(particle.charge * 30 + 100, 255)})` : `rgb(${Math.min(particle.charge * -30 + 100, 255)}, 0, 0)`;
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.font = "18px sans";
    ctx.textAlign = "center";
    let text = particle.charge >= 0 ? "+" : "";
    text += particle.charge;
    ctx.fillText(text, relpos.x, relpos.y + 5, 2 * radius);
    ctx.restore();
}

function draw() {

    let now = new Date();
    dt = (now - lastDraw) * speed / 10;
    lastDraw = now;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    if (clear) {
        clear = false;
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // messages
    let message = `Currently: ${running ? "running" : "stopped"}
    position: [${view.x},${view.y}]
    speed: ${speed}
    [space]: pause
    [right-click]: clear particle
    [c]: clear
    [+,-]: change speed
    [arrows]: move view`
    messagediv.innerText = message;

    if (holding) {
        holding.x = mousemoveevent.clientX - view.x;
        holding.y = mousemoveevent.clientY - view.y;
        drawCharge(holding);
    }

    // Add positive charge
    drawCharge({ x: 25, y: 25, charge: 1 }, true);

    // Add negative charge
    drawCharge({ x: 25, y: 75, charge: -1 }, true);

    previous = JSON.parse(JSON.stringify(particles))

    particles.forEach(particle => {
        if (running) {
            let forces = calcForces(particle);

            // Euler's Therom
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;

            particle.vx += forces.x * dt;
            particle.vy += forces.y * dt;

        }

        drawCharge(particle);
    })



    window.requestAnimationFrame(draw);
}

function sizeCanvas() {
    canvas.height = window.innerHeight;
    canvas.width = window.innerWidth;
}

function particleInfo(part1, part2) {
    let displacement = Math.sqrt(Math.pow(part1.x - part2.x, 2) + Math.pow(part1.y - part2.y, 2));
    let angle = Math.atan2(part1.y - part2.y, part1.x - part2.x);

    return {
        displacement: displacement,
        angle: angle
    }

}

function calcForces(particle) {
    let x = 0;
    let y = 0;

    previous.forEach(curr => {
        let info = particleInfo(curr, particle);
        if (info.displacement === 0) {
            return;
        }

        x += 1 / Math.pow((info.displacement), 2) * curr.charge * -1 * particle.charge * Math.cos(info.angle);
        y += 1 / Math.pow((info.displacement), 2) * curr.charge * -1 * particle.charge * Math.sin(info.angle);

    })

    if (isNaN(y))
        y = 0;

    if (isNaN(x))
        x = 0;

    return {
        x: x,
        y: y
    }
}

function withinRange(value, min, max) {
    return (value <= max && value >= min);
}

function clicking(particle, e) {
    let relpos = {
        x: particle.x + view.x,
        y: particle.y + view.y
    };
    return (withinRange(e.clientX, relpos.x - radius, relpos.x + radius) && withinRange(e.clientY, relpos.y - radius, relpos.y + radius));
}