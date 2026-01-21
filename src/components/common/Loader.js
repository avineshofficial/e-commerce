import React from 'react';
import '../../styles/Loader.css';

/**
 * Reusable Loader Component
 * @param {string} text - Optional text to display below spinner (default: "Loading...")
 * @param {boolean} fullScreen - If true, centers in viewport/container vertically (default: true)
 */
const Loader = ({ text = "Loading...", fullScreen = true }) => {
  return (
    <div className={fullScreen ? "loader-container-full" : "loader-container-inline"}>
      <div className="spinner"></div>
      {text && <div className="loading-text">{text}</div>}
    </div>
  );
};

export default Loader;