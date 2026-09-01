export const THEFT_PLANET = Object.freeze({
  name: 'Sneakle-5',
  tagline: 'purple dust, wobbly towers, and very suspicious parking spots',
  surface: 0x5b3f8f,
  accent: 0xffdd66,
  sky: 0x14091f,
  fog: 0.031,
  props: 'mischief'
});

export const ROCKET_THEFT_STATES = Object.freeze({
  IDLE: 'idle',
  SELECTED: 'selected',
  FLYING: 'flying',
  LANDED: 'landed',
  STEALING: 'stealing',
  STRANDED: 'stranded'
});

export function createRocketTheftRun() {
  let state = ROCKET_THEFT_STATES.IDLE;
  return {
    get state() { return state; },
    select() { state = ROCKET_THEFT_STATES.SELECTED; },
    launch() { state = ROCKET_THEFT_STATES.FLYING; },
    land() { state = ROCKET_THEFT_STATES.LANDED; },
    steal() { state = ROCKET_THEFT_STATES.STEALING; },
    strand() { state = ROCKET_THEFT_STATES.STRANDED; },
    reset() { state = ROCKET_THEFT_STATES.IDLE; }
  };
}

export function isRocketUnavailable(state) {
  return state === ROCKET_THEFT_STATES.STEALING || state === ROCKET_THEFT_STATES.STRANDED;
}

export function rocketTheftMissionCopy(state) {
  if (state === ROCKET_THEFT_STATES.SELECTED) {
    return {
      title: `Launch to ${THEFT_PLANET.name}`,
      objective: 'Visit the new alien planet. Mission Control says the parking situation looks totally normal.',
      badge: 'Mischief?'
    };
  }

  if (state === ROCKET_THEFT_STATES.FLYING) {
    return {
      title: `Approaching ${THEFT_PLANET.name}`,
      objective: 'Guide the rocket in. The landing zone is full of tiny footprints and zero red flags. Probably fine.',
      badge: 'Approach'
    };
  }

  if (state === ROCKET_THEFT_STATES.LANDED) {
    return {
      title: `Explore ${THEFT_PLANET.name}`,
      objective: 'Exit the rocket and scout the landing zone. The local aliens are acting extremely casual.',
      badge: 'Scout'
    };
  }

  if (state === ROCKET_THEFT_STATES.STEALING) {
    return {
      title: 'Hey! That is our rocket!',
      objective: 'Mischievous aliens jumped aboard. Watch where they take it, then find another way off the planet.',
      badge: 'Uh oh'
    };
  }

  if (state === ROCKET_THEFT_STATES.STRANDED) {
    return {
      title: 'Stranded, but not stuck',
      objective: 'The rocket is gone for now. Explore the planet and look for another way off. No fighting; solve the problem.',
      badge: 'Stranded'
    };
  }

  return {
    title: '',
    objective: '',
    badge: ''
  };
}
