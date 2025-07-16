import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Hotel, Users, Calendar, TrendingUp, DollarSign, CheckCircle, X, ArrowUp, ArrowDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  totalHotels: number;
  totalUsers: number;
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  recentBookings: any[];
  monthlyBookings: any[];
  monthlyRevenue: any[];
  bookingStatusData: any[];
  topHotels: any[];
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [hotelsRes, usersRes, bookingsRes] = await Promise.all([
        supabase.from('hotels').select('*', { count: 'exact' }),
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('bookings').select(`
          *,
          hotel:hotels(name, location),
          room:rooms(type),
          profile:profiles(full_name)
        `).order('created_at', { ascending: false })
      ]);
       console.log(bookingsRes)
      const totalHotels = hotelsRes.count || 0;
      const totalUsers = usersRes.count || 0;
      const totalBookings = bookingsRes.count || 0;
      
      const bookings = bookingsRes.data || [];
      console.log(bookings)
      const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
      console.log(confirmedBookings)
      console.log(cancelledBookings)
      const totalRevenue = bookings
        .filter(b => b.status === 'confirmed')
        .reduce((sum, booking) => sum + booking.total_price, 0);
      
      // Get monthly data
      const monthlyBookings = getMonthlyBookings(bookings);
      const monthlyRevenue = getMonthlyRevenue(bookings);
      
      // Booking status data for pie chart
      const bookingStatusData = [
        { name: 'Confirmed', value: confirmedBookings, color: '#10B981' },
        { name: 'Cancelled', value: cancelledBookings, color: '#EF4444' }
      ];

      // Top hotels by bookings
      const hotelBookings = bookings.reduce((acc, booking) => {
        const hotelName = booking.hotel?.name || 'Unknown';
        acc[hotelName] = (acc[hotelName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topHotels = Object.entries(hotelBookings)
        .map(([name, bookings]) => ({ name, bookings }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      setStats({
        totalHotels,
        totalUsers,
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        totalRevenue,
        recentBookings: bookings.slice(0, 5),
        monthlyBookings,
        monthlyRevenue,
        bookingStatusData,
        topHotels
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyBookings = (bookings: any[]) => {
    const monthlyData = bookings.reduce((acc, booking) => {
      const month = new Date(booking.created_at).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
     console.log(monthlyData)
    return Object.entries(monthlyData).map(([month, count]) => ({
      month,
      bookings: count
    }));
  };

  const getMonthlyRevenue = (bookings: any[]) => {
    const monthlyData = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((acc, booking) => {
        const month = new Date(booking.created_at).toLocaleString('default', { month: 'short' });
        acc[month] = (acc[month] || 0) + booking.total_price;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(monthlyData).map(([month, revenue]) => ({
      month,
      revenue
    }));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Error loading dashboard</p>
      </div>
    );
  }

  const COLORS = ['#10B981', '#EF4444'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300">Comprehensive overview of your hotel management system</p>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Hotels"
          value={stats.totalHotels}
          icon={Hotel}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="bg-gradient-to-r from-green-500 to-green-600"
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Total Bookings"
          value={stats.totalBookings}
          icon={Calendar}
          color="bg-gradient-to-r from-yellow-500 to-yellow-600"
          trend={{ value: 15, isPositive: true }}
        />
        <StatsCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
          trend={{ value: 23, isPositive: true }}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Confirmed Bookings</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.confirmedBookings}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {((stats.confirmedBookings / stats.totalBookings) * 100).toFixed(1)}% of total
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Cancelled Bookings</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.cancelledBookings}</p>
            </div>
            <X className="h-8 w-8 text-red-500" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {((stats.cancelledBookings / stats.totalBookings) * 100).toFixed(1)}% of total
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Average Booking Value</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ₹{stats.confirmedBookings > 0 ? Math.round(stats.totalRevenue / stats.confirmedBookings).toLocaleString() : 0}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Per confirmed booking</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Monthly Bookings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.monthlyBookings}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
              <Bar dataKey="bookings" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
                formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10B981" 
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div> */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Status Pie Chart */}
        {/* <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Booking Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats.bookingStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {stats.bookingStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: 'none', 
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center space-x-4 mt-4">
            {stats.bookingStatusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: COLORS[index] }}
                ></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">{entry.name}</span>
              </div>
            ))}
          </div>
        </div> */}

        {/* Top Hotels */}
        {/* <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top Hotels</h3>
          <div className="space-y-3">
            {stats.topHotels.map((hotel, index) => (
              <div key={hotel.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 w-6">
                    #{index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white ml-2">
                    {hotel.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {hotel.bookings} bookings
                </span>
              </div>
            ))}
          </div>
        </div> */}

        {/* Recent Bookings */}
        {/* <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Recent Bookings</h3>
          <div className="space-y-3">
            {stats.recentBookings.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{booking.hotel?.name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{booking.profile?.full_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">₹{booking.total_price}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    booking.status === 'confirmed' 
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div> */}
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<any>;
  color: string;
  trend?: { value: number; isPositive: boolean };
}

function StatsCard({ title, value, icon: Icon, color, trend }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6 hover:shadow-lg dark:hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              {trend.isPositive ? (
                <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {trend.value}%
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}
