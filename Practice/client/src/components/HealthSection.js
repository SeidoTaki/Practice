// HealthSection.js
import React from 'react';
import MyMeds from './MyMeds';
import MyCondition from './MyCondition';
import ActivityRating from './ActivityRating';

const HealthSection = ({ activeSection, user_id }) => {
  return (
    <div className="health-section">
      {activeSection === 'meds' && <MyMeds user_id={user_id} />}
      {activeSection === 'condition' && <MyCondition user_id={user_id} />}
      {activeSection === 'rating' && <ActivityRating user_id={user_id} />}
    </div>
  );
};

export default HealthSection;