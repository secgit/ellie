const MAX_ROUNDS = 10;

const animals = [
  {
    id: 'fox',
    name: 'Willow the Fox',
    story: 'I dash through the berry bushes each morning. Can you guess my favorite snack?',
    favoriteTreat: 'berries',
    image: 'assets/animal-fox.png'
  },
  {
    id: 'bunny',
    name: 'Juniper the Bunny',
    story: 'My ears wiggle when I see something crisp and crunchy from the garden!',
    favoriteTreat: 'carrots',
    image: 'assets/animal-bunny.png'
  },
  {
    id: 'owl',
    name: 'Sage the Owl',
    story: 'When the moon glows, I collect twinkling treats that shine softly in the night.',
    favoriteTreat: 'mushrooms',
    image: 'assets/animal-owl.png'
  },
  {
    id: 'deer',
    name: 'Maple the Deer',
    story: 'I nibble on crunchy treasures that tumble from the tallest oak trees.',
    favoriteTreat: 'acorns',
    image: 'assets/animal-deer.png'
  }
];

const treatDescriptions = {
  berries: 'A basket of sun-warmed berries collected from the berry patch.',
  carrots: 'Crunchy carrots freshly pulled from the garden.',
  acorns: 'Golden acorns gathered from the great oak.',
  mushrooms: 'Glow mushrooms that light up the twilight picnic.'
};

const scoreValue = document.getElementById('score-value');
const roundValue = document.getElementById('round-value');
const bestValue = document.getElementById('best-value');
const promptText = document.getElementById('prompt-text');
const startButton = document.getElementById('start-button');
const feedback = document.getElementById('feedback');
const animalCard = document.getElementById('animal-card');
const animalImage = document.getElementById('animal-image');
const animalName = document.getElementById('animal-name');
const animalStory = document.getElementById('animal-story');
const celebration = document.getElementById('celebration');

const treatButtons = Array.from(document.querySelectorAll('.treat-card'));

let isRoundActive = false;
let currentAnimal = null;
let round = 0;
let score = 0;
let bestStreak = 0;

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function resetTreatButtons(disabled = false) {
  treatButtons.forEach((button) => {
    button.disabled = disabled;
    button.classList.remove('selected');
  });
}

function playCelebration() {
  celebration.classList.add('active');
  setTimeout(() => {
    celebration.classList.remove('active');
  }, 2200);
}

function updateStatus() {
  scoreValue.textContent = score;
  roundValue.textContent = round;
  bestValue.textContent = bestStreak;
}

function setFeedback(message, type) {
  feedback.textContent = message;
  feedback.className = `feedback ${type ?? ''}`.trim();
}

function startGame() {
  score = 0;
  round = 0;
  isRoundActive = false;
  startButton.textContent = 'Next Friend';
  setFeedback('', '');
  updateStatus();
  nextRound();
}

function nextRound() {
  if (round >= MAX_ROUNDS) {
    setFeedback(`You fed every friend! Final score: ${score}/${MAX_ROUNDS}. Tap Start Picnic to play again.`, 'success');
    promptText.textContent = 'All the forest friends are full and happy. Wonderful work!';
    startButton.textContent = 'Play Again';
    startButton.disabled = false;
    resetTreatButtons(true);
    playCelebration();
    return;
  }

  round += 1;
  isRoundActive = true;
  updateStatus();

  const [animal] = shuffle(animals);
  currentAnimal = animal;

  animalCard.classList.add('active');
  animalImage.src = animal.image;
  animalImage.alt = `${animal.name} illustration`;
  animalName.textContent = animal.name;
  animalStory.textContent = animal.story;

  promptText.textContent = `${animal.name.split(' ')[0]} is hungry! Which snack will you share?`;
  setFeedback('', '');

  resetTreatButtons(false);
  startButton.disabled = true;
}

function handleTreatSelection(event) {
  if (!isRoundActive || !currentAnimal) {
    return;
  }

  const button = event.currentTarget;
  const selectedTreat = button.dataset.treat;

  resetTreatButtons(false);
  button.classList.add('selected');

  if (selectedTreat === currentAnimal.favoriteTreat) {
    score += 1;
    bestStreak = Math.max(bestStreak, score);
    setFeedback(`Yum! ${currentAnimal.name.split(' ')[0]} loved the ${treatDescriptions[selectedTreat].toLowerCase()}`, 'success');
  } else {
    score = Math.max(0, score - 1);
    setFeedback(`Oops! Try offering the snack that matches the clue.`, 'error');
  }

  updateStatus();
  isRoundActive = false;
  animalCard.classList.remove('active');
  startButton.disabled = false;
  startButton.textContent = round >= MAX_ROUNDS ? 'Celebrate Picnic' : 'Next Friend';
  startButton.focus();
}

startButton.addEventListener('click', () => {
  if (round >= MAX_ROUNDS && !isRoundActive) {
    startGame();
  } else if (!isRoundActive) {
    nextRound();
  }
});

treatButtons.forEach((button) => {
  button.addEventListener('click', handleTreatSelection);
});

resetTreatButtons(true);
startButton.disabled = false;
