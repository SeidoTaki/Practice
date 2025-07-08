import React from 'react';
import MyMeds from './MyMeds';
import MyCondition from './MyCondition';
import ActivityRating from './ActivityRating';

const HealthSection = ({ activeSection }) => {
  return (
    <div className="health-section">
      {activeSection === 'meds' && <MyMeds />}
      {activeSection === 'condition' && <MyCondition />}
      {activeSection === 'rating' && <ActivityRating />}
    </div>
  );
};

export default HealthSection;