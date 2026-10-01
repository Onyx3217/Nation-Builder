import { useState, useMemo, useEffect, useSyncExternalStore, memo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Sphere,
  Graticule,
  Marker,
} from 'react-simple-maps'
import { motion, AnimatePresence } from 'framer-motion'
import { ZoomIn, ZoomOut, RotateCcw, MessageSquare, Anchor, Navigation } from 'lucide-react'

const REAL_GEO_URL = '/world-countries.json'
const FICTIONAL_GEO_URL = '/fictional-world.json'
const MOBILE_MEDIA_QUERY = '(max-width: 639px)'

function subscribeToMobileLayout(onChange) {
  const media = window.matchMedia(MOBILE_MEDIA_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function getMobileLayout() {
  return typeof window !== 'undefined' && window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

// Dedicated oceanic sanctuary coordinates so custom player nations never overlap landmasses
const oceanPlayerSectors = {
  'Europe': [-24, 46],       // North Atlantic oceanic territory west of Bay of Biscay
  'Americas': [-48, 26],     // Mid-Atlantic oceanic territory east of Bermuda
  'Asia': [155, 26],         // Pacific oceanic zone east of Japan
  'Africa': [-10, -10],      // South Atlantic maritime sector west of Angola
  'Middle East': [64, 16],   // Central Arabian Sea oceanic zone
  'Oceania': [168, -18],     // Deep South Pacific maritime realm
}

// Canonical coordinates for world nations
const worldRegistryCoordinates = {
  'united_states': [-98, 38],
  'united_states_of_america': [-98, 38],
  'usa': [-98, 38],
  'france': [2.3, 46.5],
  'germany': [10.4, 51.1],
  'united_kingdom': [-3.4, 55.3],
  'uk': [-3.4, 55.3],
  'russia': [60.0, 58.0],
  'china': [104.1, 35.8],
  'japan': [138.2, 36.2],
  'india': [78.9, 21.0],
  'brazil': [-51.9, -14.2],
  'egypt': [30.8, 26.8],
  'south_africa': [25.0, -30.5],
  'australia': [133.7, -25.2],
  'canada': [-106.3, 56.1],
  'mexico': [-102.5, 23.6],
  'saudi_arabia': [45.0, 23.8],
  'turkey': [35.2, 38.9],
  'south_korea': [127.7, 35.9],
  'italy': [12.5, 41.8],
  'spain': [-3.7, 40.4],
  'nigeria': [8.6, 9.0],
  'argentina': [-63.6, -38.4],
  'indonesia': [113.9, -0.7],
  'iran': [53.6, 32.4],
  'poland': [19.1, 52.0],
  'sweden': [16.5, 62.0],
  'pakistan': [69.3, 30.3],
}

const continentCenters = {
  'Europe': [16, 50],
  'Asia': [88, 36],
  'Americas': [-72, 12],
  'Africa': [21, 6],
  'Middle East': [46, 26],
  'Oceania': [136, -24],
}

const fictionalRegionCenters = {
  'Aethelgard Plains': [-128, 48],
  'Nordic Reach': [-64, 58],
  'Solar Rim': [53, 35],
  'Equatorial Basin': [2, -4],
  'Oceanic Archipelagos': [145, -35],
  'Polar North': [-157, 71],
  'Golden Dunes': [91, -3],
  'Azure Sea': [-49, 31],
  'High Plateaus': [128, 50],
  'Volcanic Rift': [45, -43],
  'Cloud Highlands': [-103, 6],
  'Craggy Highlands': [153, 8],
}

const fictionalCountryCoordinates = {
  eldoria: [-128, 48],
  valoria: [-64, 58],
  solaria: [53, 35],
  neo_veridia: [2, -4],
  thalassia: [145, -35],
  hyperborea: [-157, 71],
  zandoria: [91, -3],
  arcadia: [-49, 31],
  astralis: [128, 50],
  ignis_prime: [45, -43],
  caelum: [-103, 6],
  drakonia: [153, 8],
}

const relationColorMap = {
  player: { fill: '#f59e0b', ring: '#fbbf24', text: 'text-amber-400', label: 'Homeland' },
  ally: { fill: '#10b981', ring: '#34d399', text: 'text-emerald-400', label: 'Ally' },
  friendly: { fill: '#059669', ring: '#10b981', text: 'text-emerald-300', label: 'Friendly' },
  neutral: { fill: '#64748b', ring: '#94a3b8', text: 'text-slate-300', label: 'Neutral' },
  tense: { fill: '#f97316', ring: '#fb923c', text: 'text-orange-400', label: 'Tense' },
  hostile: { fill: '#ef4444', ring: '#f87171', text: 'text-red-400', label: 'Hostile' },
  war: { fill: '#dc2626', ring: '#ef4444', text: 'text-red-500', label: 'At War' },
}

function normalizeCountryName(value = '') {
  const normalized = String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
  const aliases = {
    unitedstatesofamerica: 'unitedstates',
    demrepcongo: 'democraticrepublicofthecongo',
    czechia: 'czechrepublic',
    macedonia: 'northmacedonia',
    eswatini: 'swaziland',
  }
  return aliases[normalized] || normalized
}

function WorldMap({ worldCountries, relations, playerCountry, onSelectCountry, focusedCountry, worldMode = 'real', isFrench = true, isBackground = false, isPanelOpen = false }) {
  const isMobile = useSyncExternalStore(subscribeToMobileLayout, getMobileLayout, () => false)
  const [position, setPosition] = useState({ coordinates: [10, 20], zoom: 1 })
  const [hoveredCountry, setHoveredCountry] = useState(null)
  const isFictionalWorld = worldMode === 'fictional'
  const geographyUrl = isFictionalWorld ? FICTIONAL_GEO_URL : REAL_GEO_URL
  const getRelationLabel = (relation) => {
    const frenchLabels = { ally: 'allié', friendly: 'amical', neutral: 'neutre', tense: 'tendu', hostile: 'hostile', war: 'en guerre' }
    const englishLabels = { ally: 'Ally', friendly: 'Friendly', neutral: 'Neutral', tense: 'Tense', hostile: 'Hostile', war: 'At war' }
    return (isFrench ? frenchLabels : englishLabels)[relation] || relation
  }

  // Zoom controls
  const handleZoomIn = () => setPosition((pos) => ({ ...pos, zoom: Math.min(pos.zoom * 1.5, 8) }))
  const handleZoomOut = () => setPosition((pos) => ({ ...pos, zoom: Math.max(pos.zoom / 1.5, 1) }))
  const handleResetZoom = () => setPosition({ coordinates: [10, 20], zoom: 1 })

  // Sovereign oceanic placement for player country
  const playerCoordinates = useMemo(() => {
    if (Array.isArray(playerCountry?.coordinates) && playerCountry.coordinates.length === 2) {
      return playerCountry.coordinates
    }
    const cont = playerCountry?.continent || 'Europe'
    if (isFictionalWorld) {
      const center = fictionalRegionCenters[cont] || [0, 30]
      return [Math.max(-170, Math.min(170, center[0] + 8)), center[1] - 7]
    }
    return oceanPlayerSectors[cont] || [-28, 32]
  }, [playerCountry, isFictionalWorld])

  // Deterministic indexing of world nations
  const indexedWorldCountries = useMemo(() => {
    const modeCountries = (worldCountries || []).filter((country) =>
      isFictionalWorld ? country.isReal !== true : country.isReal !== false
    )

    return modeCountries.map((c, index) => {
      const cleanKey = (c.id || c.name).toLowerCase().replace(/[^a-z0-9]/g, '_')
      let coords = isFictionalWorld
        ? fictionalCountryCoordinates[cleanKey] || fictionalRegionCenters[c.continent]
        : worldRegistryCoordinates[cleanKey] || c.coordinates

      if (!coords) {
        const continent = c.continent || 'Europe'
        const centers = isFictionalWorld ? fictionalRegionCenters : continentCenters
        const base = centers[continent] || [20, 30]
        const angle = (index * 137.5 * Math.PI) / 180
        const radius = 7 + (index % 4) * 4
        coords = [
          Math.max(-160, Math.min(160, base[0] + Math.cos(angle) * radius * 1.2)),
          Math.max(-55, Math.min(70, base[1] + Math.sin(angle) * radius * 0.8)),
        ]
      }

      return {
        ...c,
        indexedKey: cleanKey,
        coordinates: coords,
      }
    })
  }, [worldCountries, isFictionalWorld])

  // Center on focused country if passed as prop
  useEffect(() => {
    if (focusedCountry?.coordinates) {
      setPosition({ coordinates: focusedCountry.coordinates, zoom: 2.5 })
    }
  }, [focusedCountry])

  const countryByMapName = useMemo(() => new Map(indexedWorldCountries.map((country) => [normalizeCountryName(country.name), country])), [indexedWorldCountries])

  return (
    <div className={isBackground
      ? 'fixed inset-0 z-0 overflow-hidden bg-[#071522]'
      : 'relative flex w-full flex-col overflow-hidden rounded-3xl border border-slate-700/80 bg-[#030611] shadow-2xl'}>
      {/* Top Map Control Bar */}
      <div className={isBackground
        ? 'absolute right-2 top-36 z-30 flex items-center justify-between gap-2 border border-slate-500/80 bg-slate-950/90 px-2 py-2 shadow-xl sm:right-4 sm:top-24 sm:gap-3 sm:px-4 sm:py-3'
        : 'z-30 flex items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/80 px-4 py-3'}>
        <div className="flex items-center gap-2">
          <Navigation size={15} className={`${isFictionalWorld ? 'text-amber-300' : 'text-sky-300'}`} />
          <span className={`${isBackground ? 'hidden sm:inline' : ''} text-xs font-bold text-white uppercase`}>
            {isFictionalWorld
              ? (isFrench ? 'Carte des royaumes connus' : 'Map of Known Realms')
              : (isFrench ? 'Carte géopolitique mondiale' : 'World Political Map')}
          </span>
          <span className={`${isBackground ? 'hidden lg:inline' : 'hidden sm:inline'} text-[10px] text-slate-300`}>
            ({indexedWorldCountries.length} {isFrench ? 'nations' : 'nations'})
          </span>
        </div>

        {/* Tactical Zoom & Reset Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomIn}
            className="grid h-10 w-10 place-items-center border border-slate-500 bg-slate-900 text-white transition-colors hover:bg-blue-600 active:scale-95 sm:h-9 sm:w-9"
            title={isFrench ? 'Agrandir' : 'Zoom in'}
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="grid h-10 w-10 place-items-center border border-slate-500 bg-slate-900 text-white transition-colors hover:bg-blue-600 active:scale-95 sm:h-9 sm:w-9"
            title={isFrench ? 'Réduire' : 'Zoom out'}
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="grid h-10 w-10 place-items-center border border-slate-500 bg-slate-900 text-slate-200 transition-colors hover:bg-slate-700 hover:text-white active:scale-95 sm:h-9 sm:w-9"
            title={isFrench ? 'Recentrer la carte' : 'Center map'}
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Interactive Canvas */}
      <div className={isBackground ? 'absolute inset-0 h-full w-full' : 'relative h-[58dvh] min-h-[420px] w-full lg:h-[calc(100dvh-13rem)] lg:min-h-[560px]'}>
        {/* Floating Dossier on Hover / Selected */}
        <AnimatePresence>
          {hoveredCountry && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-4 right-3 z-40 min-w-[240px] max-w-[calc(100%-1.5rem)] space-y-2.5 border border-sky-300/70 bg-slate-950/95 p-4 shadow-2xl sm:right-4 sm:min-w-[260px]"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="text-3xl">{hoveredCountry.flag || '🌐'}</span>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">{hoveredCountry.name}</h4>
                    <p className="text-[10px] text-slate-400">{hoveredCountry.capital}</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    hoveredCountry.isPlayer
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : (relationColorMap[relations[hoveredCountry.id]] || relationColorMap.neutral).text
                  }`}
                >
                  {hoveredCountry.isPlayer
                    ? (isFrench ? 'Votre pays' : 'Your country')
                    : getRelationLabel(relations[hoveredCountry.id] || 'neutral')}
                </span>
              </div>

              {hoveredCountry.isPlayer ? (
                <div className="space-y-1">
                  <p className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                    <Anchor size={12} />
                    {playerCountry.territorialDisputeWith
                      ? (isFrench ? 'Territoire contesté' : 'Contested territory')
                      : (isFictionalWorld
                        ? (isFrench ? 'Votre nation' : 'Your realm')
                        : (isFrench ? 'Territoire maritime' : 'Maritime territory'))}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {playerCountry.territorialDisputeWith
                      ? (isFrench
                        ? `Revendication contestée avec ${playerCountry.territorialDisputeWith}.`
                        : `Territorial claim disputed by ${playerCountry.territorialDisputeWith}.`)
                      : (isFrench ? 'Centre de votre territoire.' : 'Center of your territory.')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
                    <p>{isFrench ? 'Régime' : 'Government'}: <span className="text-slate-400">{hoveredCountry.regime}</span></p>
                    <p>{isFrench ? 'Armée' : 'Military'}: <span className="text-slate-400">{hoveredCountry.militaryPower}/10</span></p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectCountry(hoveredCountry)}
                    className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 glow-blue transition-all shadow-lg cursor-pointer"
                  >
                    <MessageSquare size={13} /> {isFrench ? 'Ouvrir le dialogue' : 'Open dialogue'}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Geopolitical Legend */}
        {!isPanelOpen && <div className={`absolute ${isBackground ? 'bottom-16 md:bottom-4' : 'bottom-4'} left-2 z-20 flex max-w-[calc(100%-1rem)] flex-wrap items-center gap-x-3 gap-y-1 border border-slate-500/80 bg-slate-950/90 px-2.5 py-2 text-[10px] sm:left-4 sm:gap-3 sm:px-3.5 sm:text-[11px]`}>
          <span className="flex items-center gap-1 text-amber-400 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            {isFictionalWorld ? (isFrench ? 'Votre nation' : 'Your realm') : (isFrench ? 'Votre pays' : 'Your country')}
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> {isFrench ? 'Alliés' : 'Allies'}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-500" /> {isFrench ? 'Neutres' : 'Neutral'}
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" /> {isFrench ? 'Hostiles' : 'Hostile'}
          </span>
        </div>}

        {/* SVG World Map */}
        <ComposableMap
          preserveAspectRatio="xMidYMid meet"
          projectionConfig={{
            rotate: [-10, 0, 0],
            scale: isBackground ? (isMobile ? 180 : 130) : 145,
          }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            minZoom={1}
            maxZoom={8}
            translateExtent={[[0, 0], [800, 600]]}
            onMoveEnd={(pos) => setPosition(pos)}
          >
            <Sphere stroke="rgba(59, 130, 246, 0.12)" strokeWidth={1} fill="transparent" />
            <Graticule stroke="rgba(255, 255, 255, 0.03)" strokeWidth={0.5} />

            {/* Earth Continents Geometry */}
            <Geographies geography={geographyUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const mapCountry = countryByMapName.get(normalizeCountryName(geo.properties?.name))
                  const relation = mapCountry?.id === playerCountry?.id || normalizeCountryName(mapCountry?.name) === normalizeCountryName(playerCountry?.name)
                    ? 'player'
                    : (mapCountry ? (relations[mapCountry.id] || 'neutral') : 'neutral')
                  const colors = relationColorMap[relation] || relationColorMap.neutral
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => mapCountry && setHoveredCountry(mapCountry)}
                      onMouseLeave={() => setHoveredCountry(null)}
                      onClick={() => mapCountry && onSelectCountry(mapCountry)}
                      fill={hoveredCountry?.id === mapCountry?.id && mapCountry
                        ? '#fbbf24'
                        : mapCountry ? colors.fill : (isFictionalWorld ? '#176273' : '#345267')}
                      fillOpacity={hoveredCountry?.id === mapCountry?.id && mapCountry ? 1 : mapCountry ? 0.94 : 0.88}
                      stroke={hoveredCountry?.id === mapCountry?.id && mapCountry
                        ? '#ffffff'
                        : mapCountry ? 'rgba(255,255,255,0.96)' : 'rgba(220,237,250,0.82)'}
                      strokeWidth={hoveredCountry?.id === mapCountry?.id && mapCountry ? 1.6 : mapCountry ? 1.35 : 1.05}
                      style={{ outline: 'none' }}
                    />
                  )
                })
              }
            </Geographies>

            {/* Sovereign Ocean Territory for Player's Nation */}
            {playerCountry?.name && (
              <Marker coordinates={playerCoordinates}>
                <g
                  className="cursor-pointer"
                  onClick={() => setHoveredCountry({ ...playerCountry, isPlayer: true })}
                >
                  <circle r={12} fill="transparent" />
                  <circle r={3.5} fill="#f59e0b" stroke="#ffffff" strokeWidth={1} />
                  <text
                    textAnchor="middle"
                    y={-8}
                    className="font-bold fill-amber-300 text-[10px] filter drop-shadow-[0_0_6px_#f59e0b]"
                  >
                    👑 {playerCountry.name}
                  </text>
                </g>
              </Marker>
            )}

            {/* World Nations Interactive Tactical Pins (100 nations - tiny sleek radar dots) */}
            {indexedWorldCountries.map((c) => {
              const relKey = relations[c.id] || 'neutral'
              const colorConfig = relationColorMap[relKey] || relationColorMap.neutral
              const isHovered = hoveredCountry?.id === c.id
              const isFocused = focusedCountry?.id === c.id

              return (
                <Marker key={c.id} coordinates={c.coordinates}>
                  <g
                    className="cursor-pointer group"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectCountry(c)
                    }}
                    onMouseEnter={() => setHoveredCountry(c)}
                  >
                    {/* Tight, non-overlapping clickable hitbox */}
                    <circle r={Math.max(isMobile ? 5 : 4, 6 / Math.sqrt(position.zoom))} fill="transparent" />

                    {/* Targeting beacon only if searched or focused */}
                    {isFocused && (
                      <>
                        <circle r={14} fill="none" stroke="#60a5fa" strokeWidth={1.5} className="animate-ping" />
                        <circle r={8} fill="none" stroke="#3b82f6" strokeWidth={1} />
                      </>
                    )}

                    {/* Tiny subtle radar dot */}
                    <circle
                      r={isFocused ? 5 : isHovered ? 4 : isMobile ? 2.5 : position.zoom >= 2.5 ? 2.8 : 2.2}
                      fill={colorConfig.fill}
                      stroke={isFocused || isHovered ? '#ffffff' : 'rgba(255,255,255,0.95)'}
                      strokeWidth={isFocused || isHovered ? 1.5 : 1}
                      className="transition-all"
                    />

                    {/* Country label ONLY displayed when hovered or focused */}
                    {(isHovered || isFocused) && (
                      <text
                        textAnchor="middle"
                        y={-8}
                        className="text-[10px] font-bold fill-white pointer-events-none filter drop-shadow-[0_1px_4px_rgba(0,0,0,1)] bg-slate-900"
                      >
                        {c.flag} {c.name}
                      </text>
                    )}
                  </g>
                </Marker>
              )
            })}
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Bottom Interactive Quick-Access Nation Radar Strip */}
      {!isBackground && <div className="flex items-center gap-2 overflow-x-auto border-t border-slate-800/80 bg-slate-950/90 p-3">
        <span className="text-[10px] uppercase font-bold text-slate-500 whitespace-nowrap px-1">
          {isFrench ? 'Nations :' : 'Nations:'}
        </span>
        {indexedWorldCountries.map((c) => {
          const relKey = relations[c.id] || 'neutral'
          const colorConfig = relationColorMap[relKey] || relationColorMap.neutral
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCountry(c)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-white whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer"
            >
              <span>{c.flag}</span>
              <span className="font-semibold">{c.name}</span>
              <span className={`w-2 h-2 rounded-full ${colorConfig.fill}`} />
            </button>
          )
        })}
      </div>}
    </div>
  )
}

export default memo(WorldMap)
