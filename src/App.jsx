// src/App.jsx
import React, { useState, useEffect, useMemo } from 'react';
import './index.css';

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  BarElement
} from 'chart.js';
import { Doughnut, Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, Title, CategoryScale, LinearScale, BarElement);

const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxENr-Dv-4qGnkpB6eXQUsUS6S1IAFECDGh8eEVO-BmQkNa8jz9Baid8JUmGFtwc5qq/exec";

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // Default: 'dashboard'
  
  const [rawData, setRawData] = useState([]);      // For KPI Dashboard (res.data)
  const [scoreData, setScoreData] = useState([]);  // For Final Score (res.data2)
  const [loading, setLoading] = useState(true);

  // Common Filter States
  const [selectedWeek, setSelectedWeek] = useState('All');
  const [selectedPerson, setSelectedPerson] = useState('All');
  const [selectedScoreRange, setSelectedScoreRange] = useState('All');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  // Reset Filters when switching sidebar tabs
  useEffect(() => {
    setSelectedWeek('All');
    setSelectedPerson('All');
    setSelectedScoreRange('All');
    setSelectedMonth('All');
    setSearchQuery('');
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const response = await fetch(APPS_SCRIPT_URL);
      const res = await response.json();
      
      if (res.success) {
        if (Array.isArray(res.data)) setRawData(res.data);
        if (Array.isArray(res.data2)) setScoreData(res.data2);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get current active raw dataset for dropdown calculations
  const currentActiveDataset = activeTab === 'dashboard' ? rawData : scoreData;

  // Week Options
  const weekOptions = useMemo(() => {
    const weeks = currentActiveDataset
      .map(d => d.weekNo)
      .filter(w => w && String(w).trim() !== '');
    return ['All', ...Array.from(new Set(weeks))];
  }, [currentActiveDataset]);

  // Person Options
  const personOptions = useMemo(() => {
    const persons = currentActiveDataset
      .map(d => d.person)
      .filter(p => p && String(p).trim() !== '');
    return ['All', ...Array.from(new Set(persons))];
  }, [currentActiveDataset]);

  // Month Options (For Final Score)
  const monthOptions = useMemo(() => {
    const months = scoreData
      .map(d => d.month)
      .filter(m => m && String(m).trim() !== '');
    return ['All', ...Array.from(new Set(months))];
  }, [scoreData]);

  // Filter Logic - Dashboard Tab
  const filteredDashboardData = useMemo(() => {
    return rawData.filter(item => {
      const matchWeek = selectedWeek === 'All' || item.weekNo === selectedWeek;
      const matchPerson = selectedPerson === 'All' || item.person === selectedPerson;

      let matchScore = true;
      const scorePct = (item.score || 0) * 100;
      if (selectedScoreRange === '90-100') matchScore = scorePct >= 90;
      else if (selectedScoreRange === '75-89') matchScore = scorePct >= 75 && scorePct < 90;
      else if (selectedScoreRange === '0-74') matchScore = scorePct < 75;

      const matchSearch = (item.person || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.source || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchWeek && matchPerson && matchScore && matchSearch;
    });
  }, [rawData, selectedWeek, selectedPerson, selectedScoreRange, searchQuery]);

  // Filter Logic - Final Score Tab
  const filteredScoreData = useMemo(() => {
    return scoreData.filter(item => {
      const matchWeek = selectedWeek === 'All' || item.weekNo === selectedWeek;
      const matchPerson = selectedPerson === 'All' || item.person === selectedPerson;
      const matchMonth = selectedMonth === 'All' || item.month === selectedMonth;

      let matchScore = true;
      const scorePct = (item.avgweeklyscore || 0) * 100;
      if (selectedScoreRange === '90-100') matchScore = scorePct >= 90;
      else if (selectedScoreRange === '75-89') matchScore = scorePct >= 75 && scorePct < 90;
      else if (selectedScoreRange === '0-74') matchScore = scorePct < 75;

      const matchSearch = (item.person || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.month || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchWeek && matchPerson && matchMonth && matchScore && matchSearch;
    });
  }, [scoreData, selectedWeek, selectedPerson, selectedMonth, selectedScoreRange, searchQuery]);

  // Aggregations for KPI Dashboard
  const totals = useMemo(() => {
    return filteredDashboardData.reduce((acc, curr) => {
      acc.total += curr.totalTask || 0;
      acc.done += curr.doneTask || 0;
      acc.pending += curr.pendingTask || 0;
      acc.delay += curr.taskDoneDelay || 0;
      return acc;
    }, { total: 0, done: 0, pending: 0, delay: 0 });
  }, [filteredDashboardData]);

  // Aggregations for Final Score Tab
  const scoreStats = useMemo(() => {
    if (filteredScoreData.length === 0) return { avgScore: 0, topScorers: 0, lowScorers: 0, totalRecords: 0 };
    const sum = filteredScoreData.reduce((acc, curr) => acc + (curr.avgweeklyscore || 0), 0);
    const avg = (sum / filteredScoreData.length) * 100;
    const top = filteredScoreData.filter(d => ((d.avgweeklyscore || 0) * 100) >= 90).length;
    const low = filteredScoreData.filter(d => ((d.avgweeklyscore || 0) * 100) < 75).length;
    return {
      avgScore: avg.toFixed(1),
      topScorers: top,
      lowScorers: low,
      totalRecords: filteredScoreData.length
    };
  }, [filteredScoreData]);

  // Charts Configuration - Dashboard Tab
  const doughnutData = {
    labels: ['Done Task', 'Pending Task', 'Done by Delay'],
    datasets: [{
      data: [Math.max(0, totals.done - totals.delay), totals.pending, totals.delay],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
      borderWidth: 0
    }]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#cbd5e1' } },
      title: { display: true, text: 'Task Status Breakdown', color: '#f8fafc', font: { size: 16 } }
    },
    cutout: '70%'
  };

  const sourceWiseCounts = useMemo(() => {
    return filteredDashboardData.reduce((acc, curr) => {
      if (curr.source) {
        acc[curr.source] = (acc[curr.source] || 0) + (curr.totalTask || 0);
      }
      return acc;
    }, {});
  }, [filteredDashboardData]);

  const pieData = {
    labels: Object.keys(sourceWiseCounts),
    datasets: [{
      data: Object.values(sourceWiseCounts),
      backgroundColor: ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#14b8a6', '#f97316'],
      borderWidth: 0
    }]
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#cbd5e1' } },
      title: { display: true, text: 'Tasks by Source / Category', color: '#f8fafc', font: { size: 16 } }
    }
  };

  // Bar Chart Configuration - Final Score Tab
  const scoreBarData = useMemo(() => {
    const topRecords = filteredScoreData.slice(0, 10);
    return {
      labels: topRecords.map(d => d.person),
      datasets: [{
        label: 'Avg Weekly Score %',
        data: topRecords.map(d => ((d.avgweeklyscore || 0) * 100).toFixed(1)),
        backgroundColor: '#6366f1',
        borderRadius: 6
      }]
    };
  }, [filteredScoreData]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px', fontSize: '18px', color: '#818cf8' }}>
        Loading Performance Analytics...
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* 🟢 LEFT SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-brand">📊 Analytics App</div>
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </button>

          <button 
            className={`nav-item ${activeTab === 'finalScore' ? 'active' : ''}`}
            onClick={() => setActiveTab('finalScore')}
          >
            <span className="nav-icon">🎯</span>
            <span>Final Score</span>
          </button>
        </nav>
      </div>

      {/* 🔵 MAIN CONTENT CONTAINER */}
      <div className="main-content">
        
        {/* ==================== TAB 1: DASHBOARD ==================== */}
        {activeTab === 'dashboard' && (
          <>
            <div className="header-bar">
              <div className="header-title">KPI Performance Dashboard</div>
              <div className="total-records">Total Records: {filteredDashboardData.length}</div>
            </div>

            {/* Filters */}
            <div className="glass-card">
              <div className="filters-grid">
                <div className="filter-group">
                  <label className="filter-label">Week No.</label>
                  <select className="filter-select" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}>
                    {weekOptions.map((wk, idx) => (
                      <option key={idx} value={wk}>{wk}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Person / Employee</label>
                  <select className="filter-select" value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)}>
                    {personOptions.map((p, idx) => (
                      <option key={idx} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Score Range</label>
                  <select className="filter-select" value={selectedScoreRange} onChange={(e) => setSelectedScoreRange(e.target.value)}>
                    <option value="All">All Scores</option>
                    <option value="90-100">High (90% - 100%)</option>
                    <option value="75-89">Medium (75% - 89%)</option>
                    <option value="0-74">Needs Attention (&lt; 75%)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="scorecards-grid">
              <div className="glass-card kpi-card">
                <div className="kpi-title">Total Task</div>
                <div className="kpi-value val-blue">{totals.total}</div>
              </div>

              <div className="glass-card kpi-card green">
                <div className="kpi-title">Done Task</div>
                <div className="kpi-value val-green">{totals.done}</div>
              </div>

              <div className="glass-card kpi-card amber">
                <div className="kpi-title">Pending Task</div>
                <div className="kpi-value val-amber">{totals.pending}</div>
              </div>

              <div className="glass-card kpi-card red">
                <div className="kpi-title">Done by Delay</div>
                <div className="kpi-value val-red">{totals.delay}</div>
              </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
              <div className="glass-card chart-box">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
              <div className="glass-card chart-box">
                <Pie data={pieData} options={pieOptions} />
              </div>
            </div>

            {/* EMP Detail Data Table */}
            <div className="glass-card">
              <div className="table-header-box">
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>EMP Detail List</div>
                <input 
                  type="text" 
                  placeholder="Search Employee or Source..." 
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Week</th>
                      <th>Person</th>
                      <th>Score %</th>
                      <th>Total</th>
                      <th>Done</th>
                      <th>Pending</th>
                      <th>Delay</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDashboardData.length > 0 ? (
                      filteredDashboardData.map((row) => (
                        <tr key={row.id}>
                          <td>{row.weekNo}</td>
                          <td style={{ fontWeight: 'bold' }}>{row.person}</td>
                          <td>
                            <span className={`score-badge ${
                              ((row.score || 0) * 100) >= 90 ? 'badge-high' :
                              ((row.score || 0) * 100) >= 75 ? 'badge-mid' : 'badge-low'
                            }`}>
                              {((row.score || 0) * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td>{row.totalTask}</td>
                          <td className="val-green">{row.doneTask}</td>
                          <td className="val-amber">{row.pendingTask}</td>
                          <td className="val-red">{row.taskDoneDelay}</td>
                          <td style={{ color: '#94a3b8', fontSize: '12px' }}>{row.source}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', color: '#64748b' }}>No record found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ==================== TAB 2: FINAL SCORE ==================== */}
        {activeTab === 'finalScore' && (
          <>
            <div className="header-bar">
              <div className="header-title">Final Score Performance Dashboard</div>
              <div className="total-records">Total Records: {filteredScoreData.length}</div>
            </div>

            {/* Filters */}
            <div className="glass-card">
              <div className="filters-grid">
                <div className="filter-group">
                  <label className="filter-label">Week #</label>
                  <select className="filter-select" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}>
                    {weekOptions.map((wk, idx) => (
                      <option key={idx} value={wk}>{wk}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Person</label>
                  <select className="filter-select" value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)}>
                    {personOptions.map((p, idx) => (
                      <option key={idx} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Month</label>
                  <select className="filter-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                    {monthOptions.map((m, idx) => (
                      <option key={idx} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Score Range</label>
                  <select className="filter-select" value={selectedScoreRange} onChange={(e) => setSelectedScoreRange(e.target.value)}>
                    <option value="All">All Scores</option>
                    <option value="90-100">High (90% - 100%)</option>
                    <option value="75-89">Medium (75% - 89%)</option>
                    <option value="0-74">Needs Attention (&lt; 75%)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Scorecards Row */}
            <div className="scorecards-grid">
              <div className="glass-card kpi-card">
                <div className="kpi-title">Average Score</div>
                <div className="kpi-value val-blue">{scoreStats.avgScore}%</div>
              </div>
              <div className="glass-card kpi-card green">
                <div className="kpi-title">High Performers (&ge;90%)</div>
                <div className="kpi-value val-green">{scoreStats.topScorers}</div>
              </div>
              <div className="glass-card kpi-card red">
                <div className="kpi-title">Needs Attention (&lt;75%)</div>
                <div className="kpi-value val-red">{scoreStats.lowScorers}</div>
              </div>
              <div className="glass-card kpi-card amber">
                <div className="kpi-title">Total Records</div>
                <div className="kpi-value val-amber">{scoreStats.totalRecords}</div>
              </div>
            </div>

            {/* Bar Chart Section */}
            <div className="glass-card chart-box" style={{ height: '350px' }}>
              <Bar 
                data={scoreBarData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { display: false },
                    title: { display: true, text: 'Weekly Performance Score % by Person', color: '#f8fafc', font: { size: 16 } } 
                  },
                  scales: {
                    x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                    y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' }, max: 100 }
                  }
                }} 
              />
            </div>

            {/* Final Score Detail Table */}
            <div className="glass-card">
              <div className="table-header-box">
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>Final Score Detail List</div>
                <input 
                  type="text" 
                  placeholder="Search Person or Month..." 
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Week #</th>
                      <th>Person</th>
                      <th>Month</th>
                      <th>Year</th>
                      <th>Avg Weekly Score %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredScoreData.length > 0 ? (
                      filteredScoreData.map((row, idx) => (
                        <tr key={row.id || idx}>
                          <td>{row.weekNo}</td>
                          <td style={{ fontWeight: 'bold' }}>{row.person}</td>
                          <td>{row.month}</td>
                          <td>{row.year}</td>
                          <td>
                            <span className={`score-badge ${
                              ((row.avgweeklyscore || 0) * 100) >= 90 ? 'badge-high' :
                              ((row.avgweeklyscore || 0) * 100) >= 75 ? 'badge-mid' : 'badge-low'
                            }`}>
                              {((row.avgweeklyscore || 0) * 100).toFixed(2)}%
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>No record found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}