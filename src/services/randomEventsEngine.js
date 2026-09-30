/**
 * Random World Events & Discovery Engine
 * Generates immersive global events (NASA space discoveries, CERN scientific breakthroughs,
 * massive mineral findings, UN announcements) to bring the world alive.
 */

const WORLD_DISCOVERY_TEMPLATES = [
  {
    id: 'nasa_mars_liquid_water',
    category: 'space',
    org: 'NASA / ESA',
    icon: '🚀',
    headlineFr: 'DÉCOUVERTE HISTORIQUE : LA NASA CONFIRME DES RÉSERVOIRS D\'EAU LIQUIDE SUR MARS',
    headlineEn: 'HISTORIC BREAKTHROUGH: NASA CONFIRMS SUBSURFACE LIQUID WATER ON MARS',
    bodyFr: 'Les instruments radars et analyses spectroscopiques ont formellement détecté d\'immenses nappes d\'eau liquide saumâtre sous la calotte australe martienne. La communauté scientifique mondiale s\'enflamme quant aux perspectives de vie passée.',
    bodyEn: 'Subsurface radar sounding instruments have officially detected vast reservoirs of liquid briny water beneath the Martian south pole, electrifying global scientific aspirations.',
    statEffects: { globalReputation: 2 },
  },
  {
    id: 'cern_stable_fusion',
    category: 'science',
    org: 'CERN / ITER',
    icon: '⚛️',
    headlineFr: 'PERCÉE MONDIALE DU CERN : STABILISATION D\'UN RÉACTEUR À FUSION NUCLÉAIRE',
    headlineEn: 'CERN GLOBAL BREAKTHROUGH: NET ENERGY GAIN ACHIEVED IN NUCLEAR FUSION TEST',
    bodyFr: 'Une équipe conjointe internationale est parvenue à confiner un plasma magnétique ultra-dense durant plus de 120 minutes avec un rendement énergétique net de 145%. Les marchés énergétiques anticipent une révolution décarbonée.',
    bodyEn: 'An international joint team achieved stable magnetic confinement of an ultra-dense plasma for over two hours with a 145% net energy gain, heralding the dawn of clean infinite power.',
    statEffects: { gdpPerCapita: 250 },
  },
  {
    id: 'deep_sea_lithium_strike',
    category: 'resources',
    org: 'Bureau Minier International',
    icon: '⛏️',
    headlineFr: 'DÉCOUVERTE GÉOLOGIQUE MONSTRE : UN GISEMENT DE TERRES RARES ET LITHIUM EN PLEINE MER',
    headlineEn: 'MASSIVE GEOLOGICAL DISCOVERY: UNTAPPED RARE EARTH & LITHIUM RESERVE MAPPED',
    bodyFr: 'Des expéditions bathymétriques ont mis au jour une formation géologique contenant plus de 14 millions de tonnes de lithium et de terres rares stratégiques, provoquant une frénésie d\'accords industriels.',
    bodyEn: 'Deep-ocean bathymetric surveys unveiled a seabed plateau containing over 14 million metric tons of rare-earth metals and battery-grade lithium, initiating an international diplomatic rush.',
    statEffects: { inflationRate: -0.3 },
  },
  {
    id: 'nasa_james_webb_exoplanet',
    category: 'space',
    org: 'NASA / Webb Space Observatory',
    icon: '🔭',
    headlineFr: 'LE TÉLESCOPE JAMES WEBB DÉTECTE UNE ATMOSPHÈRE HABITABLE À 120 ANNÉES-LUMIÈRE',
    headlineEn: 'JAMES WEBB TELESCOPE DETECTS ATMOSPHERIC BIOSIGNATURES ON HABITABLE EXOPLANET',
    bodyFr: 'Les spectrographes infrarouges ont identifié du sulfure de diméthyle et de la vapeur d\'eau dans l\'atmosphère d\'une super-Terre en zone tempérée. La quête de civilisations extraterrestres franchit un cap sans précédent.',
    bodyEn: 'Infrared spectrographs registered dimethyl sulfide and rich water vapor signatures within the atmosphere of a temperate super-Earth exoplanet, marking a monumental milestone in astrobiology.',
    statEffects: { globalReputation: 1 },
  },
  {
    id: 'cern_room_temp_superconductor',
    category: 'science',
    org: 'CERN / Laboratoires Internationaux',
    icon: '⚡',
    headlineFr: 'SYNTHÈSE DU PREMIER SUPRACONDUCTEUR À TEMPÉRATURE AMBIANTE HOMOLOGUÉ',
    headlineEn: 'FIRST CERTIFIED ROOM-TEMPERATURE SUPERCONDUCTOR SYNTHESIZED',
    bodyFr: 'La communauté internationale confirme les propriétés de résistance électrique nulle à 21°C d\'un nouvel alliage hydride cristallin. Les réseaux électriques et les supercalculateurs s\'apprêtent à bondir de génération.',
    bodyEn: 'Peer-reviewed trials confirmed complete zero electrical resistance at 21°C using a novel synthetic crystalline hydride alloy, transforming supercomputing and green energy transport.',
    statEffects: { gdpPerCapita: 400 },
  },
  {
    id: 'un_space_treaty',
    category: 'diplomacy',
    org: 'ONU / Conseil de Sécurité',
    icon: '🌐',
    headlineFr: 'L\'ONU ADOPTE À L\'UNANIMITÉ LE NOUVEAU TRAITÉ MONDIAL SUR LA SOUVERAINETÉ LUNAIRE',
    headlineEn: 'UN UNANIMOUSLY PASSES COMPREHENSIVE LUNAR SOVEREIGNTY & MINING ACCORD',
    bodyFr: 'Après des mois d\'âpres négociations multilatérales, les cinq puissances permanentes et 78 nations ont ratifié le traité sanctuarisant la Lune comme patrimoine commun et fixant les quotas de forage orbital.',
    bodyEn: 'After intense negotiations, the five permanent members and 78 nations ratified a binding multilateral framework designating lunar territory as neutral heritage while licensing resource corridors.',
    statEffects: { militaryTension: -4 },
  },
]

const FICTIONAL_WORLD_EVENT_TEMPLATES = [
  {
    id: 'obsidium_moonfall',
    category: 'resources',
    org: 'Consortium Astral',
    icon: '☄️',
    headlineFr: 'UN FRAGMENT D’ASTRE RICHE EN OBSIDIUM ENTRE DANS LE SILLAGE DES ARCHIPELS',
    headlineEn: 'AN OBSIDIUM-RICH ASTEROID FRAGMENT ENTERS THE ARCHIPELAGOS’ ORBITAL WAKE',
    bodyFr: 'Les observatoires de Thalassia ont repéré une nouvelle veine d’alliage dans les débris. Trois maisons marchandes proposent déjà des expéditions rivales.',
    bodyEn: 'Thalassian observatories detected a new alloy vein in the debris. Three merchant houses are already proposing rival expeditions.',
    statEffects: { globalReputation: 2 },
  },
  {
    id: 'aethelgard_waterways',
    category: 'infrastructure',
    org: 'Ligue Planétaire',
    icon: '🌊',
    headlineFr: 'LES CANAUX D’AETHELGARD ROUVRENT APRÈS L’ACCORD DES CITÉS-ÉTATS',
    headlineEn: 'AETHELGARD CANALS REOPEN AFTER A CITY-STATE ACCORD',
    bodyFr: 'L’accord garantit le passage des convois et partage l’entretien des digues. Les marchés des plaines anticipent une baisse du prix des céréales.',
    bodyEn: 'The accord guarantees convoy passage and shares levee maintenance. Plains markets expect grain prices to ease.',
    statEffects: { gdpPerCapita: 180, militaryTension: -2 },
  },
  {
    id: 'polar_sky_lanterns',
    category: 'discovery',
    org: 'Observatoire du Grand Nord',
    icon: '✨',
    headlineFr: 'UNE AURORE INÉDITE RÉVÈLE DES ROUTES SÛRES AU-DESSUS DU NORD POLAIRE',
    headlineEn: 'A RARE AURORA REVEALS SAFE AIR ROUTES OVER THE POLAR NORTH',
    bodyFr: 'Les navigateurs d’Hyperborée ont établi un corridor stable au-dessus des glaces. Les guildes aériennes demandent des droits de passage exclusifs.',
    bodyEn: 'Hyperborean navigators charted a stable corridor above the ice. Air guilds are seeking exclusive passage rights.',
    statEffects: { globalReputation: 1, gdpPerCapita: 120 },
  },
  {
    id: 'solar_mirror_dispute',
    category: 'diplomacy',
    org: 'Conseil des Royaumes',
    icon: '☀️',
    headlineFr: 'LE CONSEIL DES ROYAUMES SUSPEND LE PARTAGE DES MIROIRS SOLAIRES',
    headlineEn: 'THE COUNCIL OF REALMS SUSPENDS THE SHARED SOLAR MIRROR TREATY',
    bodyFr: 'Solaria conteste la nouvelle clé de répartition de l’énergie. Les délégations négocient tandis que les réserves de plusieurs cités diminuent.',
    bodyEn: 'Solaria disputes the new energy allocation formula. Delegations negotiate as several cities draw down their reserves.',
    statEffects: { militaryTension: 3, inflationRate: 0.4 },
  },
  {
    id: 'canopy_bloom',
    category: 'discovery',
    org: 'Académie des Canopées',
    icon: '🌿',
    headlineFr: 'LES SERRES DE NÉOVÉRIDIA CULTIVENT UNE GRAINE CAPABLE DE RESTAURER LES SOLS',
    headlineEn: 'NEOVERIDIAN CANOPIES CULTIVATE A SEED THAT CAN RESTORE BARREN SOILS',
    bodyFr: 'Les premières récoltes expérimentales résistent aux terres salées. Les communautés agricoles réclament un accès public aux semences.',
    bodyEn: 'Early trial crops thrive in saline soil. Farming communities are demanding public access to the seeds.',
    statEffects: { stability: 2, gdpPerCapita: 100 },
  },
]

/**
 * Check whether a rare world discovery occurs during an elapsed period.
 */
export function checkRandomWorldEvent(currentDay, elapsedDays = 1, isFrench = true, worldMode = 'real') {
  const triggerChance = Math.min(0.55, 1 - Math.pow(0.992, Math.max(0, elapsedDays)))
  if (Math.random() > triggerChance) return null

  const templates = worldMode === 'fictional' ? FICTIONAL_WORLD_EVENT_TEMPLATES : WORLD_DISCOVERY_TEMPLATES
  const template = templates[Math.floor(Math.random() * templates.length)]

  return {
    id: `${template.id}-${currentDay}-${Date.now()}`,
    category: template.category,
    org: template.org,
    icon: template.icon,
    headline: isFrench ? template.headlineFr : template.headlineEn,
    body: isFrench ? template.bodyFr : template.bodyEn,
    statEffects: template.statEffects || {},
    day: currentDay,
    type: 'discovery',
  }
}
