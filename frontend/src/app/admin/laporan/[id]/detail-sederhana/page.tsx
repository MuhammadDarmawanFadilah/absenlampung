"use client";

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function DetailSederhanaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
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
          <CardTitle>Detail Sederhana - Laporan {id}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-500">
              Halaman detail sederhana untuk laporan dengan ID: {id}
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
