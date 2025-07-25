'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, X, MapPin, Building2, Home } from 'lucide-react'
import dynamic from 'next/dynamic'

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false })

// Fix for default markers in React Leaflet
let L: any = null
if (typeof window !== 'undefined') {
  import('leaflet').then((leafletModule) => {
    L = leafletModule.default;
  });
  
  // Add CSS for animation
  const style = document.createElement('style')
  style.textContent = `
    @keyframes pulse {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.2);
        opacity: 0.7;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
    .custom-div-icon {
      background: transparent !important;
      border: none !important;
    }
  `
  if (!document.querySelector('#map-icon-styles')) {
    style.id = 'map-icon-styles'
    document.head.appendChild(style)
  }
}

interface LocationMapMobileProps {
  showLocationMap: boolean
  setShowLocationMap: (show: boolean) => void
  currentLocation: { lat: number; lng: number } | null
  selectedShift: any
  pegawaiLokasi: any
  pegawaiData: any
  distance: number | null
  distanceToHome: number | null
}

export default function LocationMapMobile({
  showLocationMap,
  setShowLocationMap,
  currentLocation,
  selectedShift,
  pegawaiLokasi,
  pegawaiData,
  distance,
  distanceToHome
}: LocationMapMobileProps) {
  const [showDetails, setShowDetails] = useState(false)

  if (!showLocationMap) {
    return (
      <Button variant="outline" size="sm" className="text-xs hidden" onClick={() => setShowLocationMap(true)}>
        <Eye className="w-3 h-3 mr-1" />
        Lihat Peta
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">Lokasi Saat Ini</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedShift?.lockLokasi === 'HARUS_DI_KANTOR' ? 
                `Harus di kantor: ${pegawaiLokasi?.namaLokasi || ''}` : 
                'Fleksibel - dapat absen dari mana saja'
              }
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowLocationMap(false)}
            className="text-muted-foreground hover:text-foreground p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative" style={{ height: 'calc(100vh - 200px)' }}>
        {currentLocation ? (
          <MapContainer
            center={[currentLocation.lat, currentLocation.lng]}
            zoom={16}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Current location marker */}
            <Marker
              position={[currentLocation.lat, currentLocation.lng]}
              icon={L?.divIcon({
                html: `
                  <div style="
                    position: relative;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  ">
                    <div style="
                      font-size: 32px;
                      color: #3b82f6;
                      filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.8));
                      animation: pulse 2s infinite;
                    ">📍</div>
                  </div>
                `,
                className: 'custom-div-icon',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
              })}
            />

            {/* Office location marker and radius */}
            {selectedShift?.lockLokasi === 'HARUS_DI_KANTOR' && pegawaiLokasi && (
              <>
                <Circle
                  center={[pegawaiLokasi.latitude, pegawaiLokasi.longitude]}
                  radius={pegawaiLokasi.radius || 100}
                  pathOptions={{
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.15,
                    weight: 3,
                    dashArray: '8, 8'
                  }}
                />
                <Marker
                  position={[pegawaiLokasi.latitude, pegawaiLokasi.longitude]}
                  icon={L?.divIcon({
                    html: `
                      <div style="
                        position: relative;
                        width: 44px;
                        height: 44px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                      ">
                        <div style="
                          font-size: 36px;
                          color: #ef4444;
                          filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.8));
                        ">🏢</div>
                      </div>
                    `,
                    className: 'custom-div-icon',
                    iconSize: [44, 44],
                    iconAnchor: [22, 22]
                  })}
                />
              </>
            )}

            {/* Home location marker */}
            {selectedShift?.lockLokasi !== 'HARUS_DI_KANTOR' && pegawaiData?.latitude && pegawaiData?.longitude && (
              <Marker
                position={[pegawaiData.latitude, pegawaiData.longitude]}
                icon={L?.divIcon({
                  html: `
                    <div style="
                      position: relative;
                      width: 40px;
                      height: 40px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    ">
                      <div style="
                        font-size: 34px;
                        color: #22c55e;
                        filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.8));
                      ">🏠</div>
                    </div>
                  `,
                  className: 'custom-div-icon',
                  iconSize: [40, 40],
                  iconAnchor: [20, 20]
                })}
              />
            )}
          </MapContainer>
        ) : (
          <div className="flex items-center justify-center h-full bg-muted/20">
            <div className="text-center">
              <div className="text-4xl mb-4">📍</div>
              <div className="text-muted-foreground">Memuat lokasi...</div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Info Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border shadow-lg">
        {/* Toggle Details Button */}
        <div className="p-4 border-b border-border">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Sembunyikan Detail' : 'Lihat Detail'}
            <Eye className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {showDetails && (
          <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
            {/* Current Location Info */}
            <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">Lokasi Anda</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Lat: {currentLocation?.lat.toFixed(6)}</div>
                <div>Lng: {currentLocation?.lng.toFixed(6)}</div>
              </div>
            </div>

            {/* Office Info (if required) */}
            {selectedShift?.lockLokasi === 'HARUS_DI_KANTOR' && pegawaiLokasi && (
              <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Building2 className="w-4 h-4 text-destructive" />
                  <span className="font-medium text-foreground">{pegawaiLokasi.namaLokasi}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Radius Absensi:</span>
                    <Badge variant="outline" className="text-primary border-primary/30">
                      {pegawaiLokasi.radius || 100}m
                    </Badge>
                  </div>
                  {distance !== null && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Jarak Anda:</span>
                      <Badge 
                        variant={distance <= (pegawaiLokasi.radius || 100) ? "default" : "destructive"}
                        className="text-white"
                      >
                        {Math.round(distance)}m
                      </Badge>
                    </div>
                  )}
                  {distance !== null && (
                    <div className={`text-center p-2 rounded text-sm font-medium ${
                      distance <= (pegawaiLokasi.radius || 100)
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                    }`}>
                      {distance <= (pegawaiLokasi.radius || 100)
                        ? '✅ Dalam radius - dapat absen'
                        : '❌ Di luar radius - tidak dapat absen'
                      }
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Home Info (if flexible) */}
            {selectedShift?.lockLokasi !== 'HARUS_DI_KANTOR' && pegawaiData?.latitude && pegawaiData?.longitude && (
              <div className="bg-green-100/80 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Home className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-foreground">Rumah</span>
                </div>
                {distanceToHome !== null && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Jarak dari lokasi saat ini:</span>
                    <Badge variant="outline" className="text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                      {Math.round(distanceToHome)}m
                    </Badge>
                  </div>
                )}
                <div className="mt-2 text-center p-2 bg-green-100 dark:bg-green-900/30 rounded text-sm font-medium text-green-800 dark:text-green-200">
                  ✅ Absen fleksibel - dapat absen dari mana saja
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="pt-2 border-t border-border">
              <h5 className="font-medium text-foreground mb-2 text-sm">Legenda:</h5>
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
                  <span className="text-muted-foreground">Lokasi Anda Saat Ini</span>
                </div>
                {selectedShift?.lockLokasi === 'HARUS_DI_KANTOR' ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-destructive rounded-full flex items-center justify-center text-white text-xs">🏢</div>
                      <span className="text-muted-foreground">Kantor</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary border-dashed rounded-full bg-primary/20" />
                      <span className="text-muted-foreground">Radius Absensi</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">🏠</div>
                    <span className="text-muted-foreground">Rumah</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
