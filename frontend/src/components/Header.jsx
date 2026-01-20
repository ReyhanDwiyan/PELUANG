import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { storage } from "../utils/auth";
import "../styles/Header.css";

export default function Header() {
    const location = useLocation();
    const isAuthenticated = storage.isAuthenticated();
    // Tambahan: Cek apakah user adalah admin
    const isAdmin = storage.isAdmin(); 
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY < 10) {
                // Selalu tampilkan di top
                setIsVisible(true);
            } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
                // Scroll ke bawah & sudah lewat 80px → hide
                setIsVisible(false);
            } else if (currentScrollY < lastScrollY) {
                // Scroll ke atas → show
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [lastScrollY]);

    return (
        <header className={`topnav ${isVisible ? 'topnav--visible' : 'topnav--hidden'}`}>
            <div className="topnav__inner">
                <NavLink to={isAuthenticated ? "/dashboard" : "/"} className="topnav__brand">
                    <img 
                        src="/images/logo-peluang.png" 
                        alt="Peluang Logo" 
                        className="topnav__logo"
                    />
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
                        <NavLink to="/history" className={({ isActive }) => (isActive ? "isActive" : "")}>
                            Riwayat
                        </NavLink>
                        
                        {/* PERUBAHAN DI SINI: Hanya render jika isAdmin bernilai true */}
                        {isAdmin && (
                            <NavLink to="/admin" className={({ isActive }) => (isActive ? "isActive" : "")}>
                                Admin Panel
                            </NavLink>
                        )}
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