import { getApiUrl } from '@/lib/config';

interface DashboardStats {
  monthlyLoginCount: number;
  recentLogins: UserInfo[];
  totalBiographies: number;
  recentBiographies: UserInfo[];
  monthlyNewsCount: number;
  popularNews: NewsStats[];
  popularProposals: ProposalStats[];
  recentComments: RecentComment[];
  monthlyDocumentCount: number;
  popularDocuments: DocumentStats[];
}

interface DashboardOverview {
  organizationInfo: OrganizationInfo;
  quickStats: QuickStats;
  monthlyData: MonthlyData[];
  activityFeed: ActivityFeed[];
}

interface UserInfo {
  fullName: string;
  email: string;
  lastLoginDate: string;
  profileImageUrl: string;
}

interface NewsStats {
  id: number;
  title: string;
  author: string;
  publishDate: string;
  viewCount: number;
  commentCount: number;
  imageUrl?: string;
}

interface ProposalStats {
  id: number;
  title: string;
  description: string;
  proposer: string;
  createdDate: string;
  voteCount: number;
  status: string;
}

interface RecentComment {
  userName: string;
  comment: string;
  commentDate: string;
  type: string;
  itemTitle: string;
  itemId: number;
  userId?: number; // Add userId for navigation to biography
}

interface DocumentStats {
  id: number;
  title: string;
  description: string;
  author: string;
  uploadDate: string;
  downloadCount: number;
  commentCount: number;
  fileType: string;
}

interface OrganizationInfo {
  name: string;
  description: string;
  mission: string;
  vision: string;
  establishedYear: string;
  logoUrl: string;
}

interface QuickStats {
  totalMembers: number;
  activeMembers: number;
  totalNews: number;
  totalProposals: number;
  totalDocuments: number;
  monthlyLogins: number;
  memberGrowthRate: number;
  newsGrowthRate: number;
}

interface MonthlyData {
  month: string;
  logins: number;
  newMembers: number;
  newsPublished: number;
  proposalsSubmitted: number;
  documentsUploaded: number;
}

interface ActivityFeed {
  type: string;
  title: string;
  description: string;
  userName: string;
  userAvatar: string;
  timestamp: string;
  itemUrl: string;
  icon: string;
  color: string;
}

export class DashboardService {
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const url = getApiUrl('dashboard/stats');
      console.log('Fetching dashboard stats from:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  static async getDashboardOverview(): Promise<DashboardOverview> {
    try {
      const url = getApiUrl('dashboard/overview');
      console.log('Fetching dashboard overview from:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      throw error;
    }
  }
}

export type {
  DashboardStats,
  DashboardOverview,
  UserInfo,
  NewsStats,
  ProposalStats,
  RecentComment,
  DocumentStats,
  OrganizationInfo,
  QuickStats,
  MonthlyData,
  ActivityFeed,
};
