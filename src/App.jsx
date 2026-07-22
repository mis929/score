import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Search, Calendar, User, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import './index.css'; // Pure Vanilla CSS import

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedWeek, setSelectedWeek] = useState('All');
  const [selectedPerson, setSelectedPerson] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyWrJRmD_wBuBCpPAF1gwaNUKlvRoYVZi0vO_-hIqTVROQpl0vr0GLlWnY20UL0DnqC/exec';

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

  const weekList = useMemo(() => {
    const weeks = [...new Set(data.map((item) => item['Week #']))].filter(Boolean);
    return ['All', ...weeks];
  }, [data]);

  const personList = useMemo(() => {
    const persons = [...new Set(data.map((item) => item['Person']))].filter(Boolean);
    return persons.filter((p) => p.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [data, searchQuery]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchWeek = selectedWeek === 'All' || item['Week #'] === selectedWeek;
      const matchPerson = selectedPerson === 'All' || item['Person'] === selectedPerson;
      return matchWeek && matchPerson;
    });
  }, [data, selectedWeek, selectedPerson]);

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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h3>Loading Dashboard Data...</h3>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-title">
          <h1>Weekly Performance Dashboard</h1>
          <p>Track and monitor team task progress</p>
        </div>

        <div className="controls-group">
          <div className="input-box">
            <Calendar size={16} />
            <select value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}>
              <option value="All">All Weeks</option>
              {weekList.filter((w) => w !== 'All').map((week) => (
                <option key={week} value={week}>{week}</option>
              ))}
            </select>
          </div>

          <div className="input-box">
            <User size={16} />
            <select value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)}>
              <option value="All">All Employees</option>
              {personList.map((person) => (
                <option key={person} value={person}>{person}</option>
              ))}
            </select>
          </div>

          <div className="input-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Filter Employee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue"><Clock size={24} /></div>
          <div className="kpi-info">
            <p>Total Tasks</p>
            <h3>{metrics.totalTasks}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon green"><CheckCircle2 size={24} /></div>
          <div className="kpi-info">
            <p>Done Tasks</p>
            <h3>{metrics.doneTasks}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon red"><AlertCircle size={24} /></div>
          <div className="kpi-info">
            <p>Pending Tasks</p>
            <h3>{metrics.pendingTasks}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon amber"><Clock size={24} /></div>
          <div className="kpi-info">
            <p>Done By Delay</p>
            <h3>{metrics.taskDoneByDelay}</h3>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h2>Task Completion Status</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
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

        <div className="chart-card">
          <h2>Delay vs Timely Execution</h2>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value">
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

      {/* Table */}
      <div className="table-card">
        <div className="table-header">
          <h2>Employee Details List</h2>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Week #</th>
                <th>Person</th>
                <th>Weekly Score %</th>
                <th>Total Task</th>
                <th>Done Task</th>
                <th>Pending</th>
                <th>Task Done By Delay</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length > 0 ? (
                filteredData.map((row, index) => (
                  <tr key={index}>
                    <td>{row['Date'] ? new Date(row['Date']).toLocaleDateString() : '-'}</td>
                    <td>{row['Week #']}</td>
                    <td><strong>{row['Person']}</strong></td>
                    <td>
                      <span className="badge">
                        {(Number(row['Weekly Score %']) * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td>{row['Total Task']}</td>
                    <td className="text-emerald">{row['Done Task']}</td>
                    <td className="text-rose">{row['Pending']}</td>
                    <td className="text-amber">{row['Task Done By Delay']}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center">No matching records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}