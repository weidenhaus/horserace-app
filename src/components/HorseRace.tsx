import React, { useEffect, useState, useRef } from "react";
import "../index.css";

interface Horse {
  id: number;
  name: string;
  position: number;
  speed: number;
  color: string;
}

const HorseRace: React.FC = () => {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [raceInProgress, setRaceInProgress] = useState(false);
  const [winner, setWinner] = useState<Horse | null>(null);
  const [commentary, setCommentary] = useState<string>(
    "Welcome to the horse race!"
  );
  const [raceLength, setRaceLength] = useState(1000);
  const [connected, setConnected] = useState(false);
  const [rawData, setRawData] = useState<any[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Connect to SSE endpoint
    eventSourceRef.current = new EventSource(
      `${import.meta.env.VITE_API_ENDPOINT}/events`
    );

    eventSourceRef.current.onopen = () => {
      setConnected(true);
    };

    eventSourceRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case "init":
          setHorses(data.horses);
          setRaceInProgress(data.raceInProgress);
          setRaceLength(data.raceLength);
          break;
        case "raceStart":
          setHorses(data.horses);
          setRaceInProgress(true);
          setWinner(null);
          setCommentary(data.message);
          break;
        case "raceUpdate":
          setRawData(data.horses);
          setHorses(data.horses);
          break;
        case "commentary":
          setCommentary(data.message);
          break;
        case "raceEnd":
          setRaceInProgress(false);
          setWinner(data.winner);
          setCommentary(data.message);
          break;
      }
    };

    eventSourceRef.current.onerror = () => {
      setConnected(false);
      eventSourceRef.current?.close();
    };

    return () => {
      eventSourceRef.current?.close();
    };
  }, []);

  const startRace = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_ENDPOINT}/start-race`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        console.error("Failed to start race");
      }
    } catch (error) {
      console.error("Error starting race:", error);
    }
  };

  return (
    <div className="horse-race-container">
      <h1>Virtual Horse Racing</h1>
      <p>
        Tech demo for SSE (Server-Sent Events) by Steffen Weidenhaus. Make sure
        to open it in several browser sessions at once.
      </p>
      <p>
        Each horse has a random speed and the first to reach the finish line
        wins.
      </p>
      <a href="https://github.com/weidenhaus/horserace">
        Check out the code on GitHub
      </a>
      <div className="connection-status">
        {connected ? "🟢 Connected" : "🔴 Disconnected"}
      </div>

      <div className="race-track">
        {horses.map((horse) => (
          <div key={horse.id} className="track-lane">
            <div className="lane-name">{horse.name}</div>
            <div className="lane-track">
              <div
                className="horse"
                style={{
                  left: `${(horse.position / raceLength) * 100}%`,
                  backgroundColor: horse.color,
                }}
              >
                🐎
              </div>
              <div className="finish-line"></div>
            </div>
          </div>
        ))}
      </div>

      <div className="commentary-box">
        <h3>Race Commentary</h3>
        <p>{commentary}</p>
      </div>

      {winner && (
        <div className="winner-announcement">
          <h2>🏆 {winner.name} has won the race! 🏆</h2>
        </div>
      )}

      <button
        onClick={startRace}
        disabled={raceInProgress}
        className="start-button"
      >
        {raceInProgress ? "Race in progress..." : "Start Race"}
      </button>

      {rawData.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Position</th>
              <th>Speed</th>
            </tr>
          </thead>
          <tbody>
            {rawData &&
              rawData.map((horse: Horse) => (
                <tr key={horse.id}>
                  <td>{horse.name}</td>
                  <td>{horse.position}</td>
                  <td>{horse.speed}</td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default HorseRace;
