import { defineConfig } from 'vite';

function selectedDestinationRoutingFix() {
  return {
    name: 'rkt-47-selected-destination-routing-fix',
    enforce: 'pre',
    transform(code, id) {
      const normalizedId = id.replaceAll('\\', '/').split('?')[0].split('#')[0];
      if (!normalizedId.endsWith('/src/planetExplorer.js')) {
        return null;
      }

      let nextCode = code;

      nextCode = nextCode.replace(
        `function launchToSelectedPlanet() {
  if (flightMode === 'walking' || flightMode === 'countdown') return;

  if (flightMode === 'landed') {
    targetPlanetIndex = (currentPlanetIndex + 1) % PLANETS.length;
  }

  if (targetPlanetIndex === currentPlanetIndex && flightMode !== 'ready') {
    targetPlanetIndex = (currentPlanetIndex + 1) % PLANETS.length;
  }

  if (LAUNCH_COUNTDOWN_ENABLED) {
    startLaunchCountdown();
    return;
  }

  beginLaunchFlight();
}`,
        `function launchToSelectedPlanet() {
  if (flightMode === 'walking' || flightMode === 'countdown') return;

  if (flightMode !== 'ready' && targetPlanetIndex === currentPlanetIndex) {
    targetPlanetIndex = getNextPlanetIndex(currentPlanetIndex);
  }

  if (LAUNCH_COUNTDOWN_ENABLED) {
    startLaunchCountdown();
    return;
  }

  beginLaunchFlight();
}`
      );

      nextCode = nextCode.replace(
        `function resetLaunchCountdownState() {
  countdownStart = null;
  pendingLaunchTargetIndex = null;
}`,
        `function resetLaunchCountdownState() {
  countdownStart = null;
  pendingLaunchTargetIndex = null;
}

function getNextPlanetIndex(fromIndex) {
  return (fromIndex + 1) % PLANETS.length;
}`
      );

      nextCode = nextCode.replace(
        `  const planet = PLANETS[targetPlanetIndex];
  currentPlanetIndex = targetPlanetIndex;`,
        `  const planet = PLANETS[targetPlanetIndex];
  currentPlanetIndex = targetPlanetIndex;
  targetPlanetIndex = getNextPlanetIndex(currentPlanetIndex);`
      );

      nextCode = nextCode.replace(
        "    launchButton.textContent = `Fly to ${PLANETS[(currentPlanetIndex + 1) % PLANETS.length].name}`;",
        "    launchButton.textContent = `Fly to ${target.name}`;"
      );

      nextCode = nextCode.replace(
        "    helpLabel.textContent = `Landed on ${current.name}: ${current.tagline}. Press E to step out.`;",
        "    helpLabel.textContent = `Landed on ${current.name}: ${current.tagline}. Press E to step out or fly to ${target.name}.`;"
      );

      if (nextCode === code) {
        this.error('RKT-47 selected-destination routing fix did not match planetExplorer.js. Failing fast so the routing bug is not hidden.');
      }

      return {
        code: nextCode,
        map: null
      };
    }
  };
}

export default defineConfig({
  plugins: [selectedDestinationRoutingFix()]
});
