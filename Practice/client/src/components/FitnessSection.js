import React from 'react';
import ActivitySummary from './ActivitySummary';
import WorkoutPlan from './WorkoutPlan';
import NewExercises from './NewExercises';

const FitnessSection = ({ activeSection, user_id }) => {
  return (
    <div className="fitness-section">
      {activeSection === 'activity' && <ActivitySummary user_id={user_id} />}
      {activeSection === 'workout' && <WorkoutPlan user_id={user_id} />}
      {activeSection === 'new' && <NewExercises user_id={user_id} />}
    </div>
  );
};

export default FitnessSection;