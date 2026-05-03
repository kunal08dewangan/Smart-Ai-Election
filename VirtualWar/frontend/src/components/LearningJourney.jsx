import React, { useState } from 'react';

// --- Custom Interactive Components ---

function RegistrationSim() {
  const [voterId, setVoterId] = useState('');
  const [status, setStatus] = useState(null);

  const checkEligibility = () => {
    if (!voterId.trim()) {
       setStatus({ type: 'error', msg: 'Please enter a Voter ID!' });
       return;
    }
    
    const id = voterId.trim().toUpperCase();

    if (id === 'EV-2026-1001') {
      setStatus({ type: 'success', data: { name: 'Rohan Sharma', age: 25, state: 'Maharashtra', constituency: 'Pune', eligible: true } });
    } else if (id === 'EV-2026-1002') {
      setStatus({ type: 'success', data: { name: 'Priya Patel', age: 32, state: 'Gujarat', constituency: 'Surat', eligible: true } });
    } else if (id === 'EV-2026-1003') {
      setStatus({ type: 'error', msg: 'Name: Aryan Gupta, Age: 17, State: Delhi. Status: Not eligible (Under age).' });
    } else {
      setStatus({ type: 'error', msg: 'Voter ID not found in database. Please try EV-2026-1001.' });
    }
  };

  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '10px' }}>
      <h3 style={{color: '#00B4DB', marginBottom: '15px'}}>Fetch Details via Voter ID</h3>
      <input type="text" placeholder="Enter Voter ID (e.g. EV-2026-1001)" value={voterId} onChange={e=>setVoterId(e.target.value)} style={inputStyle} />
      <button onClick={checkEligibility} style={btnStyle}>Search Voter Details</button>
      
      {status && status.type === 'error' && (
        <div style={{ marginTop: '15px', padding: '10px', borderRadius: '5px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
          ❌ {status.msg}
        </div>
      )}

      {status && status.type === 'success' && (
        <div className="fade-in" style={{ marginTop: '15px', padding: '15px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.5)', color: '#e2e8f0', textAlign: 'left', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.1)' }}>
          <h4 style={{ color: '#4ade80', borderBottom: '1px solid rgba(34, 197, 94, 0.3)', paddingBottom: '8px', marginBottom: '12px', fontSize: '1.1rem' }}>✅ Verification Successful</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <p><strong>Name:</strong> {status.data.name}</p>
            <p><strong>Age:</strong> {status.data.age}</p>
            <p><strong>State:</strong> {status.data.state}</p>
            <p><strong>Constituency:</strong> {status.data.constituency}</p>
          </div>
          <div style={{ marginTop: '15px', background: 'linear-gradient(90deg, #16a34a, #22c55e)', color: 'white', padding: '8px 12px', borderRadius: '6px', display: 'inline-block', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
            Status: ELIGIBLE TO VOTE
          </div>
        </div>
      )}
    </div>
  );
}

function CampaigningSim() {
  const [activeMessage, setActiveMessage] = useState(null);
  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '10px' }}>
      <h3 style={{color: '#00B4DB', marginBottom: '15px'}}>Live Campaign Rallies</h3>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => setActiveMessage("🟦 Party A: 'We promise 100 new schools, better healthcare, and job creation for youth!'")} style={{...btnStyle, flex: 1, minWidth: '200px', background: '#3b82f6'}}>Attend Party A Rally</button>
        <button onClick={() => setActiveMessage("🟧 Party B: 'We promise infrastructure development, tax cuts, and agricultural growth!'")} style={{...btnStyle, flex: 1, minWidth: '200px', background: '#f59e0b'}}>Attend Party B Rally</button>
      </div>
      {activeMessage && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#1e293b', borderLeft: '4px solid #00B4DB', fontStyle: 'italic', borderRadius: '4px' }}>
          📢 {activeMessage}
        </div>
      )}
    </div>
  );
}

function VotingSim() {
  const [voted, setVoted] = useState(false);
  
  const handleVote = () => {
    setVoted(true);
  };

  return (
    <div style={{ background: '#cbd5e1', padding: '20px', borderRadius: '10px', color: '#0f172a' }}>
      <h3 style={{ marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>EVM (Electronic Voting Machine)</h3>
      {!voted ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={evmRowStyle}>
            <div style={{flex: 1, fontWeight: 'bold'}}>1. Party A (🟦)</div>
            <button onClick={handleVote} style={evmBtnStyle}></button>
          </div>
          <div style={evmRowStyle}>
            <div style={{flex: 1, fontWeight: 'bold'}}>2. Party B (🟧)</div>
            <button onClick={handleVote} style={evmBtnStyle}></button>
          </div>
          <div style={evmRowStyle}>
            <div style={{flex: 1, fontWeight: 'bold'}}>3. NOTA (❌)</div>
            <button onClick={handleVote} style={evmBtnStyle}></button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', color: '#b91c1c', fontWeight: 'bold', background: 'white', borderRadius: '8px' }}>
          <div style={{ fontSize: '3rem', animation: 'blink 1s infinite' }}>🔴</div>
          *BEEEEEP*<br/><br/>
          <span style={{ color: 'green' }}>Your vote has been recorded securely!</span>
        </div>
      )}
    </div>
  );
}

function ResultsSim() {
  const [revealed, setRevealed] = useState(false);
  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
      <h3 style={{color: '#00B4DB', marginBottom: '15px'}}>Election Results HQ</h3>
      {!revealed ? (
        <button onClick={() => setRevealed(true)} style={{...btnStyle, padding: '15px 30px', fontSize: '1.2rem', background: '#10b981'}}>Start Counting Votes</button>
      ) : (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{color: '#3b82f6', fontWeight: 'bold'}}>Party A (58%)</span>
            <span style={{color: '#f59e0b', fontWeight: 'bold'}}>Party B (42%)</span>
          </div>
          <div style={{ height: '30px', width: '100%', background: '#f59e0b', borderRadius: '15px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: '58%', background: '#3b82f6', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>WINNER</div>
          </div>
          <h2 style={{ marginTop: '20px', color: '#10b981' }}>🏆 Party A forms the Government!</h2>
        </div>
      )}
    </div>
  );
}

function CertificateSim() {
  return (
    <div style={{ background: 'rgba(255, 215, 0, 0.05)', padding: '20px', borderRadius: '10px', textAlign: 'center', border: '2px dashed rgba(250, 204, 21, 0.5)' }}>
      <h2 style={{color: '#facc15', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
        <span>🎓</span> Certificate of Participation
      </h2>
      <div style={{ background: '#ffffff', color: '#1e293b', padding: '30px', borderRadius: '12px', margin: '20px 0', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
        <h3 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', letterSpacing: '2px', color: '#64748b' }}>ELECTIONVERSE DEMO</h3>
        <p style={{ marginTop: '20px', fontSize: '1.1rem', color: '#64748b' }}>This certifies that</p>
        <h2 style={{ color: '#2563eb', margin: '15px 0', fontSize: '2rem' }}>Rohan Sharma</h2>
        <p style={{ fontWeight: 'bold', color: '#475569' }}>Voter ID: EV-2026-1001</p>
        <p style={{ marginTop: '15px' }}>Has successfully completed the Interactive Election Learning Journey.</p>
        
        <div style={{ textAlign: 'left', margin: '20px auto 0', display: 'inline-block', background: '#f8fafc', padding: '15px 25px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{marginBottom: '8px'}}>✅ Eligibility Verified (Age 18+)</div>
          <div style={{marginBottom: '8px'}}>✅ Face Verification Completed</div>
          <div style={{marginBottom: '8px'}}>✅ Polling Booth Found</div>
          <div>✅ Simulated Vote Cast securely</div>
        </div>
      </div>
      <p style={{color: '#cbd5e1', fontSize: '0.85rem'}}>*This final detail summarizes the entire user flow for your demo presentation.*</p>
    </div>
  );
}

function GenericSim({ title, message }) {
  const [done, setDone] = useState(false);
  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '10px', textAlign: 'center' }}>
      <h3 style={{color: '#00B4DB', marginBottom: '15px'}}>{title}</h3>
      <p style={{color: '#e2e8f0', marginBottom: '20px', fontSize: '1.1rem'}}>{message}</p>
      {!done ? (
        <button style={{...btnStyle, width: 'auto', padding: '10px 30px'}} onClick={() => setDone(true)}>Acknowledge & Proceed</button>
      ) : (
        <div style={{color: '#4ade80', fontWeight: 'bold', marginTop: '10px'}}>✅ Action Completed Successfully!</div>
      )}
    </div>
  );
}

// --- Main Component ---

function LearningJourney({ role }) {
  const [activeStep, setActiveStep] = useState(null);

  const getJourneySteps = (currentRole) => {
    if (currentRole === 'Election Officer') {
      return [
        { id: 'eo_1', title: "1. Duty Allocation", desc: "Get your assigned polling station and collect EVMs/VVPATs.", icon: "📋", btnText: "View Allocation" },
        { id: 'eo_2', title: "2. Verify Voters", desc: "Check incoming voter IDs against the electoral roll.", icon: "✅", btnText: "Start Verification" },
        { id: 'eo_3', title: "3. Monitor EVM", desc: "Ensure smooth voting process and seal machines post-poll.", icon: "🗳️", btnText: "Monitor Booth" },
        { id: 'eo_4', title: "4. Counting & Results", desc: "Transparent vote counting and declaration.", icon: "📊", btnText: "View Live Results" }
      ];
    } else if (currentRole === 'Candidate') {
      return [
        { id: 'can_1', title: "1. File Nomination", desc: "Submit your candidacy papers and affidavit to the EC.", icon: "📝", btnText: "File Papers" },
        { id: 'can_2', title: "2. Campaign Management", desc: "Host rallies, manage budget, and distribute manifestos.", icon: "📢", btnText: "Manage Campaign" },
        { id: 'can_3', title: "3. Booth Monitoring", desc: "Deploy polling agents and monitor voter turnout live.", icon: "👀", btnText: "Monitor Turnout" },
        { id: 'can_4', title: "4. Counting & Results", desc: "Monitor counting tables and await the final declaration.", icon: "📊", btnText: "View Live Results" }
      ];
    } else {
      // Default: First-Time Voter
      return [
        { id: 1, title: "1. Registration ✅", desc: "Create your Voter ID and verify your eligibility to vote.", icon: "🪪", btnText: "Start Registration" },
        { id: 2, title: "2. Campaigning 📢", desc: "Candidates promote their vision. Voters learn about the issues.", icon: "📢", btnText: "Attend Rallies" },
        { id: 3, title: "3. Voting Day 🗳️", desc: "Identity verification and using the EVM at the polling booth.", icon: "🗳️", btnText: "Enter Polling Booth" },
        { id: 4, title: "4. Counting & Results 🧾", desc: "Transparent vote counting and declaration of the winner.", icon: "📊", btnText: "View Live Results" },
        { id: 5, title: "5. Voter Certificate 🎓", desc: "Get your digital certificate for completing the demo.", icon: "📜", btnText: "Get Certificate" }
      ];
    }
  };

  const currentSteps = getJourneySteps(role);

  const renderSim = (step) => {
    switch(step.id) {
      // Voter
      case 1: return <RegistrationSim />;
      case 2: return <CampaigningSim />;
      case 3: return <VotingSim />;
      case 4: return <ResultsSim />;
      case 5: return <CertificateSim />;
      
      // Election Officer
      case 'eo_1': return <GenericSim title="Duty Allocation" message="You have been assigned as Presiding Officer for Booth #42. Please collect EVMs, VVPATs, and Electoral Rolls." />;
      case 'eo_2': return <GenericSim title="Verify Voters" message="Simulation: Scanning Voter ID EV-2026-1001... Verified! Match found in Electoral Roll." />;
      case 'eo_3': return <GenericSim title="Monitor EVM" message="Booth #42 is operating smoothly. 142 votes cast so far. No EVM malfunctions reported." />;
      case 'eo_4': return <ResultsSim />;

      // Candidate
      case 'can_1': return <GenericSim title="File Nomination" message="Your nomination papers and Form 26 (Affidavit) have been successfully submitted and verified." />;
      case 'can_2': return <GenericSim title="Campaign Management" message="Your upcoming mega-rally is scheduled for tomorrow at Main Square. Campaign budget updated." />;
      case 'can_3': return <GenericSim title="Booth Monitoring" message="Live Update from Polling Agents: 60% voter turnout recorded at your key constituencies." />;
      case 'can_4': return <ResultsSim />;

      default: return null;
    }
  };

  return (
    <div className="learning-journey fade-in" style={{ position: 'relative' }}>
      <div style={{marginBottom: '2rem'}}>
        <h2 style={{fontSize: '2rem', marginBottom: '0.5rem', color: '#00B4DB'}}>Your Election Journey</h2>
        <p style={{color: 'var(--text-muted)'}}>
          Interactive simulation tailored for: <strong style={{color: 'white', background: '#3b82f6', padding: '2px 8px', borderRadius: '4px'}}>{role}</strong>
        </p>
      </div>

      <div className="card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        {currentSteps.map(step => (
          <div 
            key={step.id} 
            className="learning-card glass-panel" 
            onClick={() => setActiveStep(step)}
            style={{ 
              cursor: 'pointer', 
              transition: 'transform 0.2s, boxShadow 0.2s',
              border: '1px solid rgba(0, 180, 219, 0.3)',
              background: 'rgba(0, 180, 219, 0.05)',
              padding: '20px',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div className="card-icon" style={{ fontSize: '2rem', marginBottom: '10px' }}>{step.icon}</div>
            <h3 className="card-title" style={{ fontSize: '1.2rem', marginBottom: '10px' }}>{step.title}</h3>
            <p className="card-desc" style={{ fontSize: '0.9rem', color: '#cbd5e1', flex: 1 }}>{step.desc}</p>
            <button style={{
              marginTop: '15px', 
              background: 'linear-gradient(135deg, #00B4DB 0%, #0083B0 100%)', 
              border: 'none', 
              padding: '10px 16px', 
              borderRadius: '20px', 
              color: 'white', 
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              width: '100%'
            }}>
              {step.btnText}
            </button>
          </div>
        ))}
      </div>

      {/* Modal for Interactive Simulation */}
      {activeStep && (
        <div style={modalStyles.overlay} onClick={() => setActiveStep(null)}>
          <div style={modalStyles.content} onClick={e => e.stopPropagation()}>
            <button style={modalStyles.closeBtn} onClick={() => setActiveStep(null)}>✕</button>
            <h2 style={{ color: '#00B4DB', marginBottom: '10px', fontSize: '1.8rem' }}>{activeStep.title}</h2>
            <p style={{ marginBottom: '20px', color: '#e2e8f0', lineHeight: '1.5' }}>{activeStep.desc}</p>
            
            <div style={modalStyles.videoWrapper}>
              {renderSim(activeStep)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Styles ---

const inputStyle = {
  width: '100%',
  padding: '12px',
  marginBottom: '15px',
  borderRadius: '8px',
  border: '1px solid #00B4DB',
  background: 'rgba(0,0,0,0.5)',
  color: 'white',
  outline: 'none',
  fontSize: '1rem',
  boxSizing: 'border-box'
};

const btnStyle = {
  width: '100%',
  padding: '12px',
  background: 'linear-gradient(135deg, #00B4DB 0%, #0083B0 100%)',
  color: 'white',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '1rem',
  transition: 'transform 0.1s'
};

const evmRowStyle = {
  display: 'flex', 
  alignItems: 'center', 
  background: 'white', 
  padding: '15px 20px', 
  border: '1px solid #94a3b8', 
  borderRadius: '8px',
  fontSize: '1.2rem'
};

const evmBtnStyle = {
  width: '35px', 
  height: '35px', 
  background: '#3b82f6', 
  borderRadius: '50%', 
  border: '4px solid #1e40af', 
  cursor: 'pointer',
  boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
  transition: 'background 0.1s'
};

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  content: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    border: '1px solid #00B4DB',
    borderRadius: '20px',
    padding: '30px',
    maxWidth: '600px',
    width: '90%',
    position: 'relative',
    boxShadow: '0 20px 50px rgba(0, 180, 219, 0.2)',
  },
  closeBtn: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '24px',
    cursor: 'pointer',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)'
  },
  videoWrapper: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '10px',
    padding: '1px',
    marginTop: '20px'
  }
};

export default LearningJourney;
