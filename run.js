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
let ignoremouse = false;
let dragging = {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0
}

let vectorTemplate = {
    angle: 0,
    magnitude: 0
}

const DISABLE_VECTORS = 0;
const FORCE_VECTORS = 1;
const VELOCITY_VECTORS = 2; 
let vectors = 0;

/**
 * Main Function
 */
function main() {

    canvas = document.getElementById("draw-in")
    ctx = canvas.getContext('2d');

    holding = dragging = null;

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
    Mousetrap.bind('v', () => { clear = true; vectors = (vectors + 1) % 3 });

    window.requestAnimationFrame(draw);


    // Mouse events
    canvas.addEventListener('mousemove', e => {
        mousemoveevent = e;
        if (dragging) {
            clear = true;
            view.x = dragging.vx - dragging.x + e.clientX;
            view.y = dragging.vy - dragging.y + e.clientY;
        }
    });

    window.addEventListener('DOMMouseScroll', e => {
        if (ignoremouse)
            return;
        let change = e.detail >= 0 ? -1 : 1;
        if (holding) {
            holding.charge += change;
        } else {
            if (change > 0) {
                speed = speed * 2;
            } else {
                speed = speed / 2;
            }
        }
        ignoremouse = true;
        setTimeout(() => { ignoremouse = false }, 10);
    })

    canvas.addEventListener('mousedown', e => {
        // If on top of +
        if (e.clientX >= 5 && e.clientX <= 45 && e.clientY >= 5 && e.clientY <= 45) {
            holding = JSON.parse(JSON.stringify(particleTemplate));
            holding.charge = 1;
            return;
        }

        // If on top of -
        if (e.clientX >= 5 && e.clientX <= 45 && e.clientY >= 55 && e.clientY <= 95) {
            holding = JSON.parse(JSON.stringify(particleTemplate));
            holding.charge = -1;
            return;
        }

        for (let i = 0; i < particles.length; i++) {
            if (clicking(particles[i], e)) {
                holding = particles.splice(i, 1)[0];
                return;
            }
        }

        dragging = {
            x: e.clientX,
            y: e.clientY,
            vx: view.x,
            vy: view.y
        };
    });
    canvas.addEventListener('mouseup', e => {
        if (dragging) {
            dragging = null;
            return;
        }
        if (holding) {
            particles.push(holding);
            holding = null;
        }
    })

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

function drawCharge(particle, absolute, vector) {
    let relpos = {
        x: particle.x,
        y: particle.y
    };
    if (absolute !== true) {
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

    if (vector !== undefined) {
        ctx.save();
        ctx.translate(relpos.x, relpos.y);
        ctx.rotate(vector.angle + Math.PI * 0.5);
        vector.magnitude = vector.magnitude;
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(5, -1 * vector.magnitude);
        ctx.lineTo(10, -1 * vector.magnitude);
        ctx.lineTo(0, -1 * vector.magnitude - 10);
        ctx.lineTo(-10, -1 * vector.magnitude);
        ctx.lineTo(-5, -1 * vector.magnitude);
        ctx.lineTo(-5, 0);
        ctx.fill();
        ctx.restore();
    }
}

function draw() {

    let now = new Date();
    dt = (now - lastDraw) * speed / 10;
    lastDraw = now;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
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
    vectors: ${(vectors === DISABLE_VECTORS)? "disabled": (vectors === VELOCITY_VECTORS)? "velocity": "forces"}
    [space]: start/pause
    [right-click]: clear particle
    [c]: clear
    [+,- || scroll]: change speed
    [arrows || click & drag]: move view
    [v]: toggle vectors`
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
    if (running) {
        particles.forEach(particle => {
            let forces = calcForces(particle);

            // Euler's Therom
            particle.x += particle.vx * dt;
            particle.y += particle.vy * dt;

            particle.vx += forces.x * dt;
            particle.vy += forces.y * dt;

            let vector = undefined;
            if(vectors === VELOCITY_VECTORS) {
                vector = {
                    angle: Math.atan2(particle.vy, particle.vx),
                    magnitude: Math.sqrt(Math.pow(particle.vx, 2) + Math.pow(particle.vy, 2)) * 1000
                }
            } else if (vectors === FORCE_VECTORS) {
                vector = {
                    angle: Math.atan2(forces.y, forces.x),
                    magnitude: Math.sqrt(Math.pow(forces.x, 2) + Math.pow(forces.y, 2)) * 1000000
                }
            }
            
            drawCharge(particle, false, vector);
        })
    } else {
        particles.forEach(drawCharge);
    }

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

        let totalForce = 1 / Math.pow((info.displacement), 2) * curr.charge * -1 * particle.charge;

        x += totalForce * Math.cos(info.angle);
        y += totalForce * Math.sin(info.angle);

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