"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

interface PageProps {
  params: Promise<{
    id: string;
    jenisId: string;
  }>;
}

export default function JenisLaporanDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [id, setId] = useState<string>('');
  const [jenisId, setJenisId] = useState<string>('');
  
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setId(resolvedParams.id);
      setJenisId(resolvedParams.jenisId);
    };
    getParams();
  }, [params]);
  
  return (
    <div className="container mx-auto py-8 px-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Jenis Laporan Detail - Laporan {id}, Jenis {jenisId}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-500">
              Halaman detail jenis laporan untuk laporan ID: {id}, jenis ID: {jenisId}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Implementasi akan disesuaikan dengan kebutuhan spesifik
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
