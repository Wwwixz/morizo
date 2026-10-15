import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { ChevronDown, ChevronUp, Crosshair, Eye, EyeOff, Search } from 'lucide-react'
import { fetchRoute, type LatLng } from '../api/route'

export interface MapPoint {
  lat: number
  lng: number
  title?: string
}
/** Синяя точка «вы здесь» — отличается по форме от метки-пина чекпоинта */
function hereIcon(size = 26) {
  return L.divIcon({
    className: 'map-pin-wrap',
    html: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))">
      <circle cx="12" cy="12" r="11" fill="#2F6BFF" opacity="0.18"/>
      <circle cx="12" cy="12" r="7" fill="#2F6BFF" stroke="#FFFFFF" stroke-width="3"/>
    </svg>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
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

function ResizeOnExpand({ expanded }: { expanded: boolean }) {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 320)
    return () => clearTimeout(t)
  }, [expanded, map])
  return null
}

export function QuestMap({
  points,
  dark = false,
  visited = [],
  current,
  currentLabel,
  youIndex,
  youLabel,
  showRoute = true,
  className = 'map-tall',
  expandable = false,
  onSelect,
  children,
}: {
  points: MapPoint[]
  dark?: boolean
  visited?: number[]
  current?: number
  /** подпись у текущего чекпоинта (куда идти), например «Идите сюда» */
  currentLabel?: string
  /** индекс точки, где сейчас находится игрок */
  youIndex?: number
  /** подпись у точки игрока, например «Сейчас вы находитесь здесь» */
  youLabel?: string
  showRoute?: boolean
  className?: string
  expandable?: boolean
  onSelect?: (index: number) => void
  children?: ReactNode
}) {
  const center = useMemo<[number, number]>(() => [56.3269, 44.0059], [])
  const line = useMemo<LatLng[]>(() => points.map((p) => [p.lat, p.lng] as LatLng), [points])
  const [expanded, setExpanded] = useState(false)
  // Маршрут по дорогам; пока не загрузился — рисуем прямую линию
  const [route, setRoute] = useState<LatLng[] | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const coordKey = useMemo(() => line.map(([lat, lng]) => `${lat},${lng}`).join(';'), [line])

  useEffect(() => {
    if (!showRoute || line.length < 2) {
      setRoute(null)
      setRouteLoading(false)
      return
    }
    let alive = true
    setRoute(null)
    setRouteLoading(true)
    fetchRoute(line).then((r) => {
      if (!alive) return
      setRoute(r)
      setRouteLoading(false)
    })
    return () => {
      alive = false
    }
  }, [coordKey, showRoute])

  const routeLine = route ?? line
  // Пока строим маршрут, линию не показываем — прямая резала бы дома
  const hasLine = showRoute && points.length > 1 && (!routeLoading || Boolean(route))
  // Подписи у меток («Идите сюда», «Сейчас вы находитесь здесь») можно свернуть
  const [labelsHidden, setLabelsHidden] = useState(false)
  // Каждую подпись можно свернуть в «...» кликом по ней
  const [tipCollapsed, setTipCollapsed] = useState({ go: false, you: false })
  const toggleTip = (key: 'go' | 'you') => (e: MouseEvent) => {
    e.stopPropagation()
    setTipCollapsed((c) => ({ ...c, [key]: !c[key] }))
  }
  const hasLabels = Boolean((currentLabel && current !== undefined) || (youLabel && youIndex !== undefined))

  return (
    <div
      className={`map-card ${className}${expanded ? ' map-expanded' : ''}${children ? ' map-has-panel' : ''}`}
      style={dark ? { background: '#191b1f', borderColor: 'rgba(255,255,255,.1)' } : undefined}
    >
      <MapContainer
        center={center}
        zoom={13}
        zoomControl={false}
        className={dark ? 'map-skin-dark' : 'map-skin-light'}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          key={dark ? 'dark' : 'light'}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {hasLine && (
          <>
            {/* подложка — чтобы линия читалась на любом фоне карты */}
            <Polyline
              positions={routeLine}
              pathOptions={{
                color: dark ? '#0B0D12' : '#FFFFFF',
                weight: 9,
                opacity: 0.75,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
            <Polyline
              positions={routeLine}
              pathOptions={{
                color: '#2F6BFF',
                weight: 4.5,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </>
        )}
        {points.map((p, i) => {
          const isCurrent = current === i
          const isYou = youIndex === i
          const isVisited = visited.includes(i)
          // метки со подписями — статичные, без анимации
          const variant = isCurrent
            ? currentLabel
              ? 'yellow'
              : 'pulse'
            : isYou
              ? 'black'
              : isVisited || current === undefined
                ? 'yellow'
                : 'black'
          const size = isCurrent && currentLabel ? 40 : isYou ? 30 : 34
          const icon = isYou && !isCurrent ? hereIcon() : pinIcon(variant, size)
          return (
            <Marker
              key={i}
              position={[p.lat, p.lng]}
              icon={icon}
              title={p.title}
              eventHandlers={onSelect ? { click: () => onSelect(i) } : undefined}
            >
              {isCurrent && currentLabel && !labelsHidden && (
                <Tooltip permanent direction="top" offset={[0, -size - 6]} opacity={1} className="map-go-tip">
                  <span
                    className="map-tip-toggle"
                    title={tipCollapsed.go ? 'Развернуть подпись' : 'Свернуть подпись'}
                    onClick={toggleTip('go')}
                  >
                    {tipCollapsed.go ? '...' : currentLabel}
                  </span>
                </Tooltip>
              )}
              {isYou && youLabel && !labelsHidden && (
                <Tooltip permanent direction="bottom" offset={[0, isCurrent ? 6 : 18]} opacity={1} className="map-you-tip">
                  <span
                    className="map-tip-toggle"
                    title={tipCollapsed.you ? 'Развернуть подпись' : 'Свернуть подпись'}
                    onClick={toggleTip('you')}
                  >
                    {tipCollapsed.you ? '...' : youLabel}
                  </span>
                </Tooltip>
              )}
            </Marker>
          )
        })}
        <FitBounds points={points} />
        <ResizeOnExpand expanded={expanded} />
        <ZoomCtrls dark={dark} />
      </MapContainer>

      {hasLabels && (
        <button className="map-labels-tab" onClick={() => setLabelsHidden((v) => !v)}>
          {labelsHidden ? <Eye size={15} /> : <EyeOff size={15} />}
          {labelsHidden ? 'Показать подписи' : 'Скрыть подписи'}
        </button>
      )}

      {expandable && (
        <button className="map-expand-tab" onClick={() => setExpanded((v) => !v)}>
          {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          {expanded ? 'Свернуть карту' : 'Открыть карту на всю'}
        </button>
      )}

      {children}
    </div>
  )
}
