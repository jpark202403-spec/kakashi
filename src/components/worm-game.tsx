"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

type ColorKey = "red" | "orange" | "yellow" | "blue";

interface WormConfig {
  key: ColorKey;
  label: string;
  twBg: string;
  twBorder: string;
  twText: string;
  colorCode: string;
  koreanName: string;
}

const WORMS: WormConfig[] = [
  {
    key: "red",
    label: "빨강\n색",
    twBg: "bg-red-500",
    twBorder: "border-red-600",
    twText: "text-red-700",
    colorCode: "#ef4444",
    koreanName: "빨간색",
  },
  {
    key: "orange",
    label: "주황\n색",
    twBg: "bg-orange-500",
    twBorder: "border-orange-600",
    twText: "text-orange-700",
    colorCode: "#f97316",
    koreanName: "주황색",
  },
  {
    key: "yellow",
    label: "노란\n색",
    twBg: "bg-yellow-400",
    twBorder: "border-yellow-500",
    twText: "text-yellow-700",
    colorCode: "#eab308",
    koreanName: "노란색",
  },
  {
    key: "blue",
    label: "파란\n색",
    twBg: "bg-blue-500",
    twBorder: "border-blue-600",
    twText: "text-blue-700",
    colorCode: "#3b82f6",
    koreanName: "파란색",
  },
];

interface Point {
  x: number;
  y: number;
}

interface WormState {
  body: Point[];
  color: ColorKey;
  alive: boolean;
  isPlayer: boolean;
  direction: Point;
  hasReachedGoal: boolean;
  goalRank?: number;
}

interface SheetRecord {
  row?: number;
  timestamp: string; // 게임 시작 시간
  name: string; // 1등 도착한 색깔 (요청: 구글 시트의 name에 1등 도착 색깔 표시)
  arrival: string; // 도착 시간
  finishTime: string; // 도착에 걸린 시간
}

const GRID_SIZE = 20;

export default function WormGame() {
  const [screen, setScreen] = useState<
    "name_input" | "menu" | "loading_path" | "playing" | "game_over" | "records"
  >("name_input");

  const [playerName, setPlayerName] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<ColorKey>("red");
  const [records, setRecords] = useState<SheetRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);

  // Game state
  const [pathTrack, setPathTrack] = useState<Point[]>([]);
  const [goal, setGoal] = useState<Point>({ x: 18, y: 18 });
  const [worms, setWorms] = useState<WormState[]>([]);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [startTimeStr, setStartTimeStr] = useState<string>("");
  const [gameResult, setGameResult] = useState<{
    firstColorName: string;
    playerRank: number;
    isPlayerFirst: boolean;
    time: number;
    arrivalStr: string;
    startTimeStr: string;
  } | null>(null);

  // References
  const directionRef = useRef<Point>({ x: 1, y: 0 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const loopRef = useRef<NodeJS.Timeout | null>(null);
  const wormsRef = useRef<WormState[]>([]);
  const goalRef = useRef<Point>({ x: 18, y: 18 });
  const firstArrivedColorRef = useRef<string | null>(null);
  const arrivalCountRef = useRef<number>(0);

  wormsRef.current = worms;
  goalRef.current = goal;

  // READ: 구글 시트에서 기록 불러오기
  const fetchRecords = useCallback(async () => {
    setIsLoadingRecords(true);
    try {
      const res = await fetch("/api/records?action=read");
      const data = await res.json();
      if (data && Array.isArray(data.records)) {
        setRecords(data.records);
      }
    } catch (err) {
      console.error("구글 시트 기록 로드 실패:", err);
    } finally {
      setIsLoadingRecords(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // DELETE / CLEAR: [기록 초기화] 버튼 클릭 시 구글 시트의 전체 기록 초기화
  const clearGoogleSheetRecords = async () => {
    if (!confirm("정말로 구글 시트의 모든 게임 기록을 초기화하시겠습니까?")) {
      return;
    }

    setIsClearing(true);
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });
      const data = await res.json();

      if (!data.success && records.length > 0) {
        for (const rec of records) {
          if (rec.row) {
            await fetch("/api/records", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "delete", row: rec.row }),
            });
          }
        }
      }

      setRecords([]);
      alert("구글 시트의 기록이 성공적으로 초기화되었습니다.");
    } catch (err) {
      console.error("기록 초기화 실패:", err);
      alert("기록 초기화 중 오류가 발생했습니다.");
    } finally {
      setIsClearing(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== "playing") return;
      const cur = directionRef.current;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          if (cur.y === 0) directionRef.current = { x: 0, y: -1 };
          e.preventDefault();
          break;
        case "ArrowDown":
        case "s":
        case "S":
          if (cur.y === 0) directionRef.current = { x: 0, y: 1 };
          e.preventDefault();
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          if (cur.x === 0) directionRef.current = { x: -1, y: 0 };
          e.preventDefault();
          break;
        case "ArrowRight":
        case "d":
        case "D":
          if (cur.x === 0) directionRef.current = { x: 1, y: 0 };
          e.preventDefault();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [screen]);

  // [게임 시작] 버튼: Gemini AI 경로 생성 & 게임 시작
  const startGame = async () => {
    setScreen("loading_path");
    setElapsedTime(0);
    directionRef.current = { x: 1, y: 0 };
    firstArrivedColorRef.current = null;
    arrivalCountRef.current = 0;

    const startFormatted = new Date().toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    setStartTimeStr(startFormatted);

    try {
      const res = await fetch("/api/generate-path", { method: "POST" });
      const data = await res.json();

      const track: Point[] = data.path || [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 18, y: 18 },
      ];
      const targetGoal: Point = data.goal || { x: 18, y: 18 };

      setPathTrack(track);
      setGoal(targetGoal);

      const startPositions: Point[] = [
        { x: 1, y: 1 },
        { x: 1, y: 3 },
        { x: 1, y: 5 },
        { x: 1, y: 7 },
      ];

      const initialWorms: WormState[] = WORMS.map((cfg, idx) => {
        const isPlayer = cfg.key === selectedColor;
        const start = startPositions[idx];
        return {
          color: cfg.key,
          alive: true,
          isPlayer,
          direction: { x: 1, y: 0 },
          hasReachedGoal: false,
          body: [
            { x: start.x, y: start.y },
            { x: start.x - 1 >= 0 ? start.x - 1 : start.x, y: start.y },
            { x: start.x - 2 >= 0 ? start.x - 2 : start.x, y: start.y },
          ],
        };
      });

      setWorms(initialWorms);
      setScreen("playing");
    } catch (err) {
      console.error(err);
      alert("경로 생성 중 오류가 발생했습니다. 다시 시도해 주세요.");
      setScreen("menu");
    }
  };

  // 플레이어 지렁이가 도착했을 때 게임 종료 및 구글 시트에 CREATE 수행
  const handlePlayerFinish = useCallback(
    async (timeSec: number, playerRank: number, firstColor: string) => {
      if (loopRef.current) clearInterval(loopRef.current);
      if (timerRef.current) clearInterval(timerRef.current);

      const arrivalFormatted = new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      const playerColorKorean =
        WORMS.find((w) => w.key === selectedColor)?.koreanName || selectedColor;

      setGameResult({
        firstColorName: firstColor,
        playerRank,
        isPlayerFirst: playerRank === 1,
        time: timeSec,
        arrivalStr: arrivalFormatted,
        startTimeStr: startTimeStr || arrivalFormatted,
      });

      // 구글 시트 CREATE:
      // 요청 사항: "구글 시트에 기록되는 이름을 도착점에 가장 먼저 도달한 색깔로 표시"
      try {
        await fetch("/api/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            timestamp: startTimeStr || arrivalFormatted,
            name: firstColor, // 가장 먼저 도달한 색깔 (예: "빨간색", "파란색" 등)
            arrival: arrivalFormatted,
            finishTime: `${timeSec}초`,
          }),
        });
        fetchRecords();
      } catch (e) {
        console.error("구글 시트 저장 오류:", e);
      }

      setScreen("game_over");
    },
    [selectedColor, startTimeStr, fetchRecords]
  );

  // Main game tick loop
  useEffect(() => {
    if (screen !== "playing") return;

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    loopRef.current = setInterval(() => {
      const currentGoal = goalRef.current;
      const curWorms = [...wormsRef.current];
      let playerJustArrived = false;
      let playerRank = 1;

      const nextWorms = curWorms.map((worm) => {
        // 이미 도착했거나 죽은 지렁이는 위치 유지
        if (!worm.alive || worm.hasReachedGoal) return worm;

        let nextDir = worm.direction;

        if (worm.isPlayer) {
          nextDir = directionRef.current;
        } else {
          // AI 움직임: 목표점 방향으로 접근
          const head = worm.body[0];
          const candidateDirs = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 },
          ].filter(
            (d) => !(d.x === -worm.direction.x && d.y === -worm.direction.y)
          );

          candidateDirs.sort((a, b) => {
            const posA = { x: head.x + a.x, y: head.y + a.y };
            const posB = { x: head.x + b.x, y: head.y + b.y };
            const distA = Math.hypot(currentGoal.x - posA.x, currentGoal.y - posA.y);
            const distB = Math.hypot(currentGoal.x - posB.x, currentGoal.y - posB.y);
            return distA - distB + (Math.random() - 0.5) * 1.5;
          });

          for (const cand of candidateDirs) {
            const nx = head.x + cand.x;
            const ny = head.y + cand.y;
            if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
              nextDir = cand;
              break;
            }
          }
        }

        const head = worm.body[0];
        const newHead = { x: head.x + nextDir.x, y: head.y + nextDir.y };

        // 벽 충돌 검사
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          return { ...worm, alive: false };
        }

        // 도착점 도달 검사!
        const reachedGoal =
          newHead.x === currentGoal.x && newHead.y === currentGoal.y;

        if (reachedGoal) {
          arrivalCountRef.current += 1;
          const currentRank = arrivalCountRef.current;
          const wormColorName =
            WORMS.find((w) => w.key === worm.color)?.koreanName || worm.color;

          // 가장 먼저 도달한 색깔 기록
          if (!firstArrivedColorRef.current) {
            firstArrivedColorRef.current = wormColorName;
          }

          // 플레이어 지렁이가 도착했을 때만 게임 종료 트리거!
          if (worm.isPlayer) {
            playerJustArrived = true;
            playerRank = currentRank;
          }

          return {
            ...worm,
            body: [newHead, ...worm.body.slice(0, -1)],
            hasReachedGoal: true,
            goalRank: currentRank,
          };
        }

        const newBody = [newHead, ...worm.body.slice(0, -1)];

        return {
          ...worm,
          body: newBody,
          direction: nextDir,
        };
      });

      setWorms(nextWorms);

      // 사용자가 선택한 지렁이가 도착했을 때 게임 종료!
      if (playerJustArrived) {
        const timeSec = Math.floor((Date.now() - startTime) / 1000);
        const firstColor = firstArrivedColorRef.current || "알 수 없음";
        handlePlayerFinish(timeSec, playerRank, firstColor);
      }
    }, 180);

    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, handlePlayerFinish]);

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col items-center justify-center p-4 select-none font-sans text-neutral-800">
      {/* 1. 사용자 이름 입력 화면 */}
      {screen === "name_input" && (
        <div className="w-full max-w-md bg-white border border-neutral-300 shadow-sm p-8 flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold mb-6 tracking-wide text-neutral-900">
            사용자 이름 입력
          </h2>
          <p className="text-sm text-neutral-500 mb-6">
            게임을 시작하기 전에 플레이어의 이름을 입력해 주세요.
          </p>
          <input
            type="text"
            placeholder="이름을 입력하세요"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-4 py-3 border border-neutral-300 focus:outline-hidden focus:border-neutral-800 text-center text-lg mb-6 bg-neutral-50"
            maxLength={10}
            onKeyDown={(e) => {
              if (e.key === "Enter" && playerName.trim()) {
                setScreen("menu");
              }
            }}
          />
          <button
            onClick={() => {
              if (!playerName.trim()) {
                alert("이름을 입력해 주세요!");
                return;
              }
              setScreen("menu");
            }}
            className="w-full py-3 bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors shadow-xs cursor-pointer"
          >
            확인
          </button>
        </div>
      )}

      {/* 2. 메인 메뉴 화면 */}
      {screen === "menu" && (
        <div className="w-full max-w-4xl flex flex-col items-center">
          {/* 상단 3개 버튼 */}
          <div className="w-full flex justify-between items-center mb-8 px-4">
            <button
              onClick={startGame}
              className="px-8 py-3 bg-neutral-100 hover:bg-neutral-200 border border-neutral-500 text-lg font-medium text-neutral-900 shadow-xs transition-colors cursor-pointer"
            >
              게임시작
            </button>
            <button
              onClick={() => {
                fetchRecords();
                setScreen("records");
              }}
              className="px-8 py-3 bg-neutral-100 hover:bg-neutral-200 border border-neutral-500 text-lg font-medium text-neutral-900 shadow-xs transition-colors cursor-pointer"
            >
              기록확인
            </button>
            <button
              onClick={clearGoogleSheetRecords}
              disabled={isClearing}
              className="px-8 py-3 bg-neutral-100 hover:bg-neutral-200 border border-neutral-500 text-lg font-medium text-neutral-900 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isClearing ? "초기화 중..." : "기록 초기화"}
            </button>
          </div>

          {/* 중앙 지렁이게임 배너 박스 */}
          <div className="w-full bg-[#ececec] border border-neutral-500 py-16 px-6 text-center shadow-xs mb-14">
            <h1 className="text-5xl md:text-6xl font-light tracking-widest text-neutral-900">
              지 렁 이 게 임
            </h1>
            <p className="mt-4 text-sm text-neutral-500 font-normal">
              플레이어: <span className="font-bold text-neutral-800">{playerName}</span> 님
            </p>
          </div>

          {/* 하단 4개 지렁이 색상 카드 */}
          <div className="w-full flex justify-around items-center px-4">
            {WORMS.map((worm) => {
              const isSelected = selectedColor === worm.key;
              return (
                <button
                  key={worm.key}
                  onClick={() => setSelectedColor(worm.key)}
                  className={`w-24 h-36 border border-neutral-500 flex flex-col items-center justify-center text-center transition-all cursor-pointer relative ${
                    isSelected
                      ? "ring-4 ring-neutral-900 bg-white scale-105 shadow-md"
                      : "bg-[#ececec] hover:bg-neutral-200"
                  }`}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full mb-3 border border-neutral-400"
                    style={{ backgroundColor: worm.colorCode }}
                  />
                  <span className="text-xl font-normal leading-tight text-neutral-900 whitespace-pre-line">
                    {worm.label}
                  </span>
                  {isSelected && (
                    <span className="absolute bottom-1.5 text-[10px] text-neutral-500 font-semibold">
                      선택됨
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 처음으로 (이름 변경) */}
          <button
            onClick={() => setScreen("name_input")}
            className="mt-12 text-sm text-neutral-500 hover:text-neutral-900 underline underline-offset-4 cursor-pointer"
          >
            ← 처음으로 (이름 다시 입력하기)
          </button>
        </div>
      )}

      {/* 3. GEMINI AI 경로 생성 로딩 화면 */}
      {screen === "loading_path" && (
        <div className="w-full max-w-md bg-white border border-neutral-300 p-10 flex flex-col items-center text-center shadow-sm">
          <div className="w-12 h-12 border-4 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mb-6" />
          <h3 className="text-xl font-bold text-neutral-900 mb-2">
            Gemini AI 경로 생성 중...
          </h3>
          <p className="text-sm text-neutral-600 leading-relaxed">
            Gemini-3.8-Flash 모델이 지렁이 게임 트랙과 도착점을 생성하고 있습니다.
          </p>
        </div>
      )}

      {/* 4. 게임 플레이 화면 */}
      {screen === "playing" && (
        <div className="flex flex-col items-center w-full max-w-xl">
          <div className="w-full flex justify-between items-center bg-white border border-neutral-300 px-4 py-2 mb-3 text-sm">
            <div>
              시작: <span className="font-mono text-neutral-600">{startTimeStr}</span> |{" "}
              내 지렁이:{" "}
              <span
                className="font-bold"
                style={{
                  color: WORMS.find((w) => w.key === selectedColor)?.colorCode,
                }}
              >
                ● {WORMS.find((w) => w.key === selectedColor)?.koreanName}
              </span>
              {firstArrivedColorRef.current && (
                <span className="ml-2 text-xs text-amber-600 font-medium">
                  (1등: {firstArrivedColorRef.current} 도착 완료!)
                </span>
              )}
            </div>
            <div className="font-mono text-base font-semibold text-neutral-800">
              ⏱ {elapsedTime}초
            </div>
            <button
              onClick={() => {
                if (confirm("게임을 중단하고 메뉴로 돌아가시겠습니까?")) {
                  setScreen("menu");
                }
              }}
              className="text-xs text-neutral-500 hover:text-red-600 underline cursor-pointer"
            >
              나가기
            </button>
          </div>

          {/* 20x20 격자 보드 */}
          <div
            className="relative bg-neutral-900 border-4 border-neutral-800 rounded-xs shadow-lg overflow-hidden"
            style={{
              width: "min(90vw, 480px)",
              height: "min(90vw, 480px)",
              display: "grid",
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
            }}
          >
            {pathTrack.map((pt, i) => (
              <div
                key={`path-${i}`}
                style={{
                  gridColumnStart: pt.x + 1,
                  gridRowStart: pt.y + 1,
                }}
                className="bg-white/5 border border-white/5 pointer-events-none"
              />
            ))}

            {/* 도착 지점 */}
            <div
              style={{
                gridColumnStart: goal.x + 1,
                gridRowStart: goal.y + 1,
              }}
              className="bg-red-500 flex items-center justify-center animate-pulse z-20 border border-white"
            >
              <span className="text-[10px] md:text-xs font-black text-white">
                도착
              </span>
            </div>

            {/* 지렁이 4마리 */}
            {worms.map((worm) => {
              if (!worm.alive) return null;
              return worm.body.map((segment, segIdx) => {
                const isHead = segIdx === 0;
                return (
                  <div
                    key={`${worm.color}-${segIdx}`}
                    style={{
                      gridColumnStart: segment.x + 1,
                      gridRowStart: segment.y + 1,
                      backgroundColor:
                        WORMS.find((w) => w.key === worm.color)?.colorCode ||
                        "#fff",
                    }}
                    className={`rounded-xs transition-all duration-75 flex items-center justify-center z-10 ${
                      isHead
                        ? "border-2 border-white shadow-sm scale-105"
                        : "opacity-85"
                    }`}
                  >
                    {isHead && (
                      <div className="w-1.5 h-1.5 rounded-full bg-black/80" />
                    )}
                  </div>
                );
              });
            })}
          </div>

          <div className="mt-4 flex flex-col items-center gap-2">
            <span className="text-xs text-neutral-600 font-medium">
              내 지렁이(
              {WORMS.find((w) => w.key === selectedColor)?.koreanName})가
              도착점에 도착할 때까지 게임이 계속 진행됩니다!
            </span>
          </div>
        </div>
      )}

      {/* 5. 게임 종료 화면 */}
      {screen === "game_over" && gameResult && (
        <div className="w-full max-w-md bg-white border border-neutral-400 p-8 flex flex-col items-center text-center shadow-lg">
          <div className="text-4xl mb-3">
            {gameResult.isPlayerFirst ? "🥇" : "🏁"}
          </div>
          <h2 className="text-3xl font-bold mb-2 text-neutral-900">
            {gameResult.isPlayerFirst ? "1등으로 도착!" : "도착 완료 (게임 종료)"}
          </h2>
          <p className="text-base text-neutral-700 mb-4">
            가장 먼저 도달한 색깔:{" "}
            <span className="font-bold text-neutral-950">
              {gameResult.firstColorName}
            </span>{" "}
            <br />
            <span className="text-xs text-neutral-500">
              (내 지렁이 순위: {gameResult.playerRank}등)
            </span>
          </p>

          <div className="w-full bg-neutral-100 p-4 border border-neutral-200 mb-6 text-xs text-neutral-700 space-y-1.5 text-left">
            <div className="flex justify-between">
              <span className="text-neutral-500">구글 시트 기록 색상:</span>
              <span className="font-bold text-blue-600">
                {gameResult.firstColorName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">게임 시작 시간:</span>
              <span className="font-mono font-medium">{gameResult.startTimeStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">도착 시간:</span>
              <span className="font-mono font-medium">{gameResult.arrivalStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">도착에 걸린 시간:</span>
              <span className="font-mono font-bold text-neutral-900">
                {gameResult.time}초
              </span>
            </div>
            <div className="pt-1 text-[11px] text-green-600 text-center font-medium">
              ✓ 1등 도착 색깔({gameResult.firstColorName})로 구글 시트에 저장되었습니다.
            </div>
          </div>

          <div className="flex flex-col w-full gap-3">
            <button
              onClick={() => setScreen("menu")}
              className="w-full py-3 bg-neutral-900 text-white font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              화면 나가기
            </button>
            <button
              onClick={startGame}
              className="w-full py-2.5 border border-neutral-400 text-neutral-800 hover:bg-neutral-100 transition-colors text-sm cursor-pointer"
            >
              다시 플레이
            </button>
          </div>
        </div>
      )}

      {/* 6. 구글 시트 역대 기록 확인 화면 */}
      {screen === "records" && (
        <div className="w-full max-w-2xl bg-white border border-neutral-400 p-6 flex flex-col shadow-sm">
          <div className="flex justify-between items-center mb-6 pb-2 border-b border-neutral-200">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">
                구글 시트 역대 기록
              </h2>
              <span className="text-xs text-neutral-500">
                스프레드시트 실시간 동기화 데이터 (이름 열 = 1등 도착 색깔)
              </span>
            </div>
            <button
              onClick={() => setScreen("menu")}
              className="text-sm px-3 py-1 bg-neutral-200 hover:bg-neutral-300 cursor-pointer"
            >
              닫기
            </button>
          </div>

          {isLoadingRecords ? (
            <div className="py-12 text-center text-neutral-500 text-sm">
              구글 시트에서 기록을 불러오는 중입니다...
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-sm">
              저장된 구글 시트 기록이 없습니다. 게임을 플레이해 보세요!
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-300 text-neutral-600">
                    <th className="py-2 px-3 font-semibold">시작 시간</th>
                    <th className="py-2 px-3 font-semibold">1등 도착 색깔 (name)</th>
                    <th className="py-2 px-3 font-semibold">도착 시간</th>
                    <th className="py-2 px-3 font-semibold">걸린 시간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {records.map((rec, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50">
                      <td className="py-2.5 px-3 font-mono text-neutral-600">
                        {rec.timestamp}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-neutral-900">
                        {rec.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-neutral-600">
                        {rec.arrival}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-neutral-800">
                        {rec.finishTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex justify-between items-center pt-4 border-t border-neutral-200">
            <button
              onClick={clearGoogleSheetRecords}
              disabled={isClearing}
              className="text-xs text-red-600 hover:underline cursor-pointer disabled:opacity-50"
            >
              {isClearing ? "초기화 진행 중..." : "구글 시트 기록 초기화"}
            </button>
            <button
              onClick={() => setScreen("menu")}
              className="px-5 py-2 bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 cursor-pointer"
            >
              메뉴로 돌아가기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
