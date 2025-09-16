
import { useState, useRef, useEffect } from 'react';
import { Wheel } from 'react-custom-roulette';
import './App.css';

// Mendefinisikan tipe data untuk objek di dalam roda putar
interface WheelData {
  option: string;
}

function App() {
  // --- STATE MANAGEMENT ---
  const [membersInput, setMembersInput] = useState<string>('Budi, Ani, Candra, Desi, Eka, Fajar, Gita, Hani, Ilham, Joko');
  const [sequenceInput, setSequenceInput] = useState<string>('');
  const [groupCount, setGroupCount] = useState<number>(3);
  const [error, setError] = useState<string>('');

  // State untuk permainan
  const [isGameReady, setIsGameReady] = useState<boolean>(false);
  const [availableMembers, setAvailableMembers] = useState<string[]>([]);
  const [finalGroups, setFinalGroups] = useState<string[][]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState<number>(0);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  
  // State untuk Mode Sutradara
  const [predeterminedSequence, setPredeterminedSequence] = useState<string[]>([]);
  const [sequenceIndex, setSequenceIndex] = useState<number>(0);

  // State untuk komponen Wheel
  const [mustSpin, setMustSpin] = useState<boolean>(false);
  const [prizeNumber, setPrizeNumber] = useState<number>(0);
  const [wheelData, setWheelData] = useState<WheelData[]>([]);

  // State untuk UI & Responsivitas
  const [showResultAnimation, setShowResultAnimation] = useState<boolean>(false);
  const [wheelSize, setWheelSize] = useState<number>(420);
  const resultRef = useRef<HTMLDivElement>(null);

  // useEffect untuk mendeteksi dan menyesuaikan ukuran roda
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 576) setWheelSize(300);
      else if (window.innerWidth <= 992) setWheelSize(380);
      else setWheelSize(420);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // useEffect untuk auto-scroll ke hasil
  useEffect(() => {
    if (showResultAnimation && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showResultAnimation]);


  const prepareGame = (): void => {
    setError('');
    const allMembers = membersInput.split(',').map(name => name.trim()).filter(Boolean);
    const sequence = sequenceInput.split(',').map(name => name.trim()).filter(Boolean);

    if (allMembers.length < 1) {
      setError("Daftar semua anggota tidak boleh kosong.");
      return;
    }
    
    setLastResult(null);
    setIsFinished(false);
    setShowResultAnimation(false);
    setSequenceIndex(0);

    // PRIORITAS 1: Mode Sutradara (Urutan Ditentukan)
    if (sequence.length > 0) {
      const allMembersSet = new Set(allMembers);
      for (const seqMember of sequence) {
        if (!allMembersSet.has(seqMember)) {
          setError(`Anggota "${seqMember}" dalam urutan tidak ditemukan di daftar utama.`);
          return;
        }
      }
      if (sequence.length !== allMembers.length) {
          setError(`Jumlah anggota dalam urutan (${sequence.length}) harus sama dengan jumlah anggota utama (${allMembers.length}).`);
          return;
      }
      
      setPredeterminedSequence(sequence);
      setAvailableMembers(allMembers);
      setFinalGroups(Array.from({ length: groupCount }, () => []));
      setWheelData(allMembers.map(member => ({ option: member })));
      setCurrentGroupIndex(0);
    } 
    
    // PRIORITAS 3: Mode Acak Penuh
    else {
      setPredeterminedSequence([]);
      setAvailableMembers(allMembers);
      setFinalGroups(Array.from({ length: groupCount }, () => []));
      setWheelData(allMembers.map(member => ({ option: member })));
      setCurrentGroupIndex(0);
    }

    setIsGameReady(true);
  };

  const handleSpinClick = (): void => {
    if (availableMembers.length > 0 && !mustSpin) {
      setShowResultAnimation(false);
      let newPrizeNumber = 0;

      if (predeterminedSequence.length > 0) {
        // Mode Sutradara: Tentukan hasil spin
        const nextWinner = predeterminedSequence[sequenceIndex];
        const winnerIndexOnWheel = availableMembers.findIndex(m => m === nextWinner);

        if (winnerIndexOnWheel === -1) {
          setError(`Error: ${nextWinner} seharusnya ada di roda tapi tidak ditemukan.`);
          return;
        }
        newPrizeNumber = winnerIndexOnWheel;
        setSequenceIndex(prev => prev + 1);
      } else {
        // Mode Normal: Acak seperti biasa
        newPrizeNumber = Math.floor(Math.random() * availableMembers.length);
      }
      
      setPrizeNumber(newPrizeNumber);
      setMustSpin(true);
    }
  };

  const onStopSpinning = (): void => {
    const selectedMember = availableMembers[prizeNumber];
    setLastResult(selectedMember);
    setMustSpin(false);
    setShowResultAnimation(true);

    const newFinalGroups = [...finalGroups];
    newFinalGroups[currentGroupIndex].push(selectedMember);
    setFinalGroups(newFinalGroups);
    
    setCurrentGroupIndex((prevIndex) => (prevIndex + 1) % groupCount);

    const newAvailableMembers = availableMembers.filter(m => m !== selectedMember);
    setAvailableMembers(newAvailableMembers);
    setWheelData(newAvailableMembers.map(member => ({ option: member })));

    if (newAvailableMembers.length === 0) {
      setIsFinished(true);
    }
  };

  const resetGame = (): void => { setIsGameReady(false); };
  
  const handleMembersChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => setMembersInput(e.target.value);
  const handleSequenceChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => setSequenceInput(e.target.value);
  const handleGroupCountChange = (e: React.ChangeEvent<HTMLInputElement>): void => setGroupCount(Number(e.target.value));

  const remainingText = `${availableMembers.length} anggota tersisa`;

  return (
    <div className="app-wrapper">
      <div className="container">
        <header>
          <h1>Wheel of Groups</h1>
          <p>Aplikasi pembagi grup yang interaktif & modern.</p>
        </header>

        {!isGameReady ? (
          <section className="setup-area">
            <div className="input-group">
              <label htmlFor="members">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.41-1.412A6.97 6.97 0 0010 11c-2.236 0-4.233.94-5.535 2.493z" /></svg>
                Daftar Semua Anggota
              </label>
              <textarea id="members" value={membersInput} onChange={handleMembersChange} rows={4} placeholder="Pisahkan dengan koma..."/>
            </div>

            <div className="input-group">
              <label htmlFor="sequenceInput">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M11.983 1.932a.75.75 0 00-1.066 1.066l1.25 1.25a.75.75 0 001.066-1.066l-1.25-1.25zM15.139 3.361a.75.75 0 00-1.06-1.06l-1.061 1.06a.75.75 0 101.06 1.06l1.06-1.06zM17 10a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0117 10zM16.199 15.14a.75.75 0 00-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM12.75 18.25a.75.75 0 011.5 0v1.5a.75.75 0 01-1.5 0v-1.5zM10 17a.75.75 0 00-.75.75v1.5a.75.75 0 001.5 0v-1.5a.75.75 0 00-.75-.75zM5.861 16.199a.75.75 0 00-1.06 1.06l1.06 1.06a.75.75 0 101.06-1.06l-1.06-1.06zM3.801 12.75a.75.75 0 010-1.5h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 010 1.5zM4.801 5.861a.75.75 0 00-1.06-1.06L2.68 5.86a.75.75 0 101.06 1.061l1.06-1.06zM8 3a.75.75 0 01.75-.75h1.5a.75.75 0 010 1.5h-1.5A.75.75 0 018 3zM6.5 6.25a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0zM10 9.25a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" /></svg>
                Urutan Hasil Spin (Mode Sutradara)
              </label>
              <textarea id="sequenceInput" value={sequenceInput} onChange={handleSequenceChange} rows={3} placeholder="Prioritas tertinggi. Urutkan semua nama di sini."/>
            </div>

            <div className="input-group">
              <label htmlFor="groupCount">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM1 15a1 1 0 011-1h16a1 1 0 110 2H2a1 1 0 01-1-1z" /></svg>
                Jumlah Total Grup
              </label>
              <input type="number" id="groupCount" value={groupCount} onChange={handleGroupCountChange} min="1" className="small-input"/>
            </div>
            {error && <div className="error-message">{error}</div>}
            <button onClick={prepareGame} className="prepare-button">
              Mulai & Siapkan Roda
            </button>
          </section>
        ) : (
          <section className="game-area">
            <div className="wheel-wrapper">
              <div className="wheel-pointer"></div>
              {wheelData.length > 0 ? (
                 <Wheel
                  mustStartSpinning={mustSpin}
                  prizeNumber={prizeNumber}
                  data={wheelData}
                  onStopSpinning={onStopSpinning}
                  width={wheelSize}
                  height={wheelSize}
                  backgroundColors={['#B369DF', '#542095', '#FFCE2B', '#57F287']}
                  textColors={['#FFFFFF', '#363636']}
                  outerBorderWidth={10}
                  radiusLineWidth={0}
                  outerBorderColor={'#363636'}
                  spinDuration={0.8}
                  fontSize={16}
                  fontWeight="bold"
                  pointerToBaseColor={false}
                />
              ) : (
                <div className="empty-wheel-placeholder" style={{ width: `${wheelSize}px`, height: `${wheelSize}px` }}>
                  <p>Semua anggota sudah terpilih!</p>
                  <img src="https://img.icons8.com/plasticine/100/000000/confetti.png" alt="Selesai" />
                </div>
              )}
             
              {!isFinished && (
                <div className="spin-button-wrapper">
                  <button onClick={handleSpinClick} disabled={mustSpin || availableMembers.length === 0} className="prepare-button spin-button">
                    {mustSpin ? 'Berputar...' : 'Putar Roda!'}
                  </button>
                  <p className="remaining-text">{remainingText}</p>
                </div>
              )}
            </div>

            <div className="results-wrapper">
              {lastResult && showResultAnimation && (
                <div ref={resultRef} className="last-result-box show-animation">
                  <p className="result-label">Terpilih!</p>
                  <strong className="result-name">{lastResult}</strong>
                </div>
              )}
              {isFinished && (
                <div className="finished-box">
                  <h2>Permainan Selesai!</h2>
                  <p>Semua anggota telah mendapatkan grup. Klik "Atur Ulang" untuk memulai lagi.</p>
                </div>
              )}
              <h2>Hasil Pembagian Grup</h2>
              <div className="groups-container">
                {finalGroups.map((group, index) => (
                  <div key={index} className="group-card">
                    <div className="group-card-header">
                      <h3>Grup {index + 1}</h3>
                      <span className="member-count">{group.length} anggota</span>
                    </div>
                    <ul>
                      {group.map((member) => (
                        <li key={member}>{member}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <button onClick={resetGame} className="reset-button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M15.312 11.424a5.25 5.25 0 01-9.356 3.076l-1.5 1.5a.75.75 0 01-1.06-1.06l1.5-1.5a5.25 5.25 0 119.416-3.116z" clipRule="evenodd" /><path fillRule="evenodd" d="M6.343 11.03a.75.75 0 01-1.06-1.06l-1.5 1.5a.75.75 0 010 1.06l1.5 1.5a.75.75 0 11-1.06-1.06l-1.03-1.03a3.75 3.75 0 10-4.342-4.342 3.75 3.75 0 004.342 4.342l1.03 1.03z" clipRule="evenodd" /></svg>
                Atur Ulang
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default App;