  import React from 'react';

const StatCard = ({ title, value, color = '#667eea' }) => {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <h3>{title}</h3>
      </div>
      <div className="stat-value" style={{ color }}>
        {value}
      </div>
    </div>
  );
};

export default StatCard;