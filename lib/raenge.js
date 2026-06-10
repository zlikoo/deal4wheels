export const RAENGE = ['trainee', 'dealer', 'head', 'gfa', 'gf', 'it'];
export const RANG_LABEL = {
  trainee: 'Trainee', dealer: 'Dealer', head: 'Head Dealer',
  gfa: 'GF-Assistenz', gf: 'GF', it: 'IT',
};
export const atLeast = (rang, min) => RAENGE.indexOf(rang) >= RAENGE.indexOf(min);
