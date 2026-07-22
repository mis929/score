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

  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbydOax8mtS5SjJDj76ry9ASsDkifaiOUt_3qfR5Qg6qusxeUKcTDVLgGYKUmQoYBhsq/exec';

  useEffect(() => {
  const SHEET_ID = '1tAxv2Oj0griVhc-ANQDGvMzWhebHySFeBiUEfKhMGH8';
  const SHEET_NAME = 'Scores'; // Apni sheet ka exact tab name

  // Google Sheet Direct API URL
  const URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

  fetch(URL)
    .then((res) => res.text())
    .then((text) => {
      // JSON Parsing (Response clean kar rahe hain)
      const jsonString = text.substring(47, text.length - 2);
      const data = JSON.parse(jsonString);

      // Header row comfortably store kar rahe hain
      const headers = data.table.cols.map((col) => col && col.label ? col.label.trim() : '');

      // Rows Format karna
      const formattedRows = data.table.rows.map((row) => {
        let obj = {};
        if (row && row.c) {
          row.c.forEach((cell, index) => {
            const key = headers[index];
            if (key) {
              if (cell) {
                // Formatting Fix: cell.f Formatted text (jaise % ya Date) deta hai, agar null ho toh cell.v (raw value) use karein
                obj[key] = cell.f !== undefined && cell.f !== null ? cell.f : (cell.v !== null ? cell.v : '');
              } else {
                obj[key] = '';
              }
            }
          });
        }
        return obj;
      });

      setData(formattedRows);
      setLoading(false);
    })
    .catch((err) => {
      console.error('Error fetching sheet data directly:', err);
      setData([]);
      setLoading(false);
    });
}, []);
  const weekList = useMemo(() => {
  if (!Array.isArray(data)) return ['All'];
  const weeks = [...new Set(data.map((item) => item['Week #']))].filter(Boolean);
  return ['All', ...weeks];
}, [data]);

const personList = useMemo(() => {
  if (!Array.isArray(data)) return [];
  const persons = [...new Set(data.map((item) => item['Person']))].filter(Boolean);
  return persons.filter((p) => p.toLowerCase().includes(searchQuery.toLowerCase()));
}, [data, searchQuery]);

const filteredData = useMemo(() => {
  if (!Array.isArray(data)) return [];
  return data.filter((item) => {
    const matchWeek = selectedWeek === 'All' || item['Week #'] === selectedWeek;
    const matchPerson = selectedPerson === 'All' || item['Person'] === selectedPerson;
    return matchWeek && matchPerson;
  
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
{/* Employee Details List Section */}
<div style={{
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  border: '1px solid #e5e7eb',
  marginTop: '24px',
  overflow: 'hidden'
}}>
  {/* Header Title */}
  <div style={{
    padding: '16px 24px',
    borderBottom: '1px solid #f3f4f6',
    backgroundColor: '#ffffff'
  }}>
    <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>
      Employee Details List
    </h2>
  </div>

  {/* Scrollable Table Container */}
  <div style={{ maxHeight: '420px', overflowY: 'auto', overflowX: 'auto' }}>
    <table style={{
      width: '100%',
      borderCollapse: 'collapse',
      textAlign: 'left',
      fontSize: '14px',
      fontFamily: 'sans-serif'
    }}>
      <thead>
        <tr style={{
          backgroundColor: '#f9fafb',
          borderBottom: '2px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>Date</th>
          <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>Week #</th>
          <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>Person</th>
          <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>Weekly Score %</th>
          <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>Total Task</th>
          <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>Done Task</th>
          <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>Pending</th>
          <th style={{ padding: '12px 16px', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>Task Done By Delay</th>
        </tr>
      </thead>
      <tbody>
        {filteredData && filteredData.length > 0 ? (
          filteredData.map((row, index) => (
            <tr key={index} style={{
              borderBottom: '1px solid #f3f4f6',
              backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
            }}>
             <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
  <span style={{
    backgroundColor: '#d1fae5',
    color: '#065f46',
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '600'
  }}>
    {(() => {
      const val = row['Weekly Score %'];
      
      // 1. Agar value khali/null hai
      if (val === undefined || val === null || val === '') return '0%';
      
      // 2. Agar pehle se string me '%' laga hua aa raha hai (e.g. "80%")
      if (typeof val === 'string' && val.includes('%')) return val;
      
      // 3. Agar raw decimal/number hai (e.g. 0.8 ya 80)
      const num = parseFloat(val);
      if (isNaN(num)) return '0%';
      
      // Agar 1 se chota decimal hai (0.85 -> 85%), nahi toh direct percentage
      return num <= 1 ? `${Math.round(num * 100)}%` : `${Math.round(num)}%`;
    })()}
  </span>
</td></td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>
    </div>
  );
}