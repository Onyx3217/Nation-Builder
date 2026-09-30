import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store/gameStore'
import { generateCountryName } from '../services/groqService'
import { DEFAULT_WORLD_COUNTRIES } from '../data/defaultWorld'
import { FICTIONAL_WORLD_COUNTRIES } from '../data/fictionalWorld'
import NationPlacementMap from '../components/NationPlacementMap'
import {
  ChevronRight, ChevronLeft, Shuffle, Sparkles, Home, BarChart2,
  X, Check, ArrowRight, Swords, Bot, Sliders, Edit3, HelpCircle
} from 'lucide-react'
import { t } from '../i18n'

// ─── Real World Data ─────────────────────────────────────────────────────────

const REAL_CONTINENTS = [
  { value: 'Europe', labelFr: 'Europe', labelEn: 'Europe', emoji: '🏔️' },
  { value: 'Asia', labelFr: 'Asie', labelEn: 'Asia', emoji: '🌏' },
  { value: 'Americas', labelFr: 'Amériques', labelEn: 'Americas', emoji: '🌎' },
  { value: 'Africa', labelFr: 'Afrique', labelEn: 'Africa', emoji: '🌍' },
  { value: 'Oceania', labelFr: 'Océanie', labelEn: 'Oceania', emoji: '🏝️' },
  { value: 'Middle East', labelFr: 'Moyen-Orient', labelEn: 'Middle East', emoji: '🕌' },
]

const REAL_OCEAN_LOCATIONS = {
  Europe: [-24, 46],
  Americas: [-48, 26],
  Asia: [155, 26],
  Africa: [-10, -10],
  'Middle East': [64, 16],
  Oceania: [168, -18],
}

const REAL_LANGUAGES = [
  { value: 'Romance', labelFr: 'Langue Romane (Français, Espagnol, Italien)', labelEn: 'Romance (French, Spanish, Italian)' },
  { value: 'Germanic', labelFr: 'Langue Germanique (Anglais, Allemand, Néerlandais)', labelEn: 'Germanic (English, German, Dutch)' },
  { value: 'Slavic', labelFr: 'Langue Slave (Russe, Polonais, Ukrainien)', labelEn: 'Slavic (Russian, Polish, Ukrainian)' },
  { value: 'Semitic', labelFr: 'Langue Sémitique (Arabe, Hébreu)', labelEn: 'Semitic (Arabic, Hebrew)' },
  { value: 'Sino-Tibetan', labelFr: 'Langue Sino-Tibétaine (Mandarin, Cantonais)', labelEn: 'Sino-Tibetan (Mandarin, Cantonese)' },
  { value: 'Turkic', labelFr: 'Langue Turkique (Turc, Azéri, Kazakh)', labelEn: 'Turkic (Turkish, Azeri, Kazakh)' },
  { value: 'Bantu', labelFr: 'Langue Bantoue (Swahili, Zoulou, Lingala)', labelEn: 'Bantu (Swahili, Zulu, Lingala)' },
  { value: 'Indo-Iranian', labelFr: 'Langue Indo-Iranienne (Persan, Hindi, Ourdou)', labelEn: 'Indo-Iranian (Persian, Hindi, Urdu)' },
  { value: 'Uralic', labelFr: 'Langues ouraliennes (finnois, hongrois, estonien)', labelEn: 'Uralic (Finnish, Hungarian, Estonian)' },
  { value: 'Japonic', labelFr: 'Langues japonaises (japonais, ryukyu)', labelEn: 'Japonic (Japanese, Ryukyuan)' },
  { value: 'Koreanic', labelFr: 'Langues coréaniques', labelEn: 'Koreanic languages' },
  { value: 'Austronesian', labelFr: 'Langues austronésiennes (malais, tagalog, maori)', labelEn: 'Austronesian (Malay, Tagalog, Maori)' },
  { value: 'Dravidian', labelFr: 'Langues dravidiennes (tamoul, télougou)', labelEn: 'Dravidian (Tamil, Telugu)' },
  { value: 'Niger-Congo', labelFr: 'Langues Niger-Congo (yoruba, igbo, swahili)', labelEn: 'Niger-Congo (Yoruba, Igbo, Swahili)' },
  { value: 'Austroasiatic', labelFr: 'Langues austroasiatiques (vietnamien, khmer)', labelEn: 'Austroasiatic (Vietnamese, Khmer)' },
  { value: 'Kartvelian', labelFr: 'Langues kartvéliennes (géorgien)', labelEn: 'Kartvelian (Georgian)' },
  { value: 'Celtic', labelFr: 'Langues celtiques (gallois, irlandais)', labelEn: 'Celtic (Welsh, Irish)' },
  { value: 'Quechuan', labelFr: 'Langues quechuanes et andines', labelEn: 'Quechuan and Andean languages' },
]

const REAL_RELIGIONS = [
  'Secular', 'Christian (Catholic)', 'Christian (Protestant)', 'Christian (Orthodox)',
  'Muslim (Sunni)', 'Muslim (Shia)', 'Hindu', 'Buddhist', 'Jewish', 'Sikh',
  'Indigenous / Folk', 'Syncretic', 'Other',
]

const FICTIONAL_RELIGIONS = [
  'Secular', 'Solar Synod', 'Tide Ancestors', 'Old Grove Traditions',
  'Ember Covenant', 'Celestial Path', 'Many-House Faith', 'Syncretic',
]

const RELIGION_LABELS_FR = {
  Secular: 'Laïque / sans religion majoritaire',
  'Christian (Catholic)': 'Christianisme (catholique)',
  'Christian (Protestant)': 'Christianisme (protestant)',
  'Christian (Orthodox)': 'Christianisme (orthodoxe)',
  'Muslim (Sunni)': 'Islam (sunnite)',
  'Muslim (Shia)': 'Islam (chiite)',
  Hindu: 'Hindouisme',
  Buddhist: 'Bouddhisme',
  Jewish: 'Judaïsme',
  Sikh: 'Sikhisme',
  'Indigenous / Folk': 'Traditions autochtones ou populaires',
  Syncretic: 'Traditions syncrétiques',
  Other: 'Autre',
  'Solar Synod': 'Synode solaire',
  'Tide Ancestors': 'Culte des ancêtres des marées',
  'Old Grove Traditions': 'Traditions des anciens bosquets',
  'Ember Covenant': 'Pacte des braises',
  'Celestial Path': 'Voie céleste',
  'Many-House Faith': 'Foi des maisons multiples',
}

function religionLabel(value, isFrench) {
  return isFrench ? RELIGION_LABELS_FR[value] || value : value
}

const REAL_RESOURCES = [
  { id: 'oil', labelFr: '🛢️ Pétrole & Gaz Naturel', labelEn: '🛢️ Oil & Gas' },
  { id: 'tech', labelFr: '💻 Haute Technologie & IA', labelEn: '💻 High-Tech & AI' },
  { id: 'agriculture', labelFr: '🌾 Agriculture & Agroalimentaire', labelEn: '🌾 Agriculture & Food' },
  { id: 'minerals', labelFr: '⛏️ Minerais Rares & Lithium', labelEn: '⛏️ Rare Minerals & Lithium' },
  { id: 'finance', labelFr: '🏦 Finance & Services Bancaires', labelEn: '🏦 Banking & Finance' },
  { id: 'tourism', labelFr: '🏖️ Tourisme & Patrimoine', labelEn: '🏖️ Tourism & Heritage' },
  { id: 'manufacturing', labelFr: '🏭 Industrie Lourde & Métallurgie', labelEn: '🏭 Manufacturing & Industry' },
  { id: 'pharma', labelFr: '💊 Industrie Pharmaceutique & Santé', labelEn: '💊 Pharmaceuticals' },
  { id: 'renewables', labelFr: '🌬️ Énergies renouvelables', labelEn: '🌬️ Renewable energy' },
  { id: 'nuclear', labelFr: '⚛️ Nucléaire civil', labelEn: '⚛️ Civil nuclear energy' },
  { id: 'water', labelFr: '💧 Eau douce & irrigation', labelEn: '💧 Freshwater & irrigation' },
  { id: 'forestry', labelFr: '🌲 Forêts & bois', labelEn: '🌲 Forestry & timber' },
  { id: 'fisheries', labelFr: '🐟 Pêche & ressources marines', labelEn: '🐟 Fisheries & marine resources' },
  { id: 'logistics', labelFr: '🚢 Transport & logistique', labelEn: '🚢 Transport & logistics' },
  { id: 'education', labelFr: '🎓 Recherche & enseignement', labelEn: '🎓 Research & education' },
  { id: 'chemicals', labelFr: '🧪 Chimie & matériaux', labelEn: '🧪 Chemicals & materials' },
  { id: 'defense', labelFr: '🛡️ Industrie de défense', labelEn: '🛡️ Defense industry' },
]

// ─── Fictional World Data (Coherent with fictionalWorld.js) ──────────────────

const FICTIONAL_CONTINENTS = [
  { value: 'Aethelgard Plains', labelFr: "Plaines d'Aethelgard", labelEn: 'Aethelgard Plains', emoji: '🏰' },
  { value: 'Nordic Reach', labelFr: 'Confins Nordiques', labelEn: 'Nordic Reach', emoji: '🛡️' },
  { value: 'Solar Rim', labelFr: 'Pourtour Solaire', labelEn: 'Solar Rim', emoji: '☀️' },
  { value: 'Equatorial Basin', labelFr: 'Bassin Équatorial', labelEn: 'Equatorial Basin', emoji: '🌿' },
  { value: 'Oceanic Archipelagos', labelFr: 'Archipels Océaniques', labelEn: 'Oceanic Archipelagos', emoji: '🔱' },
  { value: 'Polar North', labelFr: 'Grand Nord Polaire', labelEn: 'Polar North', emoji: '❄️' },
  { value: 'Golden Dunes', labelFr: 'Dunes Dorées', labelEn: 'Golden Dunes', emoji: '🏜️' },
  { value: 'Azure Sea', labelFr: "Mer d'Azur", labelEn: 'Azure Sea', emoji: '🌊' },
  { value: 'High Plateaus', labelFr: 'Hauts-Plateaux Célestes', labelEn: 'High Plateaus', emoji: '🚀' },
  { value: 'Volcanic Rift', labelFr: 'Faille Volcanique', labelEn: 'Volcanic Rift', emoji: '🌋' },
  { value: 'Cloud Highlands', labelFr: 'Cimes Nuageuses', labelEn: 'Cloud Highlands', emoji: '🦅' },
  { value: 'Craggy Highlands', labelFr: 'Hauteurs Rocailleuses', labelEn: 'Craggy Highlands', emoji: '🐉' },
]

const FICTIONAL_LANGUAGES = [
  { value: 'Valyro-Eldorian', labelFr: 'Valyro-Eldorien (Ancien Parler Impérial des Rois)', labelEn: 'Valyro-Eldorian (Imperial King\'s Tongue)' },
  { value: 'Thalassian', labelFr: 'Dialecte Thalassien des Archipels & Marins', labelEn: 'Thalassian Archipelago & Sailor Cant' },
  { value: 'Runic Boreal', labelFr: 'Runique Boréal & Patois des Brumes', labelEn: 'Runic Boreal & Mist Dialect' },
  { value: 'Lingua Solaris', labelFr: 'Lingua Solaris (Techno-Cant des Bâtisseurs Solaires)', labelEn: 'Lingua Solaris (Solar Cant)' },
  { value: 'Sylvane', labelFr: 'Idiome Sylvestre Néovéridien', labelEn: 'Neoveridian Sylvane Idiom' },
  { value: 'Dune Nomad', labelFr: 'Dialecte Nomade des Caravanes du Désert', labelEn: 'Dune Caravan Nomad Tongue' },
  { value: 'High Astral', labelFr: 'Haut-Astral & Cryptographie Spatiale', labelEn: 'High Astral & Space Cryptography' },
  { value: 'Common Forge', labelFr: 'Langue Commune des Forges & Volcans', labelEn: 'Common Forge Dialect' },
]

const FICTIONAL_RESOURCES = [
  { id: 'obsidium', labelFr: '💎 Alliages d\'Obsidium & Cristaux Purs', labelEn: '💎 Obsidium Alloys & Pure Crystals' },
  { id: 'mithril_tech', labelFr: '⚙️ Horlogerie Mithril & Mécanique Fine', labelEn: '⚙️ Mithril Clockwork & Fine Mechanics' },
  { id: 'solar_energy', labelFr: '☀️ Énergie Solaire Miroir & Fusion Propre', labelEn: '☀️ Concentrated Solar Mirror Energy' },
  { id: 'deep_sea_minerals', labelFr: '🔱 Minerais Abyssaux & Hydrates Océaniques', labelEn: '🔱 Abyssal Minerals & Hydrates' },
  { id: 'bio_tech', labelFr: '🌿 Botanique Primaire & Synthèses Végétales', labelEn: '🌿 Primeval Botanicals & Bio-Tech' },
  { id: 'geothermal_steel', labelFr: '🌋 Acier Géothermique des Failles Actives', labelEn: '🌋 Geothermal Caldera Steel' },
  { id: 'cryo_tech', labelFr: '❄️ Technologies Cryogéniques & Glace Pure', labelEn: '❄️ Cryogenic Tech & Pure Ice' },
  { id: 'quantum_arrays', labelFr: '🚀 Réseaux Quantiques & Propulsion Orbitale', labelEn: '🚀 Quantum Arrays & Orbital Propulsion' },
]

// ─── Shared Regimes & Scenarios ─────────────────────────────────────────────

const REGIMES_DATA = [
  { value: 'Democracy', labelFr: 'Démocratie Parlementaire', labelEn: 'Parliamentary Democracy', icon: '🗳️' },
  { value: 'Presidential Republic', labelFr: 'République présidentielle', labelEn: 'Presidential Republic', icon: '🏛️' },
  { value: 'Semi-presidential Republic', labelFr: 'République semi-présidentielle', labelEn: 'Semi-presidential Republic', icon: '⚖️' },
  { value: 'Parliamentary Republic', labelFr: 'République parlementaire', labelEn: 'Parliamentary Republic', icon: '🏛️' },
  { value: 'Monarchy', labelFr: 'Monarchie Constitutionnelle', labelEn: 'Constitutional Monarchy', icon: '👑' },
  { value: 'Absolute Monarchy', labelFr: 'Monarchie absolue', labelEn: 'Absolute Monarchy', icon: '👑' },
  { value: 'Federation', labelFr: 'Fédération', labelEn: 'Federation', icon: '🔗' },
  { value: 'Confederation', labelFr: 'Confédération', labelEn: 'Confederation', icon: '🤝' },
  { value: 'One-party State', labelFr: 'État à parti unique', labelEn: 'One-party State', icon: '🏴' },
  { value: 'Dictatorship', labelFr: 'Dictature / Autoritarisme', labelEn: 'Authoritarian Dictatorship', icon: '🎖️' },
  { value: 'Theocracy', labelFr: 'Théocratie', labelEn: 'Theocracy', icon: '☪️' },
  { value: 'Oligarchy', labelFr: 'Oligarchie Financière', labelEn: 'Oligarchy', icon: '💼' },
  { value: 'Military Junta', labelFr: 'Junte Militaire', labelEn: 'Military Junta', icon: '⚔️' },
  { value: 'Direct Democracy', labelFr: 'Démocratie directe', labelEn: 'Direct Democracy', icon: '🗳️' },
  { value: 'Technocracy', labelFr: 'Technocratie', labelEn: 'Technocracy', icon: '🧠' },
  { value: 'Provisional Government', labelFr: 'Gouvernement de transition', labelEn: 'Provisional Government', icon: '🕊️' },
]

const DIPLOMACY_DATA = [
  {
    value: 'neutral', labelFr: '⚖️ Neutralité Pragmatique', labelEn: '⚖️ Pragmatic Neutrality',
    descFr: 'Équilibre strict des relations, non-alignement et diplomatie ouverte avec tous les blocs.',
    descEn: 'Strict balance of relations, non-alignment, and open diplomacy with all geopolitical blocs.',
  },
  {
    value: 'isolationist', labelFr: '🧱 Souverainisme & Isolationnisme', labelEn: '🧱 Sovereignty & Isolationism',
    descFr: 'Priorité absolue à la sécurité intérieure, autosuffisance et rejet des traités contraignants.',
    descEn: 'Absolute priority to internal security, self-sufficiency, and avoidance of foreign entanglements.',
  },
  {
    value: 'expansionist', labelFr: '🗺️ Influence Mondiale & Expansion', labelEn: '🗺️ Global Influence & Expansion',
    descFr: "Recherche active de leadership régional, traités commerciaux offensifs et réseaux d'alliances.",
    descEn: 'Active pursuit of regional leadership, assertive trade pacts, and sprawling alliance networks.',
  },
  {
    value: 'militarist', labelFr: '⚔️ Dissuasion & Puissance Militaire', labelEn: '⚔️ Deterrence & Military Force',
    descFr: 'Projection de force armée, militarisation des frontières et doctrine de riposte immédiate.',
    descEn: 'Projecting power through force, heavily fortified borders, and immediate retaliatory doctrines.',
  },
  {
    value: 'idealist', labelFr: '🕊️ Multilatéralisme & Coopération', labelEn: '🕊️ Multilateral Cooperation',
    descFr: "Promotion des traités internationaux, aide au développement et arbitrage pacifique.",
    descEn: 'Championing international law, humanitarian pacts, and peaceful diplomatic mediation.',
  },
]

const BASE_SCENARIOS = [
  {
    id: 'standard', icon: '🌐',
    labelFr: 'Ordre Géopolitique Stable', labelEn: 'Stable Geopolitical Balance',
    descFr: 'Équilibre des puissances classique. Les marchés fonctionnent, les alliances sont stables.',
    descEn: 'Classic balance of power. International trade functions, major alliances are stable.',
    statModFr: 'Stabilité +10, Tension -5', statModEn: 'Stability +10, Tension -5',
  },
  {
    id: 'war', icon: '⚔️',
    labelFr: 'Conflit Armé Régional & Blocus', labelEn: 'Regional War & Siege',
    descFr: 'Une guerre totale a éclaté à vos frontières. Sanctions économiques immédiates et tensions à 80%.',
    descEn: 'Total war has erupted on your borders. Immediate sanctions and military tension at 80%.',
    statModFr: 'Tension +40, Stabilité -20', statModEn: 'Tension +40, Stability -20',
  },
  {
    id: 'post_apoc', icon: '🌋',
    labelFr: 'Dernier Sanctuaire (Survie Civile)', labelEn: 'Last Sanctuary (Civil Survival)',
    descFr: 'Un cataclysme mondial a anéanti la plupart des gouvernements. Votre nation est un havre isolé.',
    descEn: 'A global catastrophe has decimated world powers. Your nation is an isolated haven.',
    statModFr: 'PIB -40%, Stabilité -15, Tension +20', statModEn: 'GDP -40%, Stability -15, Tension +20',
  },
  {
    id: 'economic_crisis', icon: '📉',
    labelFr: 'Crise de la Dette & Choc Pétrolier', labelEn: 'Debt Crisis & Energy Shock',
    descFr: 'Récession mondiale sévère, inflation galopante et faillites bancaires en chaîne.',
    descEn: 'Severe global recession, runaway inflation, and cascading banking defaults.',
    statModFr: 'Inflation +15%, Chômage +8%, PIB -25%', statModEn: 'Inflation +15%, Unemployment +8%, GDP -25%',
  },
  {
    id: 'cold_war', icon: '🔴',
    labelFr: 'Nouvelle Guerre Froide', labelEn: 'New Cold War',
    descFr: 'Deux blocs rivaux se disputent chaque allié. Espionnage, propagande et course aux armements.',
    descEn: 'Two rival blocs compete for every ally. Espionage, propaganda, and nuclear arms race.',
    statModFr: 'Tension +30, Réputation aléatoire', statModEn: 'Tension +30, Reputation randomized',
  },
  {
    id: 'golden_age', icon: '✨',
    labelFr: "Âge d'Or & Croissance Mondiale", labelEn: 'Golden Age & Global Boom',
    descFr: 'Boom économique mondial, taux de croissance records, paix relative entre grandes puissances.',
    descEn: 'Global economic boom, record growth rates, relative peace between major powers.',
    statModFr: 'PIB +20%, Stabilité +15, Tension -10', statModEn: 'GDP +20%, Stability +15, Tension -10',
  },
  {
    id: 'pandemic', icon: '🧬',
    labelFr: 'Urgence sanitaire internationale', labelEn: 'International Health Emergency',
    descFr: 'Une épidémie transfrontalière met les systèmes de santé et les chaînes d’approvisionnement sous pression.',
    descEn: 'A cross-border outbreak strains health systems and supply chains.',
    statModFr: 'Stabilité -8, Chômage +3%, PIB -8%', statModEn: 'Stability -8, Unemployment +3%, GDP -8%',
  },
  {
    id: 'climate', icon: '🌡️',
    labelFr: 'Choc climatique & pénuries', labelEn: 'Climate Shock & Shortages',
    descFr: 'Sécheresses, inondations et récoltes réduites provoquent des tensions sur l’eau et l’alimentation.',
    descEn: 'Droughts, floods, and poor harvests strain water and food supplies.',
    statModFr: 'Inflation +6%, Stabilité -8, PIB -5%', statModEn: 'Inflation +6%, Stability -8, GDP -5%',
  },
  {
    id: 'transition', icon: '🔋',
    labelFr: 'Transition énergétique accélérée', labelEn: 'Accelerated Energy Transition',
    descFr: 'Investissements et tensions d’approvisionnement accompagnent une sortie progressive des énergies fossiles.',
    descEn: 'Investment and supply pressures accompany a gradual shift away from fossil fuels.',
    statModFr: 'Dette +8%, Réputation +8, Tension -5', statModEn: 'Debt +8%, Reputation +8, Tension -5',
  },
  {
    id: 'democratic_transition', icon: '🗳️',
    labelFr: 'Transition politique fragile', labelEn: 'Fragile Political Transition',
    descFr: 'Une ouverture politique négociée suscite de l’espoir, mais les institutions restent vulnérables.',
    descEn: 'A negotiated political opening raises hopes while institutions remain fragile.',
    statModFr: 'Stabilité -10, Réputation +10, Tension +5', statModEn: 'Stability -10, Reputation +10, Tension +5',
  },
  {
    id: 'supply_crisis', icon: '🚢',
    labelFr: 'Crise des chaînes d’approvisionnement', labelEn: 'Supply Chain Crisis',
    descFr: 'Des routes maritimes perturbées et des pénuries de composants ralentissent la production.',
    descEn: 'Disrupted shipping lanes and component shortages slow production.',
    statModFr: 'Inflation +8%, Chômage +4%, PIB -10%', statModEn: 'Inflation +8%, Unemployment +4%, GDP -10%',
  },
  {
    id: 'reconstruction', icon: '🏗️',
    labelFr: 'Reconstruction après conflit', labelEn: 'Post-conflict Reconstruction',
    descFr: 'Un cessez-le-feu tient, mais la reconstruction, le retour des déplacés et le désarmement prennent du temps.',
    descEn: 'A ceasefire holds, but rebuilding, displacement returns, and disarmament take time.',
    statModFr: 'Stabilité +5, Dette +12%, Tension +10', statModEn: 'Stability +5, Debt +12%, Tension +10',
  },
  {
    id: 'resource_boom', icon: '⛏️',
    labelFr: 'Ruée sur les matières premières', labelEn: 'Critical Minerals Boom',
    descFr: 'Une demande mondiale soudaine stimule les exportations, mais accentue les rivalités et la dépendance.',
    descEn: 'A global demand surge boosts exports while intensifying rivalry and dependence.',
    statModFr: 'PIB +8%, Inflation +4%, Tension +8', statModEn: 'GDP +8%, Inflation +4%, Tension +8',
  },
  {
    id: 'custom', icon: '✍️',
    labelFr: 'Scénario Personnalisé (Rédigé par Vous)', labelEn: 'Custom Scenario (Written by You)',
    descFr: 'Définissez votre propre situation initiale unique. Vos ministres et la presse s\'y adapteront.',
    descEn: 'Define your own unique starting situation. The Cabinet and newspapers will adapt to it.',
    statModFr: 'Impacts narratifs personnalisés', statModEn: 'Custom narrative impacts',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPop(n) {
  if (!n) return '0'
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  return `${(n / 1e3).toFixed(0)}k`
}

function formatArea(n) {
  if (!n) return '0 km²'
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M km²`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}k km²`
  return `${n} km²`
}

function formatGini(v) {
  if (v === undefined || v === null) return '0.30'
  return (v / 100).toFixed(2)
}

function Slider({ label, value, onChange, min, max, step = 1, format, hint }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm text-slate-300 font-medium">{label}</label>
        <span className="text-sm font-bold text-blue-400 font-mono">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - min) / (max - min)) * 100}%, #1e2d4a ${((value - min) / (max - min)) * 100}%, #1e2d4a 100%)`,
        }}
      />
      <div className="flex justify-between text-xs text-slate-600 font-mono">
        <span>{format ? format(min) : min}</span>
        {hint && <span className="text-slate-500 italic text-[10px]">{hint}</span>}
        <span>{format ? format(max) : max}</span>
      </div>
    </div>
  )
}

function LimitedChoiceField({ label, items, currentVal, onSelect, triesLeft }) {
  const locked = triesLeft <= 0
  return (
    <div className="w-full max-w-xl border border-slate-700 bg-slate-900/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-300">{label}</span>
        <span className="text-xs font-mono text-emerald-300">
          {currentVal !== null && currentVal !== undefined ? currentVal : '—'}
        </span>
      </div>
      <div className={`grid max-h-52 grid-cols-2 gap-1.5 overflow-y-auto sm:grid-cols-3 ${locked ? 'opacity-40' : ''}`}>
        {items.map((item, index) => (
          <button
            key={`${String(item.value)}-${index}`}
            type="button"
            disabled={locked}
            onClick={() => onSelect(item.value)}
            className="min-h-9 border border-slate-700/80 bg-[#101815] px-2 py-1.5 text-left text-[11px] text-slate-300 transition-colors hover:border-emerald-500/60 hover:text-white disabled:cursor-not-allowed"
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
        triesLeft > 0
          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
          : 'bg-red-500/15 border-red-500/30 text-red-400'
      }`}>
        {triesLeft > 0 ? `${triesLeft} essai${triesLeft > 1 ? 's' : ''}` : 'VERROUILLÉ'}
      </div>
    </div>
  )
}

// ─── World Comparison Drawer Component ────────────────────────────────────────

function WorldComparisonDrawer({ isOpen, onClose, onJumpToStep, currentForm, worldCountries, resourceOptions, isFictional, isFrench }) {
  const [selectedTargetId, setSelectedTargetId] = useState(
    worldCountries[0]?.id || (isFictional ? 'eldoria' : 'france')
  )

  const targetCountry = useMemo(() => {
    return worldCountries.find(c => c.id === selectedTargetId) || worldCountries[0]
  }, [worldCountries, selectedTargetId])

  const metricRows = useMemo(() => {
    const metrics = [
      ['name', isFrench ? 'Nom' : 'Name', 8],
      ['flag', isFrench ? 'Emblème' : 'Flag', 8],
      ['capital', isFrench ? 'Capitale' : 'Capital', 0],
      ['continent', isFrench ? 'Région / continent' : 'Region / continent', 0],
      ['coordinates', isFrench ? 'Coordonnées' : 'Coordinates', 0],
      ['isReal', isFrench ? 'Type de monde' : 'World setting', 8],
      ['area', isFrench ? 'Superficie' : 'Area', 0],
      ['population', isFrench ? 'Population' : 'Population', 1],
      ['density', isFrench ? 'Densité (hab./km²)' : 'Density (people/km²)', 1],
      ['gdpNominal', isFrench ? 'PIB nominal estimé' : 'Estimated nominal GDP', 3],
      ['gdpPerCapita', isFrench ? 'PIB / habitant' : 'GDP / capita', 3],
      ['regime', isFrench ? 'Régime politique' : 'Government', 2],
      ['ideology', isFrench ? 'Orientation politique' : 'Political orientation', 2],
      ['militaryPower', isFrench ? 'Puissance militaire / 10' : 'Military power / 10', 4],
      ['resources', isFrench ? 'Ressources & secteurs' : 'Resources & sectors', 3],
      ['language', isFrench ? 'Langue' : 'Language', 5],
      ['religion', isFrench ? 'Religion' : 'Religion', 5],
      ['diplomacyStyle', isFrench ? 'Doctrine diplomatique' : 'Diplomatic doctrine', 6],
      ['urbanization', isFrench ? 'Urbanisation' : 'Urbanization', 1],
      ['unemploymentRate', isFrench ? 'Chômage' : 'Unemployment', 3],
      ['inflationRate', isFrench ? 'Inflation' : 'Inflation', 3],
      ['publicDebt', isFrench ? 'Dette publique (% PIB)' : 'Public debt (% GDP)', 3],
      ['giniIndex', isFrench ? 'Indice de Gini' : 'Gini index', 3],
      ['povertyRate', isFrench ? 'Pauvreté' : 'Poverty', 3],
      ['stability', isFrench ? 'Stabilité' : 'Stability', 2],
      ['globalReputation', isFrench ? 'Réputation mondiale' : 'Global reputation', 6],
      ['militaryTension', isFrench ? 'Tension militaire' : 'Military tension', 4],
      ['description', isFrench ? 'Profil géopolitique' : 'Geopolitical profile', 6],
      ['initialScenario', isFrench ? 'Scénario de départ' : 'Starting scenario', 8],
    ]
    const format = (key, country) => {
      const value = country?.[key]
      if (key === 'density') {
        return country?.population && country?.area
          ? `${Math.round(country.population / country.area).toLocaleString()} ${isFrench ? 'hab./km²' : 'people/km²'}`
          : '—'
      }
      if (key === 'gdpNominal') {
        const valueInBillions = country?.gdpNominal ?? (country?.population && country?.gdpPerCapita
          ? (country.population * country.gdpPerCapita) / 1e9
          : null)
        return valueInBillions === null || valueInBillions === undefined ? '—' : `$${valueInBillions.toLocaleString(undefined, { maximumFractionDigits: 1 })}B`
      }
      if (key === 'isReal') {
        const real = country?.isReal ?? !isFictional
        return real ? (isFrench ? 'Monde réel' : 'Real world') : (isFrench ? 'Monde fictif' : 'Fictional world')
      }
      if (key === 'coordinates') return Array.isArray(value) ? value.join(', ') : '—'
      if (value === undefined || value === null || value === '') return '—'
      if (key === 'population') return formatPop(value)
      if (key === 'area') return formatArea(value)
      if (key === 'gdpPerCapita') return `$${Number(value).toLocaleString()}`
      if (key === 'resources') {
        return Array.isArray(value)
          ? value.map((resource) => {
              const option = resourceOptions.find((item) => item.id === resource)
              return option ? (isFrench ? option.labelFr : option.labelEn) : resource
            }).join(', ') || '—'
          : String(value)
      }
      if (key === 'description') return String(value)
      if (key === 'giniIndex') return formatGini(value)
      if (['urbanization', 'unemploymentRate', 'inflationRate', 'publicDebt', 'povertyRate', 'stability', 'globalReputation', 'militaryTension'].includes(key)) return `${value}%`
      return String(value)
    }
    const lowerIsBetter = new Set(['unemploymentRate', 'inflationRate', 'publicDebt', 'giniIndex', 'povertyRate', 'militaryTension'])
    const higherIsBetter = new Set(['population', 'area', 'gdpNominal', 'gdpPerCapita', 'stability', 'globalReputation', 'urbanization'])
    return metrics.map(([key, label, step]) => {
      const value = currentForm?.[key]
        ?? (key === 'gdpNominal' ? (currentForm?.population * currentForm?.gdpPerCapita) / 1e9 : undefined)
        ?? (key === 'isReal' ? !isFictional : undefined)
      const targetValue = targetCountry?.[key] ?? (key === 'gdpNominal' && targetCountry?.population && targetCountry?.gdpPerCapita
        ? (targetCountry.population * targetCountry.gdpPerCapita) / 1e9
        : undefined)
      const numeric = typeof value === 'number' && typeof targetValue === 'number'
      const better = numeric && lowerIsBetter.has(key)
        ? value <= targetValue
        : numeric && higherIsBetter.has(key) ? value >= targetValue : null
      return { key, label, step, v1: format(key, currentForm), v2: format(key, targetCountry), better }
    })
  }, [currentForm, isFrench, targetCountry])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="w-full max-w-xl h-full bg-[#070d1d] border-l border-slate-800 p-5 overflow-y-auto flex flex-col shadow-2xl"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <BarChart2 size={18} />
            </span>
            <div>
              <h3 className="font-display font-bold text-white text-base">
                {isFrench ? 'Comparateur Mondial en Direct' : 'Live World Comparison'}
              </h3>
              <p className="text-xs text-slate-400">
                {isFictional
                  ? (isFrench ? 'Repères géopolitiques du Monde Fictif' : 'Fictional World benchmarks')
                  : (isFrench ? 'Repères mondiaux du Monde Réel (100 pays)' : 'Real World benchmarks (100 countries)')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Target Country Selector */}
        <div className="my-4">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
            {isFrench ? 'Comparer votre nation face à :' : 'Compare your nation against:'}
          </label>
          <select
            value={selectedTargetId}
            onChange={(e) => setSelectedTargetId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            {worldCountries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.flag} {c.name} ({c.continent}) — ${c.gdpPerCapita?.toLocaleString()}/hab
              </option>
            ))}
          </select>
        </div>

        {/* Head to Head Comparison Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-1 mb-5">
          <div className="grid grid-cols-3 text-center border-b border-slate-800 pb-2">
            <div className="text-left font-bold text-xs text-amber-400 truncate">
              {currentForm.flag} {currentForm.name || (isFrench ? 'Votre Pays' : 'Your Country')}
            </div>
            <div className="text-slate-500 text-[11px] uppercase font-bold tracking-wider">
              {isFrench ? 'Indicateur' : 'Metric'}
            </div>
            <div className="text-right font-bold text-xs text-blue-400 truncate">
              {targetCountry?.flag} {targetCountry?.name}
            </div>
          </div>

          {metricRows.map((row) => (
            <button
              key={row.key}
              type="button"
              onClick={() => onJumpToStep(row.step)}
              title={isFrench ? 'Aller à cette caractéristique' : 'Go to this characteristic'}
              className="grid w-full grid-cols-3 items-center gap-2 text-xs py-1.5 border-b border-slate-900/80 text-left hover:bg-slate-900/70"
            >
              <span className={`min-w-0 wrap-break-word font-mono font-bold ${row.better === true ? 'text-emerald-400' : 'text-slate-300'}`}>{row.v1}</span>
              <span className="min-w-0 wrap-break-word text-center text-slate-400 text-[11px] px-1 inline-flex items-center justify-center gap-1">
                {row.label}<ArrowRight size={10} className="shrink-0 text-blue-400" />
              </span>
              <span className={`min-w-0 wrap-break-word font-mono font-bold text-right ${row.better === false ? 'text-emerald-400' : 'text-slate-300'}`}>{row.v2}</span>
            </button>
          ))}
        </div>

        <p className="text-[11px] text-slate-500">{isFrench ? '— signifie que cette donnée n’est pas renseignée pour le pays comparé. Cliquez sur une ligne pour modifier cette caractéristique.' : '— means this information is not available for the selected country. Click a row to edit that characteristic.'}</p>
      </motion.div>
    </div>
  )
}

// ─── Main Creation Wizard Component ──────────────────────────────────────────

export default function Creation() {
  const navigate = useNavigate()
  const { updateCountry, country, setPhase, groqApiKey, language, worldMode, difficultyMode, worldCountries: storeWorldCountries } = useGameStore()
  const isFrench = (language || 'fr') === 'fr'
  const isFictional = worldMode === 'fictional'

  // Context-aware datasets according to worldMode
  const CONTINENTS_DATA = isFictional ? FICTIONAL_CONTINENTS : REAL_CONTINENTS
  const LANGUAGES_DATA = isFictional ? FICTIONAL_LANGUAGES : REAL_LANGUAGES
  const RESOURCES_DATA = isFictional ? FICTIONAL_RESOURCES : REAL_RESOURCES
  const RELIGIONS_DATA = isFictional ? FICTIONAL_RELIGIONS : REAL_RELIGIONS
  const worldCountryList = storeWorldCountries?.length
    ? storeWorldCountries
    : (isFictional ? FICTIONAL_WORLD_COUNTRIES : DEFAULT_WORLD_COUNTRIES)
  const initialContinent = CONTINENTS_DATA.some((item) => item.value === country.continent)
    ? country.continent
    : CONTINENTS_DATA[0].value
  const availableResourceIds = new Set(RESOURCES_DATA.map((resource) => resource.id))
  const initialResources = (country.resources || []).filter((resource) => availableResourceIds.has(resource))
  const [placement, setPlacement] = useState(() => ({
    coordinates: Array.isArray(country.coordinates) && country.coordinates.length === 2
      ? country.coordinates
      : (isFictional ? [0, 0] : REAL_OCEAN_LOCATIONS[initialContinent] || [-24, 46]),
    occupiedCountryId: country.territorialDisputeCountryId || null,
    occupiedCountryName: country.territorialDisputeWith || null,
  }))

  // Difficulty & Steps
  const [diffMode, setDiffMode] = useState(difficultyMode || 'choose') // 'choose' | 'ai' | 'normal' | 'hard'
  const [step, setStep] = useState(0)
  const [isComparisonOpen, setIsComparisonOpen] = useState(false)
  const [selectedResources, setSelectedResources] = useState(
    initialResources.length ? initialResources : RESOURCES_DATA.slice(0, 2).map((resource) => resource.id)
  )
  const [generatingName, setGeneratingName] = useState(false)
  const [generatingAi, setGeneratingAi] = useState(false)
  const initialAiGenerationStarted = useRef(false)

  // Scenario management (Presets + Custom Scenario prompt)
  const [selectedScenarioPreset, setSelectedScenarioPreset] = useState('standard')
  const [customScenarioText, setCustomScenarioText] = useState('')

  // Hard mode — 2 tries per spin field
  const [hardTries, setHardTries] = useState({
    continent: 2, area: 2, population: 2, urbanization: 2, regime: 2,
    militaryPower: 2, resources: 2, language: 2, religion: 2,
    diplomacyStyle: 2, capital: 2, flag: 2, scenario: 2,
    gdpPerCapita: 2, unemploymentRate: 2, inflationRate: 2,
    publicDebt: 2, giniIndex: 2, povertyRate: 2,
  })
  const [hardRolled, setHardRolled] = useState({})

  // Local form state
  const [form, setFormState] = useState({
    name: country.name || '',
    capital: country.capital || '',
    flag: country.flag || (isFictional ? '👑' : '🇫🇷'),
    initialScenario: country.initialScenario || 'Ordre Géopolitique Stable',
    continent: initialContinent,
    area: country.area || 250000,
    population: country.population || 30000000,
    regime: country.regime || 'Republic',
    gdpPerCapita: country.gdpPerCapita || 28000,
    unemploymentRate: country.unemploymentRate || 5.6,
    inflationRate: country.inflationRate || 2.3,
    publicDebt: country.publicDebt || 64.0,
    giniIndex: country.giniIndex || 31.0,
    povertyRate: country.povertyRate || 8.4,
    militaryPower: country.militaryPower ?? 6,
    urbanization: country.urbanization ?? 65,
    language: LANGUAGES_DATA.some((item) => item.value === country.language)
      ? country.language
      : LANGUAGES_DATA[0].value,
    religion: country.religion || 'Secular',
    diplomacyStyle: country.diplomacyStyle || 'neutral',
  })

  const setF = (k, v) => setFormState((f) => ({ ...f, [k]: v }))

  const selectContinent = (value) => {
    setF('continent', value)
    setPlacement({
      coordinates: isFictional ? [0, 0] : REAL_OCEAN_LOCATIONS[value] || [-24, 46],
      occupiedCountryId: null,
      occupiedCountryName: null,
    })
  }

  const spendTry = (field, val) => {
    if (hardTries[field] === undefined || hardTries[field] <= 0) return
    setF(field, val)
    setHardTries(prev => ({ ...prev, [field]: prev[field] - 1 }))
    setHardRolled((prev) => ({ ...prev, [field]: true }))
  }

  const hardCurrentValue = (field, value) => hardRolled[field] ? value : null

  const calculatedNominalGdp = Math.round((form.population * form.gdpPerCapita) / 1e9 * 10) / 10

  const STEPS = [
    { id: 'geo', title: isFrench ? 'Géographie' : 'Geography', icon: '🏔️' },
    { id: 'demo', title: isFrench ? 'Démographie' : 'Demographics', icon: '👥' },
    { id: 'politics', title: isFrench ? 'Régime' : 'Government', icon: '🏛️' },
    { id: 'economy', title: isFrench ? 'Macroéconomie' : 'Economy', icon: '💰' },
    { id: 'military', title: isFrench ? 'Défense' : 'Military', icon: '🛡️' },
    { id: 'culture', title: isFrench ? 'Culture' : 'Culture', icon: '🎭' },
    { id: 'diplomacy', title: isFrench ? 'Diplomatie' : 'Diplomacy', icon: '🤝' },
    { id: 'identity', title: isFrench ? 'Identité' : 'Identity', icon: '🏳️' },
    { id: 'finalize', title: isFrench ? 'Finalisation' : 'Finalize', icon: '✨' },
  ]

  const handleRandomizeAll = () => {
    const continent = CONTINENTS_DATA[Math.floor(Math.random() * CONTINENTS_DATA.length)].value
    setFormState((prev) => ({
      ...prev,
      continent,
      regime: REGIMES_DATA[Math.floor(Math.random() * REGIMES_DATA.length)].value,
      language: LANGUAGES_DATA[Math.floor(Math.random() * LANGUAGES_DATA.length)].value,
      diplomacyStyle: DIPLOMACY_DATA[Math.floor(Math.random() * DIPLOMACY_DATA.length)].value,
      population: Math.round(1000000 + Math.random() * 90000000),
      area: Math.round(20000 + Math.random() * 800000),
      gdpPerCapita: Math.round(4000 + Math.random() * 55000),
      militaryPower: Math.floor(2 + Math.random() * 8),
      unemploymentRate: Math.round((3 + Math.random() * 10) * 10) / 10,
      inflationRate: Math.round((1 + Math.random() * 6) * 10) / 10,
      publicDebt: Math.round(30 + Math.random() * 80),
      giniIndex: Math.round((25 + Math.random() * 35) * 10) / 10,
    }))
    setPlacement({
      coordinates: isFictional ? [0, 0] : REAL_OCEAN_LOCATIONS[continent] || [-24, 46],
      occupiedCountryId: null,
      occupiedCountryName: null,
    })
  }

  const handleGenerateName = async () => {
    setGeneratingName(true)
    try {
      const result = await generateCountryName(groqApiKey, {
        ...form,
        resources: selectedResources,
        worldMode,
      })
      if (result) {
        setF('name', result.name || form.name)
      }
    } catch (e) { console.error(e) }
    setGeneratingName(false)
  }

  const handleAiGenerate = async () => {
    setGeneratingAi(true)
    try {
      const continentList = CONTINENTS_DATA.map(c => c.value).join(', ')
      const regimeList = REGIMES_DATA.map(r => r.value).join(', ')
      const langList = LANGUAGES_DATA.map(l => l.value).join(', ')
      const resList = RESOURCES_DATA.map(r => r.id).join(', ')
      const religionList = RELIGIONS_DATA.join(', ')

      const prompt = `Génère une nation ${isFictional ? 'dans un monde imaginaire cohérent' : 'dans le monde réel contemporain'} pour un jeu de simulation géopolitique.
Retourne UNIQUEMENT un objet JSON valide, sans format markdown, sans commentaires :
{
  "name": string,
  "capital": string,
  "flag": "emoji unique",
  "continent": "choisis parmi: ${continentList}",
  "regime": "choisis parmi: ${regimeList}",
  "population": number (500000-120000000),
  "area": number (5000-1500000),
  "gdpPerCapita": number (600-80000),
  "unemploymentRate": number (2-25),
  "inflationRate": number (0.5-20),
  "publicDebt": number (10-180),
  "giniIndex": number (20-60, stocké sur 100),
  "militaryPower": number 1-10,
  "urbanization": number 20-95,
  "language": "choisis parmi: ${langList}",
  "religion": "choisis parmi: ${religionList}",
  "diplomacyStyle": "neutral|isolationist|expansionist|militarist|idealist",
  "resources": ["choisis 2 ou 3 parmi: ${resList}"]
}`

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://nation-builder.app',
        },
        body: JSON.stringify({
          model: 'qwen/qwen3-8b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.92,
          max_tokens: 700,
        }),
      })
      const data = await res.json()
      const raw = data?.choices?.[0]?.message?.content || ''
      const jsonMatch = raw.match(/\{[\s\S]+\}/)
      if (jsonMatch) {
        const p = JSON.parse(jsonMatch[0])
        setFormState(prev => ({
          ...prev,
          name: p.name || prev.name,
          capital: p.capital || prev.capital,
          flag: p.flag || prev.flag,
          continent: p.continent || prev.continent,
          regime: p.regime || prev.regime,
          population: Number(p.population) || prev.population,
          area: Number(p.area) || prev.area,
          gdpPerCapita: Number(p.gdpPerCapita) || prev.gdpPerCapita,
          unemploymentRate: Number(p.unemploymentRate) || prev.unemploymentRate,
          inflationRate: Number(p.inflationRate) || prev.inflationRate,
          publicDebt: Number(p.publicDebt) || prev.publicDebt,
          giniIndex: Number(p.giniIndex) || prev.giniIndex,
          militaryPower: Number(p.militaryPower) || prev.militaryPower,
          urbanization: Number(p.urbanization) || prev.urbanization,
          language: p.language || prev.language,
          religion: p.religion || prev.religion,
          diplomacyStyle: p.diplomacyStyle || prev.diplomacyStyle,
        }))
        const generatedContinent = CONTINENTS_DATA.some((item) => item.value === p.continent)
          ? p.continent
          : form.continent
        setPlacement({
          coordinates: isFictional ? [0, 0] : REAL_OCEAN_LOCATIONS[generatedContinent] || [-24, 46],
          occupiedCountryId: null,
          occupiedCountryName: null,
        })
        if (p.resources?.length) setSelectedResources(p.resources.slice(0, 3))
      }
    } catch (e) { console.error('AI gen error', e) }
    setGeneratingAi(false)
    setStep(8)
  }

  useEffect(() => {
    if (diffMode === 'ai' && !initialAiGenerationStarted.current) {
      initialAiGenerationStarted.current = true
      handleAiGenerate()
    }
  }, [diffMode])

  const handleFinish = () => {
    const finalName = form.name.trim() || (isFrench ? 'Nouvelle République' : 'New Republic')
    const finalCapital = form.capital.trim() || (isFrench ? 'Capitale' : 'Capital City')
    const finalFlag = form.flag || '👑'

    // Compute final scenario text & stat effects
    let finalScenarioLabel = ''
    let scenarioPatch = {}

    if (isHard) {
      finalScenarioLabel = form.initialScenario
    } else if (selectedScenarioPreset === 'custom') {
      finalScenarioLabel = customScenarioText.trim() || (isFrench ? 'Scénario Personnalisé' : 'Custom Scenario')
    } else {
      const presetObj = BASE_SCENARIOS.find(s => s.id === selectedScenarioPreset)
      finalScenarioLabel = isFrench ? presetObj?.labelFr : presetObj?.labelEn
      switch (selectedScenarioPreset) {
        case 'war':
          scenarioPatch = { militaryTension: 80, stability: Math.max(10, 75 - 20) }
          break
        case 'post_apoc':
          scenarioPatch = { gdpPerCapita: Math.round(form.gdpPerCapita * 0.6), stability: Math.max(5, 75 - 15), militaryTension: 40 }
          break
        case 'economic_crisis':
          scenarioPatch = { inflationRate: form.inflationRate + 15, unemploymentRate: Math.min(45, form.unemploymentRate + 8), gdpPerCapita: Math.round(form.gdpPerCapita * 0.75) }
          break
        case 'cold_war':
          scenarioPatch = { militaryTension: 60, globalReputation: Math.floor(30 + Math.random() * 40) }
          break
        case 'golden_age':
          scenarioPatch = { gdpPerCapita: Math.round(form.gdpPerCapita * 1.2), stability: Math.min(95, 75 + 15), militaryTension: Math.max(5, 20 - 10) }
          break
        default:
          scenarioPatch = { stability: Math.min(95, 75 + 10), militaryTension: Math.max(5, 20 - 5) }
      }
    }

    updateCountry({
      ...form,
      name: finalName,
      capital: finalCapital,
      flag: finalFlag,
      resources: selectedResources,
      coordinates: placement.coordinates,
      territorialDisputeCountryId: placement.occupiedCountryId,
      territorialDisputeWith: placement.occupiedCountryName,
      gdpNominal: calculatedNominalGdp,
      initialScenario: finalScenarioLabel,
      ...scenarioPatch,
    })

    setPhase('integration')
    navigate('/world')
  }

  const canProceed = () => {
    if (isHard) {
      const requiredRolls = {
        0: ['continent', 'area'],
        1: ['population', 'urbanization'],
        2: ['regime'],
        3: ['gdpPerCapita', 'unemploymentRate', 'inflationRate', 'publicDebt', 'giniIndex', 'povertyRate', 'resources'],
        4: ['militaryPower'],
        5: ['language', 'religion'],
        6: ['diplomacyStyle'],
        7: ['capital', 'flag'],
      }
      return (requiredRolls[step] || []).every((field) => hardRolled[field])
    }
    if (step === 0) return Boolean(form.continent)
    if (step === 2) return Boolean(form.regime)
    return true
  }

  // ─── Step Content Renderer ────────────────────────────────────────────────
  const isHard = diffMode === 'hard'

  const renderStep = () => {
    switch (step) {
      case 0: // Geography
        return (
          <div className="space-y-8">
            <div>
              <p className="text-sm text-slate-400 mb-3">
                {isFictional
                  ? (isFrench ? 'Choisissez la région ou le continent de ce Monde Fictif :' : 'Select your Fictional Realm / Continent:')
                  : (isFrench ? 'Choisissez le continent terrestre d\'implantation :' : 'Select your Real World continent:')}
              </p>
              {isHard ? (
                <div className="flex justify-center">
                  <LimitedChoiceField
                    label={isFrench ? 'Région' : 'Region'}
                    items={CONTINENTS_DATA.map((region) => ({
                      label: `${region.emoji} ${isFrench ? region.labelFr : region.labelEn}`,
                      value: region.value,
                    }))}
                    currentVal={hardCurrentValue('continent', CONTINENTS_DATA.find((region) => region.value === form.continent)?.[isFrench ? 'labelFr' : 'labelEn'])}
                    onSelect={(value) => {
                      spendTry('continent', value)
                      setPlacement({
                        coordinates: isFictional ? [0, 0] : REAL_OCEAN_LOCATIONS[value] || [-24, 46],
                        occupiedCountryId: null,
                        occupiedCountryName: null,
                      })
                    }}
                    triesLeft={hardTries.continent}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CONTINENTS_DATA.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => selectContinent(c.value)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        form.continent === c.value
                          ? 'border-blue-500 bg-blue-600/20 text-white shadow-[0_0_15px_rgba(59,130,246,0.25)]'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <div className="text-2xl mb-1">{c.emoji}</div>
                      <div className="font-semibold text-sm">{isFrench ? c.labelFr : c.labelEn}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isHard ? (
              <div>
                <p className="text-xs text-red-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-3">
                  ⚔️ {isFrench ? 'Mode Difficile — Superficie (2 essais)' : 'Hard — Territory (2 tries)'}
                </p>
                <div className="flex justify-center">
                  <LimitedChoiceField
                    label={isFrench ? 'Superficie (km²)' : 'Area (km²)'}
                    items={[
                      { label: '5k km²', value: 5000 }, { label: '50k km²', value: 50000 },
                      { label: '100k km²', value: 100000 }, { label: '250k km²', value: 250000 },
                      { label: '500k km²', value: 500000 }, { label: '750k km²', value: 750000 },
                      { label: '1M km²', value: 1000000 }, { label: '2M km²', value: 2000000 },
                      { label: '5M km²', value: 5000000 }, { label: '17M km²', value: 17000000 },
                    ]}
                    currentVal={hardCurrentValue('area', formatArea(form.area))}
                    onSelect={(v) => spendTry('area', v)}
                    triesLeft={hardTries.area}
                  />
                </div>
              </div>
            ) : (
              <Slider
                label={isFrench ? 'Superficie Terrestre (km²)' : 'Territorial Area (km²)'}
                value={form.area}
                onChange={(v) => setF('area', v)}
                min={1000}
                max={2000000}
                step={5000}
                format={formatArea}
              />
            )}
            <NationPlacementMap
              coordinates={placement.coordinates}
              worldCountries={worldCountryList}
              isFictional={isFictional}
              isFrench={isFrench}
              onChange={setPlacement}
            />
            {!isFictional && placement.occupiedCountryName && (
              <div className="border-l-2 border-amber-400 bg-amber-950/30 px-4 py-3 text-xs text-amber-100" role="status">
                <strong>{isFrench ? 'Territoire disputé :' : 'Contested territory:'}</strong>{' '}
                {isFrench
                  ? `${placement.occupiedCountryName} considérera cette implantation comme une revendication sur son territoire et pourra s’y opposer.`
                  : `${placement.occupiedCountryName} will consider this a claim on its territory and may oppose it.`}
              </div>
            )}
          </div>
        )

      case 1: // Demographics
        return (
          <div className="space-y-8">
            {isHard ? (
              <div>
                <p className="text-xs text-red-400 font-bold uppercase tracking-wider flex items-center gap-1 mb-3">
                  ⚔️ {isFrench ? 'Mode Difficile — Population (2 essais)' : 'Hard — Population (2 tries)'}
                </p>
                <div className="flex justify-center">
                  <LimitedChoiceField
                    label="Population"
                    items={[
                      { label: '500k', value: 500000 }, { label: '1M', value: 1000000 }, { label: '5M', value: 5000000 },
                      { label: '10M', value: 10000000 }, { label: '20M', value: 20000000 }, { label: '40M', value: 40000000 },
                      { label: '80M', value: 80000000 }, { label: '150M', value: 150000000 },
                      { label: '500M', value: 500000000 }, { label: '1.4B', value: 1400000000 },
                    ]}
                    currentVal={hardCurrentValue('population', formatPop(form.population))}
                    onSelect={(v) => spendTry('population', v)}
                    triesLeft={hardTries.population}
                  />
                  <LimitedChoiceField
                    label={isFrench ? 'Urbanisation' : 'Urbanization'}
                    items={[20, 30, 40, 50, 60, 70, 80, 90, 95].map((value) => ({ label: `${value}%`, value }))}
                    currentVal={hardCurrentValue('urbanization', `${form.urbanization}%`)}
                    onSelect={(value) => spendTry('urbanization', value)}
                    triesLeft={hardTries.urbanization}
                  />
                </div>
              </div>
            ) : (
              <>
                <Slider
                  label={isFrench ? 'Population Totale' : 'Total Population'}
                  value={form.population}
                  onChange={(v) => setF('population', v)}
                  min={100000}
                  max={150000000}
                  step={200000}
                  format={formatPop}
                />
                <Slider
                  label={isFrench ? "Taux d'Urbanisation (%)" : 'Urbanization Rate (%)'}
                  value={form.urbanization}
                  onChange={(v) => setF('urbanization', v)}
                  min={15}
                  max={95}
                  step={1}
                  format={(v) => `${v}%`}
                />
              </>
            )}
          </div>
        )

      case 2: // Government
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-400 mb-3">
                  {isFrench ? 'Choisissez le régime de votre gouvernement :' : 'Choose your form of government:'}
            </p>
            {isHard ? (
              <div className="flex justify-center">
                <LimitedChoiceField
                  label={isFrench ? 'Régime politique' : 'Government'}
                  items={REGIMES_DATA.map((regime) => ({ label: `${regime.icon} ${isFrench ? regime.labelFr : regime.labelEn}`, value: regime.value }))}
                  currentVal={hardCurrentValue('regime', REGIMES_DATA.find((regime) => regime.value === form.regime)?.[isFrench ? 'labelFr' : 'labelEn'])}
                  onSelect={(value) => spendTry('regime', value)}
                  triesLeft={hardTries.regime}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {REGIMES_DATA.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setF('regime', r.value)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      form.regime === r.value
                        ? 'border-blue-500 bg-blue-600/20 text-white shadow-[0_0_15px_rgba(59,130,246,0.25)]'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="text-2xl">{r.icon}</span>
                    <div className="font-semibold text-sm">{isFrench ? r.labelFr : r.labelEn}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )

      case 3: // Macroeconomics
        return (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-500/20 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                  {isFrench ? 'PIB Nominal Estimé' : 'Estimated Nominal GDP'}
                </span>
                <p className="text-2xl font-bold text-amber-400 font-mono mt-0.5">
                  ${calculatedNominalGdp.toLocaleString()} {isFrench ? 'Mds USD' : 'Bn USD'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                  {isFrench ? 'PIB / Habitant' : 'GDP / Capita'}
                </span>
                <p className="text-xl font-bold text-white font-mono mt-0.5">
                  ${form.gdpPerCapita.toLocaleString()}
                </p>
              </div>
            </div>

            {isHard ? (
              <>
                <p className="text-xs text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  ⚔️ {isFrench ? 'Mode Difficile — 2 essais par indicateur' : 'Hard Mode — 2 tries per indicator'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <LimitedChoiceField
                    label="PIB/hab (USD)"
                    items={[
                      { label: '$500', value: 500 }, { label: '$1 500', value: 1500 }, { label: '$3 000', value: 3000 },
                      { label: '$7 000', value: 7000 }, { label: '$15 000', value: 15000 }, { label: '$28 000', value: 28000 },
                      { label: '$45 000', value: 45000 }, { label: '$65 000', value: 65000 },
                      { label: '$85 000', value: 85000 }, { label: '$120 000', value: 120000 },
                    ]}
                    currentVal={hardCurrentValue('gdpPerCapita', `$${form.gdpPerCapita.toLocaleString()}`)}
                    onSelect={(v) => spendTry('gdpPerCapita', v)}
                    triesLeft={hardTries.gdpPerCapita}
                  />
                  <LimitedChoiceField
                    label={isFrench ? 'Chômage (%)' : 'Unemploy. (%)'}
                    items={[
                      { label: '2%', value: 2 }, { label: '3.5%', value: 3.5 }, { label: '5%', value: 5 },
                      { label: '7%', value: 7 }, { label: '10%', value: 10 }, { label: '14%', value: 14 },
                      { label: '18%', value: 18 }, { label: '22%', value: 22 }, { label: '28%', value: 28 }, { label: '35%', value: 35 },
                    ]}
                    currentVal={hardCurrentValue('unemploymentRate', `${form.unemploymentRate}%`)}
                    onSelect={(v) => spendTry('unemploymentRate', v)}
                    triesLeft={hardTries.unemploymentRate}
                  />
                  <LimitedChoiceField
                    label="Inflation (%)"
                    items={[
                      { label: '0.5%', value: 0.5 }, { label: '1.5%', value: 1.5 }, { label: '2.5%', value: 2.5 },
                      { label: '4%', value: 4 }, { label: '7%', value: 7 }, { label: '12%', value: 12 },
                      { label: '20%', value: 20 }, { label: '35%', value: 35 }, { label: '60%', value: 60 }, { label: '150%', value: 150 },
                    ]}
                    currentVal={hardCurrentValue('inflationRate', `${form.inflationRate}%`)}
                    onSelect={(v) => spendTry('inflationRate', v)}
                    triesLeft={hardTries.inflationRate}
                  />
                  <LimitedChoiceField
                    label={isFrench ? 'Dette/PIB (%)' : 'Debt/GDP (%)'}
                    items={[
                      { label: '10%', value: 10 }, { label: '25%', value: 25 }, { label: '40%', value: 40 },
                      { label: '60%', value: 60 }, { label: '80%', value: 80 }, { label: '100%', value: 100 },
                      { label: '130%', value: 130 }, { label: '160%', value: 160 }, { label: '200%', value: 200 }, { label: '280%', value: 280 },
                    ]}
                    currentVal={hardCurrentValue('publicDebt', `${form.publicDebt}%`)}
                    onSelect={(v) => spendTry('publicDebt', v)}
                    triesLeft={hardTries.publicDebt}
                  />
                  <LimitedChoiceField
                    label="Gini (0–1)"
                    items={[
                      { label: '0.22', value: 22 }, { label: '0.27', value: 27 }, { label: '0.31', value: 31 },
                      { label: '0.35', value: 35 }, { label: '0.40', value: 40 }, { label: '0.45', value: 45 },
                      { label: '0.50', value: 50 }, { label: '0.55', value: 55 }, { label: '0.60', value: 60 }, { label: '0.65', value: 65 },
                    ]}
                    currentVal={hardCurrentValue('giniIndex', formatGini(form.giniIndex))}
                    onSelect={(v) => spendTry('giniIndex', v)}
                    triesLeft={hardTries.giniIndex}
                  />
                  <LimitedChoiceField
                    label={isFrench ? 'Pauvreté (%)' : 'Poverty (%)'}
                    items={[2, 5, 8, 12, 18, 25, 40, 60, 80].map((value) => ({ label: `${value}%`, value }))}
                    currentVal={hardCurrentValue('povertyRate', `${form.povertyRate}%`)}
                    onSelect={(value) => spendTry('povertyRate', value)}
                    triesLeft={hardTries.povertyRate}
                  />
                </div>
              </>
            ) : (
              <>
                <Slider
                  label={isFrench ? 'PIB par habitant (USD)' : 'GDP per Capita (USD)'}
                  value={form.gdpPerCapita}
                  onChange={(v) => setF('gdpPerCapita', v)}
                  min={800}
                  max={85000}
                  step={500}
                  format={(v) => `$${v.toLocaleString()}`}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  <Slider
                    label={isFrench ? 'Taux de Chômage (%)' : 'Unemployment Rate (%)'}
                    value={form.unemploymentRate}
                    onChange={(v) => setF('unemploymentRate', v)}
                    min={2} max={25} step={0.1}
                    format={(v) => `${v}%`}
                  />
                  <Slider
                    label={isFrench ? "Taux d'Inflation Annuel (%)" : 'Annual Inflation Rate (%)'}
                    value={form.inflationRate}
                    onChange={(v) => setF('inflationRate', v)}
                    min={0.5} max={30} step={0.1}
                    format={(v) => `${v}%`}
                  />
                  <Slider
                    label={isFrench ? 'Dette Publique (% du PIB)' : 'Public Debt (% of GDP)'}
                    value={form.publicDebt}
                    onChange={(v) => setF('publicDebt', v)}
                    min={10} max={180} step={1}
                    format={(v) => `${v}%`}
                  />
                  <Slider
                    label="Gini"
                    value={form.giniIndex}
                    onChange={(v) => setF('giniIndex', v)}
                    min={20} max={65} step={0.5}
                    format={formatGini}
                    hint={isFrench ? '0 = égalité totale, 1 = inégalité totale (réel: 0.20–0.63)' : '0 = equality, 1 = max inequality (real: 0.20–0.63)'}
                  />
                </div>
              </>
            )}

            {isHard ? (
              <div className="flex justify-center">
                <LimitedChoiceField
                  label={isFrench ? 'Ressource stratégique' : 'Strategic resource'}
                  items={RESOURCES_DATA.map((resource) => ({
                    label: (isFrench ? resource.labelFr : resource.labelEn).slice(0, 22),
                    value: resource.id,
                  }))}
                  currentVal={hardCurrentValue('resources', RESOURCES_DATA.find((resource) => resource.id === selectedResources[0])?.[isFrench ? 'labelFr' : 'labelEn'])}
                  onSelect={(value) => { spendTry('resources', value); setSelectedResources([value]) }}
                  triesLeft={hardTries.resources}
                />
              </div>
            ) : (
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2.5">
                {isFrench ? 'Ressources Stratégiques (3 max) :' : 'Strategic Resources (max 3):'}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {RESOURCES_DATA.map((r) => {
                  const sel = selectedResources.includes(r.id)
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        if (sel) setSelectedResources(selectedResources.filter(x => x !== r.id))
                        else if (selectedResources.length < 3) setSelectedResources([...selectedResources, r.id])
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        sel
                          ? 'border-amber-500 bg-amber-500/20 text-white shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {isFrench ? r.labelFr : r.labelEn}
                    </button>
                  )
                })}
              </div>
            </div>
            )}
          </div>
        )

      case 4: // Military
        return (
          <div className="space-y-6 flex flex-col items-center">
            <p className="text-sm text-slate-400 text-center max-w-md">
              {isFrench
                ? 'Définissez la puissance militaire (1 = Pacifiste, 10 = Hégémonie Mondiale).'
                : 'Define military power (1 = Pacifist, 10 = Global Hegemon).'}
            </p>

            {isHard ? (
              <>
                <p className="text-xs text-red-400 font-bold flex items-center gap-1">
                  ⚔️ {isFrench ? 'Deux tentatives pour ce choix' : 'Two attempts for this choice'}
                </p>
                <LimitedChoiceField
                  label={isFrench ? 'Puissance Militaire' : 'Military Power'}
                  items={[
                    { label: 'Pacifiste 1', value: 1 }, { label: 'Faible 2', value: 2 }, { label: 'Modeste 3', value: 3 },
                    { label: 'Mineur 4', value: 4 }, { label: 'Moyen 5', value: 5 }, { label: 'Solide 6', value: 6 },
                    { label: 'Fort 7', value: 7 }, { label: 'Majeur 8', value: 8 },
                    { label: 'Superpuiss. 9', value: 9 }, { label: 'Hégémon 10', value: 10 },
                  ]}
                  currentVal={form.militaryPower}
                  onSelect={(v) => spendTry('militaryPower', v)}
                  triesLeft={hardTries.militaryPower}
                />
              </>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 10 }, (_, index) => index + 1).map((strength) => (
                  <button
                    key={strength}
                    type="button"
                    onClick={() => setF('militaryPower', strength)}
                    className={`aspect-square border text-sm font-semibold transition-colors ${
                      form.militaryPower === strength
                        ? 'border-emerald-400 bg-emerald-900/50 text-emerald-100'
                        : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-500 hover:text-white'
                    }`}
                    aria-label={`${isFrench ? 'Puissance militaire' : 'Military power'} ${strength} sur 10`}
                  >
                    {strength}
                  </button>
                ))}
              </div>
            )}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center text-sm font-bold text-amber-400">
              {isFrench ? 'Puissance Choisie :' : 'Selected Power:'} {form.militaryPower} / 10
            </div>
          </div>
        )

      case 5: // Culture
        return (
          <div className="space-y-6">
            {isHard ? (
              <div className="grid justify-center gap-4 sm:grid-cols-2">
                <LimitedChoiceField
                  label={isFrench ? 'Langue' : 'Language'}
                  items={LANGUAGES_DATA.map((item) => ({
                    label: `${item.labelFr.split(' (')[0]}`,
                    value: item.value,
                  }))}
                  currentVal={hardCurrentValue('language', form.language)}
                  onSelect={(value) => spendTry('language', value)}
                  triesLeft={hardTries.language}
                />
                <LimitedChoiceField
                  label={isFrench ? 'Religion' : 'Religion'}
                  items={RELIGIONS_DATA.map((value) => ({ label: religionLabel(value, isFrench), value }))}
                  currentVal={hardCurrentValue('religion', form.religion)}
                  onSelect={(value) => spendTry('religion', value)}
                  triesLeft={hardTries.religion}
                />
              </div>
            ) : (
              <div>
                <p className="text-sm text-slate-400 mb-3">
                  {isFrench ? 'Famille Linguistique Dominante :' : 'Dominant Linguistic Family:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {LANGUAGES_DATA.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => setF('language', l.value)}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                        form.language === l.value
                          ? 'border-blue-500 bg-blue-600/20 text-white'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      {isFrench ? l.labelFr : l.labelEn}
                    </button>
                  ))}
                </div>
                <div className="mt-6">
                  <p className="text-sm text-slate-400 mb-3">{isFrench ? 'Religion ou tradition dominante :' : 'Dominant religion or tradition:'}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {RELIGIONS_DATA.map((religion) => (
                      <button
                        key={religion}
                        type="button"
                        onClick={() => setF('religion', religion)}
                        className={`p-2.5 border text-left text-xs transition-colors ${
                          form.religion === religion
                            ? 'border-blue-500 bg-blue-600/20 text-white'
                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                      >
                        {religionLabel(religion, isFrench)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      case 6: // Diplomacy
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-400 mb-3">
              {isFrench ? 'Posture diplomatique :' : 'Diplomatic posture:'}
            </p>
            {isHard ? (
              <div className="flex justify-center">
                <LimitedChoiceField
                  label={isFrench ? 'Doctrine étrangère' : 'Foreign doctrine'}
                  items={DIPLOMACY_DATA.map((item) => ({ label: (isFrench ? item.labelFr : item.labelEn).slice(0, 22), value: item.value }))}
                  currentVal={hardCurrentValue('diplomacyStyle', DIPLOMACY_DATA.find((item) => item.value === form.diplomacyStyle)?.[isFrench ? 'labelFr' : 'labelEn'])}
                  onSelect={(value) => spendTry('diplomacyStyle', value)}
                  triesLeft={hardTries.diplomacyStyle}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {DIPLOMACY_DATA.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setF('diplomacyStyle', d.value)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all ${
                      form.diplomacyStyle === d.value
                        ? 'border-blue-500 bg-blue-600/20 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-sm">{isFrench ? d.labelFr : d.labelEn}</div>
                    <p className="text-xs text-slate-400 mt-1">{isFrench ? d.descFr : d.descEn}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )

      case 7: // Identity
        if (isHard) return (
          <div className="grid justify-center gap-4 sm:grid-cols-2">
            <LimitedChoiceField
              label={isFrench ? 'Capitale' : 'Capital'}
              items={[...new Set(worldCountryList.map((item) => item.capital).filter(Boolean))].slice(0, 24).map((capital) => ({ label: capital.slice(0, 20), value: capital }))}
              currentVal={hardCurrentValue('capital', form.capital)}
              onSelect={(value) => spendTry('capital', value)}
              triesLeft={hardTries.capital}
            />
            <LimitedChoiceField
              label={isFrench ? 'Emblème' : 'Emblem'}
              items={['👑', '🦅', '🦁', '🌟', '⚜️', '🛡️', '⚡', '🌙', '⚓', '🏛️', '🐉', '🌹', '☀️', '🌊', '❄️', '🌿', '💎'].map((flag) => ({ label: flag, value: flag }))}
              currentVal={hardCurrentValue('flag', form.flag)}
              onSelect={(value) => spendTry('flag', value)}
              triesLeft={hardTries.flag}
            />
          </div>
        )
        return (
          <div className="space-y-6">
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {isFrench ? 'Ville capitale' : 'Capital city'}
              <input
                value={form.capital}
                onChange={(event) => setF('capital', event.target.value)}
                className="rounded border border-slate-700 bg-slate-950 px-4 py-3 text-sm normal-case tracking-normal text-white"
              />
            </label>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {isFrench ? 'Emblème national' : 'National emblem'}
              </p>
              <div className="flex flex-wrap gap-2">
                {['👑', '🦅', '🦁', '🌟', '⚜️', '🛡️', '⚡', '🌙', '⚓', '🏛️', '🐉', '🌹', '☀️', '🌊', '❄️', '🌿', '💎'].map((flag) => (
                  <button key={flag} type="button" onClick={() => setF('flag', flag)} aria-pressed={form.flag === flag} className={`border px-2.5 py-2 text-xl ${form.flag === flag ? 'border-amber-400 bg-amber-500/15' : 'border-slate-700 bg-slate-900'}`}>
                    {flag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      case 8: // Finalize
        if (isHard) {
          return (
            <div className="mx-auto w-full max-w-xl space-y-6 py-8">
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-red-300">
                  {isFrench ? 'Dernier choix' : 'Final choice'}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-white">
                  {isFrench ? 'Donnez un nom à votre pays' : 'Name your country'}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  {isFrench ? 'Les autres paramètres ont été définis aux étapes précédentes.' : 'Other parameters were set in the previous steps.'}
                </p>
              </div>
              <input
                type="text"
                autoComplete="off"
                value={form.name}
                onChange={(event) => setF('name', event.target.value)}
                placeholder={isFrench ? 'Nom du pays' : 'Country name'}
                aria-label={isFrench ? 'Nom du pays' : 'Country name'}
                className="w-full border-b-2 border-red-400 bg-transparent px-2 py-4 text-center text-xl text-white placeholder:text-slate-600 focus:outline-none"
              />
            </div>
          )
        }

        return (
          <div className="space-y-6">
            {/* AI Name Generator */}
            <div className="flex justify-end">
              <button
                onClick={handleGenerateName}
                disabled={generatingName}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Sparkles size={14} />
                <span>
                  {generatingName
                    ? (isFrench ? 'Génération...' : 'Generating...')
                    : (isFrench ? 'Générer un nom (IA)' : 'Generate a name (AI)')}
                </span>
              </button>
            </div>

            <div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  {isFrench ? 'Nom Officiel de la Nation' : 'Official Nation Name'}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setF('name', e.target.value)}
                  placeholder={isFictional ? (isFrench ? "ex: Royaume d'Eldoria" : 'e.g. Kingdom of Eldoria') : (isFrench ? "ex: République de Solaria" : 'e.g. Republic of Solaris')}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* ── Starting Geopolitical Situation (Presets + Custom Scenario Option) ── */}
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                {isFrench ? 'Situation Géopolitique Initiale :' : 'Starting Geopolitical Situation:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {BASE_SCENARIOS.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => {
                      setSelectedScenarioPreset(sc.id)
                      if (sc.id !== 'custom') {
                        setF('initialScenario', isFrench ? sc.labelFr : sc.labelEn)
                      }
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      selectedScenarioPreset === sc.id
                        ? 'border-amber-500 bg-amber-950/25 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xl">{sc.icon}</span>
                      <span className="font-bold text-sm text-white">{isFrench ? sc.labelFr : sc.labelEn}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-2">
                      {isFrench ? sc.descFr : sc.descEn}
                    </p>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      {isFrench ? sc.statModFr : sc.statModEn}
                    </span>
                  </button>
                ))}
              </div>

              {/* Custom Scenario Textarea if chosen */}
              {selectedScenarioPreset === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-2 mt-3"
                >
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase">
                    <Edit3 size={13} />
                    <span>{isFrench ? 'Rédigez votre scénario personnalisé :' : 'Write your custom scenario:'}</span>
                  </div>
                  <textarea
                    rows={3}
                    value={customScenarioText}
                    onChange={(e) => {
                      setCustomScenarioText(e.target.value)
                      setF('initialScenario', e.target.value)
                    }}
                    placeholder={
                      isFrench
                        ? "ex: Notre nation vient de subir un putsch militaire avorté. Nos frontières maritimes sont sous blocus de nos voisins mais nous venons de percer le secret de la fusion nucléaire..."
                        : "e.g. Our nation just repelled an attempted military coup. Our maritime borders are blockaded by neighbors, but we have just unlocked nuclear fusion secrets..."
                    }
                    className="w-full bg-slate-900/90 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    {isFrench
                      ? 'L\'IA intégrera fidèlement ce contexte historique dans les réunions du Conseil et les dépêches de presse.'
                      : 'The AI will faithfully weave this historical context into Cabinet sessions and global press dispatches.'}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Nation Summary */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  {isFrench ? 'Récapitulatif de votre Nation :' : 'Nation Summary:'}
                </p>
                <button
                  type="button"
                  onClick={() => setIsComparisonOpen(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <BarChart2 size={12} />
                  <span>{isFrench ? 'Comparer avec le monde' : 'Compare with world'}</span>
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {[
                  { label: isFrench ? 'Région / Cont.' : 'Region', val: form.continent },
                  { label: isFrench ? 'PIB/hab' : 'GDP/cap', val: `$${form.gdpPerCapita.toLocaleString()}` },
                  { label: isFrench ? 'Chômage' : 'Unemploy.', val: `${form.unemploymentRate}%` },
                  { label: 'Inflation', val: `${form.inflationRate}%` },
                  { label: 'Gini (0-1)', val: formatGini(form.giniIndex) },
                  { label: isFrench ? 'Dette' : 'Debt', val: `${form.publicDebt}%` },
                  { label: isFrench ? 'Militaire' : 'Military', val: `${form.militaryPower}/10` },
                  { label: 'Pop.', val: formatPop(form.population) },
                ].map(({ label, val }) => (
                  <div key={label} className="flex flex-col">
                    <span className="text-slate-500 text-[10px] uppercase tracking-wider">{label}</span>
                    <span className="text-white font-bold font-mono truncate">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // ─── Difficulty Mode Selector Screen ─────────────────────────────────────
  if (diffMode === 'choose') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b100e] p-4 overflow-y-auto">
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(171,193,164,0.12) 0.7px, transparent 0.7px)',
            backgroundSize: '24px 24px',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-3xl"
        >
          <button
            onClick={() => navigate('/mode-select')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white text-xs transition-colors mb-8"
          >
            <ChevronLeft size={13} />
            <span>{isFrench ? 'Retour au Choix du Monde' : 'Back to World Selection'}</span>
          </button>

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-emerald-800/60 bg-emerald-950/30 text-emerald-200 text-xs font-semibold mb-3">
              <span>{isFictional ? '🗺️ Monde Fictif' : '🌍 Monde Réel'}</span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-white leading-tight mb-3">
              {isFrench ? 'Difficulté & Paramètres' : 'Difficulty & Parameters'}
            </h1>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              {isFrench
                ? 'Choisissez votre point de départ.'
                : 'Choose your starting point.'}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            {/* AI Mode */}
            <motion.button
              whileHover={{ y: -2 }}
              onClick={() => { setDiffMode('ai'); handleAiGenerate() }}
              disabled={generatingAi}
              className="group text-left p-5 border border-emerald-800/70 bg-[#101a15] hover:border-emerald-500/60 transition-colors disabled:opacity-60"
            >
              <div className="text-3xl mb-4">🤖</div>
              <h2 className="font-display font-bold text-white text-lg tracking-wide mb-1">
                {isFrench ? 'Mode IA' : 'AI Mode'}
              </h2>
              <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wider mb-3">
                {isFrench ? 'Tout automatique' : 'Fully automatic'}
              </p>
              <p className="text-slate-400 text-xs leading-relaxed">
                {isFrench
                  ? "L'IA génère une nation cohérente et unique adaptée à ce monde. Vous arrivez directement à la finalisation pour la nommer."
                  : 'AI generates a unique coherent nation adapted to this world. You go straight to finalization to name it.'}
              </p>
              {generatingAi && (
                <div className="flex items-center gap-2 mt-3 text-emerald-300 text-xs">
                  <Sparkles size={12} className="animate-spin" />
                  {isFrench ? 'Génération en cours...' : 'Generating...'}
                </div>
              )}
            </motion.button>

            {/* Normal Mode */}
            <motion.button
              whileHover={{ y: -2 }}
              onClick={() => setDiffMode('normal')}
              className="group text-left p-5 border border-slate-700 bg-[#121715] hover:border-slate-400 transition-colors"
            >
              <div className="text-3xl mb-4">✏️</div>
              <h2 className="font-display font-bold text-white text-lg tracking-wide mb-1">
                {isFrench ? 'Mode Normal' : 'Normal Mode'}
              </h2>
              <p className="text-xs text-slate-300 font-semibold uppercase tracking-wider mb-3">
                {isFrench ? 'Choix libre guidé' : 'Guided free choice'}
              </p>
              <p className="text-slate-400 text-xs leading-relaxed">
                {isFrench
                  ? 'Chaque paramètre est défini librement avec des curseurs et des sélecteurs. Contrôle total de votre nation.'
                  : 'Every parameter set freely with sliders and selectors. Full control over your nation.'}
              </p>
            </motion.button>

            {/* Hard Mode */}
            <motion.button
              whileHover={{ y: -2 }}
              onClick={() => setDiffMode('hard')}
              className="group text-left p-5 border border-orange-900/70 bg-[#1b1511] hover:border-orange-500/60 transition-colors"
            >
              <div className="text-3xl mb-4">⚔️</div>
              <h2 className="font-display font-bold text-white text-lg tracking-wide mb-1">
                {isFrench ? 'Mode Difficile' : 'Hard Mode'}
              </h2>
              <p className="text-xs text-orange-200 font-semibold uppercase tracking-wider mb-3">
                {isFrench ? '2 tentatives par caractéristique' : '2 attempts per characteristic'}
              </p>
              <p className="text-slate-400 text-xs leading-relaxed">
                {isFrench
                  ? 'Chaque caractéristique offre deux tentatives de sélection. Les options restent visibles, sans tirage aléatoire.'
                  : 'Each characteristic allows two selections from visible options, with no random wheel.'}
              </p>
              <div className="flex flex-wrap gap-1 mt-3">
                {['PIB', 'Gini', 'Armée', 'Inflation', 'Dette', 'Pop.'].map(lbl => (
                  <span key={lbl} className="text-[10px] font-medium px-2 py-0.5 border border-orange-900/80 text-orange-200">{lbl}</span>
                ))}
              </div>
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ─── Normal / Hard Wizard ────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-[#0b100e] text-white">
      <header className="glass border-b border-slate-800/80 px-6 py-4 flex items-center justify-between flex-shrink-0 z-30 bg-slate-950/70">
        <div className="flex items-center gap-3">
          {!isHard && (
            <button
              onClick={() => setDiffMode('choose')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-600 glass text-slate-400 hover:text-white text-xs transition-colors"
            >
              <ChevronLeft size={14} />
              <span>{isFrench ? 'Difficulté' : 'Difficulty'}</span>
            </button>
          )}

          <span className="hidden sm:inline-flex text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300">
            {isFictional ? '🗺️ Monde Fictif' : '🌍 Monde Réel'}
          </span>
        </div>

        <h1 className="font-display text-base font-bold text-gradient-gold tracking-wide flex items-center gap-2">
          {isHard && (
            <span className="text-red-400 text-xs font-bold bg-red-950/50 border border-red-500/30 px-2 py-0.5 rounded-full">
              ⚔️ HARD
            </span>
          )}
          {t('create_title', language)}
        </h1>

        <div className="flex items-center gap-2">
          {/* Comparison Drawer Trigger Button */}
          {!isHard && (
            <>
              <button
                onClick={() => setIsComparisonOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
                title={isFrench ? 'Comparer avec les autres pays du monde' : 'Compare with other world nations'}
              >
                <BarChart2 size={13} className="text-blue-400" />
                <span className="hidden sm:inline">{isFrench ? 'Comparateur' : 'Compare'}</span>
              </button>

              <button
                onClick={handleRandomizeAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all"
              >
                <Shuffle size={13} />
                <span className="hidden sm:inline">{isFrench ? 'Aléatoire' : 'Randomize'}</span>
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-8">
        {/* Step Progress */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  i === step
                    ? isHard ? 'bg-red-600 text-white shadow-md' : 'bg-blue-600 text-white shadow-md'
                    : i < step
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'text-slate-600 cursor-default'
                }`}
              >
                <span>{s.icon}</span>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-3 h-px ${i < step ? 'bg-slate-600' : 'bg-slate-800'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>{STEPS[step].icon}</span>
                  <span>{STEPS[step].title}</span>
                  {isHard && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                      ⚔️ {isFrench ? 'Mode Difficile' : 'Hard Mode'}
                    </span>
                  )}
                </h2>

                {/* Quick compare link on every step */}
                {!isHard && <button
                  type="button"
                  onClick={() => setIsComparisonOpen(true)}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  <BarChart2 size={12} />
                  <span className="hidden sm:inline">{isFrench ? 'Comparer aux autres' : 'Compare'}</span>
                </button>}
              </div>

              <p className="text-slate-500 text-xs mb-6 font-mono">
                {isFrench ? `Étape ${step + 1} sur ${STEPS.length}` : `Step ${step + 1} of ${STEPS.length}`}
              </p>
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation Footer */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-800/80">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 border border-slate-800 rounded-xl text-xs text-slate-400 hover:text-white hover:border-slate-600 transition-all disabled:opacity-20"
          >
            <ChevronLeft size={15} />
            <span>{isFrench ? 'Retour' : 'Back'}</span>
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => {
                updateCountry({ ...form, resources: selectedResources, gdpNominal: calculatedNominalGdp })
                setStep((s) => s + 1)
              }}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-7 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg disabled:opacity-40 ${
                isHard ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500 glow-blue'
              }`}
            >
              <span>{isFrench ? 'Continuer' : 'Continue'}</span>
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-2xl text-xs font-bold text-white transition-all shadow-[0_0_25px_rgba(245,158,11,0.4)]"
            >
              <Sparkles size={14} />
              <span>{t('create_btn_finish', language)}</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Comparison Drawer */}
      <WorldComparisonDrawer
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        onJumpToStep={(targetStep) => {
          setStep(targetStep)
          setIsComparisonOpen(false)
        }}
        currentForm={{ ...form, resources: selectedResources }}
        worldCountries={worldCountryList}
        resourceOptions={RESOURCES_DATA}
        isFictional={isFictional}
        isFrench={isFrench}
      />
    </div>
  )
}
