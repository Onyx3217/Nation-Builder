import { useState } from 'react'
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps'
import { MapPin, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

const REAL_MAP = '/world-countries.json'
const FICTIONAL_MAP = '/fictional-world.json'
const WIDTH = 640
const HEIGHT = 280
const SCALE = 82

function normalizeName(value = '') {
  return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
}

export default function NationPlacementMap({ coordinates, worldCountries, isFictional, isFrench, selectedCountryId, onChange, onCountrySelect }) {
  const geographyUrl = isFictional ? FICTIONAL_MAP : REAL_MAP
  const [mapPosition, setMapPosition] = useState({ coordinates: [0, 0], zoom: 1 })
  const changeZoom = (amount) => setMapPosition((position) => ({
    ...position,
    zoom: Math.max(1, Math.min(4, Number((position.zoom + amount).toFixed(1)))),
  }))
  const handleMapClick = (event, featureName = null) => {
    const svg = event.currentTarget.ownerSVGElement || event.currentTarget
    if (!svg) return
    const bounds = svg.getBoundingClientRect()
    const viewBox = svg.viewBox.baseVal
    const x = ((event.clientX - bounds.left) / bounds.width) * viewBox.width
    const y = ((event.clientY - bounds.top) / bounds.height) * viewBox.height
    const mapX = viewBox.width / 2 + (x - viewBox.width / 2) / mapPosition.zoom
    const mapY = viewBox.height / 2 + (y - viewBox.height / 2) / mapPosition.zoom
    const longitude = mapPosition.coordinates[0] + ((mapX - viewBox.width / 2) / SCALE) * (180 / Math.PI)
    const latitude = mapPosition.coordinates[1] + ((viewBox.height / 2 - mapY) / SCALE) * (180 / Math.PI)
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || Math.abs(longitude) > 180 || Math.abs(latitude) > 85) return

    const aliases = { unitedstatesofamerica: 'unitedstates', demrepcongo: 'democraticrepublicofthecongo', czechia: 'czechrepublic', macedonia: 'northmacedonia', eswatini: 'swaziland' }
    const mapName = aliases[normalizeName(featureName)] || normalizeName(featureName)
    const matchedCountry = !isFictional && featureName
      ? (worldCountries || []).find((country) => normalizeName(country.name) === mapName || normalizeName(country.name) === normalizeName(featureName.replace(/^Dem\. /, '')))
      : null

    const nextPlacement = {
      coordinates: matchedCountry?.coordinates || [Number(longitude.toFixed(2)), Number(latitude.toFixed(2))],
      occupiedCountryId: matchedCountry?.id || null,
      occupiedCountryName: matchedCountry?.name || (!isFictional ? featureName : null),
      continent: matchedCountry?.continent || null,
    }
    onChange(nextPlacement)
    if (matchedCountry) onCountrySelect?.(matchedCountry)
  }

  return (
    <section className="border border-slate-700 bg-[#101815] p-3 sm:p-4 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{isFrench ? 'Emplacement du pays' : 'Country location'}</h3>
          <p className="mt-1 text-[11px] text-slate-400">
            {isFrench ? 'Cliquez un pays pour le jouer, ou dans la mer pour créer un pays sur mesure.' : 'Click a country to play it, or the sea to create a custom nation.'}
          </p>
        </div>
        <MapPin size={16} className="shrink-0 text-emerald-300" />
      </div>

      <div className="relative overflow-hidden border-2 border-emerald-500/50 bg-[#020b12] shadow-[inset_0_0_32px_rgba(16,185,129,0.12)]">
        <div className="absolute right-2 top-2 z-10 flex gap-1 rounded-lg border border-slate-500/70 bg-slate-950/90 p-1 shadow-xl">
          <button type="button" onClick={() => changeZoom(0.5)} className="grid h-9 w-9 place-items-center rounded-md text-white hover:bg-emerald-600" aria-label={isFrench ? 'Agrandir la carte' : 'Zoom in'}><ZoomIn size={17} /></button>
          <button type="button" onClick={() => changeZoom(-0.5)} className="grid h-9 w-9 place-items-center rounded-md text-white hover:bg-emerald-600" aria-label={isFrench ? 'Réduire la carte' : 'Zoom out'}><ZoomOut size={17} /></button>
          <button type="button" onClick={() => setMapPosition({ coordinates: [0, 0], zoom: 1 })} className="grid h-9 w-9 place-items-center rounded-md text-white hover:bg-emerald-600" aria-label={isFrench ? 'Réinitialiser la carte' : 'Reset map'}><RotateCcw size={16} /></button>
        </div>
        <ComposableMap
          width={WIDTH}
          height={HEIGHT}
          projection="geoEquirectangular"
          projectionConfig={{ scale: SCALE, center: [0, 0] }}
          className="h-auto w-full touch-manipulation"
          onClick={(event) => handleMapClick(event)}
          role="img"
          aria-label={isFrench ? 'Carte interactive pour choisir un emplacement' : 'Interactive map to choose a location'}
        >
          <ZoomableGroup center={mapPosition.coordinates} zoom={mapPosition.zoom} minZoom={1} maxZoom={4} onMoveEnd={(position) => setMapPosition({ coordinates: position.coordinates, zoom: position.zoom })}>
          <Geographies geography={geographyUrl}>
            {({ geographies }) => {
              return (
                <g className="cursor-crosshair">
                  {geographies.map((geography) => (
                    <Geography
                      key={geography.rsmKey}
                      geography={geography}
                      onClick={(event) => {
                        event.stopPropagation()
                        handleMapClick(event, geography.properties?.name || null)
                      }}
                      style={{
                        default: { fill: selectedCountryId && selectedCountryId === (worldCountries || []).find((country) => normalizeName(country.name) === normalizeName(geography.properties?.name))?.id ? '#f59e0b' : (isFictional ? '#0f766e' : '#166534'), stroke: '#d1fae5', strokeWidth: 0.9, outline: 'none' },
                        hover: { fill: '#38bdf8', stroke: '#ffffff', strokeWidth: 1.35, outline: 'none' },
                        pressed: { fill: '#fbbf24', stroke: '#ffffff', strokeWidth: 1.5, outline: 'none' },
                      }}
                    />
                  ))}
                  <Marker coordinates={coordinates}>
                    <circle r={11} fill="rgba(251,191,36,0.28)" stroke="#fef3c7" strokeWidth={0.8} />
                    <circle r={4.5} fill="#f59e0b" stroke="#ffffff" strokeWidth={1.8} />
                  </Marker>
                </g>
              )
            }}
          </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>{isFrench ? 'Coordonnées' : 'Coordinates'}: {coordinates[1].toFixed(2)}°, {coordinates[0].toFixed(2)}°</span>
        <span>{isFrench ? `Zoom ${Math.round(mapPosition.zoom * 100)} % · molette ou pincement` : `Zoom ${Math.round(mapPosition.zoom * 100)}% · wheel or pinch`}</span>
      </div>
    </section>
  )
}
