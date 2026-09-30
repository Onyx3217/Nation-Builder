import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps'
import { MapPin } from 'lucide-react'

const REAL_MAP = '/world-countries.json'
const FICTIONAL_MAP = '/fictional-world.json'
const WIDTH = 640
const HEIGHT = 280
const SCALE = 82

function normalizeName(value = '') {
  return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
}

export default function NationPlacementMap({ coordinates, worldCountries, isFictional, isFrench, onChange }) {
  const geographyUrl = isFictional ? FICTIONAL_MAP : REAL_MAP
  const handleMapClick = (event, featureName = null) => {
    const svg = event.currentTarget.ownerSVGElement || event.currentTarget
    if (!svg) return
    const bounds = svg.getBoundingClientRect()
    const viewBox = svg.viewBox.baseVal
    const x = ((event.clientX - bounds.left) / bounds.width) * viewBox.width
    const y = ((event.clientY - bounds.top) / bounds.height) * viewBox.height
    const longitude = ((x - viewBox.width / 2) / SCALE) * (180 / Math.PI)
    const latitude = ((viewBox.height / 2 - y) / SCALE) * (180 / Math.PI)
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || Math.abs(longitude) > 180 || Math.abs(latitude) > 85) return

    const matchedCountry = !isFictional && featureName
      ? (worldCountries || []).find((country) =>
          normalizeName(country.name) === normalizeName(featureName)
          || normalizeName(country.name) === normalizeName(featureName.replace(/^Dem\. /, ''))
        )
      : null

    onChange({
      coordinates: [Number(longitude.toFixed(2)), Number(latitude.toFixed(2))],
      occupiedCountryId: matchedCountry?.id || null,
      occupiedCountryName: matchedCountry?.name || (!isFictional ? featureName : null),
      continent: matchedCountry?.continent || null,
    })
  }

  return (
    <section className="border border-slate-700 bg-[#101815] p-3 sm:p-4 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{isFrench ? 'Emplacement du pays' : 'Country location'}</h3>
          <p className="mt-1 text-[11px] text-slate-400">
            {isFrench ? 'Cliquez sur la carte pour placer le repère.' : 'Click the map to place the pin.'}
          </p>
        </div>
        <MapPin size={16} className="shrink-0 text-emerald-300" />
      </div>

      <div className="overflow-hidden border border-slate-800 bg-[#0a100e]">
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
                        default: { fill: isFictional ? '#263a36' : '#17251e', stroke: '#53655a', strokeWidth: 0.55, outline: 'none' },
                        hover: { fill: isFictional ? '#3a594b' : '#294335', stroke: '#a9c3a5', strokeWidth: 0.85, outline: 'none' },
                        pressed: { fill: '#42664f', outline: 'none' },
                      }}
                    />
                  ))}
                  <Marker coordinates={coordinates}>
                    <circle r={9} fill="rgba(248,113,113,0.18)" />
                    <circle r={3.5} fill="#f0b76a" stroke="#fff3d8" strokeWidth={1.2} />
                  </Marker>
                </g>
              )
            }}
          </Geographies>
        </ComposableMap>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>{isFrench ? 'Coordonnées' : 'Coordinates'}: {coordinates[1].toFixed(2)}°, {coordinates[0].toFixed(2)}°</span>
        <span>{isFrench ? 'Pin ambre · territoire occupé signalé' : 'Amber pin · occupied territory is flagged'}</span>
      </div>
    </section>
  )
}