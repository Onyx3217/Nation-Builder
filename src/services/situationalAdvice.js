/**
 * Situational Advice Engine for Nation Builder
 * Analyzes the current nation's macroeconomic, military, and diplomatic state
 * to generate prioritized, actionable strategic recommendations.
 */

export function getSituationalAdvice(country, relations = {}, worldCountries = [], language = 'fr') {
  const isFrench = language === 'fr'
  if (!country) return []

  const adviceList = []

  const stability = country.stability ?? 75
  const tension = country.militaryTension ?? 20
  const inflation = country.inflationRate ?? 2.3
  const debt = country.publicDebt ?? 64.0
  const unemployment = country.unemploymentRate ?? 5.6
  const gdpPerCapita = country.gdpPerCapita ?? 28000
  const reputation = country.globalReputation ?? 60

  // Count allies and enemies
  const hostileIds = Object.keys(relations).filter(
    (id) => relations[id] === 'hostile' || relations[id] === 'war'
  )
  const allyIds = Object.keys(relations).filter(
    (id) => relations[id] === 'ally'
  )

  const hostileNames = hostileIds
    .map((id) => worldCountries.find((c) => c.id === id)?.name || id)
    .slice(0, 2)

  // ─── 1. CRITICAL THREATS (Priority 1) ──────────────────────────────────────

  // Critical Stability
  if (stability <= 35) {
    adviceList.push({
      id: 'crit-stability',
      urgency: 'critical',
      badge: isFrench ? 'Urgence Civile' : 'Civil Emergency',
      title: isFrench ? 'Risque d\'Insurrection Populaire' : 'Popular Insurrection Risk',
      description: isFrench
        ? `Stabilité effondrée à ${stability}%. Les émeutes menacent de renverser le gouvernement.`
        : `Stability collapsed to ${stability}%. Rioters threaten to topple the government.`,
      suggestedAction: isFrench
        ? 'Décréter des subventions d\'urgence sur l\'alimentation et la santé pour apaiser la population'
        : 'Implement emergency subsidies on food and basic healthcare to appease the public',
    })
  }

  // Critical Military Tension
  if (tension >= 70) {
    adviceList.push({
      id: 'crit-tension',
      urgency: 'critical',
      badge: isFrench ? 'Alerte Militaire' : 'Military Alert',
      title: isFrench ? 'Menace de Guerre Imminente' : 'Imminent War Threat',
      description: isFrench
        ? `Tension militaire à ${tension}%. Escarmouches aux frontières et déploiement ennemi.`
        : `Military tension at ${tension}%. Border skirmishes and hostile mobilization.`,
      suggestedAction: isFrench
        ? 'Mobiliser les réserves armées et mettre la défense aérienne en alerte maximale'
        : 'Mobilize armed reserves and place national air defense on maximum alert',
    })
  }

  // Hyperinflation
  if (inflation >= 15) {
    adviceList.push({
      id: 'crit-inflation',
      urgency: 'critical',
      badge: isFrench ? 'Choc Monétaire' : 'Monetary Shock',
      title: isFrench ? 'Spirale d\'Hyperinflation' : 'Hyperinflationary Spiral',
      description: isFrench
        ? `Inflation à ${inflation.toFixed(1)}%. La monnaie perd rapidement son pouvoir d'achat.`
        : `Inflation at ${inflation.toFixed(1)}%. Currency purchasing power is eroding fast.`,
      suggestedAction: isFrench
        ? 'Ordonner à la Banque Centrale de relever brutalement les taux directeurs et restreindre la masse monétaire'
        : 'Order the Central Bank to sharply hike interest rates and curb the money supply',
    })
  }

  // Critical Sovereign Debt
  if (debt >= 120) {
    adviceList.push({
      id: 'crit-debt',
      urgency: 'critical',
      badge: isFrench ? 'Dette Critique' : 'Critical Debt',
      title: isFrench ? 'Risque de Banqueroute Souveraine' : 'Sovereign Bankruptcy Risk',
      description: isFrench
        ? `Dette publique à ${debt.toFixed(1)}% du PIB. Les marchés menacent de couper le refinancement.`
        : `Public debt at ${debt.toFixed(1)}% of GDP. Sovereign bond markets are freezing.`,
      suggestedAction: isFrench
        ? 'Mettre en place un plan de redressement budgétaire et restructurer la dette d\'État'
        : 'Enact an emergency fiscal consolidation plan and restructure sovereign bonds',
    })
  }

  // ─── 2. WARNINGS & TENSIONS (Priority 2) ───────────────────────────────────

  // Moderate Stability decline
  if (stability > 35 && stability <= 55) {
    adviceList.push({
      id: 'warn-stability',
      urgency: 'warning',
      badge: isFrench ? 'Cohésion Sociale' : 'Social Cohesion',
      title: isFrench ? 'Climat Social Tendu' : 'Simmering Social Discontent',
      description: isFrench
        ? `Stabilité fragile (${stability}%). Les syndicats et citoyens expriment leur mécontentement.`
        : `Fragile stability (${stability}%). Unions and citizens voice rising discontent.`,
      suggestedAction: isFrench
        ? 'Lancer une concertation nationale sur le pouvoir d\'achat et la justice fiscale'
        : 'Launch a national summit on living costs and taxation fairness',
    })
  }

  // Moderate Inflation
  if (inflation > 5.5 && inflation < 15) {
    adviceList.push({
      id: 'warn-inflation',
      urgency: 'warning',
      badge: isFrench ? 'Inflation' : 'Inflation',
      title: isFrench ? 'Hausse des Prix Sensible' : 'Rising Cost of Living',
      description: isFrench
        ? `Inflation à ${inflation.toFixed(1)}%. Les ménages voient leur pouvoir d'achat reculer.`
        : `Inflation at ${inflation.toFixed(1)}%. Household real wages are declining.`,
      suggestedAction: isFrench
        ? 'Plafonner temporairement les marges sur l\'énergie et les biens de première nécessité'
        : 'Temporarily cap profit margins on energy and basic food staples',
    })
  }

  // Moderate Tension
  if (tension >= 45 && tension < 70) {
    adviceList.push({
      id: 'warn-tension',
      urgency: 'warning',
      badge: isFrench ? 'Géopolitique' : 'Geopolitics',
      title: isFrench ? 'Frictions Régionales' : 'Regional Frictions',
      description: isFrench
        ? `Tension militaire à ${tension}%. Climat de défiance avec les puissances rivales.`
        : `Military tension at ${tension}%. Mistrust brewing with regional powers.`,
      suggestedAction: isFrench
        ? 'Proposer l\'ouverture d\'une commission bilatérale de désescalade aux frontières'
        : 'Propose a bilateral border de-escalation commission',
    })
  }

  // Heavy Debt
  if (debt >= 90 && debt < 120) {
    adviceList.push({
      id: 'warn-debt',
      urgency: 'warning',
      badge: isFrench ? 'Finances' : 'Public Finances',
      title: isFrench ? 'Charge de la Dette Élevée' : 'Heavy Debt Service',
      description: isFrench
        ? `Dette à ${debt.toFixed(1)}% du PIB. La charge des intérêts absorbe une part croissante du budget.`
        : `Public debt at ${debt.toFixed(1)}% of GDP. Interest charges eat into budget priorities.`,
      suggestedAction: isFrench
        ? 'Auditer les dépenses ministérielles pour réduire le déficit sans freiner la croissance'
        : 'Audit state ministries to reduce the structural deficit without hurting growth',
    })
  }

  // High Unemployment
  if (unemployment >= 8.5) {
    adviceList.push({
      id: 'warn-unemployment',
      urgency: 'warning',
      badge: isFrench ? 'Emploi' : 'Employment',
      title: isFrench ? 'Taux de Chômage Préoccupant' : 'Elevated Unemployment',
      description: isFrench
        ? `Chômage à ${unemployment.toFixed(1)}%. Dégradation de l'insertion professionnelle.`
        : `Unemployment at ${unemployment.toFixed(1)}%. Labor market underperformance.`,
      suggestedAction: isFrench
        ? 'Lancer un grand programme national de rénovation d\'infrastructures pour stimuler l\'emploi'
        : 'Launch a national infrastructure renovation program to boost labor demand',
    })
  }

  // Hostile Neighbors
  if (hostileNames.length > 0) {
    adviceList.push({
      id: 'warn-hostile',
      urgency: 'warning',
      badge: isFrench ? 'Menace Extérieure' : 'External Threat',
      title: isFrench ? 'Hostilité Déclarée' : 'Declared Hostility',
      description: isFrench
        ? `Relations conflictuelles avec : ${hostileNames.join(', ')}.`
        : `Adversarial relations with: ${hostileNames.join(', ')}.`,
      suggestedAction: isFrench
        ? `Rapatrier nos réserves de devises et imposer des sanctions économiques ciblées contre ${hostileNames[0]}`
        : `Repatriate foreign exchange reserves and impose targeted trade sanctions on ${hostileNames[0]}`,
    })
  }

  // Diplomatic Isolation
  if (allyIds.length === 0) {
    adviceList.push({
      id: 'warn-isolation',
      urgency: 'warning',
      badge: isFrench ? 'Diplomatie' : 'Diplomacy',
      title: isFrench ? 'Isolement International' : 'International Isolation',
      description: isFrench
        ? 'Aucune alliance formelle. Le pays est vulnérable en cas d\'agression multilatérale.'
        : 'No formal alliances. The nation is exposed in case of multilateral hostility.',
      suggestedAction: isFrench
        ? 'Négocier un traité d\'assistance mutuelle et de partenariat stratégique avec une grande puissance'
        : 'Negotiate a mutual assistance and strategic partnership treaty with a global power',
    })
  }

  // ─── 3. STRATEGIC OPPORTUNITIES & PROSPERITY (Priority 3) ──────────────────

  // High stability & low tension -> Innovation boom
  if (stability >= 65 && tension <= 35) {
    adviceList.push({
      id: 'opp-innovation',
      urgency: 'opportunity',
      badge: isFrench ? 'Opportunité' : 'Opportunity',
      title: isFrench ? 'Révolution Technologique & Souveraineté' : 'Technological Breakthrough',
      description: isFrench
        ? 'La paix civile et la sécurité permettent d\'accélérer massivement dans les technologies clés.'
        : 'Civil stability and security allow massive acceleration in critical industries.',
      suggestedAction: isFrench
        ? 'Créer un fonds souverain d\'investissement dans les semi-conducteurs, l\'IA et la transition énergétique'
        : 'Establish a national sovereign fund for semiconductors, AI, and green energy transition',
    })
  }

  // High GDP / Strong finances
  if (debt < 60 && inflation < 4.0) {
    adviceList.push({
      id: 'opp-expansion',
      urgency: 'opportunity',
      badge: isFrench ? 'Rayonnement' : 'Global Reach',
      title: isFrench ? 'Projection Économique Internationale' : 'Global Economic Projection',
      description: isFrench
        ? 'Finances saines et monnaie stable. Moment propice pour étendre nos parts de marché mondiales.'
        : 'Robust public finances and sound currency. Prime moment to expand global trade reach.',
      suggestedAction: isFrench
        ? 'Signer un accord de libre-échange préférentiel et ouvrir de nouveaux corridors commerciaux'
        : 'Sign a preferential free-trade accord and establish new global export corridors',
    })
  }

  // Default fallback if nothing triggered
  if (adviceList.length === 0) {
    adviceList.push({
      id: 'default-audit',
      urgency: 'opportunity',
      badge: isFrench ? 'Conseil d\'Orientation' : 'Strategic Orientation',
      title: isFrench ? 'Consolidation Stratégique' : 'Strategic Consolidation',
      description: isFrench
        ? 'Les indicateurs généraux sont stables. Poursuivez le développement équilibré de la nation.'
        : 'Macro indicators are balanced. Continue steady, long-term national development.',
      suggestedAction: isFrench
        ? 'Demander un bilan complet de notre défense nationale et de nos réserves énergétiques'
        : 'Request a comprehensive audit of national defense readiness and strategic energy reserves',
    })
  }

  // Sort by urgency: critical first, then warning, then opportunity
  const urgencyWeight = { critical: 0, warning: 1, opportunity: 2 }
  adviceList.sort((a, b) => (urgencyWeight[a.urgency] ?? 3) - (urgencyWeight[b.urgency] ?? 3))

  return adviceList.slice(0, 4)
}
