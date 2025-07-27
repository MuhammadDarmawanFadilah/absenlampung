'use client'

import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye } from 'lucide-react'
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
  if (!document.querySelector('#map-icon-styles-desktop')) {
    style.id = 'map-icon-styles-desktop'
    document.head.appendChild(style)
  }
}

interface LocationMapDesktopProps {
  showLocationMap: boolean
  setShowLocationMap: (show: boolean) => void
  currentLocation: { lat: number; lng: number } | null
  selectedShift: any
  pegawaiLokasi: any
  pegawaiData: any
  distance: number | null
  distanceToHome: number | null
}

export default function LocationMapDesktop({
  showLocationMap,
  setShowLocationMap,
  currentLocation,
  selectedShift,
  pegawaiLokasi,
  pegawaiData,
  distance,
  distanceToHome
}: LocationMapDesktopProps) {
  return (
    <Dialog open={showLocationMap} onOpenChange={setShowLocationMap}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          <Eye className="w-3 h-3 mr-1" />
          Lihat Lokasi
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="p-0 overflow-hidden bg-background border-0 shadow-2xl"
        style={{ 
          width: '98vw', 
          maxWidth: '98vw', 
          height: '95vh', 
          maxHeight: '95vh',
          minWidth: '98vw'
        }}
      >
        <DialogTitle style={{ 
          position: 'absolute', 
          left: '-10000px', 
          top: 'auto', 
          width: '1px', 
          height: '1px', 
          overflow: 'hidden' 
        }}>
          Lokasi Saat Ini
        </DialogTitle>
        <div className="relative w-full h-full flex flex-col bg-background" style={{ width: '100%', height: '100%' }}>
          {/* Header */}
          <div className="flex-shrink-0 bg-background border-b border-border p-4 z-20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-foreground">Lokasi Saat Ini</h3>
                <p className="text-sm text-muted-foreground mt-1">
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
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </div>
          </div>

          {/* Map Container */}
          <div className="flex-1 relative">
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
                        width: 36px;
                        height: 36px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                      ">
                        <div style="
                          font-size: 28px;
                          color: #3b82f6;
                          filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.7));
                          animation: pulse 2s infinite;
                        ">📍</div>
                      </div>
                    `,
                    className: 'custom-div-icon',
                    iconSize: [36, 36],
                    iconAnchor: [18, 18]
                  })}
                >
                  <Popup>
                    <div className="p-3 min-w-[250px] bg-background border border-border rounded-lg">
                      <h4 className="font-semibold text-primary text-lg mb-2">
                        📍 Lokasi Anda
                      </h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="grid grid-cols-2 gap-2 text-xs bg-muted p-2 rounded">
                          <div>Lat: {currentLocation.lat.toFixed(6)}</div>
                          <div>Lng: {currentLocation.lng.toFixed(6)}</div>
                        </div>
                        {selectedShift?.lockLokasi === 'HARUS_DI_KANTOR' && distance !== null && (
                          <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-foreground">Jarak ke kantor:</span>
                              <span className="font-bold text-foreground">{Math.round(distance)}m</span>
                            </div>
                            <div className={`text-center mt-2 p-2 rounded-lg ${
                              distance <= (pegawaiLokasi?.radius || 100) 
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                                : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                            }`}>
                              {distance <= (pegawaiLokasi?.radius || 100) ? '✅ Dalam radius' : '❌ Di luar radius'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>

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
                        weight: 2,
                        dashArray: '5, 5'
                      }}
                    />
                    <Marker
                      position={[pegawaiLokasi.latitude, pegawaiLokasi.longitude]}
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
                              color: #ef4444;
                              filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.7));
                            ">🏢</div>
                          </div>
                        `,
                        className: 'custom-div-icon',
                        iconSize: [40, 40],
                        iconAnchor: [20, 20]
                      })}
                    >
                      <Popup>
                        <div className="p-4 min-w-[280px] bg-background border border-border rounded-lg">
                          <h4 className="font-semibold text-destructive text-lg mb-3">
                            🏢 {pegawaiLokasi.namaLokasi}
                          </h4>
                          <div className="space-y-3">
                            <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
                              <div className="text-sm font-medium text-primary mb-1">Radius Absensi</div>
                              <div className="text-2xl font-bold text-primary">{pegawaiLokasi.radius || 100}m</div>
                            </div>
                            {distance !== null && (
                              <div className={`p-3 rounded-lg border ${
                                distance <= (pegawaiLokasi.radius || 100) 
                                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              }`}>
                                <div className={`text-sm font-medium mb-1 ${
                                  distance <= (pegawaiLokasi.radius || 100) 
                                    ? 'text-green-900 dark:text-green-100' 
                                    : 'text-red-900 dark:text-red-100'
                                }`}>
                                  Jarak Anda
                                </div>
                                <div className={`text-2xl font-bold ${
                                  distance <= (pegawaiLokasi.radius || 100) 
                                    ? 'text-green-700 dark:text-green-400' 
                                    : 'text-red-700 dark:text-red-400'
                                }`}>
                                  {Math.round(distance)}m
                                </div>
                                <div className={`text-xs mt-2 ${
                                  distance <= (pegawaiLokasi.radius || 100) 
                                    ? 'text-green-600 dark:text-green-400' 
                                    : 'text-red-600 dark:text-red-400'
                                }`}>
                                  {distance <= (pegawaiLokasi.radius || 100) 
                                    ? '✅ Dalam radius - dapat absen' 
                                    : '❌ Di luar radius - tidak dapat absen'
                                  }
                                </div>
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground pt-2 border-t border-border grid grid-cols-2 gap-2 bg-muted p-2 rounded">
                              <div>Lat: {pegawaiLokasi.latitude}</div>
                              <div>Lng: {pegawaiLokasi.longitude}</div>
                            </div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
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
                          width: 36px;
                          height: 36px;
                          display: flex;
                          align-items: center;
                          justify-content: center;
                        ">
                          <div style="
                            font-size: 30px;
                            color: #22c55e;
                            filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.7));
                          ">🏠</div>
                        </div>
                      `,
                      className: 'custom-div-icon',
                      iconSize: [36, 36],
                      iconAnchor: [18, 18]
                    })}
                  >
                    <Popup>
                      <div className="p-3 min-w-[220px] bg-background border border-border rounded-lg">
                        <h4 className="font-semibold text-green-600 dark:text-green-400 text-lg mb-2">
                          🏠 Rumah
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-2">
                          {distanceToHome !== null && (
                            <div className="flex justify-between bg-muted p-2 rounded">
                              <span>Jarak dari lokasi saat ini:</span>
                              <span className="font-bold text-foreground">{Math.round(distanceToHome)}m</span>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground pt-2 border-t border-border grid grid-cols-2 gap-2 bg-muted p-2 rounded">
                            <div>Lat: {pegawaiData.latitude}</div>
                            <div>Lng: {pegawaiData.longitude}</div>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
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

          {/* Bottom Legend */}
          <div className="flex-shrink-0 bg-background border-t border-border p-4">
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Legenda Peta</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-primary rounded-full shadow-sm animate-pulse" />
                  <span className="font-medium text-foreground">Lokasi Anda</span>
                </div>
                
                {selectedShift?.lockLokasi === 'HARUS_DI_KANTOR' ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-destructive rounded-full shadow-sm flex items-center justify-center text-white text-sm">🏢</div>
                      <span className="font-medium text-foreground">Kantor ({pegawaiLokasi?.namaLokasi})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-primary border-dashed rounded-full bg-primary/20" />
                      <span className="font-medium text-foreground">Radius: {pegawaiLokasi?.radius || 100}m</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-green-500 rounded-full shadow-sm flex items-center justify-center text-white text-sm">🏠</div>
                      <span className="font-medium text-foreground">Rumah</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 bg-green-400 rounded" />
                      <span className="font-medium text-foreground">Absen Fleksibel</span>
                    </div>
                  </>
                )}
              </div>
              
              {selectedShift?.lockLokasi === 'HARUS_DI_KANTOR' && distance !== null && (
                <div className="pt-2 border-t border-border">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    distance <= (pegawaiLokasi?.radius || 100) 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                      : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                  }`}>
                    Status: {distance <= (pegawaiLokasi?.radius || 100) 
                      ? `✅ Valid (${Math.round(distance)}m)` 
                      : `❌ Terlalu jauh (${Math.round(distance)}m)`
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
