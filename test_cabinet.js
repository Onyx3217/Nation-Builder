import { getAiCabinetAdvice } from './src/services/groqService.js';

const playerCountry = {
  name: 'République de France',
  regime: 'Republic',
  population: 68000000,
  gdpPerCapita: 42000,
  stability: 75,
  militaryTension: 20,
  globalReputation: 70,
  inflationRate: 2.1,
  unemploymentRate: 7.2,
  publicDebt: 110,
  giniIndex: 32,
  initialScenario: 'Ordre Géopolitique Stable'
};

try {
  const result = await getAiCabinetAdvice('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', {
    playerCountry,
    worldCountries: [],
    relations: {},
    day: 1,
    playerQuery: "Envoyer 5000 soldats à la frontière pour un exercice militaire d'intimidation",
    conversationHistory: [],
    language: 'fr'
  });

  console.log('RESULT:', JSON.stringify(result, null, 2));
} catch (e) {
  console.error('EXCEPTION:', e);
}
