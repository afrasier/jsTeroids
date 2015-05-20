//Author: Arman Frasier; armanfrasier@gmail.com

var mDrawContext;
var score = 0;

var VERSION = "1.0.1";

var asteroids = new Array();
var bullets = new Array();
var fadeText = new Array();
var ship;

var loaded = false;
var mute = false;
var playMusic = true;
var playSFX = true;
var gameOn = false;
var warpPrompt = false;
var gameOver = false;
var callcount = 0;
var bars = false;
var lives = 3;
var shields = 0;
var lastCall = 0;
var lmilestones = 0;
var smilestones = 0;

var COLLISION_TOLERANCE = 10;

var curSector = 0;

var sectors = new Array("Sol",
                        "Aldebaran",
                        "Rigel",
                        "Mintaka",
                        "Polaris",
                        "Bellatrix",
                        "Saiph",
                        "Acamar",
                        "Vega",
                        "Alzir",
                        "Betelgeuse",
                        "Diadem"               
                         );

var sfx = new Array(loadAudio("sfx/engine.wav"),
                    loadAudio("sfx/pew.wav"),
                    loadAudio("sfx/powerup.wav"),
                    loadAudio("sfx/shieldsup.wav"),
                    loadAudio("sfx/asteroidDestroy.wav"),
                    loadAudio("sfx/dampeners.wav"),
                    loadAudio("sfx/TouchingMomentsFourMelody.mp3"),
                    loadAudio("sfx/AndAwaken.mp3"));
                                      
var SFX_ENGINE = 0;
var SFX_PEW = 1;
var SFX_POWERUP = 2;
var SFX_SHIELDSUP = 3;
var SFX_ASTEROIDDESTROY = 4;
var SFX_DAMPENERS = 5;
var SFX_GAMEOVER = 6;
var SFX_VICTORY = 7;

var music = new Array(loadAudio("mus/Chase.mp3"),
                      loadAudio("mus/Decisions.mp3"),
                      loadAudio("mus/FutureGladiator.mp3"),
                      loadAudio("mus/ImpendingBoom.mp3"),
                      loadAudio("mus/Interloper.mp3"),
                      loadAudio("mus/MovementProposition.mp3"),
                      loadAudio("mus/RisingGame.mp3"));
                      
var musicStrings = new Array("Chase - Kevin MacLeod (incompetech.com)",
                             "Decisions - Kevin MacLeod (incompetech.com)",
                             "Future Gladiator - Kevin MacLeod (incompetech.com)",
                             "Impending Boom - Kevin MacLeod (incompetech.com)",
                             "Interloper - Kevin MacLeod (incompetech.com)",
                             "Movement Proposition - Kevin MacLeod (incompetech.com)",
                             "Rising Game - Kevin MacLeod (incompetech.com)");
                             
for(var i = 0; i < music.length; i++) {
    music[i].volume = 0.4;
}

var current_music = (Math.round(Math.random()*music.length))%music.length;

var filesLoaded = 0;
var filesToLoad = 2 + sfx.length;

var input = new Array(false, false, false, false, false);

var KB_UP = 0;
var KB_DOWN = 1;
var KB_LEFT = 2;
var KB_RIGHT = 3;

var KB_SPACE = 4;


var MAX_RSPEED = 0.1;
var MAX_LSPEED = 5;

function $(element) {
    return document.getElementById(element);
}    

//yay stack overflow
function sqr(x) {
    return x*x;
}

function dist2(v, w) { 
    return sqr(v.x - w.x) + sqr(v.y - w.y);
}

function distToSegmentSquared(p, v, w) {
  var l2 = dist2(v, w);
  if (l2 == 0) return dist2(p, v);
  var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  if (t < 0) return dist2(p, v);
  if (t > 1) return dist2(p, w);
  return dist2(p, { x: v.x + t * (w.x - v.x),
                    y: v.y + t * (w.y - v.y) });
}

//p - point, v/w define line segment
function distToSegment(p, v, w) { return Math.sqrt(distToSegmentSquared(p, v, w)); }

function initialize() {
    $('canvas').width = $('canvas').offsetWidth;
    $('canvas').height = $('canvas').offsetHeight;
    mDrawContext = $('canvas').getContext('2d');

    window.onkeydown = kbdown;
    window.onkeyup   = kbup;
    
    window.setInterval(function(){draw()}, 16);
    window.setInterval(function(){gameLogic()}, 16);
    
    ship = new Ship();
    for(var i = 0; i < Math.round(($('canvas').height * $('canvas').width)/100000); i++) {
        asteroids.push(new Asteroid());
    }
}

function clear() {
    mDrawContext.fillStyle = "rgba(0,0,0,1)";
    mDrawContext.fillRect(0, 0, $('canvas').width, $('canvas').height);
}

function resize() {
    
}

function newLevel() {
    for(var i = 0; i < sfx.length; i++) {
        sound(i, false);
    }
    gameOn = true;
    warpPrompt = false;
    lastCall = getTime();
    nextMusic();
    
    asteroids = new Array();
    bullets = new Array();
    for(var i = 0; i < Math.round(($('canvas').height * $('canvas').width)/100000) + 2*curSector; i++) {
        asteroids.push(new Asteroid());
    }
    
    var sp = new Ship();
    ship.position = sp.position;
    ship.lspeed = sp.lspeed;
    ship.rspeed = sp.rspeed;
    ship.angle = sp.angle;
    ship.vertices = sp.vertices;
    ship.invuln = 2000;
}

function newGame() {
    for(var i = 0; i < sfx.length; i++) {
        sound(i, false);
    }
    warpPrompt = false;
    curSector = 0;
    score = 0;
    gameOn = true;
    gameOver = false;
    lives = 3;
    lmilestones = 0;
    smilestones = 0;
    shields = 0;
    lastCall = getTime();
    nextMusic();
    
    asteroids = new Array();
    bullets = new Array();
    for(var i = 0; i < Math.round(($('canvas').height * $('canvas').width)/100000); i++) {
        asteroids.push(new Asteroid());
    }
    ship = new Ship();
    ship.invuln = 2000;
}

function fgameOver() {
    gameOn = false;
    gameOver = true;
    
    for(var i = 0; i < sfx.length; i++) {
        sound(i, false);
    }
    stopMusic();
    sfx[SFX_GAMEOVER].currentTime = 0;
    sound(SFX_GAMEOVER, true);
}

function gameLogic() {
    if(gameOn) {
        if(asteroids.length == 0) {
            gameOn = false;
            warpPrompt = true;
            score += (curSector+1)*500
            for(var i = 0; i < sfx.length; i++) {
                sound(i, false);
            }
            stopMusic();
            sfx[SFX_VICTORY].currentTime = 0;
            sound(SFX_VICTORY, true)
        }
    
        //Handle input
        if(input[KB_LEFT]) {
            ship.gLeft = true;
            ship.rspeed -= 0.001;
            if(Math.abs(ship.rspeed) > MAX_RSPEED) {
                ship.rspeed = sign(ship.rspeed)*MAX_RSPEED;
            }
            sound(SFX_ENGINE, true);
        } else {
            ship.gLeft = false;
        }
        
        if(input[KB_RIGHT]) {
            ship.gRight = true;
            ship.rspeed += 0.001;
            if(Math.abs(ship.rspeed) > MAX_RSPEED) {
                ship.rspeed = sign(ship.rspeed)*MAX_RSPEED;
            }
            sound(SFX_ENGINE, true);
        } else {
            ship.gRight = false;
        }
        
        if(input[KB_UP]) {
            ship.gUp = true;
            ship.lspeed = new Point(ship.lspeed.x + Math.cos(ship.angle)*-0.05, ship.lspeed.y + Math.sin(ship.angle)*-0.05);
            
            ship.lspeed.x = (Math.abs(ship.lspeed.x) > MAX_LSPEED) ? MAX_LSPEED*sign(ship.lspeed.x) : ship.lspeed.x;
            ship.lspeed.y = (Math.abs(ship.lspeed.y) > MAX_LSPEED) ? MAX_LSPEED*sign(ship.lspeed.y) : ship.lspeed.y;
            
            
            sound(SFX_ENGINE, true);
        } else {
            ship.gUp = false;
        }
        
        if(input[KB_DOWN]) {
            ship.gDown = true;
            ship.lspeed.x *= ship.dampeners;
            ship.lspeed.y *= ship.dampeners;
            ship.rspeed *= ship.dampeners;
            sound(SFX_DAMPENERS, true);
        } else {
            ship.gDown = false;
            sound(SFX_DAMPENERS, false);
        }
        
        if(!input[KB_RIGHT] && !input[KB_LEFT] && !input[KB_UP]) {
            sound(SFX_ENGINE, false);
        }
        
        if(input[KB_SPACE]) {
            ship.fire();
        }
        //Add time score
        score += (getTime() - lastCall)/1000;
        lastCall = getTime();
        
        //Check for milestone scores
        if(score/5000 - lmilestones > 1) {
            lmilestones++;
            sound(SFX_POWERUP, true);
            lives++;
            fadeText.push(new scrText("Extra Life!", ship.position));
        }
        
        if(score/3000 - smilestones > 1) {
            smilestones++;
            shields++;
            ship.getShield();
            var t = new scrText("Shields up!", ship.position);
            t.fillStyle="rgba(0,0,255,";
            fadeText.push(t);
        }
        
        //Move ship
        ship.rotate(ship.rspeed);
        ship.position = new Point(ship.position.x + ship.lspeed.x, ship.position.y + ship.lspeed.y);
        ship.position.verify();
        
        //Move Asteroids
        for(var i = 0; i < asteroids.length; i++) {
            asteroids[i].rotate(asteroids[i].rspeed);
            asteroids[i].position = new Point(asteroids[i].position.x + asteroids[i].lspeed.x, asteroids[i].position.y + asteroids[i].lspeed.y);
            asteroids[i].position.verify();
        }
        
        //Move bullets
        for(var i = 0; i < bullets.length; i++) {
            bullets[i].position = new Point(bullets[i].position.x + bullets[i].lspeed.x, bullets[i].position.y + bullets[i].lspeed.y);
            bullets[i].position.verify();
            if(getTime() - bullets[i].birthtime > bullets[i].ageofdeath) {
                bullets.splice(i, 1);
                i--;
            }
        }
        
        //Check for collisions
        
        //Bullets
        for(var i = 0; i < bullets.length; i++) {
            var intersectPoints = 0;
            var templine = null;
            var temppoint = null;
            var bray = new Line(bullets[i].position, new Point(0,0));
            var b = new Line(bullets[i].vertices[0].plus(bullets[i].position), bullets[i].vertices[1].plus(bullets[i].position));
            for(var j = 0; j < asteroids.length; j++) {
                intersectPoints = 0;
                for(var k = 0; k < asteroids[j].vertices.length; k++) {
                    templine = new Line(asteroids[j].vertices[k].plus(asteroids[j].position), asteroids[j].vertices[(k+1)%asteroids[j].vertices.length].plus(asteroids[j].position));
                    temppoint = bray.intersects(templine);
                    if(temppoint != null) {
                        if(templine.pointInSegment(temppoint) && b.pointInSegment(temppoint)) {
                            intersectPoints++;
                        }
                    }
                }
                if(intersectPoints % 2 != 0) {
                    score += asteroids[j].size;
                    fadeText.push(new scrText(Math.round(asteroids[j].size) + " pts", asteroids[j].position));
                    asteroids[j].destroy(j);
                    j=asteroids.length;
                    bullets.splice(i, 1);
                    i--;
                }
            }
        }
    }
    
    //Ship
    for(var i = 0; i < ship.vertices.length; i++) {
        if(ship.invuln > 0) {
            break;
        }
        var intersectPoints = 0;
        var templine = null;
        var temppoint = null;
        var bray = new Line(ship.vertices[i].plus(ship.position), new Point(0,0));
        var b = new Line(ship.vertices[i].plus(ship.position), ship.vertices[(i+1)%ship.vertices.length].plus(ship.position));
        for(var j = 0; j < asteroids.length; j++) {
            intersectPoints = 0;
            for(var k = 0; k < asteroids[j].vertices.length; k++) {
                templine = new Line(asteroids[j].vertices[k].plus(asteroids[j].position), asteroids[j].vertices[(k+1)%asteroids[j].vertices.length].plus(asteroids[j].position));
                temppoint = bray.intersects(templine);
                if(temppoint != null) {
                    if(templine.pointInSegment(temppoint) && b.pointInSegment(temppoint)) {
                        intersectPoints++;
                    }
                }
            }
            if(intersectPoints % 2 != 0) {
                asteroids[j].destroy(j);
                j--;
                if(shields > 0) {
                    shields--;
                    if(shields <= 0) {
                        ship.shield = false;
                    }
                    break;
                } else {
                    lives--;
                    ship.invuln += 2000;
                    if(lives < 0) {
                        fgameOver();
                    }
                    break;
                }
            }
        }
    }
    ship.invuln -= getTime() - ship.lastC;
    ship.lastC = getTime();
    ship.invuln = (ship.invuln < 0) ? 0 : ship.invuln;
}

//Score counter
function addScore() {
    //TODO
}

function draw() {
    clear();
    
    for(var i = 0; i < asteroids.length; i++) {
        asteroids[i].draw();
    }
    
    for(var i = 0; i < bullets.length; i++) {
        bullets[i].draw();
    }
    
    ship.draw();
    
    for(var i = 0; i < fadeText.length; i++) {
        fadeText[i].draw();
        if(getTime() - fadeText[i].birthtime > fadeText[i].ageofdeath) {
            fadeText.splice(i, 1);
            i--;
        }
    }
    
    drawHUD();
}

function drawHUD() {
    mDrawContext.font="15px Courier";
    mDrawContext.fillStyle = "rgba(255,255,255,1)";
    mDrawContext.fillText("Score: " + Math.round(score), 5, 15);
    var lifestring = "";
    for(var i = 0; i < lives; i++) {
        lifestring += " \u263A";
    }
    mDrawContext.fillText(lifestring, 5, 30);
    
    mDrawContext.fillStyle = "rgba(0,0,255,1)";
    var shieldstring = "";
    for(var i = 0; i < shields; i++) {
        shieldstring += " \u229A";
    }
    mDrawContext.fillText(shieldstring, 5, 50);
    
    mDrawContext.fillStyle = "rgba(255,255,255,1)";
    
    
    mDrawContext.fillText(($('canvas').height * $('canvas').width)/100000 + curSector, 5, $('canvas').height - 75);
    mDrawContext.fillText("Speed: " + Math.ceil(ship.lspeed.r() * 100) / 100 + " km/s", 5, $('canvas').height - 30);
    mDrawContext.fillText("Heading: " + Math.ceil(((180-ship.angle*180/Math.PI)%360) * 100)/100 + " degrees", 5, $('canvas').height - 15);
    
    mDrawContext.fillText("Developed by Arman J. Frasier, www.armanfrasier.com", $('canvas').width - (mDrawContext.measureText("Developed by Arman J. Frasier, www.armanfrasier.com")).width, $('canvas').height - 15);
    
    mDrawContext.font = "30px Courier";
    mDrawContext.fillText("Sector: " + sectors[curSector%sectors.length], 5, $('canvas').height - 90);
    
    if(!mute) {
        mDrawContext.font = "15px Courier";
        mDrawContext.fillStyle = "rgba(255,255,255,1)";
        var string = "Now playing: " + musicStrings[current_music];
        if(callcount % 100 == 0) {
            bars = !bars;
        }
        if(bars) {
            string = "\u266B " + string + " \u266B";
        } else {
            string = "\u266A " + string + " \u266A";
        }
        callcount++;
        var textWidth = (mDrawContext.measureText(string)).width;
        mDrawContext.fillText(string, $('canvas').width - textWidth - 15, 15);
    }
    
    //Music Controls
    
    
    if(!loaded) {    
        mDrawContext.fillStyle = "rgba(0,0,0,0.75)";
        mDrawContext.fillRect(0,0,$('canvas').width, $('canvas').height);
        mDrawContext.font="50px Courier";
        mDrawContext.fillStyle = "rgba(255,255,255,1)";
        mDrawContext.fillText("Loading...", $('canvas').width/2 - (mDrawContext.measureText("Loading...")).width/2, $('canvas').height/2);
    }
    
    if(gameOver && loaded) {
        mDrawContext.fillStyle = "rgba(0,0,0,0.90)";
        mDrawContext.fillRect(0,0,$('canvas').width, $('canvas').height);
        mDrawContext.font="50px Courier";
        mDrawContext.fillStyle = "rgba(255,255,255,1)";
        mDrawContext.fillText("Game Over!", $('canvas').width/2 - (mDrawContext.measureText("Game Over!")).width/2, $('canvas').height/2 - 150);
        mDrawContext.fillText("Final Score: " + Math.round(score), $('canvas').width/2 - (mDrawContext.measureText("Final Score: " + Math.round(score))).width/2, $('canvas').height/2 - 100);
        mDrawContext.fillText("Sector: " + sectors[curSector%sectors.length] + " // " + (($('canvas').height * $('canvas').width)/100000 + curSector), $('canvas').width/2 - (mDrawContext.measureText("Sector: " + sectors[curSector%sectors.length] + " // " + ($('canvas').height * $('canvas').width)/100000 + curSector)).width/2, $('canvas').height/2 - 50);
        
        mDrawContext.fillText("Press enter for new game!", $('canvas').width/2 - (mDrawContext.measureText("Press enter for new game!")).width/2, $('canvas').height/2 + 50);
    }
    
    if(!gameOver && !gameOn && !warpPrompt && loaded) {
        mDrawContext.fillStyle = "rgba(0,0,0,0.90)";
        mDrawContext.fillRect(0,0,$('canvas').width, $('canvas').height);
        mDrawContext.font="50px Courier";
        mDrawContext.fillStyle = "rgba(255,255,255,1)";
        mDrawContext.fillText("jsTeroids", $('canvas').width/2 - (mDrawContext.measureText("jsTeroids")).width/2, $('canvas').height/2 - 170);
        mDrawContext.font="30px Courier";
        mDrawContext.fillText("v" + VERSION, $('canvas').width/2 - (mDrawContext.measureText("v" + VERSION)).width/2, $('canvas').height/2 - 140);
        mDrawContext.fillText("Developed by Arman J. Frasier (www.armanfrasier.com)", $('canvas').width/2 - (mDrawContext.measureText("Developed by Arman J. Frasier (www.armanfrasier.com)")).width/2, $('canvas').height/2 - 100);
        mDrawContext.fillText("Music from Kevin MacLeod (incompetech.com) (CC License)", $('canvas').width/2 - (mDrawContext.measureText("Music from Kevin MacLeod (incompetech.com) (CC License)")).width/2, $('canvas').height/2 - 70);
        
        mDrawContext.font="20px Courier";
        mDrawContext.fillText(":: CONTROLS ::", $('canvas').width/2 - (mDrawContext.measureText(":: CONTROLS ::")).width/2, $('canvas').height/2 - 30);
        mDrawContext.fillText("UP/W: Forward Thrust        DOWN/S: Inertial Dampeners        LEFT/A: Left Thrust        RIGHT/D: Right Thrust",
                              $('canvas').width/2 - (mDrawContext.measureText("UP/W: Forward Thrust        DOWN/S: Intertial Dampeners        LEFT/A: Left Thrust        RIGHT/D: Right Thrust")).width/2,
                              $('canvas').height/2 + 40);
        mDrawContext.fillText("SPACE: Fire        P: Pause/Resume Music        M: Mute all",
                              $('canvas').width/2 - (mDrawContext.measureText("SPACE: Fire        P: Pause/Resume Music        M: Mute all")).width/2,
                              $('canvas').height/2 + 70);
                              
        mDrawContext.fillText("Press Enter to Begin",
                              $('canvas').width/2 - (mDrawContext.measureText("Press Enter to Begin")).width/2,
                              $('canvas').height/2 + 130);
    }
    
    if(warpPrompt && loaded) {
        mDrawContext.fillStyle = "rgba(0,0,255,0.50)";
        mDrawContext.fillRect(0,0,$('canvas').width, $('canvas').height);
        mDrawContext.font="50px Courier";
        mDrawContext.fillStyle = "rgba(255,255,255,1)";
        mDrawContext.fillText("Sector Complete!", $('canvas').width/2 - (mDrawContext.measureText("Sector Complete!")).width/2, $('canvas').height/2 - 150);
        mDrawContext.font="30px Courier";
        mDrawContext.fillText("Sector bonus: " + (1 + curSector)*500, $('canvas').width/2 - (mDrawContext.measureText("Sector bonus: " + (1 + curSector)*500)).width/2, $('canvas').height/2 - 100);
        mDrawContext.font="20px Courier";
        mDrawContext.fillText("Press 'E' to engage warp to next sector!", $('canvas').width/2 - (mDrawContext.measureText("Press 'E' to engage warp to next sector!")).width/2, $('canvas').height/2 - 25);   
    }
}

function sign(a) {
    return a/Math.abs(a);
}

//AUDIO STUFF
function sound(a, p) {
    if(!mute) {
        if(p && playSFX) {
            sfx[a].play();
        } else {
            sfx[a].pause();
        }
    }
}

function startMusic() {
    music[current_music].addEventListener('ended', function(){nextMusic();});
    if(playMusic) {
        music[current_music].play();
    }
}

function nextMusic() {
    stopMusic();
    current_music = (current_music+1)%music.length;
    startMusic();
}

function stopMusic() {
    music[current_music].pause();
}

function loadAudio(uri) {
    var audio = new Audio();
    audio.addEventListener('canplaythrough', isAppLoaded, false); // It works!!
    audio.src = uri;
    return audio;
}

function isAppLoaded() {
    filesLoaded++;
    if (filesLoaded >= filesToLoad) {
        loaded = true;
    }
}

//Input Handler
function kb(e, b) {
    e = e || window.event;
    var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
    if (!charCode) {
        return;
    }
    if(charCode == 37 || charCode == 65) {//left arrow
        input[KB_LEFT] = b;
    }
    
    if(charCode == 39 || charCode == 68) { //right arrow
        input[KB_RIGHT] = b;
    }
    
    if(charCode == 38 || charCode == 87) { //up arrow
        input[KB_UP] = b;
    }
    
    if(charCode == 40 || charCode == 83) { //down arrow
        input[KB_DOWN] = b;
    }
    
    if(charCode == 32) { //space arrow
        input[KB_SPACE] = b;
    }
    
    if(charCode == 69 && e.type == "keydown") { //e
        if(warpPrompt) {
            curSector++;
            newLevel();
        }
    }
    
    if(charCode == 13) {  //enter
        if(!gameOn && loaded) {
            newGame();
        }
    }
    
    if(charCode == 80 && e.type == "keydown") {
        if(playMusic) {
            playMusic = !playMusic;
            stopMusic();
        } else {
            playMusic = !playMusic;
            startMusic();
        }
    }
    
    if(charCode == 77 && e.type == "keydown") {
        if(mute) {
            startMusic();
        } else {
            stopMusic();
        }
        mute = !mute;
    }
}

function kbdown(e) {
    kb(e, true);
}

function kbup(e) {
    kb(e, false);
}

function getTime() {
    return (new Date()).getTime();
}

//Objects

function Point(x, y) {
    this.x = x;
    this.y = y;
    
    this.verify = verify;
    function verify() {
        if(this.x > $('canvas').width) {
            this.x = x - $('canvas').width;
        }
        
        if(this.x < 0) {
            this.x = $('canvas').width + x;
        }
        
        if(this.y > $('canvas').height) {
            this.y = y - $('canvas').height;
        }
        
        if(this.y < 0) {
            this.y = $('canvas').height + y;
        }
    }
    
    this.plus = plus;
    function plus(p) {
        var ret = new Point(0,0);
        ret.x = this.x + p.x;
        ret.y = this.y + p.y;
        return ret;
    }
    
    this.draw = draw;
    function draw() {
        mDrawContext.fillStyle = "rgba(255,255,255,0.5)";
        mDrawContext.strokeStyle = "rgba(255,255,255,1)";
        
        mDrawContext.lineWidth = 2;
        
        mDrawContext.fillRect(this.x-5, this.y-5, 10, 10);
    }
    
    this.r = r;
    function r() {
        return Math.sqrt(sqr(x) + sqr(y));
    }
    
    this.rotateAbout = rotateAbout; //Rotates about point p
    function rotateAbout(p, a) {
        var s = Math.sin(a);
        var c = Math.cos(a);

        // translate point back to origin:
        this.x -= p.x;
        this.y -= p.y;

        // rotate point
        var xnew = this.x * c - this.y * s;
        var ynew = this.x * s + this.y * c;

        // translate point back:
        this.x = xnew + p.x;
        this.y = ynew + p.y;
    }
}

function Line(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
    
    this.intersects = intersects;
    function intersects(other) {
        var temp = ((this.p1.x - this.p2.x)*(other.p1.y - other.p2.y)-(this.p1.y - this.p2.y)*(other.p1.x - other.p2.x));
        if(temp == 0) {
            return null;
        }
        
        var pIntersect = new Point(     
        ((this.p1.x*this.p2.y - this.p1.y*this.p2.x)*(other.p1.x - other.p2.x) - (this.p1.x - this.p2.x)*(other.p1.x*other.p2.y - other.p1.y*other.p2.x))/
        ((this.p1.x - this.p2.x)*(other.p1.y - other.p2.y)-(this.p1.y - this.p2.y)*(other.p1.x - other.p2.x)),
        ((this.p1.x*this.p2.y - this.p1.y*this.p2.x)*(other.p1.y - other.p2.y) - (this.p1.y - this.p2.y)*(other.p1.x*other.p2.y - other.p1.y*other.p2.x))/
        ((this.p1.x - this.p2.x)*(other.p1.y - other.p2.y)-(this.p1.y - this.p2.y)*(other.p1.x - other.p2.x))
        );
        
        return pIntersect;
    }
    
    this.pointInSegment = pointInSegment;
    function pointInSegment(other) {
        if(distToSegment(other, this.p1, this.p2) < COLLISION_TOLERANCE) {
            return true;
        }
    }
}

function Ship() {
    this.position = new Point($('canvas').width/2,$('canvas').height/2);
    this.lspeed = new Point(0,0);
    this.rspeed = 0;
    this.angle = Math.PI/2;
    this.shield = false;
    this.timeOfLastFire = 0;
    this.shotCooldown = 325;
    this.dampeners = 0.99;
    this.invuln = 0;
    this.lastC = getTime();
        
    //Graphics stuff
    this.gLeft = false;
    this.gRight = false;
    this.gUp = false;
    this.gDown = false;
    
    this.vertices = new Array();
    
    this.vertices.push(new Point(0,-25));
    this.vertices.push(new Point(12,12));
    this.vertices.push(new Point(0,7));
    this.vertices.push(new Point(-12,12));
    
    this.draw = draw;
    function draw() {
        mDrawContext.fillStyle = "rgba(255,255,255,0.1)";
        mDrawContext.strokeStyle = "rgba(255,255,255,1)";
        if(this.invuln > 0) {
            mDrawContext.strokeStyle = "rgba(255,255,255,0.30)";
        }
        mDrawContext.lineWidth = 3;
        
        mDrawContext.moveTo(this.position.x + this.vertices[0].x, this.position.y + this.vertices[0].y);
        if(this.gDown) {
            mDrawContext.shadowBlur=10;
            mDrawContext.shadowColor="white";
        }
        
        mDrawContext.beginPath();
        for(var i = 0; i < this.vertices.length; i++) {
            mDrawContext.lineTo(this.position.x + this.vertices[i].x, this.position.y + this.vertices[i].y);
        }
        mDrawContext.lineTo(this.position.x + this.vertices[0].x, this.position.y + this.vertices[0].y);
        mDrawContext.stroke();
        mDrawContext.shadowBlur = 0;
        mDrawContext.fill();
        
        if(this.shield) {
            mDrawContext.shadowBlur=35;
            mDrawContext.shadowColor="blue";
            mDrawContext.lineWidth = 1;
            var shieldScale = 1.5;
            mDrawContext.strokeStyle = "rgba(0,0,255,1)";
            mDrawContext.fillStyle = "rgba(0,0,255,0.1)";
            mDrawContext.beginPath();
            for(var i = 0; i < this.vertices.length; i++) {
                mDrawContext.lineTo(this.position.x + this.vertices[i].x*shieldScale, this.position.y + this.vertices[i].y*shieldScale);
            }
            mDrawContext.lineTo(this.position.x + this.vertices[0].x*shieldScale, this.position.y + this.vertices[0].y*shieldScale);
            mDrawContext.stroke();
            mDrawContext.fill();
            mDrawContext.shadowBlur = 0;
        }
        
        if(this.gUp) {
            mDrawContext.shadowBlur=5;
            mDrawContext.shadowColor="white";
            var tempPoint = new Point(4, 18);
            var tempPoint2 = new Point(-4, 18);
            tempPoint.rotateAbout(new Point(0,0), -Math.PI/2 + this.angle);
            tempPoint2.rotateAbout(new Point(0,0), -Math.PI/2 + this.angle);
            
            mDrawContext.fillStyle = "rgba(255,255,255,0.5)";
            
            mDrawContext.moveTo(this.position.x + this.vertices[2].x, this.position.y + this.vertices[2].y);
            mDrawContext.beginPath();
            mDrawContext.lineTo(this.position.x + tempPoint.x, this.position.y + tempPoint.y);
            mDrawContext.lineTo(this.position.x + tempPoint2.x, this.position.y + tempPoint2.y);
            mDrawContext.lineTo(this.position.x + this.vertices[2].x, this.position.y + this.vertices[2].y);
            mDrawContext.fill();
            mDrawContext.shadowBlur = 0;
        }
        
        if(this.gLeft) {
            mDrawContext.shadowBlur=5;
            mDrawContext.shadowColor="white";
            var tempPoint = new Point(10, -28);
            var tempPoint2 = new Point(10, -23);
            tempPoint.rotateAbout(new Point(0,0), -Math.PI/2 + this.angle);
            tempPoint2.rotateAbout(new Point(0,0), -Math.PI/2 + this.angle);
            
            mDrawContext.fillStyle = "rgba(255,255,255,0.5)";
            
            mDrawContext.moveTo(this.position.x + this.vertices[0].x, this.position.y + this.vertices[0].y);
            mDrawContext.beginPath();
            mDrawContext.lineTo(this.position.x + tempPoint.x, this.position.y + tempPoint.y);
            mDrawContext.lineTo(this.position.x + tempPoint2.x, this.position.y + tempPoint2.y);
            mDrawContext.lineTo(this.position.x + this.vertices[0].x, this.position.y + this.vertices[0].y);
            mDrawContext.fill();
            mDrawContext.shadowBlur = 0;
        }
        
        if(this.gRight) {
            mDrawContext.shadowBlur=5;
            mDrawContext.shadowColor="white";
            var tempPoint = new Point(-10, -28);
            var tempPoint2 = new Point(-10, -23);
            tempPoint.rotateAbout(new Point(0,0), -Math.PI/2 + this.angle);
            tempPoint2.rotateAbout(new Point(0,0), -Math.PI/2 + this.angle);
            
            mDrawContext.fillStyle = "rgba(255,255,255,0.5)";
            
            mDrawContext.moveTo(this.position.x + this.vertices[0].x, this.position.y + this.vertices[0].y);
            mDrawContext.beginPath();
            mDrawContext.lineTo(this.position.x + tempPoint.x, this.position.y + tempPoint.y);
            mDrawContext.lineTo(this.position.x + tempPoint2.x, this.position.y + tempPoint2.y);
            mDrawContext.lineTo(this.position.x + this.vertices[0].x, this.position.y + this.vertices[0].y);
            mDrawContext.fill();
            mDrawContext.shadowBlur = 0;
        }
    }
        
    this.getShield = getShield;
    function getShield() {
        this.shield = true;
        sound(SFX_SHIELDSUP, true);
    }
        
    this.fire = fire;
    function fire() {
        if(getTime() - this.timeOfLastFire < this.shotCooldown) {
            return;
        }
        this.timeOfLastFire = getTime();
        sound(SFX_PEW, true);
        var b = new LaserShot(this.angle);
        b.position = new Point(this.vertices[0].x + this.position.x, this.vertices[0].y + this.position.y);
        b.lspeed = new Point(-MAX_LSPEED * 1.25 * Math.cos(this.angle), -MAX_LSPEED * 1.25 * Math.sin(this.angle));
        bullets.push(b);
    }
    
    this.rotate = rotate;
    function rotate(a) {
        this.angle += a;
        for(var i = 0; i < this.vertices.length; i++) {
            this.vertices[i].rotateAbout(new Point(0,0), a);
        }
    }
}

function Asteroid(s) {
    this.position = new Point(Math.random()*$('canvas').width,Math.random()*$('canvas').height);
    while(dist2(this.position, ship.position) < 400) {
        this.position = new Point(Math.random()*$('canvas').width,Math.random()*$('canvas').height);
    }
    this.lspeed = new Point(Math.random()*MAX_LSPEED/4, Math.random()*MAX_LSPEED/4);
    this.rspeed = Math.random()*MAX_RSPEED/4;
    this.angle = Math.PI/2;
    
    this.size = Math.round(Math.random()*5+2)* 20;
    if(s != null) {
        this.size = s;
    }
    
    this.vertices = new Array();
    var p = null;
    for(var i = 0; i < 10; i++) {
        p = new Point(0, (Math.random() * this.size) + 10);
        p.y = (p.y > this.size) ? this.size : p.y;
        p.rotateAbout(new Point(0,0), 0.57*i);
        this.vertices.push(p);
    }

    this.draw = draw;
    function draw() {
        mDrawContext.fillStyle = "rgba(0,0,0,1)";
        mDrawContext.strokeStyle = "rgba(255,255,255,1)";
        
        mDrawContext.lineWidth = 3;
        
        mDrawContext.moveTo(this.position.x + this.vertices[0].x, this.position.y + this.vertices[0].y);
        mDrawContext.beginPath();
        for(var i = 0; i < this.vertices.length; i++) {
            mDrawContext.lineTo(this.position.x + this.vertices[i].x, this.position.y + this.vertices[i].y);
        }
        mDrawContext.lineTo(this.position.x + this.vertices[0].x, this.position.y + this.vertices[0].y);
        mDrawContext.stroke();
    }
    
    this.rotate = rotate;
    function rotate(a) {
        this.angle += a;
        for(var i = 0; i < this.vertices.length; i++) {
            this.vertices[i].rotateAbout(new Point(0,0), a);
        }
    }
    
    this.destroy = destroy;
    function destroy(index) {
        if(index != null) {
            asteroids.splice(index, 1);
        }
        
        sound(SFX_ASTEROIDDESTROY, true);
        
        if(this.size >= 30) {
            var a1 = new Asteroid(this.size/2);
            var a2 = new Asteroid(this.size/2);
            
            //positions
            var ang = Math.random()*2*Math.PI;
            var posVert = new Point(0, this.size/2+10);
            var velVert = new Point(0, this.lspeed.r()/2);
            posVert.rotateAbout(new Point(0,0), ang);
            velVert.rotateAbout(new Point(0,0), Math.PI/4);
            
            a1.position.x = posVert.x + this.position.x;
            a1.position.y = posVert.y + this.position.y;
            
            a1.lspeed.x = velVert.x;
            a1.lspeed.y = velVert.y;
            
            posVert.rotateAbout(new Point(0,0), Math.PI);
            velVert.rotateAbout(new Point(0,0), Math.PI);
            
            a2.position.x = posVert.x + this.position.x;
            a2.position.y = posVert.y + this.position.y;
            
            a2.lspeed.x = velVert.x;
            a2.lspeed.y = velVert.y;
            
            asteroids.push(a1);
            asteroids.push(a2);
        }
    }
}

function LaserShot(a) {
    this.position = new Point(0,0);
    this.lspeed = new Point(0,0);
    this.birthtime = getTime();
    this.angle = 0;
    if(a != null) {
        this.angle = a;
    }
    this.ageofdeath = 2000;
    
    this.vertices = new Array();
    
    this.vertices.push(new Point(5 * Math.cos(this.angle), 5 * Math.sin(this.angle)));
    this.vertices.push(new Point(-5 * Math.cos(this.angle), -5 * Math.sin(this.angle)));
    
    this.draw = draw;
    function draw() {
        mDrawContext.shadowBlur=5;
        mDrawContext.shadowColor="white";
        mDrawContext.fillStyle = "rgba(0,0,0,1)";
        mDrawContext.strokeStyle = "rgba(255,255,255,1)";
        
        mDrawContext.lineWidth = 3;
        
        mDrawContext.moveTo(this.position.x + this.vertices[0].x, this.position.y + this.vertices[0].y);
        mDrawContext.beginPath();
        for(var i = 0; i < this.vertices.length; i++) {
            mDrawContext.lineTo(this.position.x + this.vertices[i].x, this.position.y + this.vertices[i].y);
        }
        mDrawContext.lineTo(this.position.x + this.vertices[0].x, this.position.y + this.vertices[0].y);
        mDrawContext.stroke();
        mDrawContext.shadowBlur=0;
    }    
}

function scrText(s, p) {
    this.position = p;
    this.birthtime = getTime();
    this.ageofdeath = 2500;
    this.fillStyle = "rgba(255,255,255,";
    this.alpha = "1";
    
    this.string = "TEXT";
    if(s != null) {
        this.string = s;
    }
    
    this.draw = draw;
    function draw() {
        this.alpha = (getTime()-this.birthtime)/this.ageofdeath;
        var shift = this.alpha * 100;
        mDrawContext.font = "20px Courier";
        mDrawContext.fillStyle = this.fillStyle + (1-this.alpha) + ")";
        mDrawContext.fillText(this.string, this.position.x - (mDrawContext.measureText(this.string)).width/2, this.position.y - shift);
    }
}
