import React, { useState } from 'react';

const simulationSteps = [
  { id: 1, title: "Enter Polling Booth", icon: "🏫", desc: "Welcome to the booth. Please proceed to the first officer." },
  { id: 2, title: "Show ID Verification", icon: "🪪", desc: "Show your Voter ID or alternative approved identification." },
  { id: 3, title: "Get Verified", icon: "✅", desc: "Your name is checked in the voter list, and your finger is marked with indelible ink." },
  { id: 4, title: "Use EVM Machine", icon: "🗳️", desc: "Press the blue button next to your chosen candidate's symbol on the Electronic Voting Machine." },
  { id: 5, title: "Confirm via VVPAT", icon: "📄", desc: "Look at the VVPAT window for 7 seconds to verify your printed slip." },
  { id: 6, title: "Submit Vote", icon: "✔️", desc: "Your vote has been securely recorded! Thank you for participating in democracy." }
];

function SimulationMode() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleNext = () => {
    if (currentStep < simulationSteps.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setIsCompleted(false);
  };

  const currentStepData = simulationSteps.find(s => s.id === currentStep);

  return (
    <div className="simulation-container fade-in">
      <div style={{marginBottom: '2rem'}}>
        <h2 style={{fontSize: '2rem', marginBottom: '0.5rem'}}>Voting Simulation</h2>
        <p style={{color: 'var(--text-muted)'}}>Experience the step-by-step process of casting a vote.</p>
      </div>

      <div className="step-indicator">
        {simulationSteps.map(step => (
          <div 
            key={step.id} 
            className={`step-dot ${step.id <= currentStep ? 'active' : ''}`}
            title={step.title}
          />
        ))}
      </div>

      <div className="sim-box glass-panel">
        {!isCompleted ? (
          <>
            <div className="sim-icon">{currentStepData.icon}</div>
            <h3 style={{fontSize: '1.5rem', color: 'var(--primary)'}}>{currentStepData.title}</h3>
            <p style={{color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6'}}>
              {currentStepData.desc}
            </p>
            
            <button className="btn-primary" onClick={handleNext}>
              {currentStep === simulationSteps.length ? "Finish Simulation" : "Proceed to Next Step"}
            </button>
          </>
        ) : (
          <>
            <div className="sim-icon" style={{animation: 'none'}}>🎉</div>
            <h3 style={{fontSize: '1.5rem', color: 'var(--success)'}}>Simulation Complete!</h3>
            <p style={{color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6'}}>
              You have successfully completed the voting process. Remember, every vote counts!
            </p>
            <button className="btn-primary" onClick={handleReset}>
              Restart Simulation
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default SimulationMode;
