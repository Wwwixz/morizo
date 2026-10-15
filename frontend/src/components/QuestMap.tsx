import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Crosshair, Minus, Plus, Search } from 'lucide-react'

export interface MapPoint {
  lat: number
  lng: number
  title: string
}

function pinIcon(variant: 'yellow' | 'black' | 'pulse', size = 34) {
  const fill = variant === 'yellow' ? '#FFC107' : '#0F0F0F'
  const stroke = variant === 'black' ? '#FFFFFF' : '#0F0F0F'
  const dot = variant === 'yellow' ? '#0F0F0F' : '#FFFFFF'
  const pulse = variant === 'pulse' ? ' pin-pulse' : ''
  return L.divIcon({
    className: `map-pin-wrap${pulse}`,
    html: `<svg width="${size}" height="${size}" viewBox="0 0 48 48" fill="none" style="filter:drop-shadow(0 3px 4px rgba(0,0,0,.35))">
      <path d="M24 3C15.7 3 9 9.7 9 18c0 4.9 2.3 8.6 5 11.9L24 45l10-15.1c2.7-3.3 5-7 5-11.9C39 9.7 32.3 3 24 3z" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
      <circle cx="24" cy="18" r="6" fill="${dot}"/>
    </svg>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  })
}

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15)
      return
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]))
    map.fitBounds(bounds, { padding: [48, 48] })
  }, [points, map])
  return null
}

function ZoomCtrls({ dark }: { dark?: boolean }) {
  const map = useMap()
  const zoom = (d: number) => (d > 0 ? map.zoomIn() : map.zoomOut())
  const locate = () =>
    map.locate({ setView: true, maxZoom: 15 }).on('locationerror', () => map.setView([56.3269, 44.0059], 13))
  const reset = () => map.setView([56.3269, 44.0059], 13)
  return (
    <>
      <div className="map-ctrl-col">
        <button className="map-ctrl" title="Поиск по карте" onClick={reset}>
          <Search size={17} />
        </button>
        <button className="map-ctrl" title="Моё местоположение" onClick={locate}>
          <Crosshair size={17} />
        </button>
      </div>
      <div className="map-zoom">
        <button onClick={() => zoom(1)}>+</button>
        <button onClick={() => zoom(-1)} style={{ color: dark ? '#fff' : undefined }}>
          −
        </button>
      </div>
    </>
  )
}

export function QuestMap({
  points,
  dark = false,
  visited = [],
  current,
  showRoute = true,
  className = 'map-tall',
}: {
  points: MapPoint[]
  dark?: boolean
  visited?: number[]
  current?: number
  showRoute?: boolean
  className?: string
}) {
  const center = useMemo<[number, number]>(() => [56.3269, 44.0059], [])
  const line = points.map((p) => [p.lat, p.lng] as [number, number])

  return (
    <div className={`map-card ${className}`} style={dark ? { background: '#191b1f', borderColor: 'rgba(255,255,255,.1)' } : undefined}>
      <MapContainer center={center} zoom={13} zoomControl={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          key={dark ? 'dark' : 'light'}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url={
            dark
              ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
          }
        />
        {showRoute && points.length > 1 && (
          <Polyline
            positions={line}
            pathOptions={{
              color: '#FFC107',
              weight: 3,
              dashArray: '2 10',
              lineCap: 'round',
              opacity: 0.95,
            }}
          />
        )}
        {points.map((p, i) => {
          const isCurrent = current === i
          const isVisited = visited.includes(i)
          const variant = isCurrent ? 'pulse' : isVisited || current === undefined ? 'yellow' : 'black'
          return <Marker key={i} position={[p.lat, p.lng]} icon={pinIcon(variant)} title={p.title} />
        })}
        <FitBounds points={points} />
        <ZoomCtrls dark={dark} />
      </MapContainer>
    </div>
  )
}
