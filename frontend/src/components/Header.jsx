import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { storage } from "../utils/auth";
import "../styles/Header.css";

export default function Header() {
    const location = useLocation();
    const isAuthenticated = storage.isAuthenticated();
    
    // Navbar tetap tampil di semua halaman termasuk landing
    return (
        <header className="topnav">
            <div className="topnav__inner">
                <NavLink to={isAuthenticated ? "/dashboard" : "/"} className="topnav__brand">
                    <span className="topnav__mark" />
                    <span className="topnav__name">Peluang</span>
                </NavLink>

                {isAuthenticated && (
                    <nav className="topnav__links" aria-label="Primary navigation">
                        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "isActive" : "")}>
                            Dashboard
                        </NavLink>
                        <NavLink to="/map" className={({ isActive }) => (isActive ? "isActive" : "")}>
                            Peta Interaktif
                        </NavLink>
                        <NavLink to="/analysis" className={({ isActive }) => (isActive ? "isActive" : "")}>
                            Analisis Potensi
                        </NavLink>
                        <NavLink to="/history" className={({ isActive }) => (isActive ? "isActive" : "")}>
                            Riwayat
                        </NavLink>
                        <NavLink to="/admin" className={({ isActive }) => (isActive ? "isActive" : "")}>
                            Admin Panel
                        </NavLink>
                    </nav>
                )}

                <div className="topnav__right">
                    {isAuthenticated ? (
                        <button 
                            className="topnav__btn topnav__logout"
                            onClick={() => {
                                storage.removeUser();
                                window.location.href = '/';
                            }}
                        >
                            Logout
                        </button>
                    ) : (
                        <>
                            <NavLink to="/login" className="topnav__login">
                                Login
                            </NavLink>
                            <NavLink to="/register" className="topnav__btn topnav__register">
                                Register
                            </NavLink>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}