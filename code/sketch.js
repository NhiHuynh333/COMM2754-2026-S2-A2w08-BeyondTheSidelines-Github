// SECTION 1: GLOBAL VARIABLES AND SETTINGS

let tiles = []; 
let numTiles = 40; 
let rotY = 0; 

let treeBuffer; 
let trailBuffer; 
let bloodBuffer; 

let isLayoutSwapped = false;
let lastLayoutSwapTime = 0;
let layoutLerp = 0; 
let bgTextBuffer; 
let uiBuffer;     
let warningImg = null; 

let flowerRenderer;
let flowerScene;
let flowerCamera;
let flowerLayer;
let flowerTemplate;
let redFlowerTemplate; 
let flowerInstances = [];
let baseFlowerScale = 1;
let flowerRendererInitialized = false;

let sliceBuffer;
let sliceCtx;

let bugs = [];
let allBugTextures = {}; 
let wingMatL, wingMatR; 
const MAX_BUGS = 20; 
const BUG_CATEGORIES = ['RightEar', 'LeftEar', 'RightEye', 'LeftEye', 'Nose', 'Lips'];

const FEATURE_SCALES = {
  'LeftEye': 1.2, 'RightEye': 1.2,
  'Nose': 1.2, 'Lips': 0.9, 
  'LeftEar': 1.5, 'RightEar': 1.5
};

const FACE_OFFSETS = {
  'LeftEye': { x: -42, y: 110, z: 35 },
  'RightEye': { x: 42, y: 110, z: 35 },
  'Nose': { x: 0, y: 65, z: 40 },
  'Lips': { x: 0, y: 25, z: 35 },
  'LeftEar': { x: -75, y: 80, z: 15 },
  'RightEar': { x: 75, y: 80, z: 15 }
};

// SECTION 2: GAME LOGIC AND AUDIO VARIABLES

let mixers = []; 
let lastClockTime = 0;

let hasVictim = false;
let victimIndex = -1;
let victimStartTime = 0; 
let victimRecovered = false; 
let fullRecoveryTime = 0; 

let selectedFlowerIndex = -1;
let interactionStartTime = 0;
let userInteracted = false;

let defenseTriggerTime = 0;
let defenseActive = false;
let recoveryProgress = 0; 
let bugsDistracted = false;

let sceneStartTime = 0; 

let bloomingSequenceStarted = false;
let bloomSequenceIndices = [];
let currentBloomStep = 0;
let lastBloomStepTime = 0;
let bloomInterval = 500; 
let allFlowersBloomed = false;

let bloodLevel = 0; 
let bloodDrips = []; 
let bloodHitBottom = false; 
let nextScheduledImpact = 0; 

let bgSoundFile = null;
let isMusicPlaying = false;
let glitchNoise = null; 

let currentBgRate = 1.0; 
let targetBgRate = 1.0;
let currentRateJitter = 0; 
let currentVolJitter = 0;  
let targetBgVol = 0.8; 
let currentBgVol = 0.8; 
let lastBloomNoteTriggerTime = 0;

let flowerSounds = [];
let noteIndex = 0;
let noteDirection = 1; 
let bloodDripSound = null; 
let clickSound = null; 
const noteFiles = [
  'COMM2754-2026-S2-A2w08-BeyondTheSidelines-C4Do.wav',
  'COMM2754-2026-S2-A2w08-BeyondTheSidelines-Re.wav',
  'COMM2754-2026-S2-A2w08-BeyondTheSidelines-Mi.wav',
  'COMM2754-2026-S2-A2w08-BeyondTheSidelines-Fa.wav',
  'COMM2754-2026-S2-A2w08-BeyondTheSidelines-Sol.wav', 
  'COMM2754-2026-S2-A2w08-BeyondTheSidelines-La.wav',
  'COMM2754-2026-S2-A2w08-BeyondTheSidelines-Si.wav',
  'COMM2754-2026-S2-A2w08-BeyondTheSidelines-C5Do.wav'
];
let lastNotePlayedTime = 0;

let isBgm2Active = false;
let genBgmCurrentVol = 0.0;
let nextGenNoteTime = 0;
let genSequenceMode = 0;
let genStepCount = 0;

const FLOWER_ASSET_PATH = '../edited-media/COMM2754-2026-S2-A2w08-BeyondTheSidelines-WhiteAnthurium.glb';
const RED_FLOWER_ASSET_PATH = '../edited-media/COMM2754-2026-S2-A2w08-BeyondTheSidelines-RedAnthurium.glb';
const FLOWER_DISPLAY_SIZE_RATIO = 150 / 1080;


// SECTION 3: CORE SETUP FUNCTIONS

// Load all external media files into the browser's memory before the website even starts.
function preload() {
  // Load background ambient music
  bgSoundFile = loadSound('../designed-sounds/COMM2754-2026-S2-A2w08-BeyondTheSidelines-Ambient.wav');
  // Load the dripping blood sound effect
  bloodDripSound = loadSound('../designed-sounds/COMM2754-2026-S2-A2w08-BeyondTheSidelines-Dripping.wav');
  // Load the bell sound effect for clicking
  clickSound = loadSound('../designed-sounds/COMM2754-2026-S2-A2w08-BeyondTheSidelines-WindBell.wav');
  
  // Loop through the list of note file names and load each one into the flowerSounds array
  for (let i = 0; i < noteFiles.length; i++) {
    let soundPath = '../designed-sounds/' + noteFiles[i];
    flowerSounds.push(loadSound(soundPath));
  }
}

// Setup runs exactly once at the beginning to set up the screen and data.
function setup() {
  // Force the browser to treat 1 pixel as exactly 1 pixel, preventing lag on high-resolution screens (like Mac Retina displays)
  pixelDensity(1);
  
  // Find the HTML element where we want to place our drawing canvas
  let container = document.getElementById('canvas-container');
  // Determine the canvas width. If the container exists, use its width. Otherwise, use the full window width.
  let cw = container ? container.clientWidth : windowWidth;
  // Determine the canvas height using the same logic.
  let ch = container ? container.clientHeight : windowHeight;
  
  // Create the main drawing area using the calculated width and height
  let cnv = createCanvas(cw, ch);
  // Place this newly created canvas inside the HTML container
  cnv.parent('canvas-container');

  // If the container was found, apply basic CSS rules to center it
  if(container) {
    container.style.position = 'relative';
    container.style.margin = '0 auto';
  }

  // Apply CSS to force the canvas to stretch and fill 100% of its parent container
  cnv.style('display', 'block');
  cnv.style('width', '100%');
  cnv.style('height', '100%');
  cnv.style('object-fit', 'contain'); 
  
  // Start downloading the warning image in the background. Once loaded, assign it to the warningImg variable.
  loadImage('image_107703.png', img => { warningImg = img; });

  // Start the 3D graphics engine (Three.js), passing the current width and height
  initializeFlowerRenderer(cw, ch);

  // Clear the tiles array to make sure it's empty
  tiles = [];
  // Calculate the starting positions for all the branches. 'true' means place them instantly.
  generateTreeStructure(true); 

  // Create 5 separate invisible canvases (buffers) that match the screen size. We will draw on these hidden layers to create advanced effects.
  treeBuffer = createGraphics(cw, ch);
  trailBuffer = createGraphics(cw, ch);
  bloodBuffer = createGraphics(cw, ch);
  bgTextBuffer = createGraphics(cw, ch);
  uiBuffer = createGraphics(cw, ch);

  // Create a raw HTML5 canvas specifically for the glitch effect because it handles pixel-slicing much faster than p5.js
  sliceBuffer = document.createElement('canvas');
  sliceBuffer.width = cw;
  // Make the slice buffer exactly 50 pixels tall, as we only need to copy thin horizontal strips of the screen
  sliceBuffer.height = 50; 
  // Get the 2D drawing context for this raw canvas, optimizing it for frequent reading (pixel grabbing)
  sliceCtx = sliceBuffer.getContext('2d', { willReadFrequently: true });

  // Find the fullscreen button and the main artwork wrapper in the HTML
  let fsBtn = document.getElementById('fullscreen-btn');
  let wrapper = document.getElementById('artwork-wrapper');
  
  // If the button exists, listen for a mouse click on it
  if (fsBtn && wrapper) {
    fsBtn.addEventListener('click', () => {
      // If we are currently NOT in fullscreen mode, request the browser to enter fullscreen
      if (!document.fullscreenElement) {
        if (wrapper.requestFullscreen) wrapper.requestFullscreen();
        else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen();
      } else {
        // If we ARE in fullscreen mode, ask the browser to exit fullscreen
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      }
    });
  }

  // Record the exact millisecond the program started to use as a baseline for timers
  lastClockTime = millis();
  sceneStartTime = millis();
  lastLayoutSwapTime = millis(); 

  // Inject a link into the HTML document to load the 'Mea Culpa' font directly from Google Fonts
  let fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Mea+Culpa&display=swap';
  fontLink.rel = 'stylesheet';
  document.head.appendChild(fontLink);
}

// This function runs automatically whenever the user resizes their browser window
function windowResized() {
    // Get the new width and height of the container
    let container = document.getElementById('canvas-container');
    let cw = container ? Math.floor(container.clientWidth) : Math.floor(windowWidth);
    let ch = container ? Math.floor(container.clientHeight) : Math.floor(windowHeight);
    
    // Resize the main p5.js canvas to match the new screen dimensions
    resizeCanvas(cw, ch);
    
    // Resize every single hidden buffer canvas so they don't get stretched or cut off
    treeBuffer.resizeCanvas(cw, ch);
    trailBuffer.resizeCanvas(cw, ch);
    bloodBuffer.resizeCanvas(cw, ch);
    bgTextBuffer.resizeCanvas(cw, ch);
    uiBuffer.resizeCanvas(cw, ch);
    
    // Update the width of our raw glitch buffer to span the new screen width
    if(sliceBuffer) sliceBuffer.width = cw;
    
    // Inform the 3D engine that the screen size changed
    if (flowerRenderer) {
        // Update the 3D renderer's internal resolution
        flowerRenderer.setSize(cw, ch, false);
        // Adjust the 3D camera boundaries so models don't look squished
        flowerCamera.right = cw;
        flowerCamera.top = ch;
        // Apply the new camera settings
        flowerCamera.updateProjectionMatrix();
    }
    
    // Recalculate branch positions to spread them out nicely over the new screen shape
    generateTreeStructure(true);
}


// SECTION 4: SOUND AND MUSIC FUNCTIONS

// Setup a synthetic audio generator for the TV static sound
function initAudioSynth() {
    // If the noise generator hasn't been created yet
    if (glitchNoise === null) {
        try {
            // Create a 'white noise' generator
            glitchNoise = new p5.Noise('white');
            // Set its initial volume to 0 so it's silent
            glitchNoise.amp(0); 
            // Turn the generator on in the background
            glitchNoise.start();
        } catch (e) {
            console.error("Audio init error:", e);
        }
    }
}

// Play a single piano note, adjusting its volume based on the volMult parameter
function playBloomNote(volMult = 1.0) {
    // If our list of sounds is empty, stop the function immediately
    if (flowerSounds.length === 0) return;
    
    // Get the specific sound file we are supposed to play next
    let currentSound = flowerSounds[noteIndex];
    // If the sound isn't fully loaded into memory yet, stop the function
    if (!currentSound || !currentSound.isLoaded()) return;
    
    let currentMillis = millis();
    // Safety check: Prevent playing sounds too fast. If less than 30ms passed since the last note, cancel.
    if (currentMillis - lastNotePlayedTime < 30) return;
    
    try {
        // Calculate the sound duration based on the bloomInterval (converted from ms to seconds)
        let soundDuration = bloomInterval / 1000;
        // Play the sound from start (0), at normal speed (1.0), multiplied by our custom volume, panning center (0), for the calculated duration
        currentSound.play(0, 1.0, volMult * 0.70, 0, soundDuration); 
        
        // Update timers to remember when we just played this note
        lastNotePlayedTime = currentMillis;
        lastBloomNoteTriggerTime = currentMillis;

        // Move to the next note index based on our direction (up or down the scale)
        noteIndex += noteDirection;
        
        // If we reached the end of our list of notes
        if (noteIndex >= flowerSounds.length) {
            // Step back to the second-to-last note
            noteIndex = flowerSounds.length - 2; 
            // Change direction to go down the scale (-1)
            noteDirection = -1; 
        } 
        // If we reached the beginning of the list
        else if (noteIndex < 0) {
            // Step forward to the second note
            noteIndex = 1; 
            // Change direction to go up the scale (1)
            noteDirection = 1; 
        }
    } catch (e) {
        console.error("Audio play error:", e);
    }
}

// Automatically generate peaceful background music by randomly picking harmonious notes
function playGenerativeMusic(currentMillis) {
    // Check if music is toggled on and the volume is loud enough to actually hear
    if (isMusicPlaying && genBgmCurrentVol > 0.01) {
        // Check if enough time has passed to play the next note
        if (currentMillis >= nextGenNoteTime) {
            // Define the index numbers for a pentatonic scale. These notes will always sound good together randomly.
            let scale = [0, 1, 2, 4, 5, 7]; 
            
            // If we've finished our current music pattern sequence
            if (genStepCount <= 0) {
                // Randomly pick a new mode: 0 for single notes, 1 for chords
                genSequenceMode = floor(random(2)); 
                // Randomly decide to play this new mode for 4 to 8 steps before changing again
                genStepCount = floor(random(4, 9)); 
            }
            
            // Default delay before the next note plays is 500ms
            let delayMs = 500; 
            
            // If we are in Single Note mode (Melody)
            if (genSequenceMode === 0) { 
                // Pick a random note index from our safe scale array
                let noteIdx = scale[floor(random(scale.length))];
                let snd = flowerSounds[noteIdx];
                
                if (snd && snd.isLoaded()) {
                    // Check exactly how long this audio file is in seconds
                    let actualDur = snd.duration();
                    // Set the delay matching the exact duration of the note (converted to ms)
                    if (actualDur > 0) delayMs = actualDur * 1000;
                    // Play the single note at normal speed, with a slightly randomized volume
                    snd.play(0, 1.0, genBgmCurrentVol * random(0.5, 0.8), 0, actualDur);
                }
                // Schedule the next note to play after the delay finishes
                nextGenNoteTime = currentMillis + delayMs;
            } 
            // If we are in Multiple Notes mode (Chords)
            else { 
                // Randomly decide to play 2 or 3 notes at the exact same time
                let numNotes = floor(random(2, 4)); 
                // Pick a base starting note, avoiding the very end of the scale
                let rootIdx = floor(random(scale.length - 2));
                // Track the shortest note duration so we don't wait too long
                let minDur = 9999; 
                
                // Loop to play the chosen number of notes
                for(let i = 0; i < numNotes; i++) {
                    // Space the notes out by skipping every other note in the scale array, which creates a classic musical chord
                    let noteIdx = scale[(rootIdx + i * 2) % scale.length]; 
                    let snd = flowerSounds[noteIdx];
                    
                    if (snd && snd.isLoaded()) {
                        let actualDur = snd.duration();
                        // Find the shortest note duration among the chord notes
                        if (actualDur > 0 && actualDur < minDur) minDur = actualDur;
                        // Play the chord note at a lower volume (0.45) so they don't deafen the user when stacked together
                        snd.play(0, 1.0, genBgmCurrentVol * 0.45, 0, actualDur);
                    }
                }
                // Schedule next note based on the shortest note in the chord
                if (minDur !== 9999) delayMs = minDur * 1000;
                nextGenNoteTime = currentMillis + delayMs;
            }
            // Subtract one from the sequence counter
            genStepCount--;
        }
    }
}


// SECTION 5: MECHANICS (BRANCHES AND UI INTERACTIONS)

// Calculate starting, ending, and curving points for the 3D branches
function generateTreeStructure(isInstant = true) {
  // Set the base starting point for all branches to the bottom center of the screen
  let baseX = width / 2;
  let baseY = height - 70;
  let baseZ = 0;
  // Define a minimum spacing requirement so flower heads don't overlap completely
  let minDistance = width * 0.09; 

  // Check if we are generating branches for the very first time
  let isInit = tiles.length === 0;
  // Temporary array to track positions while building to ensure they don't overlap
  let tempPositions = []; 

  // Loop exactly 40 times to create 40 branches
  for (let i = 0; i < numTiles; i++) {
    let validPosition = false;
    let retries = 0;
    // Set a hard limit to stop trying to find an empty spot, preventing the computer from getting stuck in an infinite loop
    let maxRetries = 200; 
    
    let branchAngle, horizRadius, targetX, targetY, targetZ, heightFactor;

    // Keep trying to find a non-overlapping spot for the flower head
    while (!validPosition && retries < maxRetries) {
      // Calculate a base circular angle depending on the branch index, then add slight randomness so it looks natural
      branchAngle = (i / numTiles) * TWO_PI + random(-0.2, 0.2); 
      // Pick a random distance from the center
      horizRadius = random(width * 0.08, width * 0.38); 

      // Use trigonometry to map the angle and distance into flat X and Z coordinates
      targetX = baseX + cos(branchAngle) * horizRadius; 
      targetZ = baseZ + sin(branchAngle) * horizRadius; 
      
      // Calculate a multiplier. Flowers further outward will naturally end up lower in height.
      heightFactor = 1.0 - (horizRadius / (width * 0.38)); 
      let maxBranchHeight = height * 0.9; 
      // Calculate final Y height based on screen limits and our multiplier
      targetY = baseY - (random(height * 0.23, maxBranchHeight * 0.55) + heightFactor * (maxBranchHeight * 0.45)); 

      // Assume the position is safe until proven otherwise
      let isOverlapping = false;
      // Loop through all previously placed flowers
      for (let j = 0; j < tempPositions.length; j++) {
        let pos = tempPositions[j];
        // Calculate 3D distance between current target and previously placed flower
        if (dist(targetX, targetY, targetZ, pos.x, pos.y, pos.z) < minDistance) {
          // If they are closer than the minimum distance, flag as overlapping and break the check loop
          isOverlapping = true; break; 
        }
      }
      // If it didn't overlap anything, mark it as valid to exit the while loop
      if (!isOverlapping) validPosition = true; 
      retries++;
    }

    // Save the finalized safe spot
    tempPositions.push({x: targetX, y: targetY, z: targetZ});

    // Define Control Point 1 near the base to guide the start of the branch curve
    let cp1x = baseX; 
    let cp1y = baseY - random(height * 0.18, height * 0.41);
    let cp1z = baseZ;
    // Define Control Point 2 near the target head to pull the branch sideways naturally
    let cp2x = targetX + random(-50, 50); 
    let cp2y = targetY + random(100, 250);
    let cp2z = targetZ + random(-50, 50);

    // Give each branch a slightly unique tilt angle
    let randomTiltX = random(radians(15), radians(45));

    if (isInit) {
      // If this is the first setup, push a brand new data object into the array
      tiles.push({
        bx: baseX, by: baseY, bz: baseZ,
        currentCp1x: cp1x, targetCp1x: cp1x,
        currentCp1y: cp1y, targetCp1y: cp1y,
        currentCp1z: cp1z, targetCp1z: cp1z,
        
        currentTx: targetX, targetTx: targetX, baseTargetTx: targetX,
        currentTy: targetY, targetTy: targetY, baseTargetTy: targetY,
        currentTz: targetZ, targetTz: targetZ, baseTargetTz: targetZ,
        
        // Store CP2 relative to the target, so if the target moves, CP2 follows it
        currentCp2OffsetX: cp2x - targetX, targetCp2OffsetX: cp2x - targetX,
        currentCp2OffsetY: cp2y - targetY, targetCp2OffsetY: cp2y - targetY,
        currentCp2OffsetZ: cp2z - targetZ, targetCp2OffsetZ: cp2z - targetZ,

        angle: branchAngle, tiltX: randomTiltX, blurProgress: 0 
      });
    } else {
      // If we are just updating existing branches (like window resize), update the target variables
      let t = tiles[i];
      t.bx = baseX; t.by = baseY;
      t.targetCp1x = cp1x; t.targetCp1y = cp1y; t.targetCp1z = cp1z;
      
      t.baseTargetTx = targetX; t.baseTargetTy = targetY; t.baseTargetTz = targetZ;
      t.targetTx = targetX; t.targetTy = targetY; t.targetTz = targetZ;
      t.targetCp2OffsetX = cp2x - targetX; t.targetCp2OffsetY = cp2y - targetY; t.targetCp2OffsetZ = cp2z - targetZ;
      t.angle = branchAngle; t.tiltX = randomTiltX; t.blurProgress = 0; 

      // If 'isInstant' is true, immediately snap the current positions to the target positions without sliding smoothly
      if (isInstant) {
        t.currentTx = targetX; t.currentTy = targetY; t.currentTz = targetZ;
        t.currentCp1x = cp1x; t.currentCp1y = cp1y; t.currentCp1z = cp1z;
        t.currentCp2OffsetX = cp2x - targetX; t.currentCp2OffsetY = cp2y - targetY; t.currentCp2OffsetZ = cp2z - targetZ;
      }
    }
  }
}

// Function executes automatically when the user clicks the mouse button
function mousePressed() {
  let currentMillis = millis();
  let mx = mouseX;
  let my = mouseY;

  // Modern browsers require a user interaction before allowing audio to play. If audio context is paused, resume it now.
  if (getAudioContext().state !== 'running') getAudioContext().resume();
  // Call the function to setup the TV static noise generator
  initAudioSynth();

  // Create ratio variables to scale click boundaries accurately across different screen sizes
  let scaleX = width / 1920; let scaleY = height / 1080;

  // Base dimensions and padding for the UI buttons
  let w = 80; let h = 30;
  let padX = 60 * scaleX; let visualPadY = 80 * scaleY; let optLeft = 6 * scaleX; let spacing = 55 * scaleX; 
  
  // Define button diameter
  let infoD = 36;
  // Calculate X position if button was on left side
  let tX_N_info = padX + optLeft + infoD / 2;
  // Calculate X position if button was on right side
  let tX_S_info = width - padX - infoD / 2;
  // Blend between left and right positions based on layoutLerp sliding decimal
  let infoX = lerp(tX_N_info, tX_S_info, layoutLerp);
  // Calculate Y position
  let infoY = visualPadY + infoD / 2;

  // Calculate distance between mouse click (mx, my) and button center (infoX, infoY). If within radius (+10px padding), it's a hit!
  if (dist(mx, my, infoX, infoY) <= infoD / 2 + 10) {
      // Find the hidden HTML overlay element
      let overlay = document.getElementById('info-overlay');
      // Append the 'active' CSS class to make it visible
      if (overlay) overlay.classList.add('active'); 
      // Stop executing the rest of the mousePressed logic so we don't accidentally click a flower behind the button
      return; 
  }

  // Calculate X bounds for the Music Button based on layout slide
  let tX_N_wave = padX + optLeft + spacing;
  let tX_S_wave = width - padX - w - spacing;
  let waveX = lerp(tX_N_wave, tX_S_wave, layoutLerp); 
  let waveY = visualPadY;

  // Check if mouse X and Y fall inside the rectangular area of the Music button (+10px padding)
  if (mx >= waveX - 10 && mx <= waveX + w + 10 && my >= waveY - 10 && my <= waveY + h + 30) {
    // Flip the boolean switch (true becomes false, false becomes true)
    isMusicPlaying = !isMusicPlaying; 
    
    if (isMusicPlaying) {
        // If music was toggled ON and isn't currently playing, start looping it
        if (bgSoundFile && !bgSoundFile.isPlaying()) bgSoundFile.loop(); 
    } else {
        // If music was toggled OFF and is currently playing, pause it
        if (bgSoundFile && bgSoundFile.isPlaying()) bgSoundFile.pause();
    }
    // Stop executing mouse logic
    return; 
  }

  // If there is no victim being attacked, ignore all remaining click logic (you can't defend if there's no attack)
  if (!hasVictim) return; 

  // Loop through all 3D flower instances
  for (let i = 0; i < flowerInstances.length; i++) {
    // You cannot rescue the victim by clicking it directly. Skip if this index matches the victim.
    if (i === victimIndex) continue; 
    let inst = flowerInstances[i];
    // Safety check: ensure the object actually exists before checking data
    if (!inst) continue;

    // Grab the 3D position of the flower
    let fPos = inst.position; 
    // Calculate 2D distance between mouse and flower. We invert Y because 3D coordinates grow upwards, but 2D screen coordinates grow downwards.
    let d = dist(mx, my, fPos.x, height - fPos.y);
    
    // If user clicked within 80 pixels of a valid flower and hasn't already interacted
    if (d < 80 && !userInteracted) {
      // Record the clicked flower's index
      selectedFlowerIndex = i;
      // Mark that user successfully intervened
      userInteracted = true; 
      // Record the exact time the user clicked
      interactionStartTime = currentMillis;
      // Trigger the boolean to make bugs scatter away
      bugsDistracted = true;

      // Play the wind chime sound effect
      if (clickSound && clickSound.isLoaded()) clickSound.play(0, 1.0, 0.2); 

      // Take the clicked flower's blooming animation clip and speed it up significantly based on our bloomInterval rule
      if (inst.userData.mixerW && inst.userData.actionW) {
        let animDuration = inst.userData.actionW.getClip().duration || 1;
        inst.userData.mixerW.timeScale = animDuration / (bloomInterval / 1000); 
      }
      
      // Play a tiny volume sound note
      playBloomNote(0.01); 

      // Empty the array to prepare a fresh sequence map
      bloomSequenceIndices = [];
      // Grab a copy of the clicked flower's exact 3D coordinates
      let clickedPos = inst.position.clone();
      
      // Loop through all flowers again
      for (let j = 0; j < flowerInstances.length; j++) {
          // Push every flower index EXCEPT the victim and the clicked flower into the new array
          if (j !== victimIndex && j !== selectedFlowerIndex) bloomSequenceIndices.push(j);
      }
      
      // Sort the array. The formula 'distance a minus distance b' forces flowers closest to the clicked flower to the front of the line.
      bloomSequenceIndices.sort((a, b) => {
          let posA = flowerInstances[a].position;
          let posB = flowerInstances[b].position;
          return clickedPos.distanceTo(posA) - clickedPos.distanceTo(posB);
      });

      // Signal the rendering loop that the sequence should begin playing out
      bloomingSequenceStarted = true;
      currentBloomStep = 0;
      lastBloomStepTime = currentMillis;
      allFlowersBloomed = false;
      
      // Break the loop since we only allow clicking one flower
      break;
    }
  }
}


// SECTION 6: 3D ENGINE (THREE.JS) SETUP

// Utility function that creates a <script> tag dynamically to download required external libraries over the internet
function loadExternalScript(source) {
  // Wrap the process in a Promise so the code waits until the download finishes before continuing
  return new Promise((resolve, reject) => {
    let script = document.createElement('script');
    script.src = source;
    // When download completes, resolve (succeed)
    script.onload = resolve;
    // When download fails, reject and log an error
    script.onerror = () => reject(new Error(`Unable to load ${source}`));
    // Inject the tag into HTML to begin the download process
    document.head.appendChild(script);
  });
}

// Function to force 3D materials to calculate their depth correctly, preventing transparent parts (like leaves) from turning invisible incorrectly
function applyMaterialDepthFix(template) {
  // Traverse iterates over every sub-object inside the 3D model
  template.traverse((child) => {
    // If the object is a visible shape (mesh) with a material
    if (child.isMesh && child.material) {
      // Force it into an array just in case the mesh uses multiple materials
      let materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach(mat => {
        // Enable transparency support
        mat.transparent = true; 
        // Discard absolutely invisible pixels to save rendering power
        mat.alphaTest = 0.05;     
        // Force the object to write its depth into the buffer so other objects know it's in front of them
        mat.depthWrite = true;   
        // Ensure the engine tests if this object is in front of others
        mat.depthTest = true;
        // Flag the material to re-compile its shader settings
        mat.needsUpdate = true;
      });
    }
  });
}

// Custom function to smoothly fade 3D models in and out
function setAssemblyOpacity(model, opacityValue) {
  if (!model) return;
  model.traverse((child) => {
    if (child.isMesh && child.material) {
      let mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach(mat => {
        mat.transparent = true; 
        // Apply the decimal opacity value
        mat.opacity = opacityValue;
        
        // If the object is partially faded, turn off depth writing. This prevents a bug where fading models block models behind them like solid walls.
        if (opacityValue < 1.0 && opacityValue > 0.0) mat.depthWrite = false; 
        // If fully solid, turn depth writing back on
        else mat.depthWrite = true;
        
        mat.needsUpdate = true;
      });
    }
  });
}

// Huge function to setup the entire Three.js 3D world
async function initializeFlowerRenderer(cw, ch) {
  // Stop if it already initialized
  if (flowerRendererInitialized) return;
  flowerRendererInitialized = true;

  try {
    // Wait for the main Three.js engine library to download
    await loadExternalScript('../vendor/three.min.js');
    // Wait for the plugin that allows loading .glb 3D files to download
    await loadExternalScript('../vendor/GLTFLoader.js');

    // Create the system that actually draws the 3D pixels. Enable alpha (transparent background) and antialias (smooth edges).
    flowerRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: false });
    // Match pixel density to 1
    flowerRenderer.setPixelRatio(1);
    // Set the drawing resolution to match the screen
    flowerRenderer.setSize(cw, ch, false);
    // Set background color to black with 0 opacity (fully transparent)
    flowerRenderer.setClearColor(0x000000, 0);
    // Use accurate color encoding
    flowerRenderer.outputEncoding = THREE.sRGBEncoding;
    // Force objects furthest away to draw first
    flowerRenderer.sortObjects = true; 

    // Extract the raw HTML canvas element generated by Three.js
    flowerLayer = flowerRenderer.domElement;
    flowerLayer.id = 'flower-webgl-layer';
    
    // Inject CSS to stack this 3D canvas perfectly on top of the p5.js canvas, but set z-index to -1 so mouse clicks pass through it to p5.js
    Object.assign(flowerLayer.style, {
      position: 'absolute', top: '0', left: '0',
      width: '100%', height: '100%',
      objectFit: 'contain', pointerEvents: 'none', zIndex: '-1', opacity: '0' 
    });
    // Add the 3D canvas into our HTML container
    document.getElementById('canvas-container').appendChild(flowerLayer);

    // Create the empty 3D universe
    flowerScene = new THREE.Scene();
    
    // Create an Orthographic camera (objects stay the same size regardless of distance). Provide left, right, top, bottom bounds.
    flowerCamera = new THREE.OrthographicCamera(0, cw, ch, 0, 0.1, 5000);
    // Pull the camera 2000 units backwards on the Z axis
    flowerCamera.position.set(0, 0, 2000);
    // Force the camera to look directly at the center (0,0,0)
    flowerCamera.lookAt(0, 0, 0);

    // Create a global ambient light to softly illuminate all sides (white from sky, grey from ground)
    let hemiLight = new THREE.HemisphereLight(0xffffff, 0x666666, 0.84);
    flowerScene.add(hemiLight);
    
    // Create a strong directional light acting like a sun, casting light from the top right
    let sunLight = new THREE.DirectionalLight(0xffffff, 0.84);
    sunLight.position.set(600, 900, 1600);
    flowerScene.add(sunLight);
    
    // Create a weaker directional light from the bottom left to fill in hard shadows
    let fillLight = new THREE.DirectionalLight(0xe0e0e0, 0.42);
    fillLight.position.set(-600, 300, -1000);
    flowerScene.add(fillLight);

    // Set up a loader to pull 2D image files into 3D textures
    let texLoader = new THREE.TextureLoader();
    // Load the left and right wing images
    let wingTexL = texLoader.load('../edited-media/COMM2754-2026-S2-A2w08-BeyondTheSidelines-BugWings.png');
    let wingTexR = texLoader.load('../edited-media/COMM2754-2026-S2-A2w08-BeyondTheSidelines-BugWings.png');
    
    // Instruct the right wing texture to mirror itself horizontally so it faces the opposite way
    wingTexR.wrapS = THREE.RepeatWrapping; wingTexR.repeat.x = -1; wingTexR.offset.x = 1;  
    
    // Create 'SpriteMaterials' for the wings. Sprites are flat 2D planes in a 3D world that always rotate to face the camera.
    wingMatL = new THREE.SpriteMaterial({ map: wingTexL, color: 0xffffff, transparent: true, depthTest: false });
    wingMatR = new THREE.SpriteMaterial({ map: wingTexR, color: 0xffffff, transparent: true, depthTest: false });

    // Loop through our face part categories (LeftEye, Nose, etc.)
    BUG_CATEGORIES.forEach(cat => {
      // Create an empty object to store images for this category
      allBugTextures[cat] = {};
      // For each category, load the 6 different variations of that face part
      for (let x = 1; x <= 6; x++) {
        // Construct the file path using the category and number dynamically
        let path = `../edited-media/COMM2754-2026-S2-A2w08-BeyondTheSidelines-${cat}-0${x}.png`;
        // Load and store the image texture
        allBugTextures[cat][x] = texLoader.load(path);
      }
    });

    // Create the loader for actual 3D model geometry
    let loader = new THREE.GLTFLoader();
    
    // Load the main white flower model
    loader.load(FLOWER_ASSET_PATH, (gltfWhite) => {
      // Extract the 3D scene data from the loaded file
      flowerTemplate = gltfWhite.scene;
      // Apply our custom transparency fix
      applyMaterialDepthFix(flowerTemplate);

      // Once white flower is loaded, load the evil red flower model
      loader.load(RED_FLOWER_ASSET_PATH, (gltfRed) => {
        redFlowerTemplate = gltfRed.scene;
        applyMaterialDepthFix(redFlowerTemplate);

        // Calculate a bounding box around the white flower to determine its exact physical dimensions
        let box = new THREE.Box3().setFromObject(flowerTemplate);
        let size = box.getSize(new THREE.Vector3());
        
        // Determine if the imported model was built lying flat on the floor instead of standing upright
        let isFlat = size.z > size.y * 1.5; 
        
        // Find the single largest dimension (width, height, or depth)
        let maxDim = Math.max(size.x, size.y, size.z);
        // Calculate a multiplier that will shrink the massive raw model down to exactly '1.0' unit size
        baseFlowerScale = 1.0 / maxDim;
        // If it was built lying flat, define a rotation angle of -90 degrees (Math.PI / 2) to stand it upright
        let baseRotX = isFlat ? -Math.PI / 2 : 0;

        // Loop 40 times to create individual copies for every branch on screen
        for (let i = 0; i < numTiles; i++) {
          // Create an empty 3D folder to hold all parts of a single flower
          let assembly = new THREE.Group(); 
          // Create a sub-folder to handle rotations
          let flowerGroup = new THREE.Group();   
          
          // Make a deep clone of the white template model
          let whiteInstance = flowerTemplate.clone(true);
          // Loop through the clone and duplicate the actual color materials as well, ensuring fading one flower doesn't fade all of them
          whiteInstance.traverse((child) => {
              if (child.isMesh && child.material) child.material = child.material.clone(); 
          });
          // Shift the model slightly downward so the pivot point is at the bottom of the stem, not the middle of the flower
          whiteInstance.position.set(0, -maxDim / 3.5, 0); 
          
          // Clone the red template model with identical logic
          let redInstance = redFlowerTemplate.clone(true);
          redInstance.traverse((child) => {
              if (child.isMesh && child.material) child.material = child.material.clone();
          });
          redInstance.position.set(0, -maxDim / 3.5, 0);
          // Hide the red model initially
          redInstance.visible = false; 

          // Pack both models into the sub-folder
          flowerGroup.add(whiteInstance);
          flowerGroup.add(redInstance);
          
          // If the model was flat, stand the entire folder upright
          if (isFlat) flowerGroup.rotation.x = baseRotX;
          
          // Pack the sub-folder into the main assembly folder
          assembly.add(flowerGroup);
          
          // Attach a custom javascript object (.userData) to the 3D model to keep track of its specific game state and logic
          assembly.userData = {
            isRed: false,
            whiteModel: whiteInstance, redModel: redInstance,
            mixerW: null, mixerR: null, actionW: null, actionR: null,
            collectedFeatures: new Set(),
            isCorrupted: false, corruptionStartTime: 0,
            baseRotX: baseRotX, isRecovering: false 
          };

          // Add this finalized bundle into the master 3D universe
          flowerScene.add(assembly);
          // Also save it to our array for easy access
          flowerInstances.push(assembly);

          // If the white model file contained baked-in 3D animation (like blooming leaves)
          if (gltfWhite.animations && gltfWhite.animations.length > 0) {
            // Create a Mixer (engine that plays animations on specific models)
            let mixerW = new THREE.AnimationMixer(whiteInstance);
            // Extract the first animation clip and link it to the mixer
            let actionW = mixerW.clipAction(gltfWhite.animations[0]);
            // Tell it to play exactly once, not loop endlessly
            actionW.setLoop(THREE.LoopOnce); 
            // Tell it to freeze on the last frame when finished
            actionW.clampWhenFinished = true; 
            // Issue the play command
            actionW.play();
            // Advance the mixer by 0.01 seconds just to set the initial pose
            mixerW.update(0.01); 
            // Set animation speed to 0 (Pause)
            mixerW.timeScale = 0; 
            
            // Save mixer data into our arrays and userdata objects
            mixers.push(mixerW);
            assembly.userData.mixerW = mixerW; assembly.userData.actionW = actionW;
          }
          
          // Do the exact same animation setup for the red model
          if (gltfRed.animations && gltfRed.animations.length > 0) {
            let mixerR = new THREE.AnimationMixer(redInstance);
            let actionR = mixerR.clipAction(gltfRed.animations[0]);
            actionR.setLoop(THREE.LoopOnce); actionR.clampWhenFinished = true; actionR.play();
            mixerR.update(0.01); mixerR.timeScale = 0; 
            mixers.push(mixerR);
            assembly.userData.mixerR = mixerR; assembly.userData.actionR = actionR;
          }
        }
        // Now that the world is built, spawn the enemies
        createBugs();
      });
    });
  } catch (error) {
    console.error('The flower renderer could not be initialized.', error);
  }
}

// Build the flying enemies out of 2D images
function createBugs() {
  for(let i = 0; i < MAX_BUGS; i++) {
    // Math: modulo (%) ensures we loop evenly through the 6 categories (LeftEye, Nose, etc.)
    let cat = BUG_CATEGORIES[i % 6];
    // Pick a random style variation between 1 and 6
    let suf = Math.floor(Math.random() * 6) + 1;
    
    // Create a material using the specific loaded image texture, removing depth test so it always draws on top
    let mat = new THREE.SpriteMaterial({ map: allBugTextures[cat][suf], color: 0xffffff, depthTest: false, transparent: true });
    
    // Create an empty folder to hold the body and wings
    let group = new THREE.Group();
    
    // Create the main body sprite
    let featureSprite = new THREE.Sprite(mat);
    // Base scale value
    featureSprite.scale.set(40, 40, 1); 
    // Force extremely high render order so it renders above the flower models
    featureSprite.renderOrder = 999; 
    group.add(featureSprite);
    
    // Create Left Wing sprite
    let wingL = new THREE.Sprite(wingMatL);
    // Move the anchor point to the far right edge (1.0, 0.5) so it flaps like a hinge
    wingL.center.set(1.0, 0.5); 
    wingL.renderOrder = 998; 
    group.add(wingL);
    
    // Create Right Wing sprite
    let wingR = new THREE.Sprite(wingMatR);
    // Move the anchor point to the far left edge (0.0, 0.5)
    wingR.center.set(0.0, 0.5); 
    wingR.renderOrder = 998; 
    group.add(wingR);

    // Pick a random starting coordinate far off-screen on the Y axis
    let initialPos = new THREE.Vector3(random(0, width), random(height * 1.1, height * 1.6), random(-500, 500));
    // Apply position to group
    group.position.copy(initialPos);
    // Make bugs invisible at the start
    group.visible = false;
    // Add to 3D world
    flowerScene.add(group);

    // Save tracking data for bug AI logic
    bugs.push({
      mesh: group, feature: featureSprite, wingL: wingL, wingR: wingR,
      category: cat, suffix: suf, aspectSet: false,
      position: initialPos.clone(),
      // Assign random flight speed
      speed: random(4, 9), 
      // Pick a random flower ID to target initially
      targetIndex: Math.floor(random(0, numTiles)), 
      state: 'flying', 
      landTimer: 0, 
      // Assign a random huge number so all wing-flapping animations are out of sync with each other
      noiseOffset: random(0, 1000), 
      isVictimHunter: false,
      // Radius size for orbiting
      orbitDistance: random(120, 500), 
      // Speed and direction (positive or negative multiplier) for orbiting
      orbitSpeed: random(0.0005, 0.002) * (Math.random() > 0.5 ? 1 : -1),
      orbitAngle: random(TWO_PI), 
      orbitYOffset: random(-300, 300)
    });
  }
}


// SECTION 7: CORE GAME LOGIC (DRAWING 3D MODELS AND BUGS)

// The primary workhorse function that updates 3D positions and runs logic every frame
function renderFlowers(renderList) {
  // If engine isn't ready or models aren't cloned yet, abort frame
  if (!flowerRenderer || flowerInstances.length < numTiles) return;

  // Grab the exact current millisecond
  let currentMillis = millis();
  // Calculate exactly how many seconds have passed since the last frame ran (usually 0.016s for 60fps)
  let deltaTime = (currentMillis - lastClockTime) / 1000;
  // Update tracker for next frame
  lastClockTime = currentMillis;

  // Loop through all 3D animation mixers and push them forward in time based on deltaTime
  for (let m = 0; m < mixers.length; m++) mixers[m].update(deltaTime);

  // If the player successfully won the game and a full recovery happened
  if (victimRecovered) {
    // Wait exactly 20000ms (20 seconds) after winning before resetting the game loop
    if (currentMillis - fullRecoveryTime > 20000) {
      
      // Wipe all victim trackers
      hasVictim = false; victimIndex = -1; victimStartTime = 0; victimRecovered = false; fullRecoveryTime = 0;
      
      // Wipe interaction and blooming trackers
      selectedFlowerIndex = -1; interactionStartTime = 0; userInteracted = false;
      bugsDistracted = false; defenseTriggerTime = 0; defenseActive = false; recoveryProgress = 0;
      bloomingSequenceStarted = false; bloomSequenceIndices = []; currentBloomStep = 0; allFlowersBloomed = false;
      
      // Reset music notes and blood levels
      noteIndex = 0; noteDirection = 1; bloodLevel = 0; bloodDrips = []; bloodHitBottom = false; nextScheduledImpact = 0; 
      isBgm2Active = false; 
      
      // Loop through every single 3D flower model
      for (let i = 0; i < flowerInstances.length; i++) {
        let inst = flowerInstances[i];
        
        // Reset local memory tags
        inst.userData.isRed = false; inst.userData.isCorrupted = false; inst.userData.corruptionStartTime = 0; inst.userData.isRecovering = false;
        
        // Clear any built face parts
        if (inst.userData.collectedFeatures) inst.userData.collectedFeatures.clear();
        
        // Show white model fully opaque and un-scaled
        inst.userData.whiteModel.visible = true; inst.userData.whiteModel.scale.setScalar(1.0); setAssemblyOpacity(inst.userData.whiteModel, 1.0);
        // Hide red model completely
        inst.userData.redModel.visible = false; inst.userData.redModel.scale.setScalar(1.0); setAssemblyOpacity(inst.userData.redModel, 1.0);

        // Traverse the red model to scrub away any black corruption tint, resetting its material color to pure white hex code
        inst.userData.redModel.traverse((child) => {
            if (child.isMesh && child.material) {
                let mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach(mat => { mat.color.setHex(0xffffff); mat.needsUpdate = true; });
            }
        });

        // Reset the blooming animation back to frame 0 and hit pause
        if (inst.userData.mixerW && inst.userData.actionW) {
          inst.userData.mixerW.timeScale = 0; inst.userData.actionW.reset(); inst.userData.actionW.play(); inst.userData.mixerW.update(0.01);
        }
      }
      
      // Reset the start time tracker
      sceneStartTime = currentMillis; 
      
      // Loop through every bug and reset them to flying state far above the screen, detaching them from flowers
      bugs.forEach(bug => {
        bug.state = 'flying'; bug.position.set(random(0, width), random(height * 1.1, height * 1.6), random(-500, 500));
        bug.mesh.position.copy(bug.position); bug.mesh.scale.set(1, 1, 1); bug.isVictimHunter = false; bug.targetIndex = Math.floor(random(0, numTiles)); bug.mesh.visible = false; 
        if (bug.mesh.parent !== flowerScene) flowerScene.add(bug.mesh);
      });
      
      // Tell tree structure to slowly slide back to normal base positions
      generateTreeStructure(false); 
      // Erase any remaining blood pixels on the buffer
      bloodBuffer.clear();
    }
  }

  // If the user clicked to defend and the bloom chain is active
  if (bloomingSequenceStarted && !allFlowersBloomed) {
      // If enough milliseconds have passed to trigger the next flower
      if (currentMillis - lastBloomStepTime > bloomInterval) {
          // Check if we haven't reached the end of the sorted array
          if (currentBloomStep < bloomSequenceIndices.length) {
              // Extract the target flower ID from the sequence array
              let fIdx = bloomSequenceIndices[currentBloomStep];
              let inst = flowerInstances[fIdx];
              
              let totalSequence = bloomSequenceIndices.length;
              let fadeSteps = 8;
              let volMult = 1.0;
              
              // Math logic to fade volume IN smoothly for the first 8 steps
              if (currentBloomStep < fadeSteps) {
                  volMult = map(currentBloomStep, 0, fadeSteps - 1, 0.1, 1.0);
              } 
              // Math logic to fade volume OUT smoothly for the last 8 steps
              else if (currentBloomStep >= totalSequence - fadeSteps) {
                  volMult = map(currentBloomStep, totalSequence - fadeSteps, totalSequence - 1, 1.0, 0.01);
              }

              // Play the blooming animation for this specific flower
              if (inst && inst.userData.mixerW && inst.userData.actionW) {
                  let animDuration = inst.userData.actionW.getClip().duration || 1;
                  inst.userData.mixerW.timeScale = animDuration / (bloomInterval / 1000);
                  playBloomNote(volMult);
              }
              
              // Increment the step counter and reset the interval timer
              currentBloomStep++; lastBloomStepTime = currentMillis;
          } else {
              // Mark chain as finished and trigger the active defense mode to start saving the victim
              allFlowersBloomed = true; defenseActive = true; defenseTriggerTime = currentMillis;
          }
      }
  }

  // If defense mode is actively running, steadily increase the power meter (recoveryProgress) toward 1.0 based on frame time
  if (defenseActive && recoveryProgress < 1.0) {
    recoveryProgress += deltaTime / 15.0; 
    if (recoveryProgress > 1.0) recoveryProgress = 1.0;
  }

  // Loop through the array that holds our flattened 2D coordinates and map the 3D models onto them
  for (let i = 0; i < renderList.length; i++) {
    let r = renderList[i];
    let assembly = flowerInstances[r.originalIdx];
    let tileRef = r.tileData;
    // Skip if instance failed to load
    if (!assembly) continue;
    
    // Calculate display scale by multiplying base scale with screen height and our constant ratio
    let dynScale = baseFlowerScale * height * FLOWER_DISPLAY_SIZE_RATIO;
    // Modify scale further based on the perspective Z-depth projection (closer objects get larger)
    let actualScale = dynScale * r.pTarget.perspective * 1.5;

    // Apply violent perlin noise shaking to the specific flower the user clicked
    if (r.originalIdx === selectedFlowerIndex && userInteracted) {
      let timeSinceClick = currentMillis - interactionStartTime;
      let shakeIntensity = 0;
      // Fade out shake intensity smoothly over 3 seconds
      if (timeSinceClick < 3000) shakeIntensity = map(timeSinceClick, 0, 3000, 0.15, 0); 
      // Calculate noise wobble based on time and index offset, multiplied by the fading intensity
      let shake = (noise(currentMillis * 0.05, i) - 0.5) * shakeIntensity * 2;
      assembly.rotation.z += shake;
    } 
    // Automatically trigger blooming animation for all other flowers if defense is active
    else if (defenseActive && r.originalIdx !== victimIndex) {
      if (assembly.userData.mixerW && assembly.userData.mixerW.timeScale === 0) {
        let animDuration = assembly.userData.actionW ? assembly.userData.actionW.getClip().duration : 1;
        assembly.userData.mixerW.timeScale = animDuration / (bloomInterval / 1000); 
      }
    }

    // Geometry Calculation: Find distance between branch target and lower control point
    let dx = r.pTarget.x - r.pCP2.x;
    let dy_three = r.pCP2.y - r.pTarget.y; 
    // Use Math.atan2 to calculate the absolute angle of the line between those two points, subtract 90 deg (PI/2) to orient flower upwards
    let angleZ = Math.atan2(dy_three, dx) - Math.PI / 2;

    let renderX = r.pTarget.x;
    // Invert the Y coordinate because HTML canvas 0,0 is top-left, but Three.js WebGL 0,0 is bottom-left
    let renderY = height - r.pTarget.y; 
    let renderZ = r.pTarget.zDepth;

    // Overwrite the 3D model's transform data
    assembly.position.set(renderX, renderY, renderZ);
    assembly.rotation.set(0, 0, angleZ);
    assembly.scale.setScalar(actualScale);
    // Force the 3D renderer to draw models according to this exact index order for proper depth sorting
    assembly.renderOrder = i;

    // Apply base rotations required from the original file import
    let flowerGroup = assembly.children[0];
    flowerGroup.rotation.y = 0; flowerGroup.rotation.x = assembly.userData.baseRotX; 

    // Apply a calculated blur value by reducing the master opacity of the white flower
    if (!assembly.userData.isRed) { 
        let baseOpacity = 1.0 - (tileRef.blurProgress * 0.85); 
        setAssemblyOpacity(assembly.userData.whiteModel, baseOpacity);
    }

    // If this flower is the victim, hasn't been saved, and power meter is at zero
    if (hasVictim && !victimRecovered && r.originalIdx === victimIndex && recoveryProgress === 0) {
        let timeSinceInfection = currentMillis - victimStartTime;
        let fadeDuration = 2000; 
        
        // During the first 2 seconds of attack, slowly dissolve white model while fading in red model
        if (timeSinceInfection < fadeDuration) {
            let fadeProgress = timeSinceInfection / fadeDuration;
            setAssemblyOpacity(assembly.userData.whiteModel, 1.0 - fadeProgress);
            setAssemblyOpacity(assembly.userData.redModel, fadeProgress);
            assembly.userData.whiteModel.scale.setScalar(1.0);
            assembly.userData.redModel.scale.setScalar(0.98); 
        } else {
            // Once 2 seconds pass, hard hide white and hard show red
            assembly.userData.whiteModel.visible = false;
            setAssemblyOpacity(assembly.userData.redModel, 1.0);
            assembly.userData.redModel.scale.setScalar(1.0);
            
            // Kickstart the red flower's struggling animation at half speed
            if (assembly.userData.mixerR && assembly.userData.mixerR.timeScale === 0) {
                let animDur = assembly.userData.actionR ? assembly.userData.actionR.getClip().duration : 1;
                assembly.userData.mixerR.timeScale = animDur / 2.0; 
            }
        }

        // If the bugs managed to attach all 6 face parts
        if (assembly.userData.isCorrupted) {
            let timeSinceCorruption = currentMillis - assembly.userData.corruptionStartTime;
            // Create a progress decimal capped at 1.0 based on 3 seconds passing
            let corruptionColorProgress = Math.min(timeSinceCorruption / 3000.0, 1.0); 
            
            // Set starting color (White) and ending color (Very Dark Red Hex)
            let startColor = new THREE.Color(0xffffff);
            let endColor = new THREE.Color(0x2a0009);
            // Blend the two colors mathematically based on the time progress
            let currentColor = startColor.clone().lerp(endColor, corruptionColorProgress);

            // Apply this new blended color strictly to the red model's materials
            assembly.userData.redModel.traverse((child) => {
                if (child.isMesh && child.material) {
                    let mats = Array.isArray(child.material) ? child.material : [child.material];
                    mats.forEach(mat => { mat.color.copy(currentColor); mat.needsUpdate = true; });
                }
            });
        }
    }

    // If defense is active and the power meter is greater than zero
    if (recoveryProgress > 0 && assembly.userData.isRed) {
      let rProg = recoveryProgress;
      // Get animation durations for math calculations
      let animDurW = assembly.userData.actionW ? assembly.userData.actionW.getClip().duration : 1;
      let animDurR = assembly.userData.actionR ? assembly.userData.actionR.getClip().duration : 1;

      // Lock-in flag to ensure we only reset animation clocks once
      if (!assembly.userData.isRecovering) {
          assembly.userData.isRecovering = true;
          if (assembly.userData.actionW) { assembly.userData.actionW.reset(); assembly.userData.actionW.play(); }
          if (assembly.userData.actionR) { assembly.userData.actionR.reset(); assembly.userData.actionR.play(); }
          if (assembly.userData.mixerW) assembly.userData.mixerW.timeScale = 0;
          if (assembly.userData.mixerR) assembly.userData.mixerR.timeScale = 0;
      }
      
      // Ensure scales are stable
      assembly.userData.redModel.scale.setScalar(1.0); assembly.userData.whiteModel.scale.setScalar(1.0);

      // Math: Map the first 66% of the overall power meter to a 0.0-1.0 color blending decimal
      let colorProgress = Math.min(rProg / 0.66, 1.0);
      // Determine if we are blending from Dark Red or pure White based on if it corrupted fully
      let startColor = assembly.userData.isCorrupted ? new THREE.Color(0x2a0009) : new THREE.Color(0xffffff);
      let endColor = new THREE.Color(0xffffff);
      let currentColor = startColor.clone().lerp(endColor, colorProgress);

      // Apply blended color shift
      assembly.userData.redModel.traverse((child) => {
        if (child.isMesh && child.material) {
          let mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach(mat => { mat.color.copy(currentColor); mat.needsUpdate = true; });
        }
      });

      // Split the power meter into 3 chunks for 3 distinct animations
      
      // Chunk 1 (0% to 33%): Fold the red flower back up
      if (rProg < 0.33) {
          let unbloomProg = rProg / 0.33; 
          assembly.userData.whiteModel.visible = false; assembly.userData.redModel.visible = true;
          // Calculate the animation frame backward by subtracting progress from 1.0
          if (assembly.userData.actionR && assembly.userData.mixerR) {
              assembly.userData.actionR.time = animDurR * (1.0 - unbloomProg); assembly.userData.mixerR.update(0); 
          }
          setAssemblyOpacity(assembly.userData.redModel, 1.0);
      } 
      // Chunk 2 (33% to 66%): Crossfade opacity from Red to White
      else if (rProg < 0.66) {
          let crossfadeProg = (rProg - 0.33) / 0.33; 
          if (assembly.userData.actionR && assembly.userData.mixerR) { assembly.userData.actionR.time = 0; assembly.userData.mixerR.update(0); }
          if (assembly.userData.actionW && assembly.userData.mixerW) { assembly.userData.actionW.time = 0; assembly.userData.mixerW.update(0); }
          
          assembly.userData.redModel.visible = true; assembly.userData.whiteModel.visible = true;
          assembly.userData.redModel.scale.setScalar(0.98); 
          setAssemblyOpacity(assembly.userData.redModel, 1.0 - crossfadeProg); setAssemblyOpacity(assembly.userData.whiteModel, crossfadeProg);
      } 
      // Chunk 3 (66% to 100%): Play the beautiful white flower blooming animation forward
      else {
          let bloomProg = (rProg - 0.66) / 0.34; 
          assembly.userData.redModel.visible = false; assembly.userData.whiteModel.visible = true;
          setAssemblyOpacity(assembly.userData.whiteModel, 1.0);
          if (assembly.userData.actionW && assembly.userData.mixerW) {
              assembly.userData.actionW.time = animDurW * bloomProg; assembly.userData.mixerW.update(0); 
          }
      }

      // If the meter reached 100%, trigger the victory cleanup logic
      if (rProg >= 1.0 && !victimRecovered) {
        assembly.userData.isRed = false; assembly.userData.redModel.visible = false; assembly.userData.isCorrupted = false; assembly.userData.isRecovering = false; 
        setAssemblyOpacity(assembly.userData.whiteModel, 1.0);
        victimRecovered = true; fullRecoveryTime = currentMillis; 
      }
    }
  }

  // Iterate over every individual bug enemy to execute its AI brain
  bugs.forEach((bug, index) => {
    // Force bugs to remain invisible for the first 5 seconds to build atmosphere
    if (currentMillis - sceneStartTime < 5000) { 
      bug.mesh.visible = false; return;
    } else {
      if (!bug.mesh.visible) bug.mesh.visible = true;
    }

    // Grab the flower model the bug is currently assigned to
    let targetAssembly = flowerInstances[bug.targetIndex];
    let isFaceComplete = false;
    
    // Check if the flower has gathered 5 or more face pieces
    if (targetAssembly && targetAssembly.userData.collectedFeatures) {
        isFaceComplete = targetAssembly.userData.collectedFeatures.size >= 5;
    }

    // If the user clicked to defend, override bug state to scattering
    if (userInteracted) {
      if (bug.state !== 'scattering') {
          bug.state = 'scattering';
          // Detach the bug model from the flower's sub-folder and put it back in the global scene folder
          if (bug.mesh.parent !== flowerScene) {
              flowerScene.add(bug.mesh);
              bug.mesh.scale.set(1, 1, 1); // Reset scale
              // Snapping position back to the flower's world location with slight randomness
              if (targetAssembly) {
                  bug.position.set(targetAssembly.position.x + random(-50, 50), targetAssembly.position.y + random(0, 50), targetAssembly.position.z + random(-50, 50));
                  bug.mesh.position.copy(bug.position);
              }
          }
      }
    }

    // Bug AI for scattering (running away chaotically)
    if (bug.state === 'scattering') {
        let chaoticSpeed = 12;
        // Generate a random 3D direction vector (-1.0 to 1.0) and force its magnitude to exactly 1 (normalize)
        if (!bug.scatterDir) bug.scatterDir = new THREE.Vector3(random(-1, 1), random(-1, 1), random(-0.5, 0.5)).normalize();
        
        // Add smooth shifting perlin noise to the direction vector so the bug weaves and curves naturally
        let noiseVec = new THREE.Vector3(Math.sin(currentMillis * 0.005 + bug.noiseOffset) * 0.5, Math.cos(currentMillis * 0.004 + bug.noiseOffset) * 0.5, Math.sin(currentMillis * 0.006 + bug.noiseOffset) * 0.5);
        // Add noise vector to direction and normalize it again
        bug.scatterDir.add(noiseVec).normalize(); 
        // Multiply normalized direction by the speed scalar to create velocity
        let velocity = bug.scatterDir.clone().multiplyScalar(chaoticSpeed); 
        // Apply velocity to position tracking
        bug.position.add(velocity); 
        
        // Boundary Logic: Check if position exceeds screen bounds (minus 100px margin). If it does, reverse the direction on that axis.
        let margin = 100;
        if (bug.position.x < margin) { bug.position.x = margin; bug.scatterDir.x *= -1; }
        if (bug.position.x > width - margin) { bug.position.x = width - margin; bug.scatterDir.x *= -1; }
        if (bug.position.y < margin) { bug.position.y = margin; bug.scatterDir.y *= -1; }
        if (bug.position.y > height - margin) { bug.position.y = height - margin; bug.scatterDir.y *= -1; }

        // Send calculated position to actual 3D mesh
        bug.mesh.position.copy(bug.position);
        
        // Make wings visible
        bug.wingL.visible = true; bug.wingR.visible = true;
        
        // Flapping math: Math.sin oscillates -1 to 1. Math.abs forces it 0 to 1. This stretches and compresses the wing width rapidly.
        let flap = Math.abs(Math.sin(currentMillis * 0.08 + bug.noiseOffset));
        // Base width calculated from native image aspect ratio
        let maxWingWidth = 30 * (bug.wingAspect || 2.0);
        // Apply flap formula to width
        let wingW = maxWingWidth * (0.2 + flap * 0.8);
        bug.wingL.scale.set(wingW, 30, 1); bug.wingR.scale.set(wingW, 30, 1);
        
        // As the defense power meter rises, slowly crush and shrink the bugs out of existence based on their index fraction
        if (defenseActive) {
            let disappearThreshold = index / bugs.length; 
            if (recoveryProgress > disappearThreshold) bug.mesh.scale.multiplyScalar(0.92);
        }
        return; 
    }

    // Dynamic extraction of the wing image aspect ratio once it finally finishes downloading
    if (bug.wingAspect === undefined) {
        if (bug.wingL.material.map && bug.wingL.material.map.image) {
            let img = bug.wingL.material.map.image;
            if (img.width > 0 && img.height > 0) bug.wingAspect = img.width / img.height; 
        }
    }
    
    // Fallback constants for wings
    let aspectW = bug.wingAspect || 2.0; 
    let baseWingHeight = 30; 
    let maxWingWidth = baseWingHeight * aspectW; 

    // Wing animations applied to all standard states (Flying, Orbiting)
    if (bug.state !== 'face_formed' || (bug.state === 'face_formed' && !isFaceComplete)) {
        bug.wingL.visible = true; bug.wingR.visible = true;
        // Flap fast if flying, flap slow if attaching
        let flapSpeed = bug.state === 'flying' ? 0.04 : 0.02; 
        let flap = Math.abs(Math.sin(currentMillis * flapSpeed + bug.noiseOffset));
        let wingW = maxWingWidth * (0.2 + flap * 0.8); 
        bug.wingL.scale.set(wingW, baseWingHeight, 1); bug.wingR.scale.set(wingW, baseWingHeight, 1);
        bug.wingL.position.set(-2, 2, -2); bug.wingR.position.set(2, 2, -2);
    } 
    // Animation for when face is complete: Wings droop and fade out
    else if (bug.state === 'face_formed' && isFaceComplete) {
        if (bug.wingTransition === undefined) bug.wingTransition = 1.0;
        
        if (bug.wingTransition > 0) {
            // Subtract delta time to create a 0.0 tracker
            bug.wingTransition -= deltaTime * 1.5; 
            // Prevent going below zero
            if (bug.wingTransition < 0) bug.wingTransition = 0;
            
            let scaleT = bug.wingTransition;
            // Calculate a Y-drop coordinate
            let fallY = 2 - (1.0 - bug.wingTransition) * 80; 
            
            // Apply scales and positions to simulate drooping wings
            let wingW = maxWingWidth * scaleT;
            let wingH = baseWingHeight * scaleT;
            bug.wingL.scale.set(wingW, wingH, 1); bug.wingR.scale.set(wingW, wingH, 1);
            bug.wingL.position.set(-2, fallY, -2); bug.wingR.position.set(2, fallY, -2);
        } else {
            // Hard hide when transition finishes
            bug.wingL.visible = false; bug.wingR.visible = false;
        }
    }

    // AI State logic for fully attached face parts
    if (bug.state === 'face_formed') {
        if(targetAssembly) {
            // Grab the flower's current overall scale
            let worldScale = targetAssembly.scale.x; 
            if (worldScale < 0.001) worldScale = 0.001; 
            
            // Math: Because the bug is now grouped INSIDE the flower folder, it multiplies its scale. We must inverse-scale (1/scale) it so it doesn't become microscopic.
            bug.mesh.scale.set(1 / worldScale, 1 / worldScale, 1 / worldScale);
            
            // Look up exact hard-coded coordinates to position this specific face part
            let offset = FACE_OFFSETS[bug.category];
            // Apply offset, also dividing by world scale
            bug.mesh.position.set(offset.x / worldScale, offset.y / worldScale, offset.z / worldScale);
        }
        return; 
    }

    // Ensure the bug body image (nose, eye) correctly maintains its native PNG aspect ratio and custom modifier scale
    if (!bug.aspectSet && bug.feature.material.map && bug.feature.material.map.image) {
      let img = bug.feature.material.map.image;
      if (img.width > 0 && img.height > 0) {
        let aspect = img.width / img.height;
        let scaleMult = FEATURE_SCALES[bug.category] || 1.0;
        // Override edge case for specific lip image
        if (bug.category === 'Lips' && bug.suffix === 1) scaleMult = 0.55;
        let baseSize = 40 * scaleMult;
        bug.feature.scale.set(baseSize * aspect, baseSize, 1);
        bug.aspectSet = true;
      }
    }

    // Skip tracking if flower died or unloaded
    if(!targetAssembly) return;
    let targetPos = targetAssembly.position.clone();
    
    // AI State for Orbiting: Hovering around the victim menacingly before attacking
    if (hasVictim && bug.targetIndex === victimIndex) {
        // Enforce a 10 second wait before they attach
        let canFormFace = (currentMillis - victimStartTime > 10000); 
        if (!bug.isVictimHunter || !canFormFace) {
            // Constantly increase the orbit angle
            bug.orbitAngle += bug.orbitSpeed * deltaTime * 1000;
            // Trigonometry map: Cosine maps X axis, Sine maps Z axis to create a perfect circle based on angle and radius
            let ox = Math.cos(bug.orbitAngle) * bug.orbitDistance;
            let oz = Math.sin(bug.orbitAngle) * bug.orbitDistance;
            // Add offsets to target position
            targetPos.add(new THREE.Vector3(ox, bug.orbitYOffset, oz));
        }
    }

    // AI State for standard flight toward target
    if (bug.state === 'flying') {
      // Vector Math: target position minus current position yields the direction to travel
      let dir = targetPos.clone().sub(bug.position);
      // Determine distance
      let distToTarget = dir.length();
      
      // Normalize vector to set magnitude to 1
      if (distToTarget > 0.001) { dir.normalize(); } else { dir.set(0, 1, 0); }
      
      // Combine 3 sine waves offset by distinct speeds and noise offsets to create an organic wobble
      let noiseVec = new THREE.Vector3(Math.sin(currentMillis * 0.002 + bug.noiseOffset), Math.cos(currentMillis * 0.0017 + bug.noiseOffset), Math.sin(currentMillis * 0.0023 + bug.noiseOffset));
      // Reduce the wobble intensely when very close to target (dist < 150) so it doesn't overshoot
      let wobbleStrength = distToTarget < 150 ? (distToTarget / 150) * 0.5 : 0.8;
      dir.add(noiseVec.multiplyScalar(wobbleStrength)).normalize();

      let currentSpeed = bug.speed;
      // Math: map() gracefully slows down the speed multiplier as the distance shrinks below 100
      if (distToTarget < 100) currentSpeed = map(distToTarget, 0, 100, 1.5, bug.speed); 

      // Multiply direction by speed to get velocity, then add to position
      let velocity = dir.multiplyScalar(currentSpeed);
      bug.position.add(velocity);
      bug.mesh.position.copy(bug.position);

      // AI Logic check: Has the bug arrived?
      if (distToTarget < 20) {
        
        // If there is no victim yet, randomly trigger the first attack sequence
        if (!hasVictim && currentMillis - sceneStartTime > 8000) { 
          hasVictim = true; victimIndex = bug.targetIndex; victimStartTime = currentMillis; 
          
          targetAssembly.userData.isRed = true;
          targetAssembly.userData.whiteModel.visible = true; targetAssembly.userData.redModel.visible = true;
          targetAssembly.userData.whiteModel.scale.setScalar(1.0); targetAssembly.userData.redModel.scale.setScalar(1.0);
          
          // Pre-configure opacities for the fade-in sequence
          setAssemblyOpacity(targetAssembly.userData.whiteModel, 1.0); setAssemblyOpacity(targetAssembly.userData.redModel, 0.0);
          
          // Wipe memory sets
          targetAssembly.userData.collectedFeatures = new Set();
          targetAssembly.userData.isCorrupted = false; targetAssembly.userData.corruptionStartTime = 0;
          
          // Reset struggling red animation to frame zero
          if(targetAssembly.userData.mixerR && targetAssembly.userData.actionR) {
              targetAssembly.userData.actionR.reset(); targetAssembly.userData.mixerR.timeScale = 0; 
          }
          
          let baseY = height - 70;

          // Dramatic scene shift: Loop through all flowers and push them away, pulling victim to center
          for(let k = 0; k < numTiles; k++) {
              let f = tiles[k];
              // Target victim
              if (k === victimIndex) {
                  // Force base target to exact middle screen, somewhat low
                  f.baseTargetTx = width / 2; f.baseTargetTy = baseY - height * 0.74; f.baseTargetTz = 0;
              } else {
                  // Re-calculate non-victims forcing them to outer circular rings
                  let radius = random(width * 0.17, width * 0.38); 
                  f.baseTargetTx = width / 2 + Math.cos(f.angle) * radius; f.baseTargetTz = Math.sin(f.angle) * radius;
                  f.baseTargetTy = baseY - random(height * 0.18, height * 0.65); 
              }
          }

          // Randomize which image sub-variation will be used for the entire face build
          let targetSuffix = Math.floor(Math.random() * 6) + 1; 
          // Shuffle categories so we assign face parts randomly
          let availableCategories = shuffle([...BUG_CATEGORIES]); 
          
          // Command this first bug to initiate attack
          bug.isVictimHunter = true; bug.category = availableCategories[0]; bug.suffix = targetSuffix;
          bug.feature.material.map = allBugTextures[bug.category][bug.suffix]; bug.aspectSet = false; 

          // Sift out this bug from array, shuffle remaining array
          let otherBugs = bugs.filter(b => b !== bug);
          otherBugs = shuffle(otherBugs); 
          
          // Command 5 more bugs from the random pile to assist in the attack
          for (let k = 0; k < otherBugs.length; k++) {
              let b = otherBugs[k];
              if (k < 5) {
                  b.isVictimHunter = true; b.targetIndex = victimIndex; b.category = availableCategories[k + 1]; b.suffix = targetSuffix;
                  b.feature.material.map = allBugTextures[b.category][b.suffix]; b.aspectSet = false;
              } else {
                  // Make the rest keep doing whatever they were doing, but change their target safely to victim
                  b.isVictimHunter = false; b.targetIndex = victimIndex; 
              }
          }
        } 
        
        let canFormFace = (currentMillis - victimStartTime > 10000); 

        // If attack is on and this bug is designated as an attacker
        if (hasVictim && bug.targetIndex === victimIndex) {
            if (bug.isVictimHunter && canFormFace) {
                // Swap AI state to locked
                bug.state = 'face_formed'; 
                // Grouping math: detach from global scene and add directly as a child to the flower group
                let flowerGroup = targetAssembly.children[0];
                flowerGroup.add(bug.mesh);
                // Register piece in Set
                targetAssembly.userData.collectedFeatures.add(bug.category);
                
                // If set size hits exactly 6, trigger final corruption phase
                if (targetAssembly.userData.collectedFeatures.size === 6 && !targetAssembly.userData.isCorrupted) {
                    targetAssembly.userData.isCorrupted = true; targetAssembly.userData.corruptionStartTime = currentMillis;
                }
            }
        } 
        else {
            // Normal behavior: Land on the flower and stay there randomly between 80-180 frames
            bug.state = 'landed'; bug.landTimer = random(80, 180); 
        }
      }
    } 
    // State machine handling landed bugs
    else if (bug.state === 'landed') {
      // Force position tightly to the 3D flower plus a small vertical offset
      bug.position.copy(targetPos).add(new THREE.Vector3(0, 30, 20));
      bug.mesh.position.copy(bug.position);
      
      // Subtract frame timer
      bug.landTimer--;
      
      // When timer hits zero, take off
      if (bug.landTimer <= 0) {
        // Redetermine target
        if (hasVictim) { bug.targetIndex = victimIndex; } else { bug.targetIndex = Math.floor(random(0, numTiles)); }
        
        // Reset coordinate forcefully off screen
        bug.position.set(random(0, width), random(height * 1.1, height * 1.6), random(-500, 500));
        bug.mesh.position.copy(bug.position);
        
        // Swap state back to flight
        bug.state = 'flying';
      }
    }
  });
}


// SECTION 8: 2D USER INTERFACE (UI) AND DRAWING

// Draw the massive background text layout onto the separate background canvas buffer
function drawBackgroundText(buf) {
  // Push acts like a folder, saving all subsequent styling commands so they don't leak out and affect other drawing commands later
  buf.push();
  
  // Set fill to our specific Neon Green hex color
  buf.fill('#AEEB87');
  // Remove borders on text
  buf.noStroke();
  
  // Calculate multipliers mapping the current screen size against a reference 1080p screen
  let scaleX = width / 1920;
  let scaleY = height / 1080;
  // Pick whichever multiplier is smaller to ensure scaling down doesn't get squished
  let sScale = Math.min(scaleX, scaleY);
  
  // Scale text sizes dynamically by multiplying the native value with the calculated scale
  let titleSize = 140 * sScale;
  let lineSpacing = 130 * sScale;
  let padX = 60 * scaleX; 
  let visualPadY = 80 * scaleY; 
  let optLeft = 6 * scaleX; 
  let wKerning = 0; 

  // Align rendering anchor point to Bottom Left
  buf.textAlign(LEFT, BASELINE); 
  // Assign font styles
  buf.textSize(titleSize);
  buf.textStyle(NORMAL);
  buf.textFont('Helvetica, Arial, sans-serif');
  
  // Calculate exactly where the first line should be drawn on the Y-Axis
  let topBaseline = visualPadY + 100 * scaleY;
  
  let str1 = "IF NOT ME,";
  // Dynamically calculate exactly how many pixels wide this specific string is
  let w1 = buf.textWidth(str1);
  
  // Calculate coordinate if text should stick to right side
  let targetX1_Normal = width - padX - w1; 
  // Calculate coordinate if text should stick to left side
  let targetX1_Swap = padX; 
  // Use lerp (Linear Interpolation) to calculate the middle-ground coordinate based on the shifting layoutLerp decimal
  let x1 = lerp(targetX1_Normal, targetX1_Swap, layoutLerp);
  
  // Actually stamp the text pixels
  buf.text(str1, x1, topBaseline);
  
  // Setup next line
  buf.textFont('Helvetica, Arial, sans-serif');
  let strHO = "HO?";
  let wHO = buf.textWidth(strHO);
  
  // Swap to the fancy cursive font for a single letter
  buf.textFont('"Mea Culpa", cursive');
  let strW1 = "W";
  let wW1 = buf.textWidth(strW1);
  
  // Sum widths to find total footprint
  let totalW2 = wW1 + wHO - wKerning;
  let targetX2_Normal = width - padX - totalW2;
  let targetX2_Swap = padX;
  let x2 = lerp(targetX2_Normal, targetX2_Swap, layoutLerp);
  
  // Draw cursive "W"
  buf.textFont('"Mea Culpa", cursive');
  buf.text(strW1, x2, topBaseline + lineSpacing);
  
  // Draw normal "HO?" strictly pushed over by the calculated width of the cursive "W"
  buf.textFont('Helvetica, Arial, sans-serif');
  buf.text(strHO, x2 + wW1 - wKerning, topBaseline + lineSpacing);

  // Setup calculation for the bottom text lines
  let bottomBaseline = height - visualPadY; 
  
  buf.textFont('Helvetica, Arial, sans-serif');
  let strIfNot = "IF NOT";
  let wIfNot = buf.textWidth(strIfNot);
  let tX_ifNot_N = padX; 
  let tX_ifNot_S = width - padX - wIfNot; 
  let xIfNot = lerp(tX_ifNot_N, tX_ifNot_S, layoutLerp);
  // Subtracting line spacings from baseline draws text upwards from the bottom
  buf.text(strIfNot, xIfNot, bottomBaseline - lineSpacing * 2);

  let strNow = "NOW,";
  let wNow = buf.textWidth(strNow);
  let tX_now_N = padX;
  let tX_now_S = width - padX - wNow;
  let xNow = lerp(tX_now_N, tX_now_S, layoutLerp);
  buf.text(strNow, xNow, bottomBaseline - lineSpacing);

  // Split-font drawing block for "WHEN?"
  buf.textFont('"Mea Culpa", cursive');
  let strW2 = "W";
  let wW2 = buf.textWidth(strW2);
  buf.textFont('Helvetica, Arial, sans-serif');
  let strHen = "HEN?";
  let wHen = buf.textWidth(strHen);
  
  let totalW3 = wW2 + wHen - wKerning;
  let tX_when_N = padX;
  let tX_when_S = width - padX - totalW3;
  let xWhen = lerp(tX_when_N, tX_when_S, layoutLerp);

  buf.textFont('"Mea Culpa", cursive');
  buf.text(strW2, xWhen, bottomBaseline);
  buf.textFont('Helvetica, Arial, sans-serif');
  buf.text(strHen, xWhen + wW2 - wKerning, bottomBaseline);
  
  // Configure smaller paragraph text
  buf.fill('#D0FFEA'); 
  buf.textSize(24 * sScale);
  buf.textStyle(NORMAL);
  buf.textFont('Helvetica, Arial, sans-serif');
  
  // Store the block of text as lines in an array
  let lines = [
      "Master the 5Ds of Bystander Intervention",
      "today to help end violence against women",
      "and build safer spaces for everyone."
  ];
  let pLineSpacing = 32 * sScale;
  
  // Loop through each line to draw them properly stacked
  for (let i = 0; i < lines.length; i++) {
      let lw = buf.textWidth(lines[i]);
      let tX_N = width - padX - lw; 
      let tX_S = padX + optLeft;  
      let lx = lerp(tX_N, tX_S, layoutLerp);
      let ly = bottomBaseline - (lines.length - 1 - i) * pLineSpacing; 
      buf.text(lines[i], lx, ly);
  }
  
  // Close the 'folder' of styles to reset drawing mode
  buf.pop();
}

// Function handling the drawing of the wavy music toggle button
function drawAudioWave(buf) {
  buf.push();
  
  // Recalculate scales inside local function scope
  let scaleX = width / 1920; let scaleY = height / 1080; let sScale = Math.min(scaleX, scaleY);
  
  let w = 80 * scaleX; let h = 30 * scaleY;
  let padX = 60 * scaleX; let visualPadY = 80 * scaleY; let optLeft = 6 * scaleX; let spacing = 55 * scaleX; 
  
  // Calculate bounding box targets
  let tX_N = padX + optLeft + spacing; 
  let tX_S = width - padX - w - spacing;
  let waveX = lerp(tX_N, tX_S, layoutLerp);
  let waveY = visualPadY;
  
  // Translate literally moves the 0,0 grid origin to exactly where the button is. This makes calculating coordinates for the inner wave much easier (everything starts at 0 locally).
  buf.translate(waveX, waveY); 
  
  // Remove interior fill, add stroke line styling
  buf.noFill();
  buf.stroke('#D0FFEA'); 
  buf.strokeWeight(4 * sScale);   
  
  // Begin collecting vertices (points) to draw a continuous custom line
  buf.beginShape();
  
  // If boolean true, execute math loop to build a wavy line
  if (isMusicPlaying) {
      // Loop over X width in 2-pixel jumps
      for (let x = 0; x <= w; x += 2) { 
          // Math: Use Sine wave mapped to X iterator, subtracted by flowing time, multiplied by height to oscillate Y coordinates
          let y = h/2 + Math.sin(x * 0.15 - millis() * 0.005) * (h/2);
          // Add point to geometry
          buf.vertex(x, y);
      }
  } else {
      // If boolean false, just draw a straight flat line across
      buf.line(0, h/2, w, h/2);
  }
  // Connect and seal the points together with ink
  buf.endShape();
  
  // Revert styles to stamp text label underneath
  buf.noStroke(); buf.fill('#D0FFEA'); buf.textSize(24 * sScale); buf.textStyle(NORMAL); buf.textFont('Helvetica, Arial, sans-serif'); 
  buf.textAlign(CENTER, TOP); buf.text("MUSIC", w / 2, h + 8 * scaleY); 
  
  buf.pop();
}

// Draw the circle information button
function drawInfoButton(buf) {
  buf.push();
  
  let scaleX = width / 1920; let scaleY = height / 1080; let sScale = Math.min(scaleX, scaleY);
  
  let padX = 60 * scaleX; let visualPadY = 80 * scaleY; let optLeft = 6 * scaleX; let infoD = 36 * sScale; 

  let tX_N = padX + optLeft + infoD / 2;
  let tX_S = width - padX - infoD / 2;
  let x = lerp(tX_N, tX_S, layoutLerp);
  let y = visualPadY + infoD / 2;

  buf.noFill(); 
  buf.stroke('#AEEB87'); 
  
  // TĂNG ĐỘ DÀY VIỀN TẠI ĐÂY (đổi 2 thành 4 hoặc 5 tùy ý)
  buf.strokeWeight(4 * sScale); 
  
  // Draw the actual mathematical circle outline
  buf.circle(x, y, infoD);

  // Setup styles for the 'i' text and center it perfectly on the circle coordinates
  buf.fill('#AEEB87'); 
  buf.noStroke(); 
  buf.textAlign(CENTER, CENTER); 
  buf.textSize(20 * sScale); 
  buf.textFont('Helvetica, Arial, sans-serif');
  
  // THÊM LỆNH NÀY ĐỂ LÀM ĐẬM CHỮ "i"
  buf.textStyle(BOLD); 
  
  buf.text("i", x, y + 2 * scaleY); 
  
  buf.pop();
}


// SECTION 9: MAIN DRAWING LOOP (RUNS 60 TIMES PER SECOND)

// This native p5.js loop executes constantly, driving all visuals, math, and rendering functions for every frame.
function draw() {
  // Capture current millisecond
  let currentMillis = millis();

  // If subtracting the recorded swap time from current time yields more than 8000ms (8 seconds)
  if (currentMillis - lastLayoutSwapTime > 8000) {
      // Toggle boolean to opposite state
      isLayoutSwapped = !isLayoutSwapped;
      // Record new swap time marker
      lastLayoutSwapTime = currentMillis;
  }
  
  // If boolean true, set target to 1.0, else 0.0
  let targetLerp = isLayoutSwapped ? 1.0 : 0.0;
  // Linear Interpolation: Forces the layoutLerp value to slide smoothly towards the target value by 5% every single frame, creating fluid motion
  layoutLerp = lerp(layoutLerp, targetLerp, 0.05);

  // Boolean trigger condition: If there is an active attack, no user interaction, and the blood level has risen past 33% of screen height
  let isAudioGlitching = (hasVictim && !userInteracted && bloodLevel > height / 3);

  // If all animations completed and recovery hasn't processed
  if (allFlowersBloomed && !victimRecovered) isBgm2Active = true;

  // Initialize placeholder local variables for logic checks
  let targetAmbient = 0.8;
  let targetGen = 0.0;
  
  // Route audio mixing targets based on state flags
  if (isBgm2Active) {
      // Mute ambient completely, blast generative music
      targetAmbient = 0.0; targetGen = 0.6;     
  } else {
      // If we are actively running through the wave bloom sequence, mute ambient to let piano notes shine
      if (currentMillis - lastBloomNoteTriggerTime < bloomInterval) targetAmbient = 0.0; 
      // Else standard ambient baseline
      else targetAmbient = 0.8; 
      targetGen = 0.0;
  }
  
  // Smoothly blend the current volume decimal toward the target decimal by 1.5% each frame to avoid audio popping
  currentBgVol = lerp(currentBgVol, targetAmbient, 0.015);
  genBgmCurrentVol = lerp(genBgmCurrentVol, targetGen, 0.015);

  // Manipulate playback speed (pitch): Slow down when losing, speed up wildly during defense counter-attack, otherwise normal
  if (hasVictim && !userInteracted) targetBgRate = 0.8; 
  else if (userInteracted) targetBgRate = 1.33; 
  else targetBgRate = 1.0; 
  // Smoothly blend speed parameter
  currentBgRate = lerp(currentBgRate, targetBgRate, 0.015); 

  // Audio distortion sub-routine triggered only during extreme danger
  if (isAudioGlitching && isMusicPlaying) {
      // Math modulo: Execute this block only once every 6 frames
      if (frameCount % 6 === 0) { 
          // Inject totally random numbers into jitter modifiers to corrupt the sound parameters
          currentRateJitter = random(-0.25, 0.25); currentVolJitter = random(0.2, 0.6);
      }
  } else {
      // Force neutral state
      currentRateJitter = 0; currentVolJitter = 0;
  }

  // Final audio commit processing
  if (bgSoundFile && bgSoundFile.isPlaying()) {
      // Prevent volume from dipping below mathematical zero
      let finalVol = max(0, currentBgVol - currentVolJitter);
      let finalRate = currentBgRate + currentRateJitter;
      
      // Override p5 sound engine parameters (adding tiny internal fade of 0.05 to smooth it out)
      bgSoundFile.setVolume(finalVol, 0.05);
      bgSoundFile.rate(finalRate); 
  }
  
  // Trigger music generation logic check
  playGenerativeMusic(currentMillis);
  
  // Final noise volume processing
  if (glitchNoise) {
      // Randomize amplitude (volume) rapidly between 0.05 and 0.2 to simulate electric static clipping
      if (isAudioGlitching && isMusicPlaying) glitchNoise.amp(random(0.05, 0.2), 0.05); 
      // Force mute
      else glitchNoise.amp(0, 1.5); 
  }

  // Paint the entire primary HTML canvas Solid Pink, effectively erasing everything from the previous frame
  background(255, 0, 147);

  // Wipe the off-screen UI canvases clean
  bgTextBuffer.clear();
  uiBuffer.clear();
  
  // Command UI functions to redraw text and buttons onto the freshly cleared buffers based on the new frame calculations
  drawBackgroundText(bgTextBuffer);
  drawAudioWave(uiBuffer);
  drawInfoButton(uiBuffer);

  // Set standard trailing fade opacity value
  let fadeAlpha = 30;
  // If scene is finishing up beautifully, reduce alpha to 10 so trails last significantly longer on screen
  if (userInteracted && allFlowersBloomed) fadeAlpha = 10;

  // Change composite operation on the blood buffer to "Destination-Out". This means anything drawn next will ERASE pixels instead of adding to them.
  bloodBuffer.drawingContext.globalCompositeOperation = 'destination-out';
  bloodBuffer.noStroke();
  
  // Set fill to white (color doesn't matter for eraser) but with specific Alpha transparency
  bloodBuffer.fill(255, fadeAlpha); 
  
  // Draw a giant eraser rectangle over the whole screen. Because Alpha is low (30), it only partially erases pixels from the previous frame, creating a motion blur effect!
  bloodBuffer.rect(-20, -20, width + 40, height + 40); 
  
  // Restore normal composite operation so we can draw normally again
  bloodBuffer.drawingContext.globalCompositeOperation = 'source-over';

  bloodBuffer.push();
  
  // Logic generating the falling blood drip drops
  if (hasVictim) {
    if (!userInteracted) {
      let redAssembly = flowerInstances[victimIndex];
      
      if (redAssembly) {
        // Evaluate native audio clip duration
        let soundDur = (bloodDripSound && bloodDripSound.isLoaded() && bloodDripSound.duration() > 0) ? bloodDripSound.duration() : 0.8;
        let actualSoundDurMs = (soundDur / 0.75) * 1000;
        let spacingMs = actualSoundDurMs + 500; 

        // Spawn a new drip randomly if there are less than 6 currently active and 15 frames have passed
        if (bloodDrips.length < 6 && frameCount % 15 === 0) {
            let baseFallTimeMs = random(1200, 2500); 
            // Calculate exact future millisecond when drip should hit floor
            let desiredImpactTime = currentMillis + baseFallTimeMs;
            let impactTime = Math.max(desiredImpactTime, nextScheduledImpact);

            // Verify queue spacing logic
            if (impactTime - currentMillis <= 3500) {
                // Grab exact current 3D mapped Y coordinate of the victim flower
                let startY = height - redAssembly.position.y;
                let startX = redAssembly.position.x + random(-15, 15);
                
                // Inject new drop object into tracking array
                bloodDrips.push({
                    x: startX, startY: startY, y: startY, spawnTime: currentMillis, impactTime: impactTime,
                    size: random(3, 8), hasPlayedSound: false
                });
                
                // Schedule next sound spacing
                nextScheduledImpact = impactTime + spacingMs;
            }
        }
      }
    }

    // Assign color for the actual blood shapes
    bloodBuffer.fill('#2A0009'); bloodBuffer.noStroke();
    
    // Calculate absolute Y coordinate for the rising liquid surface
    let targetSurfaceY = height - bloodLevel; 

    // Loop backwards through array (required best-practice when you plan to delete items from an array inside the loop)
    for (let i = bloodDrips.length - 1; i >= 0; i--) {
      let drip = bloodDrips[i];
      
      // Calculate a math decimal representing current progress mapped between 0.0 (start) and 1.0 (impact)
      let progress = (currentMillis - drip.spawnTime) / (drip.impactTime - drip.spawnTime);
      // Hard cap the progress at 1.0 just in case time math drifted
      progress = constrain(progress, 0, 1);
      
      // Lerp uses progress decimal to calculate exact Y coordinate between start point and surface line
      drip.y = lerp(drip.startY, targetSurfaceY, progress);
      
      // Draw actual graphic oval 
      bloodBuffer.ellipse(drip.x, drip.y, drip.size, drip.size * 2);
      
      // Processing destruction logic if drip reached end
      if (progress >= 1.0) {
        // Trigger boolean that rising math uses
        bloodHitBottom = true; 
        
        // Command sound file to play once
        if (!drip.hasPlayedSound && bloodDripSound && bloodDripSound.isLoaded()) {
            bloodDripSound.play(0, 0.75, 0.2); drip.hasPlayedSound = true;
        }
        
        // Splice deletes this object exactly from the array index
        bloodDrips.splice(i, 1); 
      }
    }

    // Increase blood level progressively based on frame time
    if (!userInteracted) {
      if (bloodHitBottom) bloodLevel += (currentMillis - lastClockTime) * height * 0.000025; 
    } else {
      // Invert math subtraction to make blood sink when user intervenes
      bloodLevel -= (currentMillis - lastClockTime) * height * 0.0002; bloodHitBottom = false; 
    }
  } else {
    // Hard reset variables
    bloodLevel = 0; bloodDrips = []; bloodHitBottom = false;
  }
  
  // Constrain forces value to stay safely between 0 and screen height + 50
  bloodLevel = constrain(bloodLevel, 0, height + 50);
  
  // Generating wave polygon for the rising blood surface
  if (bloodLevel > 0) {
    // Fill uses RGBA values. 230 Alpha gives it slight transparency so we can see stuff underneath
    bloodBuffer.fill(42, 0, 9, 230); bloodBuffer.noStroke();
    
    // Command p5.js to begin recording a freeform connected shape
    bloodBuffer.beginShape();
    // Anchor vertex Bottom Left
    bloodBuffer.vertex(0, height); 
    
    // Loop across the entire X width in 50 pixel jumps
    for (let x = 0; x <= width + 50; x += 50) {
      // Calculate Y coordinate using compounded sine waves synced to time and X offset
      let waveY = height - bloodLevel + Math.sin(currentMillis * 0.002 + x * 0.005) * (height * 0.03) + Math.sin(currentMillis * 0.003 + x * 0.002) * (height * 0.015);
      // Place a vertex point
      bloodBuffer.vertex(x, waveY);
    }
    // Anchor vertex Bottom Right
    bloodBuffer.vertex(width, height); 
    // Fill shape connecting last dot to first dot
    bloodBuffer.endShape(CLOSE);
  }
  
  bloodBuffer.pop();

  // Commit all compiled blood drawings and background text into the main canvas using image function
  image(bloodBuffer, 0, 0);
  image(bgTextBuffer, 0, 0);

  // Apply identical destination-out erasure logic to the branch trails buffer
  trailBuffer.drawingContext.globalCompositeOperation = 'destination-out';
  trailBuffer.noStroke(); trailBuffer.fill(255, fadeAlpha); trailBuffer.rect(-20, -20, width + 40, height + 40); 
  trailBuffer.drawingContext.globalCompositeOperation = 'source-over';

  // Tick the global rotation angle forward infinitely
  rotY += 0.009; 
  // Wipe fresh tree branch buffer
  treeBuffer.clear();
  // Initialize placeholder array for the frame rendering list
  let renderList = [];
  
  // Sub-loop iterating every flower tracking object
  for (let i = 0; i < tiles.length; i++) {
    let t = tiles[i];

    // Conditional evaluation calculating exactly what opacity (blur) value this specific branch needs right now
    let targetBlur = 0;
    if (hasVictim && !victimRecovered) {
        if (i === victimIndex) targetBlur = 0; 
        else if (userInteracted && i === selectedFlowerIndex) targetBlur = 0; 
        else if (bloomingSequenceStarted) {
            let seqIdx = bloomSequenceIndices.indexOf(i);
            if (seqIdx !== -1 && seqIdx < currentBloomStep) targetBlur = 0;
            else targetBlur = 1.0;
        } else targetBlur = 1.0; 
    } else targetBlur = 0; 
    
    // Apply sliding interpolation to the blur parameter
    t.blurProgress = lerp(t.blurProgress || 0, targetBlur, 0.05); 

    // Chaotic and Defensive specific motion generation math
    if (hasVictim) {
      // Freeze the victim entirely
      if (i === victimIndex && !victimRecovered) {
        t.targetTx = t.baseTargetTx; t.targetTy = t.baseTargetTy; t.targetTz = t.baseTargetTz;
      } else {
        if (defenseActive) {
          // Time multiplier variable
          let time = currentMillis * 0.0015;
          let centerTx = width / 2; let centerTz = 0;
          let rotationAngle = time * 0.5;
          
          // Math floor rounds decimals down to whole integers. Used here to establish wave cycles.
          let cycle = Math.floor(rotationAngle / (Math.PI * 2));
          let cycleProgress = (rotationAngle % (Math.PI * 2)) / (Math.PI * 2);
          
          // Noise function returns smooth random 0 to 1 value based on seed. Used here to generate random quantity of sine waves per cycle.
          let numWaves1 = Math.floor(map(noise(cycle * 123.45), 0, 1, 2, 6)); 
          let numWaves2 = Math.floor(map(noise((cycle + 1) * 123.45), 0, 1, 2, 6)); 
          
          // Constraints bounding
          let minY = height * 0.07; let maxY = height * 0.8;
          let centerTy = (minY + maxY) / 2; let amplitude = (maxY - minY) / 2;
          
          // Modulo math sorting objects into 3 distinct radius rings
          let layer = i % 3; 
          let baseRadius = width * 0.2 + layer * (width * 0.11); 
          let safeRadius = baseRadius + Math.sin(time + i) * (width * 0.015); 
          
          // Apply trigonometric assignments
          t.targetTx = centerTx + Math.cos(t.angle + rotationAngle) * safeRadius;
          t.targetTz = centerTz + Math.sin(t.angle + rotationAngle) * safeRadius;
          
          // Multiply multiple waves together
          let wave1 = Math.sin(t.angle * numWaves1 + time * 1.5) * amplitude; 
          let wave2 = Math.sin(t.angle * numWaves2 + time * 1.5) * amplitude; 
          
          // Calculate an acceleration easing curve
          let smoothP = cycleProgress * cycleProgress * (3 - 2 * cycleProgress);
          // Lerp wave outputs based on easing
          let multiWave = lerp(wave1, wave2, smoothP);
          let ripple = Math.sin(time * 3 + t.angle * 2) * (height * 0.04);
          
          // Assign finalized Y coordinates
          t.targetTy = centerTy + multiWave + ripple; 
        } else {
          // Implement random scary perlin noise offset to completely scramble branches violently
          let time = currentMillis * 0.0012;
          let moveRangeX = width * 0.13; let moveRangeZ = width * 0.13; let moveRangeY = height * 0.32; 
          t.targetTx = t.baseTargetTx + (noise(time, i) - 0.5) * 2 * moveRangeX;
          t.targetTz = t.baseTargetTz + (noise(i, time) - 0.5) * 2 * moveRangeZ;
          let chaoticY = t.baseTargetTy + (noise(time, i * 2) - 0.5) * 2 * moveRangeY;
          let baseY = height - 70; let maxAllowedY = baseY - height * 0.67; 
          if (chaoticY < maxAllowedY) chaoticY = maxAllowedY;
          t.targetTy = chaoticY;
        }
      }
    }

    // Apply linear interpolation repeatedly to drag ALL actual branch components (X, Y, Control Points) toward their calculated math targets
    t.currentTx = lerp(t.currentTx, t.targetTx, 0.02); t.currentTy = lerp(t.currentTy, t.targetTy, 0.02); t.currentTz = lerp(t.currentTz, t.targetTz, 0.02);
    t.currentCp1x = lerp(t.currentCp1x, t.targetCp1x, 0.02); t.currentCp1y = lerp(t.currentCp1y, t.targetCp1y, 0.02); t.currentCp1z = lerp(t.currentCp1z, t.targetCp1z, 0.02);
    t.currentCp2OffsetX = lerp(t.currentCp2OffsetX, t.targetCp2OffsetX, 0.02); t.currentCp2OffsetY = lerp(t.currentCp2OffsetY, t.targetCp2OffsetY, 0.02); t.currentCp2OffsetZ = lerp(t.currentCp2OffsetZ, t.targetCp2OffsetZ, 0.02);
    let cp2x = t.currentTx + t.currentCp2OffsetX; let cp2y = t.currentTy + t.currentCp2OffsetY; let cp2z = t.currentTz + t.currentCp2OffsetZ;

    // Run the data through our massive projection math function to flatten 3D into 2D screen coordinates
    let pBase   = get3DProjection(t.bx, t.by, t.bz, rotY);
    let pCP1    = get3DProjection(t.currentCp1x, t.currentCp1y, t.currentCp1z, rotY);
    let pCP2    = get3DProjection(cp2x, cp2y, cp2z, rotY);
    let pTarget = get3DProjection(t.currentTx, t.currentTy, t.currentTz, rotY);

    // Push finalized rendering package into the frame array
    renderList.push({ pBase, pCP1, pCP2, pTarget, tileData: t, originalIdx: i });
  }

  // Sort array objects ascending based on zDepth variable, ensuring items furthest away from camera render first, creating correct visual layers
  renderList.sort((a, b) => a.pTarget.zDepth - b.pTarget.zDepth);

  // Second loop running over the sorted array to actually draw lines on screen
  for (let i = 0; i < renderList.length; i++) {
    let r = renderList[i];
    treeBuffer.noFill();
    
    // Safety check catching infinite zero-division errors if endpoints happen to exactly match
    if (Math.abs(r.pBase.x - r.pTarget.x) < 0.01 && Math.abs(r.pBase.y - r.pTarget.y) < 0.01) r.pTarget.x += 0.01; 
    
    // Extract HTML5 native command to create gradient line starting at base coordinates and terminating at target coordinates
    let branchGrad = treeBuffer.drawingContext.createLinearGradient(r.pBase.x, r.pBase.y, r.pTarget.x, r.pTarget.y);
    let baseColorStr = '#AEEB87'; let tipColorStr = '#D0FFEA';

    // Complex color processing based on victim state
    if (hasVictim && !victimRecovered && r.originalIdx === victimIndex) {
        let assembly = flowerInstances[r.originalIdx];
        if (recoveryProgress > 0) {
            // Lerp Color function transitions hex codes beautifully between two values based on decimal modifier
            let baseColor = lerpColor(color('#000000'), color('#AEEB87'), recoveryProgress);
            let tipColor = lerpColor(color('#2A0009'), color('#D0FFEA'), recoveryProgress);
            
            // Format colors back into raw rgb string format for HTML5 canvas interpretation
            baseColorStr = `rgb(${Math.round(red(baseColor))}, ${Math.round(green(baseColor))}, ${Math.round(blue(baseColor))})`;
            tipColorStr = `rgb(${Math.round(red(tipColor))}, ${Math.round(green(tipColor))}, ${Math.round(blue(tipColor))})`;
            
            // Inject color stops into gradient definition
            branchGrad.addColorStop(0.0, baseColorStr); branchGrad.addColorStop(1.0, tipColorStr);
        } else if (assembly && assembly.userData.isCorrupted) {
            let timeSinceCorruption = currentMillis - assembly.userData.corruptionStartTime;
            let cProg = constrain(timeSinceCorruption / 3000.0, 0, 1);
            branchGrad.addColorStop(0.0, '#000000'); 
            let spreadStop = constrain(cProg, 0.001, 0.999); 
            // Shift mid-gradient point slowly upwards
            branchGrad.addColorStop(spreadStop, '#2A0009'); branchGrad.addColorStop(1.0, '#A2084E');
        } else {
            // Static dark red logic for normal victim
            branchGrad.addColorStop(0.0, '#2A0009'); branchGrad.addColorStop(1.0, '#A2084E');
        }
    } else {
        // Normal green logic for standard stems
        branchGrad.addColorStop(0.0, baseColorStr); branchGrad.addColorStop(1.0, tipColorStr);
    }
    
    // Commit gradient into stroke color processor
    treeBuffer.drawingContext.strokeStyle = branchGrad;

    // Retrieve requested blur status
    let currentBlur = r.tileData.blurProgress * 6; 
    treeBuffer.drawingContext.filter = 'none'; 
    // Apply blur processing by directly multiplying the alpha (transparency) parameter of the native HTML drawing context, bypassing p5.js overhead
    if (currentBlur > 0.5) treeBuffer.drawingContext.globalAlpha = 1.0 - (r.tileData.blurProgress * 0.7); 
    else treeBuffer.drawingContext.globalAlpha = 1.0;
    
    // Set line thickness natively mapped against calculated perspective parameter (further away = thinner line)
    treeBuffer.strokeWeight(3 * r.pTarget.perspective);
    
    // Issue bezier drawing instruction, mapping 4 pairs of coordinates into the curved stem
    treeBuffer.bezier(r.pBase.x, r.pBase.y, r.pCP1.x, r.pCP1.y, r.pCP2.x, r.pCP2.y, r.pTarget.x, r.pTarget.y);
  }

  // Force global alpha back to solid 1.0 so subsequent system processes aren't corrupted
  treeBuffer.drawingContext.globalAlpha = 1.0;
  
  // Dump branch contents over to trailing buffer
  trailBuffer.image(treeBuffer, 0, 0);

  // Trigger massive sub-loop executing the 3D updates matching this render list
  renderFlowers(renderList); 

  // Merging systems pipeline
  if (flowerRenderer && flowerScene && flowerCamera) {
    // Array map creates a quick backup clone array storing true/false visibility data for all bugs
    let bugVisibilities = bugs.map(b => b.mesh.visible);
    
    // Mutate source array forcing all bugs invisible temporarily
    bugs.forEach(b => b.mesh.visible = false); 
    
    // Command Three.js to render a snapshot picture of the scene
    flowerRenderer.render(flowerScene, flowerCamera); 
    
    // Use low-level drawImage instruction copying pixels directly from 3D domElement over to the 2D trailBuffer
    if (flowerLayer) trailBuffer.drawingContext.drawImage(flowerLayer, 0, 0, width, height); 
    
    // Dump completed trail buffer onto the actual main screen output
    image(trailBuffer, 0, 0); 

    // Retrieve backup array and forcefully restore bug visibilities
    bugs.forEach((b, i) => b.mesh.visible = bugVisibilities[i]); 
    
    // Take a second snapshot using Three.js engine now that bugs are visible again
    flowerRenderer.render(flowerScene, flowerCamera); 
    
    // Stamp the final 3D picture onto the main output screen entirely separated from trails system
    if (flowerLayer) drawingContext.drawImage(flowerLayer, 0, 0, width, height); 
  }

  // Glitch generation logic processing block
  if (hasVictim && !userInteracted && bloodLevel > height / 3) {
    push();
    
    // Create shortcut variable to the raw canvas target
    let cnvElement = drawingContext.canvas;
    
    // Calculate random chance probability. 80% chance we skip doing anything.
    if (random() > 0.2) { 
        // Choose number of pixel slice bands dynamically
        let numSlices = Math.floor(random(4, 12)); 
        for (let i = 0; i < numSlices; i++) {
            // Assign randomized source bounding Y and Height parameters
            let sliceY = random(height - 30);
            let sliceH = random(5, 30); 
            // Select random displacement offset for the target X axis
            let shiftX = random(width * -0.02, width * 0.02); 
            
            if (sliceCtx && sliceBuffer) {
                // Wipe local slice sandbox clean
                sliceCtx.clearRect(0, 0, width, sliceH);
                
                // Copy exact rectangular band of pixels from main canvas onto sandbox canvas
                sliceCtx.drawImage(cnvElement, 0, sliceY, width, sliceH, 0, 0, width, sliceH);
                
                // Redraw pixels from sandbox back onto main canvas, utilizing the randomized X parameter to physically misalign them, generating the glitch!
                drawingContext.drawImage(sliceBuffer, 0, 0, width, sliceH, shiftX, sliceY, width, sliceH);
            }
        }
    }

    // Process UI Scale variables again locally
    let scaleX = width / 1920; let scaleY = height / 1080; let sScale = Math.min(scaleX, scaleY);
    
    // Math: Sine wave pulsing rapidly mapped to 0.65-1.0 to handle warning flicker opacity
    let flash = Math.sin(currentMillis * 0.008) * 0.35 + 0.65;
    let alphaVal = flash * 255;
    
    // Utilize native HTML drop-shadow filters mimicking neon glow
    drawingContext.shadowColor = '#FF0093'; drawingContext.shadowBlur = 40 * sScale; 

    // Render warning image if loaded
    if (warningImg && warningImg.width > 0) {
      // Toggle drawing mode mapping anchors to Image Center rather than Top-Left
      imageMode(CENTER); 
      // Force RGBA processing affecting opacity
      tint(255, alphaVal);
      
      // Setup relative dimensions calculated from raw source image data
      let imgW = 550 * sScale; let imgH = warningImg.height * (imgW / warningImg.width);
      let jitterX = random(-3, 3); let jitterY = random(-3, 3);
      
      // Draw image applying jitter offsets
      image(warningImg, width / 2 + jitterX, height / 2 - (140 * scaleY) + jitterY, imgW, imgH);
      
      // Halt RGBA processing and revert anchors
      noTint(); imageMode(CORNER); 
    }

    // Render warning text overlays
    textAlign(CENTER, CENTER); textFont('Helvetica, Arial, sans-serif'); fill(255, alphaVal); noStroke();
    textSize(110 * sScale); textStyle(BOLD); text("WARNING", width / 2 + random(-2, 2), height / 2 + (30 * scaleY));
    textSize(45 * sScale); textStyle(NORMAL); text("Please click on any white flower to intervene!", width / 2 + random(-1, 1), height / 2 + (120 * scaleY));
    
    pop();
  }

  // Always draw the UI buffer containing buttons last so no visual element can ever cover them up.
  image(uiBuffer, 0, 0);
}

// Projection processor taking native 3D parameters outputting flattened 2D coordinates required for 2D screen drawing
function get3DProjection(x, y, z, angle) {
  // Define Center coordinates as absolute Origin 0,0 mapping point
  let cx = width / 2; let cy = height / 2; 
  // Calculate raw offsets relative to Origin zero
  let rx = x - cx; let ry = y - cy; let rz = z; 
  
  // Trigonometry processing evaluating the Sin and Cosine modifications representing the physical rotation around Y-Axis
  let rotX = rx * cos(angle) + rz * sin(angle); 
  let rotZ = -rx * sin(angle) + rz * cos(angle);
  let rotY = ry; 
  
  // Establish distance focal plane simulating camera depth
  let cameraDistance = width * 1.04; 
  
  // Generate perspective scaling decimal. Divides the focal length by real distance. Close items result in decimals >1. Far items result in decimals <1.
  let perspective = cameraDistance / (cameraDistance - rotZ); 
  
  // Construct object payload
  return {
    // Math logic applying calculated perspective depth value directly modifying physical pixel locations
    x: cx + rotX * perspective, 
    y: cy + rotY * perspective,
    // Export parameter useful for dynamic sizing of independent meshes later
    perspective: perspective, 
    // Export raw depth tracker for Z-index sorting matrices
    zDepth: rotZ
  };
}