const DEMO_USERS = {
    "jilani": {
        displayName: "Jilani",
        password: "123456"
    },
    "admin": {
        displayName: "System Administrator",
        password: "123456"
    }
};

const app = document.getElementById("app");
const switchWrap = document.getElementById("switchWrap");
const message = document.getElementById("message");
const messageTitle = document.getElementById("messageTitle");
const messageSub = document.getElementById("messageSub");
const inputBox = document.getElementById("inputBox");
const input = document.getElementById("chatInput");
const send = document.getElementById("send");
const eyeToggle = document.getElementById("eyeToggle");
const eyeIcon = document.getElementById("eyeIcon");
const typing = document.getElementById("typing");
const response = document.getElementById("response");
const timer = document.getElementById("timer");
const timerFill = document.getElementById("timerFill");
const timerLabel = document.getElementById("timerLabel");
const success = document.getElementById("success");
const successText = document.getElementById("successText");
const dust = document.getElementById("dust");
const lightRig = document.getElementById("lightRig");
const muteToggle = document.getElementById("muteToggle");
const muteIcon = document.getElementById("muteIcon");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let muted = false;

let state = "OFF";
let timeoutId = null;
let countdownId = null;
let secondsLeft = 30;
const SESSION_SECONDS = 30;
let currentUser = null;
let typeToken = 0;

/* ===================== SOUND (synthesized, no files needed) ===================== */

let actx = null;
function audioCtx() {
    if (!actx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) actx = new AC();
    }
    return actx;
}

function playTone(freq, duration, type = "sine", startGain = .06, delay = 0) {
    if (muted) return;
    const ctx = audioCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(startGain, t0 + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, t0 + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + .05);
}

function sfxClick() {
    playTone(180, .09, "square", .05);
    playTone(90, .12, "sine", .04, .01);
}

function sfxError() {
    playTone(160, .16, "sawtooth", .045);
    playTone(120, .18, "sawtooth", .04, .06);
}

function sfxSuccess() {
    playTone(523.25, .5, "sine", .05, 0);
    playTone(659.25, .5, "sine", .045, .09);
    playTone(783.99, .6, "sine", .045, .18);
}

/* ===================== DUST PARTICLES ===================== */

function spawnDust() {
    dust.innerHTML = "";
    const count = window.innerWidth < 700 ? 14 : 26;

    for (let i = 0; i < count; i++) {
        const mote = document.createElement("div");
        mote.className = "mote";

        const size = 1.5 + Math.random() * 2.5;
        const left = 45 + Math.random() * 55; // biased toward the right/light side
        const duration = 9 + Math.random() * 10;
        const delay = -Math.random() * 18;
        const drift = (Math.random() - 0.5) * 120;

        mote.style.width = `${size}px`;
        mote.style.height = `${size}px`;
        mote.style.left = `${left}%`;
        mote.style.setProperty("--drift", `${drift}px`);
        mote.style.animationDuration = `${duration}s`;
        mote.style.animationDelay = `${delay}s`;
        mote.style.opacity = (0.35 + Math.random() * 0.5).toFixed(2);

        dust.appendChild(mote);
    }
}

/* ===================== TYPEWRITER ===================== */

function typeText(el, text, speed = 26) {
    return new Promise(resolve => {
        const myToken = ++typeToken;
        el.textContent = "";

        if (!text) {
            resolve();
            return;
        }

        const cursor = document.createElement("span");
        cursor.className = "cursor";
        el.appendChild(cursor);

        let i = 0;
        const step = () => {
            if (myToken !== typeToken) return; // superseded
            if (i < text.length) {
                cursor.insertAdjacentText("beforebegin", text[i]);
                i++;
                setTimeout(step, speed);
            } else {
                cursor.remove();
                resolve();
            }
        };
        step();
    });
}

async function showMessage(title, sub = "") {
    typeToken++; // cancel any in-flight typing on the other field
    const localToken = typeToken;
    await typeText(messageTitle, title, 24);
    if (localToken !== typeToken) return;
    await typeText(messageSub, sub, 16);
}

/* ===================== TIMER ===================== */

function resetTimer() {
    clearTimeout(timeoutId);
    clearInterval(countdownId);

    secondsLeft = SESSION_SECONDS;
    timerLabel.textContent = `SESSION WILL EXPIRE IN ${secondsLeft}s`;
    timerFill.style.transition = "none";
    timerFill.style.transform = "scaleX(1)";
    timerFill.classList.remove("warn");
    // force reflow so the transition re-applies on next tick
    void timerFill.offsetWidth;
    timerFill.style.transition = "transform 1s linear, background .4s";
    timer.classList.add("show");

    countdownId = setInterval(() => {
        secondsLeft--;
        timerLabel.textContent = `SESSION WILL EXPIRE IN ${secondsLeft}s`;
        timerFill.style.transform = `scaleX(${Math.max(secondsLeft, 0) / SESSION_SECONDS})`;

        if (secondsLeft <= 8) {
            timerFill.classList.add("warn");
        }

        if (secondsLeft <= 0) {
            clearInterval(countdownId);
        }
    }, 1000);

    timeoutId = setTimeout(() => {
        resetScene();
    }, SESSION_SECONDS * 1000);
}

function clearSessionTimer() {
    clearTimeout(timeoutId);
    clearInterval(countdownId);
    timer.classList.remove("show");
}

/* ===================== FLOW ===================== */

function turnOn() {
    if (state !== "OFF") return;

    sfxClick();
    state = "NAME";

    switchWrap.classList.remove("attention");
    switchWrap.classList.add("on");

    app.classList.add("lit");
    spawnDust();

    setTimeout(() => {
        message.classList.add("show");
        showMessage("Hey, what is your name?", "Type your name and press Enter.");

        setTimeout(() => {
            inputBox.classList.add("show");
            input.placeholder = "Type your name...";
            input.type = "text";
            eyeToggle.classList.remove("show");
            input.focus();
            resetTimer();
        }, 750);

    }, 1200);
}

function showResponse(html, kind = "") {
    response.className = "response";
    if (kind) response.classList.add(kind);
    response.innerHTML = html;
    void response.offsetWidth;
    response.classList.add("show");
}

function hideResponse() {
    response.classList.remove("show");
    response.innerHTML = "";
}

function showTyping() {
    typing.classList.add("show");
}

function hideTyping() {
    typing.classList.remove("show");
}

function shakeInput() {
    inputBox.classList.remove("shake");
    void inputBox.offsetWidth;
    inputBox.classList.add("shake");
    setTimeout(() => inputBox.classList.remove("shake"), 500);
}

function askPassword(user) {
    state = "PASSWORD";
    currentUser = user;

    clearSessionTimer();

    showMessage(
        `Welcome back, ${user.displayName}.`,
        "Please enter your password."
    );

    hideResponse();

    input.value = "";
    input.type = "password";
    input.placeholder = "Enter password";
    eyeToggle.classList.add("show");
    eyeIcon.parentElement.setAttribute("title", "Show password");
    inputBox.classList.add("show");

    setTimeout(() => {
        input.focus();
        resetTimer();
    }, 450);
}

function checkName(name) {

    const key = name.trim().toLowerCase();

    if (!key) return;

    send.disabled = true;
    hideResponse();
    showTyping();

    setTimeout(() => {
        hideTyping();
        send.disabled = false;

        const user = DEMO_USERS[key];

        if (!user) {

            state = "HOLD";
            sfxError();
            shakeInput();

            showResponse(`Sorry, <strong>I don't know you.</strong>`, "error");

            input.value = "";
            input.placeholder = "Try your real name...";

            setTimeout(() => {
                if (state === "HOLD") {
                    state = "NAME";
                    hideResponse();
                    input.focus();
                }
            }, 1800);

            return;
        }

        askPassword(user);
    }, 550 + Math.random() * 350);
}

function checkPassword(password) {

    if (!currentUser) return;

    send.disabled = true;
    hideResponse();
    showTyping();

    setTimeout(() => {
        hideTyping();

        if (password === currentUser.password) {

            clearSessionTimer();
            sfxSuccess();

            state = "SUCCESS";

            showResponse(`<strong>Password verified.</strong> Authentication successful.`, "ok");

            inputBox.classList.remove("show");

            setTimeout(() => {
                successText.textContent = `Welcome, ${currentUser.displayName}.`;
                success.classList.add("show");
            }, 700);

        } else {

            send.disabled = false;
            sfxError();
            shakeInput();

            showResponse(`Incorrect password. <strong>Please try again.</strong>`, "error");

            input.value = "";

            setTimeout(() => {
                hideResponse();
                input.focus();
            }, 1200);
        }
    }, 500 + Math.random() * 300);
}

function submit() {
    if (send.disabled) return;

    if (state === "NAME" || state === "HOLD") {
        checkName(input.value);
        return;
    }

    if (state === "PASSWORD") {
        checkPassword(input.value);
    }
}

function toggleEye() {
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    eyeIcon.innerHTML = showing
        ? `<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/>`
        : `<path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M6.5 6.7C4 8.4 2 12 2 12s4 7 11 7c1.9 0 3.5-.4 4.9-1.1M9.9 4.2A10.6 10.6 0 0 1 12 5c7 0 11 7 11 7a17.9 17.9 0 0 1-3 3.6"/>`;
    input.focus();
}

function resetScene() {

    clearSessionTimer();

    state = "OFF";
    currentUser = null;

    app.classList.remove("lit");

    switchWrap.classList.remove("on");
    switchWrap.classList.add("attention");

    message.classList.remove("show");
    inputBox.classList.remove("show");
    eyeToggle.classList.remove("show");

    hideResponse();
    hideTyping();

    typeToken++;
    messageTitle.textContent = "";
    messageSub.textContent = "";

    input.value = "";
    input.type = "text";
    input.placeholder = "Type your name...";
    send.disabled = false;

    success.classList.remove("show");
}

/* ===================== EVENTS ===================== */

switchWrap.addEventListener("click", turnOn);

input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
        e.preventDefault();
        submit();
    }
});

send.addEventListener("click", submit);
eyeToggle.addEventListener("click", toggleEye);

window.addEventListener("resize", () => {
    if (app.classList.contains("lit")) spawnDust();
});

muteToggle.addEventListener("click", () => {
    muted = !muted;
    muteToggle.classList.toggle("muted", muted);
    muteToggle.setAttribute("aria-pressed", String(muted));
    muteToggle.title = muted ? "Unmute sound" : "Mute sound";
    muteIcon.innerHTML = muted
        ? `<path d="M4 9v6h4l5 5V4L8 9H4Z"/><path d="M23 9l-6 6M17 9l6 6"/>`
        : `<path d="M4 9v6h4l5 5V4L8 9H4Z"/><path d="M16 8a5 5 0 0 1 0 8M18.5 5.5a9 9 0 0 1 0 13"/>`;
});

/* ===================== PARALLAX LIGHT ===================== */

if (!prefersReducedMotion && window.matchMedia("(pointer: fine)").matches) {
    window.addEventListener("mousemove", e => {
        if (!app.classList.contains("lit")) return;
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;  // -1..1
        const ny = (e.clientY / window.innerHeight - 0.5) * 2; // -1..1
        const tx = -nx * 14;
        const ty = -ny * 10;
        lightRig.style.transform = `translate(${tx}px, ${ty}px)`;
    });
}