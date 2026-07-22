import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Search, Calendar, User, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedWeek, setSelectedWeek] = useState('All');
  const [selectedPerson, setSelectedPerson] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // ⚠️ REPLACE THIS WITH YOUR DEPLOYED GOOGLE APPS SCRIPT URL
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby3mn99580kOZVlnps8Em9o2dCSgdpMqyo6YZKXlwCcBVsf1_5j6I1z3y-4tj4LEZ1q/exec';

  useEffect(() => {
    fetch(GOOGLE_SCRIPT_URL)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  }, []);

  // Filter Dropdown Options
  const weekList = useMemo(() => {
    const weeks = [...new Set(data.map((item) => item['Week #']))].filter(Boolean);
    return ['All', ...weeks];
  }, [data]);

  const personList = useMemo(() => {
    const persons = [...new Set(data.map((item) => item['Person']))].filter(Boolean);
    return persons.filter((p) => p.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [data, searchQuery]);

  // Filtered Dataset
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchWeek = selectedWeek === 'All' || item['Week #'] === selectedWeek;
      const matchPerson = selectedPerson === 'All' || item['Person'] === selectedPerson;
      return matchWeek && matchPerson;
    });
  }, [data, selectedWeek, selectedPerson]);

  // KPI Calculations
  const metrics = useMemo(() => {
    let totalTasks = 0;
    let doneTasks = 0;
    let pendingTasks = 0;
    let taskDoneByDelay = 0;

    filteredData.forEach((row) => {
      totalTasks += Number(row['Total Task']) || 0;
      doneTasks += Number(row['Done Task']) || 0;
      pendingTasks += Number(row['Pending']) || 0;
      taskDoneByDelay += Number(row['Task Done By Delay']) || 0;
    });

    return { totalTasks, doneTasks, pendingTasks, taskDoneByDelay };
  }, [filteredData]);

  // Chart Data
  const donutData = [
    { name: 'Done Tasks', value: metrics.doneTasks },
    { name: 'Pending Tasks', value: metrics.pendingTasks },
  ];

  const pieData = [
    { name: 'Done On Time', value: Math.max(0, metrics.doneTasks - metrics.taskDoneByDelay) },
    { name: 'Done With Delay', value: metrics.taskDoneByDelay },
    { name: 'Pending', value: metrics.pendingTasks },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-semibold text-gray-600">Loading Dashboard Data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header & Controls */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Weekly Performance Dashboard</h1>
            <p className="text-sm text-gray-500">Track and monitor team task progress</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Week Dropdown */}
            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select
                className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
              >
                <option value="All">All Weeks</option>
                {weekList.filter((w) => w !== 'All').map((week) => (
                  <option key={week} value={week}>{week}</option>
                ))}
              </select>
            </div>

            {/* Employee Dropdown */}
            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <User className="w-4 h-4 text-gray-500" />
              <select
                className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer max-w-[150px]"
                value={selectedPerson}
                onChange={(e) => setSelectedPerson(e.target.value)}
              >
                <option value="All">All Employees</option>
                {personList.map((person) => (
                  <option key={person} value={person}>{person}</option>
                ))}
              </select>
            </div>

            {/* Search Box */}
            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter Employee List..."
                className="bg-transparent text-sm outline-none w-36"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Clock className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-gray-500">Total Tasks</p>
              <h3 className="text-2xl font-bold text-gray-800">{metrics.totalTasks}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-gray-500">Done Tasks</p>
              <h3 className="text-2xl font-bold text-gray-800">{metrics.doneTasks}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg"><AlertCircle className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-gray-500">Pending Tasks</p>
              <h3 className="text-2xl font-bold text-gray-800">{metrics.pendingTasks}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Clock className="w-6 h-6" /></div>
            <div>
              <p className="text-sm text-gray-500">Done By Delay</p>
              <h3 className="text-2xl font-bold text-gray-800">{metrics.taskDoneByDelay}</h3>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Donut Chart */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Task Completion Status</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Delay vs Timely Execution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index + 1]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800">Employee Details List</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Week #</th>
                  <th className="px-6 py-3">Person</th>
                  <th className="px-6 py-3">Weekly Score %</th>
                  <th className="px-6 py-3">Total Task</th>
                  <th className="px-6 py-3">Done Task</th>
                  <th className="px-6 py-3">Pending</th>
                  <th className="px-6 py-3">Task Done By Delay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.length > 0 ? (
                  filteredData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {row['Date'] ? new Date(row['Date']).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-800">{row['Week #']}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">{row['Person']}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          {(Number(row['Weekly Score %']) * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-6 py-4">{row['Total Task']}</td>
                      <td className="px-6 py-4 text-emerald-600 font-medium">{row['Done Task']}</td>
                      <td className="px-6 py-4 text-rose-600 font-medium">{row['Pending']}</td>
                      <td className="px-6 py-4 text-amber-600">{row['Task Done By Delay']}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-6 text-gray-400">
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}