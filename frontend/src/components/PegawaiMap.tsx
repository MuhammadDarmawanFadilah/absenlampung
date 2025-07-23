"use client";

import React, { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = new L.Icon({
  iconUrl: '/images/marker-icon.png',
  iconRetinaUrl: '/images/marker-icon-2x.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Fix for default markers in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png',
});

interface PegawaiLocation {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  jabatan: string;
  status: string;
  photoUrl?: string;
  alamat: string;
  provinsi: string;
  provinsiNama: string;
  kota: string;
  kotaNama: string;
  kecamatan: string;
  kecamatanNama: string;
  kelurahan: string;
  kelurahanNama: string;
  kodePos: string;
  latitude: number;
  longitude: number;
  totalTps: number;
  totalPemilihan: number;
  createdAt: string;
  pemilihanList?: Array<{
    id: number;
    judulPemilihan: string;
    totalLaporan: number;
    totalJenisLaporan: number;
  }>;
}

interface PegawaiMapProps {
  locations: PegawaiLocation[];
  center: [number, number];
  zoom: number;
  onPegawaiClick: (pegawaiId: number) => void;
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  return null;
}

const PegawaiMap: React.FC<PegawaiMapProps> = ({ locations, center, zoom, onPegawaiClick }) => {
  const mapRef = useRef<L.Map>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AKTIF': return '#22c55e';
      case 'TIDAK_AKTIF': return '#ef4444';
      case 'SUSPEND': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const createCustomIcon = (pegawai: PegawaiLocation) => {
    const color = getStatusColor(pegawai.status);
    const photoUrl = getProfileImage(pegawai);
    
    return L.divIcon({
      html: `
        <div style="
          background-color: ${color};
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          cursor: pointer;
          overflow: hidden;
          position: relative;
        ">
          ${pegawai.photoUrl ? `
            <img 
              src="${photoUrl}" 
              style="
                width: 34px; 
                height: 34px; 
                border-radius: 50%; 
                object-fit: cover;
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
              " 
              onerror="this.style.display='none'; this.parentElement.innerHTML='${pegawai.fullName.charAt(0).toUpperCase()}';"
            />
          ` : pegawai.fullName.charAt(0).toUpperCase()}
        </div>
      `,
      className: 'custom-div-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -20]
    });
  };

  const getProfileImage = (pegawai: PegawaiLocation) => {
    if (pegawai.photoUrl) {
      return pegawai.photoUrl.startsWith('http') 
        ? pegawai.photoUrl 
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload/photos/${pegawai.photoUrl}`;
    }
    return '/images/default-avatar.svg';
  };

  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden">
      <MapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <MapController center={center} zoom={zoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {locations.map((pegawai) => (
          <Marker
            key={pegawai.id}
            position={[pegawai.latitude, pegawai.longitude]}
            icon={createCustomIcon(pegawai)}
          >
            <Popup className="custom-popup">
              <div className="p-2 min-w-[250px]">
                <div className="flex items-center space-x-3 mb-3">
                  <img
                    src={getProfileImage(pegawai)}
                    alt={pegawai.fullName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/default-avatar.svg';
                    }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{pegawai.fullName}</h3>
                    <p className="text-sm text-gray-600">@{pegawai.username}</p>
                  </div>
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Jabatan:</span>
                    <span className="font-medium">{pegawai.jabatan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      pegawai.status === 'AKTIF' ? 'text-green-600' : 
                      pegawai.status === 'TIDAK_AKTIF' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {pegawai.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">TPS:</span>
                    <span className="font-medium">{pegawai.totalPemilihan || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Laporan:</span>
                    <span className="font-medium">{pegawai.pemilihanList?.reduce((sum: number, p: any) => sum + (p.totalLaporan || 0), 0) || 0}</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    <strong>Lokasi:</strong><br />
                    {pegawai.kelurahanNama || pegawai.kelurahan}, {pegawai.kecamatanNama || pegawai.kecamatan}<br />
                    {pegawai.kotaNama || pegawai.kota}, {pegawai.provinsiNama || pegawai.provinsi}
                  </p>
                </div>
                
                <button 
                  onClick={() => onPegawaiClick(pegawai.id)}
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded transition-colors"
                >
                  Lihat Detail
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default PegawaiMap;
