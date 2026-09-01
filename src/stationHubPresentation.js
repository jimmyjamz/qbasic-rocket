// A small home-base UI over the existing launchpad. No separate travel or reward state.
import { returnToStation } from './planetExplorer.js';
const hero = document.querySelector('.hero-card');
const mode = document.querySelector('#modeName');
const launch = document.querySelector('#launchButton');
const title = hero.querySelector('h1');
const originalTitle = title.textContent;
const hub = document.createElement('section');
hub.id = 'stationHub';
hub.setAttribute('aria-label', 'Space station home base');
hub.innerHTML = `
  <p class="station-welcome">Safe at home. Pick a rescue, wave to the crew, and launch!</p>
  <section aria-labelledby="stationMissionHeading">
    <h2 id="stationMissionHeading">Mission board</h2>
    <p id="stationDestination" aria-live="polite"></p>
    <p id="stationObjective"></p>
  </section>
  <section aria-labelledby="stationRewardsHeading">
    <h2 id="stationRewardsHeading">Space Hero badge wall</h2>
    <p id="stationRewards" aria-live="polite"></p>
    <small>This session only · refreshing starts a new session.</small>
  </section>
  <section aria-labelledby="stationSupplyHeading">
    <h2 id="stationSupplyHeading">Supply stop <span id="stationSupplyStatus">Coming later</span></h2>
    <p id="stationSupplyCopy">Future first-contact supplies will be here. Nothing to collect yet.</p>
    <button id="translatorButton" type="button" hidden>Collect Translator Badge</button>
  </section>`;
hero.insertBefore(hub, hero.querySelector('.controls'));

const returnButton = document.createElement('button');
returnButton.id = 'stationReturnButton';
returnButton.type = 'button';
returnButton.className = 'secondary';
returnButton.textContent = 'Return to station';
hero.querySelector('.controls').appendChild(returnButton);

function canReturn() {
  const contactReady = ['needs-translator', 'complete'].includes(document.body.dataset.firstContactState);
  return mode.textContent === 'Landed' && (document.body.dataset.rescueNpcState === 'boarded' || contactReady) && !launch.disabled;
}
returnButton.addEventListener('click', () => {
  if (canReturn()) returnToStation(document.body.dataset.rescueNpcState !== 'boarded');
});

const missions = {
  'Sprout-9': 'Find the lost botanist. Cross the vines and escort them back to the rocket.',
  'Cinder Bean': 'Find the heat-shield mechanic. Cross on GO and escort them back.',
  'Frost Pea': 'Find the frozen explorer and bring them safely back to the rocket.',
  'Gherkin-7': 'Make peaceful first contact. A Translator Badge may be needed.'
};
const translatorButton = hub.querySelector('#translatorButton');
translatorButton.addEventListener('click', () => {
  if (document.body.dataset.firstContactState !== 'at-supply') return;
  document.body.dataset.translatorBadge = 'acquired';
  document.body.dataset.firstContactState = 'translator-ready';
  renderHub();
});
function setText(selector, text) {
  const node = hub.querySelector(selector);
  if (!node) return;
  if (node.textContent !== text) node.textContent = text;
}
function renderHub() {
  const planetName = document.querySelector('#planetName');
  if (!document.body || !planetName) return;
  const atStation = mode.textContent === 'Rocket' && planetName.textContent === 'Launchpad';
  const location = atStation ? 'home' : 'away';
  if (document.body.dataset.stationHub !== location) document.body.dataset.stationHub = location;
  hub.hidden = !atStation;
  const heading = atStation ? 'Space Station' : originalTitle;
  if (title.textContent !== heading) title.textContent = heading;
  returnButton.hidden = !canReturn();
  returnButton.disabled = !canReturn();
  if (!atStation) return;
  const target = launch.textContent.replace(/^Launch to\s+/, '');
  setText('#stationDestination', `Next destination: ${target}`);
  setText('#stationObjective', missions[target] ?? 'Choose a destination for your next rescue.');
  const rescues = Number(document.body.dataset.sessionRescues ?? 0);
  const badges = Number(document.body.dataset.sessionBadges ?? 0);
  const contactBadge = document.body.dataset.firstContactBadge === 'earned';
  setText('#stationRewards', `${rescues} rescues · ${badges} Space Hero badges${contactBadge ? ' · First Contact Friend earned!' : badges ? ' — welcome home, hero!' : ' — your first rescue awaits!'}`);
  const atSupply = document.body.dataset.firstContactState === 'at-supply';
  const translatorReady = document.body.dataset.translatorBadge === 'acquired';
  translatorButton.hidden = !atSupply;
  setText('#stationSupplyStatus', atSupply ? 'Translator ready' : translatorReady ? 'Translator aboard' : 'Coming later');
  setText('#stationSupplyCopy', atSupply ? 'The aliens may be warning us. Collect the Translator Badge, then return to Gherkin-7.' : translatorReady ? 'Translator Badge collected for the Gherkin-7 mission.' : 'Future first-contact supplies will be here. Nothing to collect yet.');
}
const uiObserver = new MutationObserver(renderHub);
for (const node of [mode, launch, document.querySelector('#planetName')]) {
  uiObserver.observe(node, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
}
const rewardObserver = new MutationObserver(renderHub);
rewardObserver.observe(document.body, { attributes: true, attributeFilter: ['data-session-rescues', 'data-session-badges', 'data-rescue-npc-state', 'data-first-contact-state', 'data-first-contact-badge', 'data-translator-badge'] });
renderHub();
