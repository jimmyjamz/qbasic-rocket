const mode = document.querySelector('#modeName');
const planet = document.querySelector('#planetName');
const help = document.querySelector('#helpText');
let visitedWithoutTranslator = false;

document.body.dataset.firstContactState = 'unvisited';
document.body.dataset.translatorBadge = 'missing';
document.body.dataset.contactGarden = 'blocked';

const card = document.createElement('aside');
card.id = 'firstContactCard';
card.setAttribute('aria-live', 'polite');
card.hidden = true;
card.innerHTML = '<strong></strong><p></p>';
document.body.appendChild(card);

function state(value) { document.body.dataset.firstContactState = value; }
function render() {
  const here = planet.textContent === 'Gherkin-7';
  const eva = mode.textContent === 'Astronaut EVA';
  const landed = mode.textContent === 'Landed';
  const hasTranslator = document.body.dataset.translatorBadge === 'acquired';
  const current = document.body.dataset.firstContactState;

  if (planet.textContent === 'Launchpad' && ['blocked', 'needs-translator'].includes(current)) state('at-supply');
  if (here && landed && !hasTranslator && current === 'unvisited') state('first-landing');
  if (here && eva && !hasTranslator) {
    visitedWithoutTranslator = true;
    state('blocked');
  }
  if (here && eva && document.body.dataset.contactGarden === 'welcomed' && ['translator-ready', 'return-landing'].includes(current)) state('resolved-eva');
  if (here && landed && visitedWithoutTranslator && !hasTranslator) state('needs-translator');
  if (here && landed && hasTranslator && current === 'translator-ready') state('return-landing');
  if (here && landed && current === 'resolved-eva') state('complete');

  const now = document.body.dataset.firstContactState;
  const encounter = here && (eva || landed);
  card.hidden = !encounter;
  if (!encounter) return;
  const resolved = now === 'resolved-eva' || now === 'complete';
  card.classList.toggle('resolved', resolved);
  const contactGarden = document.body.dataset.contactGarden;
  card.querySelector('strong').textContent = now === 'complete' ? 'Mission complete — First Contact Friend!' : resolved ? 'Translation successful!' : contactGarden === 'garden' ? 'The garden gate opens!' : hasTranslator ? 'Find the moon-pickle garden gate' : 'Aliens surround the rocket!';
  card.querySelector('p').textContent = now === 'complete'
    ? 'Peaceful contact recorded. You earned the First Contact Friend badge!'
    : resolved ? '“Welcome! Please avoid our moon-pickle garden.” Your new alien friend waves.'
    : contactGarden === 'garden' ? 'The crowd clears. Approach the one alien inside and press E to say hello.'
    : hasTranslator ? 'Follow the path to the garden gate and press E to use your Translator Badge.'
      : eva ? 'Mission Control: They may be warning us, not attacking. Board the rocket and return for a translator.'
        : 'Their signals are unreadable. Exit carefully; this is a peaceful contact mission.';
  if (help && eva && !hasTranslator) help.textContent = 'The aliens block the garden path. No combat: return to the rocket (E), then fly home for a translator.';
}

for (const node of [mode, planet]) {
  const observer = new MutationObserver(render);
  observer.observe(node, { childList: true, characterData: true, subtree: true });
}
const observer = new MutationObserver(render);
observer.observe(document.body, { attributes: true, attributeFilter: ['data-translator-badge', 'data-contact-garden'] });
render();
