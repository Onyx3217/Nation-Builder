/**
 * Event Injector Service
 * Allows the player / game master to trigger massive, game-changing geopolitical events
 * (preset catastrophic events or custom player-written crises evaluated by AI).
 * Limited to 2 events per in-game day / turn.
 */

export const PRESET_INJECTOR_EVENTS = [
  {
    id: 'nuclear_exchange',
    category: 'military',
    icon: '☢️',
    titleFr: 'Incident Nucléaire Tactique & Alerte DEFCON 1',
    titleEn: 'Tactical Nuclear Detonation & DEFCON 1 Alert',
    summaryFr: 'Une explosion atomique tactique inexpliquée a rasé une base militaire stratégique frontalière. Les arsenaux nucléaires mondiaux passent en état d\'alerte maximale.',
    summaryEn: 'An unexplained tactical nuclear detonation leveled a strategic border garrison. Global nuclear arsenals shift to maximum alert status.',
    statEffects: {
      militaryTension: 55,
      stability: -35,
      gdpPerCapita: -3200,
      globalReputation: -20,
    },
    riskWarningFr: 'Risque extrême : Les tensions militaires atteignent le seuil critique d\'invasion générale !',
    riskWarningEn: 'Extreme risk: Military tensions spike towards immediate all-out war!',
  },
  {
    id: 'market_black_swan',
    category: 'economic',
    icon: '📉',
    titleFr: 'Krach Boursier Systémique & Effondrement du Crédit',
    titleEn: 'Systemic Financial Crash & Liquidity Black Hole',
    summaryFr: 'Faillite en chaîne des 3 plus grandes banques d\'investissement mondiales. Les lignes de crédit sont gelées, provoquant une panique financière immédiate et une dévaluation brutale.',
    summaryEn: 'Cascading collapse of major global investment banks. Credit lines freeze solid, sparking immediate panic and runaway currency devaluation.',
    statEffects: {
      gdpPerCapita: -5500,
      inflationRate: 18.5,
      unemploymentRate: 8.2,
      publicDebt: 32,
      stability: -20,
    },
    riskWarningFr: 'Alerte Faillite : Risque de banqueroute souveraine si la dette et l\'inflation ne sont pas jugulées.',
    riskWarningEn: 'Bankruptcy Alert: Risk of sovereign default if debt and inflation spiral unchecked.',
  },
  {
    id: 'popular_revolution',
    category: 'political',
    icon: '✊',
    titleFr: 'Insurrection Populaire & Mutinerie Militaire',
    titleEn: 'Mass Popular Insurrection & Military Defection',
    summaryFr: 'Des millions de citoyens descendent dans les rues de la capitale. Les forces de sécurité refusent d\'ouvrir le feu et une partie de l\'armée rallie les insurgés.',
    summaryEn: 'Millions flood the streets of the capital. Security forces refuse orders to disperse the crowds as military regiments join the rebellion.',
    statEffects: {
      stability: -50,
      militaryTension: 25,
      globalReputation: -15,
      unemploymentRate: 4.5,
    },
    riskWarningFr: 'Péril Révolutionnaire : La stabilité chute à un niveau proche de la chute du régime !',
    riskWarningEn: 'Revolutionary Peril: Civil stability plummets to near total state collapse!',
  },
  {
    id: 'pandemic_outbreak',
    category: 'health',
    icon: '☣️',
    titleFr: 'Épidémie Virale Foudroyante & Confinement National',
    titleEn: 'Airborne Pathogen Outbreak & Total Quarantine',
    summaryFr: 'Un pathogène à transmission aéroportée ultra-contagieux paralyse les flux commerciaux. Fermeture immédiate des frontières et arrêt complet des secteurs non-essentiels.',
    summaryEn: 'A hyper-contagious airborne pathogen paralyses international supply chains. Immediate border closures and full shutdown of non-essential sectors.',
    statEffects: {
      gdpPerCapita: -4100,
      unemploymentRate: 6.8,
      publicDebt: 24,
      stability: -18,
      militaryTension: -10,
    },
    riskWarningFr: 'Crise Sanitaire : Le Trésor public est asphyxié par les coûts d\'urgence et l\'arrêt de la production.',
    riskWarningEn: 'Health Crisis: Public treasury severely strained by emergency response costs.',
  },
  {
    id: 'fusion_breakthrough',
    category: 'technology',
    icon: '⚡',
    titleFr: 'Percée Souveraine : Maîtrise de la Fusion Nucléaire Propre',
    titleEn: 'Sovereign Triumph: Net-Positive Commercial Fusion Online',
    summaryFr: 'Vos scientifiques nationaux ont réussi le premier réacteur commercial à fusion à confinement magnétique stable. L\'énergie devient virtuellement gratuite et infinie.',
    summaryEn: 'National laboratories brought the first stable commercial net-positive fusion grid online. Clean abundant energy is achieved.',
    statEffects: {
      gdpPerCapita: 6800,
      stability: 25,
      globalReputation: 35,
      inflationRate: -3.5,
      militaryTension: -15,
    },
    riskWarningFr: null,
    riskWarningEn: null,
  },
  {
    id: 'deep_oil_lithium_strike',
    category: 'resources',
    icon: '💎',
    titleFr: 'Gisement Gigantesque de Terres Rares & Or Découvert',
    titleEn: 'Colossal Mineral Reserve & Rare-Earth Strikefall',
    summaryFr: 'Une prospection géologique met au jour la plus grande concentration de lithium et de métaux précieux de la planète sur votre territoire souverain.',
    summaryEn: 'Geological surveys confirm the discovery of the richest lithium and precious metal deposit on the planet on sovereign soil.',
    statEffects: {
      gdpPerCapita: 4800,
      publicDebt: -25,
      globalReputation: 20,
      stability: 15,
    },
    riskWarningFr: null,
    riskWarningEn: null,
  },
  {
    id: 'cyber_blackout',
    category: 'cyber',
    icon: '💻',
    titleFr: 'Cyber-Attaque Hégémonique & Blackout Énergétique',
    titleEn: 'Nation-State Cyber Infiltration & Grid Blackout',
    summaryFr: 'Un assaut cybernétique militaire coordonné paralyse les réseaux électriques, les serveurs bancaires et le trafic aérien durant 72 heures.',
    summaryEn: 'A coordinated foreign nation-state cyber offensive takes down the power grid, banking networks, and air traffic control for 72 hours.',
    statEffects: {
      gdpPerCapita: -2200,
      stability: -25,
      militaryTension: 35,
      globalReputation: -10,
    },
    riskWarningFr: 'Vulnérabilité Stratégique : Les infrastructures critiques ont été compromises.',
    riskWarningEn: 'Strategic Vulnerability: Critical infrastructure compromised.',
  },
]

/**
 * Evaluates a custom, user-written cataclysmic event using AI (or heuristic fallback)
 */
export async function evaluateCustomEventWithAi(groqApiKey, { playerCountry, worldCountries, eventText, language = 'fr' }) {
  const isFrench = language === 'fr'

  const prompt = `Tu es le moteur de simulation géopolitique suprême d'un jeu de stratégie d'État réaliste.
Un événement majeur vient d'être injecté dans le monde par le joueur :
"${eventText}"

Pays joueur actuel :
- Nom : ${playerCountry.name} (${playerCountry.regime}, ${playerCountry.continent})
- PIB/habitant : $${playerCountry.gdpPerCapita}
- Stabilité civile : ${playerCountry.stability}/100
- Tension militaire : ${playerCountry.militaryTension}/100
- Dette publique : ${playerCountry.publicDebt}%
- Inflation : ${playerCountry.inflationRate}%
- Chômage : ${playerCountry.unemploymentRate}%
- Réputation : ${playerCountry.globalReputation}/100

Cet événement peut tout faire basculer ! Évalue les conséquences géopolitiques réelles et massives de cet événement.
Réponds UNIQUEMENT par un objet JSON valide, sans balises markdown, sans texte superflu :
{
  "title": string (titre choc de l'événement en majuscules style dépêche AFP/Reuters),
  "summary": string (explication percutante de ce qui se passe et des répercussions immédiates, 2-3 phrases),
  "collapseWarning": string ou null (avertissement dramatique si l'événement menace directement la survie de la nation),
  "statEffects": {
    "stability": number entre -60 et +30 (delta de stabilité),
    "militaryTension": number entre -40 et +60 (delta de tension),
    "gdpPerCapita": number entre -10000 et +10000 (delta PIB/hab en USD),
    "inflationRate": number entre -5 et +30 (delta d'inflation en %),
    "unemploymentRate": number entre -5 et +20 (delta de chômage en %),
    "publicDebt": number entre -40 et +60 (delta de dette en %),
    "globalReputation": number entre -40 et +40 (delta de réputation)
  }
}`

  try {
    const key = groqApiKey || import.meta.env.VITE_GROQ_API_KEY || ''
    if (!key) throw new Error('No API key provided')

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
        max_tokens: 600,
      }),
    })

    if (!res.ok) {
      // Fallback model
      const resFallback = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.85,
          max_tokens: 600,
        }),
      })
      const fallbackData = await resFallback.json()
      const rawText = fallbackData?.choices?.[0]?.message?.content || ''
      const match = rawText.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0])
    } else {
      const data = await res.json()
      const rawText = data?.choices?.[0]?.message?.content || ''
      const match = rawText.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0])
    }
  } catch (err) {
    console.warn('AI evaluation error, using heuristic simulation:', err)
  }

  // Heuristic Fallback if API is offline
  const lower = eventText.toLowerCase()
  let stab = -15
  let tension = 20
  let gdp = -1000
  let inflation = 3.0
  let debt = 10
  let rep = -5

  if (lower.includes('guerre') || lower.includes('war') || lower.includes('invasion') || lower.includes('attaque')) {
    tension = 45
    stab = -30
    gdp = -2500
    rep = -15
  } else if (lower.includes('krach') || lower.includes('crise') || lower.includes('banque') || lower.includes('dette')) {
    gdp = -4000
    inflation = 12
    debt = 25
    stab = -20
  } else if (lower.includes('paix') || lower.includes('traité') || lower.includes('victoire') || lower.includes('découverte')) {
    stab = 20
    tension = -20
    gdp = 3000
    rep = 25
  }

  return {
    title: isFrench ? `ÉVÉNEMENT MAJEUR : ${eventText.toUpperCase().slice(0, 60)}` : `MAJOR EVENT: ${eventText.toUpperCase().slice(0, 60)}`,
    summary: isFrench
      ? `« ${eventText.trim().replace(/\s+/g, ' ').slice(0, 180)} » provoque des réactions immédiates dans les marchés et les institutions. Les effets affichés sont une estimation locale, faute de réponse exploitable de l'IA.`
      : `"${eventText.trim().replace(/\s+/g, ' ').slice(0, 180)}" triggers immediate reactions across markets and institutions. The displayed effects are a local estimate because the AI response was unavailable.`,
    collapseWarning: stab < -25 ? (isFrench ? 'Risque de déstabilisation sévère de l\'ordre républicain !' : 'Severe risk of sovereign destabilization!') : null,
    usedFallback: true,
    statEffects: {
      stability: stab,
      militaryTension: tension,
      gdpPerCapita: gdp,
      inflationRate: inflation,
      publicDebt: debt,
      globalReputation: rep,
    },
  }
}
