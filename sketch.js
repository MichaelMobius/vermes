let curves = [];
let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-=+[]{}|;:<>,.?/';
let customFont;
let colors = ['#FFFF00', '#FFA500', '#FF0000', '#0000FF', '#FF00FF', '#008000', '#00FFFF', '#800080'];
let colorCount = {};
let notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
let oscillators = []; // Array para almacenar osciladores

function preload() {
  customFont = loadFont('discodeck.ttf'); // Carga una fuente personalizada
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(customFont, 30);
  initializeCurves();
  userStartAudio(); // Asegurarse de que el audio esté listo
}

function draw() {
  background(0);
  curves.forEach(curve => {
    curve.move();
    curve.display();
  });
}

function initializeCurves() {
  curves = [];
  colors.forEach(color => colorCount[color] = 0);
  notes = shuffle(notes); // Mezclar las notas para asignarlas aleatoriamente
  let noteIndex = 0;
  while (curves.length < 15) {
    let midiNote = noteToMidi(notes[noteIndex % notes.length]); // Convertir nombre de nota a MIDI
    let frequency = midiToFreq(midiNote); // Convertir MIDI a frecuencia
    let osc = new p5.Oscillator();
    osc.setType('sine');
    osc.freq(frequency);
    osc.amp(0); // Inicialmente sin volumen
    osc.start();
    oscillators.push(osc);

    let curve = new Curve(osc, notes[noteIndex % notes.length]);
    if (curve.color) {
      curves.push(curve);
      noteIndex++;
    }
  }
}

function mousePressed() {
  if (getAudioContext().state !== 'running') {
    userStartAudio(); // Iniciar el contexto de audio con una interacción del usuario
  }
  initializeCurves(); // Reiniciar y regenerar las curvas cada vez que se hace clic
}

class Curve {
  constructor(oscillator, note) {
    this.char = random(chars.split(''));
    this.oscillator = oscillator;
    this.note = note;
    this.color = this.assignColor();
    this.numPoints = floor(random(5, 40)); // El número de puntos también determina la duración del sonido
    this.headPos = createVector(random(width), random(height));
    this.vel = p5.Vector.random2D().mult(random(0.5, 2));
    this.points = [];
    this.isPlaying = false;
    this.initPoints();
  }

  assignColor() {
    let availableColors = colors.filter(color => colorCount[color] < 2);
    if (availableColors.length > 0) {
      let color = random(availableColors);
      colorCount[color]++;
      return color;
    }
    return null;
  }

  initPoints() {
    for (let i = 0; i < this.numPoints; i++) {
      let angle = TWO_PI / this.numPoints * i;
      let x = this.headPos.x + cos(angle) * i * 25; // Aumenta la distancia entre puntos
      let y = this.headPos.y + sin(angle) * i * 25;
      this.points.push(createVector(x, y));
    }
  }

  move() {
    this.headPos.add(this.vel);
    this.wrap(this.headPos);

    for (let i = this.numPoints - 1; i > 0; i--) {
      let leader = this.points[i - 1];
      let follower = this.points[i];
      follower.lerp(leader, 0.05);
    }
    this.points[0] = this.headPos.copy();
    let newSpeed = this.vel.mag();
    if (newSpeed > 1.5 && !this.isPlaying) {
      this.playSound();
    }
  }

  playSound() {
    this.isPlaying = true;
    let soundDuration = this.numPoints * 0.1; // Duración del sonido basada en la cantidad de puntos
    this.oscillator.amp(0.5, 0.05); // Subir el volumen rápidamente
    setTimeout(() => {
      this.oscillator.amp(0, 0.5); // Bajar el volumen gradualmente
      this.isPlaying = false;
    }, soundDuration * 1000); // Convertir duración de segundos a milisegundos
  }

  wrap(pos) {
    if (pos.x > width) pos.x = 0;
    if (pos.x < 0) pos.x = width;
    if (pos.y > height) pos.y = 0;
    if (pos.y < 0) pos.y = height;
  }

  display() {
    for (let i = 0; i < this.numPoints - 1; i++) {
      let pt = this.points[i];
      let angle = atan2(this.points[i + 1].y - pt.y, this.points[i + 1].x - pt.x);
      push();
      translate(pt.x, pt.y);
      rotate(angle);
      fill(this.color);
      text(this.char, 0, 0);
      pop();
    }
  }
}

// Función para convertir nombre de nota a MIDI
function noteToMidi(note) {
  const scale = {
      'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
      'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
  };
  const octave = parseInt(note.slice(-1));
  const noteName = note.slice(0, -1);
  return 12 * (octave + 1) + scale[noteName];
}
