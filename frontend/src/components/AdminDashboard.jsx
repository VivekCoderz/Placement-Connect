import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import api from "../utils/api";
import { logoutState } from "../store/authSlice";
import PlacementStats from "./PlacementStats";
import "./dashboard.css";

export const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  // ✅ STEP 1: navigation state
  const [activeTab, setActiveTab] = useState("dashboard");

  const [companies, setCompanies] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const pendingCompanies = companies.filter((c) => !c.approved);
  const activeRecruiters = companies.filter((c) => c.approved).length;

  const loadData = async () => {
    setLoadingData(true);
    try {
      const resCompanies = await api.get("/admin/companies");
      const resStudents = await api.get("/admin/students");

      setCompanies(resCompanies.data.companies || []);
      setStudents(resStudents.data.students || []);
    } catch (err) {
      setErrorMsg("Failed to load dashboard data");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn(err);
    } finally {
      dispatch(logoutState());
    }
  };

  return (
    <div className="dashboard-container">

      {/* Sidebar */}
      <div className="sidebar">
        <h2>Admin Panel</h2>

        <a
          href="#"
          className={activeTab === "dashboard" ? "active" : ""}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </a>

        <a
          href="#"
          className={activeTab === "companies" ? "active" : ""}
          onClick={() => setActiveTab("companies")}
        >
          Companies
        </a>

        <a
          href="#"
          className={activeTab === "students" ? "active" : ""}
          onClick={() => setActiveTab("students")}
        >
          Students
        </a>
      </div>

      {/* Main Content */}
      <div className="main-content">

        {/* Top Bar */}
        <div className="topbar">
          <h3>Admin Dashboard</h3>
          <button className="btn" onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* Messages */}
        {errorMsg && <p style={{ color: "red" }}>{errorMsg}</p>}
        {successMsg && <p style={{ color: "green" }}>{successMsg}</p>}

        {/* ================= DASHBOARD ================= */}
        {activeTab === "dashboard" && (
          <>
            <div className="card-grid">
              <div className="card">Total Students: {students.length}</div>
              <div className="card">Total Companies: {companies.length}</div>
              <div className="card">Pending Companies: {pendingCompanies.length}</div>
              <div className="card">Active Recruiters: {activeRecruiters}</div>
            </div>

            <PlacementStats />
          </>
        )}

        {/* ================= COMPANIES ================= */}
        {activeTab === "companies" && (
          <div className="card">
            <h3>Companies List</h3>

            {companies.length === 0
              ? "No companies found"
              : companies.map((c, i) => (
                  <p key={i}>{c.name || "Company"}</p>
                ))}
          </div>
        )}

        {/* ================= STUDENTS ================= */}
        {activeTab === "students" && (
          <div className="card">
            <h3>Students List</h3>

            {students.length === 0
              ? "No students found"
              : students.map((s, i) => (
                  <p key={i}>{s.name || "Student"}</p>
                ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;