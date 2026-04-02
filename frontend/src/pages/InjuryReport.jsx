import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function InjuryReport() {
  const { id } = useParams();
  const { user } = useAuth();
  const [injury, setInjury] = useState(null);
  const [player, setPlayer] = useState(null);

  // Editable header fields
  const [completedBy, setCompletedBy] = useState('');
  const [phone, setPhone]             = useState('');
  const [email, setEmail]             = useState('');

  // Q6
  const [returnPlay, setReturnPlay] = useState('');
  // Q7
  const [braceWorn, setBraceWorn]   = useState('Unknown');
  const [braceSide, setBraceSide]   = useState('');
  const [tapeWorn, setTapeWorn]     = useState('Unknown');
  const [tapeSide, setTapeSide]     = useState('');
  const [otherEquip, setOtherEquip] = useState('');
  // Q9
  const [occurredDuring, setOccurredDuring] = useState('');
  const [gameType9, setGameType9]           = useState('');
  const [gamePeriod, setGamePeriod]         = useState('');
  const [specifyOther9, setSpecifyOther9]   = useState('');
  // Q10
  const [mechanism10, setMechanism10] = useState('');
  // Q12
  const [teamA, setTeamA]         = useState('');
  const [teamB, setTeamB]         = useState('');
  const [gameFormat, setGameFormat] = useState('');
  const [boardType, setBoardType]   = useState('');
  // Q13
  const [mechanism13, setMechanism13]     = useState('');
  const [headDirection, setHeadDirection] = useState('');
  const [fellDir, setFellDir]             = useState('');
  const [hitOn, setHitOn]                 = useState('');
  const [otherMech, setOtherMech]         = useState('');
  // Q14
  const [foulCalled, setFoulCalled]     = useState('');
  const [foulType, setFoulType]         = useState('');
  const [foulOther, setFoulOther]       = useState('');
  const [foulResult, setFoulResult]     = useState([]);
  const [foulBy, setFoulBy]             = useState('');
  // Q16
  const [safetyIssues, setSafetyIssues] = useState('');

  useEffect(() => {
    api.get(`/injuries/${id}`).then(r => {
      setInjury(r.data);
      api.get(`/players/${r.data.playerId}`).then(pr => setPlayer(pr.data));
    });
    setCompletedBy(user?.username || '');
  }, [id]);

  if (!injury) return <div style={{ padding: '2rem', color: '#333' }}>Loading...</div>;

  const today    = new Date().toISOString().split('T')[0];
  const injDate  = injury.gameDate ? new Date(injury.gameDate).toISOString().split('T')[0] : '';
  const playerName = injury.firstName ? `${injury.firstName} ${injury.lastName}` : '';
  const schoolName = player?.schoolName || '';

  // Map DB surface to form options
  const surfaceMap = {
    'Grass': 'Grass',
    'Turf - Outdoor': 'Turf - Outdoor',
    'Turf - Indoor': 'Turf - Indoor',
    'Indoor carpet': 'Indoor carpet',
    'Gym floor': 'Gym floor',
    'Outdoor': 'Turf - Outdoor',
    'Indoor': 'Turf - Indoor',
  };
  const dbSurface = surfaceMap[injury.surfaceType] || '';

  // Map DB status to form options
  const statusMap = {
    'New': 'New injury',
    'From this soccer season': 'Recurrence from this soccer season',
    'From previous': 'Recurrence from a previous soccer season',
  };
  const dbStatus = statusMap[injury.injuryStatus] || 'New injury';

  const toggleFoulResult = (val) =>
    setFoulResult(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

  const surfaces    = ['Grass', 'Turf - Outdoor', 'Turf - Indoor', 'Indoor carpet', 'Gym floor'];
  const positions   = ['Forward', 'Outside Mid', 'Centre Mid', 'Defense', 'Keeper'];
  const statuses    = ['New injury', 'Recurrence from this soccer season', 'Recurrence from a previous soccer season'];
  const foulResults = ['Free Kick', 'Penalty Kick', 'Yellow Card', 'Red Card', 'Suspension'];
  const foulBys     = ["Injured player", "Injured player's teammate", "Other team"];

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .report-page { padding: 0 !important; }
          .report-form { box-shadow: none !important; border: none !important; }
        }
        body { background: #f0f0f0; margin: 0; font-family: Arial, sans-serif; }
        input[type=text], input[type=tel], input[type=email], input[type=date], textarea {
          border: none; border-bottom: 1px solid #333; background: transparent;
          font-size: 0.9rem; padding: 2px 4px; width: 100%; outline: none; font-family: Arial, sans-serif;
        }
        textarea { border: 1px solid #ccc; padding: 6px; resize: vertical; }
      `}</style>

      {/* Action bar */}
      <div className="no-print" style={{ background: '#1a1a2e', padding: '0.75rem 2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <span style={{ color: '#e94560', fontWeight: 700, fontSize: '1rem' }}>CNSA</span>
        <span style={{ color: '#888', fontSize: '0.9rem', flex: 1 }}>Soccer Injury Report — {playerName}</span>
        <button onClick={() => window.print()} style={actionBtn('#2980b9')}>🖨 Print</button>
        <button onClick={() => window.print()} style={actionBtn('#27ae60')}>⬇ Download PDF</button>
        <button onClick={() => window.history.back()} style={actionBtn('#7f8c8d')}>← Back</button>
      </div>

      <div className="report-page" style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
        <div className="report-form" style={{ background: '#fff', padding: '2.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.15)', color: '#111' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #333', paddingBottom: '1rem' }}>
            <div style={{ width: 80, height: 80, background: '#e94560', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '1.4rem', flexShrink: 0 }}>CNSA</div>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.4rem', color: '#111' }}>Soccer Injury Report Form</h1>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#555', lineHeight: 1.4 }}>
                Please complete this form for any injury including suspected concussion occurring in soccer that receives medical attention,
                requires inability to complete the session, or results in the player missing at least one day of sporting activity.
              </p>
            </div>
          </div>

          {/* Completed by */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <Field label="Completed by:"><input type="text" value={completedBy} onChange={e => setCompletedBy(e.target.value)} /></Field>
            <Field label="Phone #:"><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} /></Field>
            <Field label="Email:"><input type="email" value={email} onChange={e => setEmail(e.target.value)} /></Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem' }}>

            {/* Q1 */}
            <Q num="1" label="Player name:">
              <input type="text" defaultValue={playerName} />
            </Q>

            {/* Q2 */}
            <Q num="2" label="Team Name:">
              <input type="text" defaultValue={schoolName} />
            </Q>

            {/* Q3 */}
            <Q num="3" label="Today's date:">
              <input type="date" defaultValue={today} />
            </Q>

            {/* Q4 */}
            <Q num="4" label="Injury date:">
              <input type="date" defaultValue={injDate} />
            </Q>
          </div>

          {/* Q5 */}
          <Q num="5" label="Injury status:">
            {statuses.map(st => (
              <CheckRow key={st} label={st} checked={dbStatus === st} readOnly />
            ))}
          </Q>

          {/* Q6 */}
          <Q num="6" label="Did the player return to play the same game/practice?">
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {['No', 'Yes', 'Non-soccer injury'].map(v => (
                <label key={v} style={checkLabel}><input type="radio" name="returnPlay" value={v} checked={returnPlay === v} onChange={e => setReturnPlay(e.target.value)} style={{ marginRight: 4 }} /> {v}</label>
              ))}
            </div>
          </Q>

          {/* Q7 */}
          <Q num="7" label="At the time of injury, were any of the following worn?">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 2rem' }}>
              <div>
                <strong style={subHead}>Brace:</strong>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: 4 }}>
                  {['Unknown', 'No', 'Yes'].map(v => (
                    <label key={v} style={checkLabel}><input type="radio" name="brace" value={v} checked={braceWorn === v} onChange={e => setBraceWorn(e.target.value)} style={{ marginRight: 4 }} /> {v}</label>
                  ))}
                </div>
                {braceWorn === 'Yes' && (
                  <div style={{ display: 'flex', gap: '1rem', marginTop: 4 }}>
                    {['Left side', 'Right side'].map(v => (
                      <label key={v} style={checkLabel}><input type="radio" name="braceSide" value={v} checked={braceSide === v} onChange={e => setBraceSide(e.target.value)} style={{ marginRight: 4 }} /> {v}</label>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <strong style={subHead}>Tape:</strong>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: 4 }}>
                  {['Unknown', 'No', 'Yes'].map(v => (
                    <label key={v} style={checkLabel}><input type="radio" name="tape" value={v} checked={tapeWorn === v} onChange={e => setTapeWorn(e.target.value)} style={{ marginRight: 4 }} /> {v}</label>
                  ))}
                </div>
                {tapeWorn === 'Yes' && (
                  <div style={{ display: 'flex', gap: '1rem', marginTop: 4 }}>
                    {['Left side', 'Right side'].map(v => (
                      <label key={v} style={checkLabel}><input type="radio" name="tapeSide" value={v} checked={tapeSide === v} onChange={e => setTapeSide(e.target.value)} style={{ marginRight: 4 }} /> {v}</label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ marginTop: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem' }}>Other: </span>
              <input type="text" value={otherEquip} onChange={e => setOtherEquip(e.target.value)} style={{ width: '60%' }} />
            </div>
          </Q>

          {/* Q8 */}
          <Q num="8" label="Position playing at time of injury:">
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              {positions.map(pos => {
                const playerPos = player?.positions || '';
                const pre = playerPos.toLowerCase().includes(pos.toLowerCase());
                return <CheckRow key={pos} label={pos} checked={pre} />;
              })}
            </div>
            <div style={{ marginTop: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem' }}>Other: </span>
              <input type="text" style={{ width: '50%' }} />
            </div>
          </Q>

          {/* Q9 */}
          <Q num="9" label="Injury occurred during:">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.3rem 1.5rem' }}>
              {['Game', 'Practice on field', 'Other'].map(v => (
                <label key={v} style={checkLabel}><input type="radio" name="occurred" value={v} checked={occurredDuring === v} onChange={e => setOccurredDuring(e.target.value)} style={{ marginRight: 4 }} /> {v}</label>
              ))}
              {['Regular season', 'Tournament', 'Playoff', 'Exhibition'].map(v => (
                <label key={v} style={checkLabel}><input type="radio" name="gameType9" value={v} checked={gameType9 === v} onChange={e => setGameType9(e.target.value)} style={{ marginRight: 4 }} /> {v}</label>
              ))}
              {['Warm-up', '1st half', '2nd half'].map(v => (
                <label key={v} style={checkLabel}><input type="radio" name="period" value={v} checked={gamePeriod === v} onChange={e => setGamePeriod(e.target.value)} style={{ marginRight: 4 }} /> {v}</label>
              ))}
            </div>
            <div style={{ marginTop: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem' }}>Please specify: </span>
              <input type="text" value={specifyOther9} onChange={e => setSpecifyOther9(e.target.value)} style={{ width: '55%' }} />
            </div>
          </Q>

          {/* Q10 */}
          <Q num="10" label="This injury involved:">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {['Sudden onset & contact with another player', 'Sudden onset & no contact with another player', 'Gradual onset / overuse', 'Unknown'].map(v => (
                <label key={v} style={checkLabel}><input type="radio" name="mechanism10" value={v} checked={mechanism10 === v} onChange={e => setMechanism10(e.target.value)} style={{ marginRight: 4 }} /> {v}</label>
              ))}
            </div>
          </Q>

          {/* Q11 */}
          <Q num="11" label="Surface of play:">
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              {surfaces.map(sf => (
                <CheckRow key={sf} label={sf} checked={dbSurface === sf} />
              ))}
            </div>
          </Q>

          {/* Q12 */}
          <Q num="12" label="Type of game:">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              <span>Team A</span>
              <input type="text" value={teamA} onChange={e => setTeamA(e.target.value)} style={{ width: 120 }} />
              <strong>vs</strong>
              <input type="text" value={teamB} onChange={e => setTeamB(e.target.value)} style={{ width: 120 }} />
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
              {['Outdoor', 'Indoor'].map(v => (
                <label key={v} style={checkLabel}><input type="radio" name="gameFormat" value={v} checked={gameFormat === v} onChange={e => setGameFormat(e.target.value)} style={{ marginRight: 4 }} /> {v}</label>
              ))}
              {['Boarded', 'Non-Boarded', 'Futsal'].map(v => (
                <label key={v} style={checkLabel}><input type="radio" name="boardType" value={v} checked={boardType === v} onChange={e => setBoardType(e.target.value)} style={{ marginRight: 4 }} /> {v}</label>
              ))}
            </div>
          </Q>

          {/* Q13 */}
          <Q num="13" label="Mechanism of injury:">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem 2rem' }}>
              <div>
                <label style={checkLabel}><input type="radio" name="mech13" value="Direct blow to head" checked={mechanism13 === 'Direct blow to head'} onChange={e => setMechanism13(e.target.value)} style={{ marginRight: 4 }} /> Direct blow to head</label>
                {mechanism13 === 'Direct blow to head' && (
                  <div style={{ display: 'flex', gap: '0.75rem', marginLeft: '1.25rem', marginTop: 4 }}>
                    {['Right','Left','Front','Back'].map(v => (
                      <label key={v} style={checkLabel}><input type="radio" name="headDir" value={v} checked={headDirection === v} onChange={e => setHeadDirection(e.target.value)} style={{ marginRight: 3 }} /> {v}</label>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label style={checkLabel}><input type="radio" name="mech13" value="Fell & hit head" checked={mechanism13 === 'Fell & hit head'} onChange={e => setMechanism13(e.target.value)} style={{ marginRight: 4 }} /> Fell &amp; hit head</label>
                {mechanism13 === 'Fell & hit head' && (
                  <div style={{ display: 'flex', gap: '0.75rem', marginLeft: '1.25rem', marginTop: 4 }}>
                    {['Back','Forward','Side'].map(v => (
                      <label key={v} style={checkLabel}><input type="radio" name="fellDir" value={v} checked={fellDir === v} onChange={e => setFellDir(e.target.value)} style={{ marginRight: 3 }} /> {v}</label>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label style={checkLabel}><input type="radio" name="mech13" value="Hit head on boards/post/net" checked={mechanism13 === 'Hit head on boards/post/net'} onChange={e => setMechanism13(e.target.value)} style={{ marginRight: 4 }} /> Hit head</label>
                {mechanism13 === 'Hit head on boards/post/net' && (
                  <div style={{ display: 'flex', gap: '0.75rem', marginLeft: '1.25rem', marginTop: 4 }}>
                    {['On boards','On post','On net'].map(v => (
                      <label key={v} style={checkLabel}><input type="radio" name="hitOn" value={v} checked={hitOn === v} onChange={e => setHitOn(e.target.value)} style={{ marginRight: 3 }} /> {v}</label>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label style={checkLabel}><input type="radio" name="mech13" value="Non-head injury" checked={mechanism13 === 'Non-head injury'} onChange={e => setMechanism13(e.target.value)} style={{ marginRight: 4 }} /> Non-head injury</label>
              </div>
            </div>
            <div style={{ marginTop: '0.4rem' }}>
              <span style={{ fontSize: '0.85rem' }}>Other: </span>
              <input type="text" value={otherMech} onChange={e => setOtherMech(e.target.value)} style={{ width: '55%' }} />
            </div>
          </Q>

          {/* Q14 */}
          <Q num="14" label="Was a foul called directly related to the injury event?">
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.5rem' }}>
              {['No', 'Yes'].map(v => (
                <label key={v} style={checkLabel}><input type="radio" name="foulCalled" value={v} checked={foulCalled === v} onChange={e => setFoulCalled(e.target.value)} style={{ marginRight: 4 }} /> {v}</label>
              ))}
            </div>
            {foulCalled === 'Yes' && (
              <>
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                  {['Body contact', 'Boarding', 'Head-contact'].map(v => (
                    <label key={v} style={checkLabel}><input type="radio" name="foulType" value={v} checked={foulType === v} onChange={e => setFoulType(e.target.value)} style={{ marginRight: 4 }} /> {v}</label>
                  ))}
                </div>
                <div style={{ marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.85rem' }}>Other: </span>
                  <input type="text" value={foulOther} onChange={e => setFoulOther(e.target.value)} style={{ width: '50%' }} />
                </div>
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                  {foulResults.map(v => (
                    <label key={v} style={checkLabel}><input type="checkbox" checked={foulResult.includes(v)} onChange={() => toggleFoulResult(v)} style={{ marginRight: 4 }} /> {v}</label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                  {foulBys.map(v => (
                    <label key={v} style={checkLabel}><input type="radio" name="foulBy" value={v} checked={foulBy === v} onChange={e => setFoulBy(e.target.value)} style={{ marginRight: 4 }} /> {v}</label>
                  ))}
                </div>
              </>
            )}
          </Q>

          {/* Q15 */}
          <Q num="15" label="Describe events surrounding injury:">
            <textarea rows={4} defaultValue={injury.notes || ''} style={{ width: '100%', marginTop: '0.25rem' }} />
          </Q>

          {/* Q16 */}
          <Q num="16" label="Describe any safety issues with the facility in use when injury occurred:">
            <textarea rows={3} value={safetyIssues} onChange={e => setSafetyIssues(e.target.value)} style={{ width: '100%', marginTop: '0.25rem' }} />
          </Q>

          {/* Footer */}
          <p style={{ fontSize: '0.75rem', color: '#777', borderTop: '1px solid #ccc', paddingTop: '0.75rem', marginTop: '1rem' }}>
            Soccer Injury Report Form – This digital version is interactive. You can click, type, print, and clear the form.
          </p>

          <div className="no-print" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={() => window.print()} style={actionBtn('#2980b9')}>🖨 Print Form</button>
            <button onClick={() => window.print()} style={actionBtn('#27ae60')}>⬇ Download PDF</button>
            <button onClick={() => window.location.reload()} style={actionBtn('#7f8c8d')}>↺ Clear Form</button>
          </div>

        </div>
      </div>
    </>
  );
}

function Q({ num, label, children }) {
  return (
    <div style={{ marginBottom: '1.1rem', borderBottom: '1px solid #eee', paddingBottom: '0.75rem' }}>
      <p style={{ margin: '0 0 0.4rem', fontWeight: 600, fontSize: '0.9rem' }}>{num}. {label}</p>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p style={{ margin: '0 0 2px', fontSize: '0.8rem', color: '#555', fontWeight: 600 }}>{label}</p>
      {children}
    </div>
  );
}

function CheckRow({ label, checked }) {
  const [val, setVal] = useState(checked);
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', cursor: 'pointer' }}>
      <input type="checkbox" checked={val} onChange={e => setVal(e.target.checked)} style={{ marginRight: 2 }} />
      {label}
    </label>
  );
}

const checkLabel = { display: 'flex', alignItems: 'center', fontSize: '0.85rem', cursor: 'pointer' };
const subHead    = { fontSize: '0.85rem', display: 'block', marginBottom: 2 };
const actionBtn  = (bg) => ({ background: bg, color: '#fff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' });
