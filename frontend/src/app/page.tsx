"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { DashboardService, DashboardOverview, DashboardStats } from '@/services/dashboardService';
import OrganizationInfoCard from '@/components/dashboard/OrganizationInfoCard';
import QuickStatsCards from '@/components/dashboard/QuickStatsCards';
import MonthlyDataChart from '@/components/dashboard/MonthlyDataChart';
import ActivityFeedCard from '@/components/dashboard/ActivityFeedCard';
import { TrendingUp, Eye, MessageCircle, ThumbsUp, Download, FileText, Users, Calendar } from 'lucide-react';

const Dashboard = () => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Navigation functions with authentication check
  const navigateToDetail = (type: 'berita' | 'usulan' | 'documents' | 'biografi', id: number) => {
    if (!isAuthenticated) {
      // If not authenticated, redirect to login with return URL
      router.push(`/login?returnUrl=/${type}/${id}`);
      return;
    }
    
    // Navigate to the appropriate detail page
    router.push(`/${type}/${id}`);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [overviewData, statsData] = await Promise.all([
        DashboardService.getDashboardOverview(),
        DashboardService.getDashboardStats()
      ]);
      
      setOverview(overviewData);
      setStats(statsData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Gagal memuat data dashboard. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          {/* Header Skeleton */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-3">
                  <Skeleton className="h-10 w-80" />
                  <Skeleton className="h-6 w-96" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-12 w-32" />
              </div>
            </div>
          </div>
          
          {/* Organization Info Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-1 h-8" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          
          {/* Stats Grid Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-1 h-8" />
              <Skeleton className="h-8 w-40" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          </div>
          
          {/* Chart Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-1 h-8" />
              <Skeleton className="h-8 w-36" />
            </div>
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
          
          {/* Content Grid Skeleton */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-1 h-8" />
              <Skeleton className="h-8 w-52" />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Skeleton className="h-96 xl:col-span-2 rounded-2xl" />
              <Skeleton className="h-96 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <Alert className="bg-white dark:bg-gray-800 border-red-200 dark:border-red-800 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Terjadi Kesalahan
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gagal memuat data dashboard
                </p>
              </div>
            </div>
            <AlertDescription className="text-gray-700 dark:text-gray-300 mb-4">
              {error}
            </AlertDescription>
            <Button 
              variant="outline" 
              onClick={fetchDashboardData}
              className="w-full bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 border-red-200 dark:border-red-800"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Coba Lagi
            </Button>
          </Alert>
        </div>
      </div>
    );
  }
  if (!overview || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Data Tidak Tersedia
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Tidak ada data yang dapat ditampilkan saat ini
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={fetchDashboardData}
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Muat Ulang
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">        {/* Enhanced Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 via-white/5 to-blue-600/10"></div>
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">
                  Dashboard Tren-Silapor
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  Sistem Pelaporan dan Pengawasan Pemilihan - Mewujudkan Pemilu yang Demokratis dan Berintegritas
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full pulse"></div>
                  <span>Sistem berjalan normal • Monitoring aktif</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={fetchDashboardData}
                  disabled={loading}
                  className="self-start sm:self-auto bg-white/50 hover:bg-white/80 dark:bg-gray-700/50 dark:hover:bg-gray-700/80 backdrop-blur-sm border-2 focus-ring"
                >
                  <RefreshCw className={`w-5 h-5 mr-3 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
                <div className="text-xs text-gray-500 text-center">
                  Update terakhir: {new Date().toLocaleTimeString('id-ID')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Organization Info Section */}
        <div className="space-y-4 fade-in-delay-1">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Informasi Sistem
            </h2>
          </div>
          <OrganizationInfoCard organizationInfo={overview.organizationInfo} />
        </div>        {/* Quick Stats Section */}
        <div className="space-y-4 fade-in-delay-2">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Statistik Pengawasan
            </h2>
          </div>
          <QuickStatsCards quickStats={overview.quickStats} />
        </div>        {/* Analytics Section */}
        <div className="space-y-4 fade-in-delay-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Analisis Data Pengawasan
            </h2>
          </div>
          <MonthlyDataChart monthlyData={overview.monthlyData} />
        </div>        {/* Quick Actions for Bawaslu Functions */}
        <div className="space-y-4 fade-in-delay-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Aksi Cepat Pengawasan
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card 
              className="relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20 border-red-200 dark:border-red-800 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => router.push('/laporan-pengawas')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">Laporan Pengawas</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Kelola laporan pengawasan pemilu</p>
                  </div>
                  <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center group-hover:bg-red-500/30 transition-colors">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => router.push('/admin/pemilihan')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Data Pemilihan</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Monitoring data pemilihan aktif</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => router.push('/documents')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-700 dark:text-green-300 mb-2">Dokumentasi</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Akses dokumen dan regulasi</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                    <Download className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-all duration-200 cursor-pointer group"
              onClick={() => router.push('/komunikasi')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">Komunikasi</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pusat komunikasi dan koordinasi</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                    <MessageCircle className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Content and Activity Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-teal-500 to-teal-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Laporan dan Aktivitas Pengawasan
            </h2>
          </div>
          
          {/* Popular Content - Full Width */}
          <Card className="relative overflow-hidden bg-white dark:bg-gray-800 border-0 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-400/10 to-red-400/10 rounded-full -translate-y-16 translate-x-16"></div>
            
            <CardHeader className="relative">
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Laporan dan Dokumen Populer</span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="relative">
              <Tabs defaultValue="news" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                  <TabsTrigger 
                    value="news"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-red-600 font-medium transition-all duration-200"
                  >
                    Data Pegawai
                  </TabsTrigger>
                  <TabsTrigger 
                    value="proposals"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-blue-600 font-medium transition-all duration-200"
                  >
                    Data Pemilihan
                  </TabsTrigger>
                  <TabsTrigger 
                    value="documents"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-green-600 font-medium transition-all duration-200"
                  >
                    Statistik Sistem
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="news" className="space-y-4">
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-xl p-4">
                    {stats.popularNews.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">Belum ada data pegawai populer</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {stats.popularNews.map((news, index) => (
                          <div 
                            key={index} 
                            className="bg-white dark:bg-gray-700 rounded-lg p-4 hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:bg-red-50 dark:hover:bg-gray-600"
                            onClick={() => router.push('/admin/pegawai')}
                          >
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 hover:text-red-600 dark:hover:text-red-400">
                              {news.title}
                            </h4>
                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center space-x-4">
                                <span>NIP: {news.author}</span>
                              </div>
                              <span>{news.publishDate}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                  <TabsContent value="proposals" className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl p-4">
                    {stats.popularProposals.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">Belum ada data pemilihan</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {stats.popularProposals.map((proposal, index) => (
                          <div 
                            key={index} 
                            className="bg-white dark:bg-gray-700 rounded-lg p-4 hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 hover:bg-blue-50 dark:hover:bg-gray-600"
                            onClick={() => router.push('/admin/pemilihan')}
                          >
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400">
                              {proposal.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {proposal.description}
                            </p>
                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                              <div className="flex items-center space-x-4">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs">
                                  {proposal.status}
                                </span>
                              </div>
                              <span>{proposal.createdDate}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                  <TabsContent value="documents" className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 text-center">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Total Users</h4>
                        <p className="text-2xl font-bold text-green-600">{overview.quickStats.totalMembers}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 text-center">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Total Pegawai</h4>
                        <p className="text-2xl font-bold text-blue-600">{overview.quickStats.activeMembers}</p>
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-6 text-center">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Total Pemilihan</h4>
                        <p className="text-2xl font-bold text-purple-600">{overview.quickStats.totalProposals}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>          {/* Side by Side: Activity Feed and System Statistics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="order-1 lg:order-1">
              <ActivityFeedCard activityFeed={overview.activityFeed} />
            </div>
            <div className="order-2 lg:order-2">
              <Card className="relative overflow-hidden bg-white dark:bg-gray-800 border-0 shadow-xl">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-400/10 to-purple-400/10 rounded-full -translate-y-12 translate-x-12"></div>
                
                <CardHeader className="relative flex flex-row items-center justify-between pb-4">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      Statistik Sistem
                    </CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Ringkasan data sistem pengawasan
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="relative space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
                          <p className="text-2xl font-bold text-green-600">{overview.quickStats.totalMembers}</p>
                        </div>
                        <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Pegawai</p>
                          <p className="text-2xl font-bold text-blue-600">{overview.quickStats.activeMembers}</p>
                        </div>
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Pemilihan</p>
                          <p className="text-2xl font-bold text-purple-600">{overview.quickStats.totalProposals}</p>
                        </div>
                        <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Status Sistem</p>
                          <p className="text-lg font-bold text-orange-600">Aktif</p>
                        </div>
                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Contact and Information Footer */}
        <div className="bg-gradient-to-r from-red-50 via-white to-blue-50 dark:from-red-950/20 dark:via-gray-800 dark:to-blue-950/20 rounded-xl shadow-sm border border-gray-200/50 p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <div className="w-6 h-6 bg-red-600 rounded mr-3"></div>
                Tentang Bawaslu
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Badan Pengawas Pemilihan Umum adalah lembaga negara yang bertugas mengawasi 
                penyelenggaraan pemilihan umum di seluruh Indonesia untuk menjamin pemilu yang demokratis.
              </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <div className="w-6 h-6 bg-blue-600 rounded mr-3"></div>
                Layanan Pengaduan
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  📞 Call Center: 1500-991
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  📧 Email: pengaduan@bawaslu.go.id
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  🌐 Website: www.bawaslu.go.id
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center">
                <div className="w-6 h-6 bg-green-600 rounded mr-3"></div>
                Jam Operasional
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  Senin - Jumat: 08:00 - 17:00 WIB
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Sabtu: 08:00 - 12:00 WIB
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Minggu & Hari Libur: Tutup
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
          <p>© 2025 Tren-Silapor - Sistem Pelaporan dan Pengawasan Pemilihan untuk Demokrasi yang Berkualitas</p>
          <p className="mt-2 text-xs">
            Dikembangkan untuk mendukung pengawasan pemilu yang transparan dan partisipatif
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
