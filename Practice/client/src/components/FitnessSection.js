import React from 'react';
import ActivitySummary from './ActivitySummary';
import WorkoutPlan from './WorkoutPlan';
import NewExercises from './NewExercises';

const FitnessSection = ({ activeSection }) => {
  return (
    <div className="fitness-section">
      {activeSection === 'activity' && <ActivitySummary />}
      {activeSection === 'workout' && <WorkoutPlan />}
      {activeSection === 'new' && <NewExercises />}
    </div>
  );
};

export default FitnessSection;