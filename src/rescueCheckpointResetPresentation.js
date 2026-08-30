const loopStatusLabel = document.querySelector('#loopStatus');
const throttleLabel = document.querySelector('#throttle');

let lastResetSignature = '';

function isVortexCheckpointReset() {
  const status = loopStatusLabel?.textContent?.trim() ?? '';
  const throttle = throttleLabel?.textContent?.trim() ?? '';
  return status === 'Vortex reset' || throttle === 'Checkpoint';
}

function resetRescuePresentationForCheckpoint() {
  const status = loopStatusLabel?.textContent?.trim() ?? '';
  const throttle = throttleLabel?.textContent?.trim() ?? '';
  const signature = `${status}|${throttle}`;

  if (!isVortexCheckpointReset()) {
    lastResetSignature = '';
    return;
  }

  if (signature === lastResetSignature) return;
  lastResetSignature = signature;

  document.body.dataset.rescueNpcState = 'hidden';
  document.body.dataset.rescueNpcProgress = '0';
  document.body.dataset.rescueNpcReturnProgress = '0';
  document.body.dataset.rescueNpcCheckpointReset = `${Date.now()}`;
}

[loopStatusLabel, throttleLabel].forEach((label) => {
  if (!label) return;
  const observer = new MutationObserver(resetRescuePresentationForCheckpoint);
  observer.observe(label, { childList: true, characterData: true, subtree: true });
});

resetRescuePresentationForCheckpoint();
