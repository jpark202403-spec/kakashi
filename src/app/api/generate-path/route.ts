import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { NextResponse } from "next/server";

// Fallback algorithm to generate randomized solvable maze paths on a 20x20 grid
function generateFallbackPath() {
  const GRID_SIZE = 20;
  const visited = new Set<string>();
  const path: { x: number; y: number }[] = [];

  let current = { x: 1, y: 1 };
  visited.add(`${current.x},${current.y}`);
  path.push({ ...current });

  const directions = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  // Random walk biased towards bottom-right (18, 18)
  for (let step = 0; step < 70; step++) {
    if (current.x >= GRID_SIZE - 2 && current.y >= GRID_SIZE - 2) break;

    // Filter valid moves
    const validMoves = directions
      .map((d) => ({ x: current.x + d.x, y: current.y + d.y }))
      .filter(
        (p) =>
          p.x >= 1 &&
          p.x < GRID_SIZE - 1 &&
          p.y >= 1 &&
          p.y < GRID_SIZE - 1 &&
          !visited.has(`${p.x},${p.y}`)
      );

    if (validMoves.length === 0) break;

    // Bias towards goal
    validMoves.sort((a, b) => {
      const distA = Math.hypot(GRID_SIZE - 2 - a.x, GRID_SIZE - 2 - a.y);
      const distB = Math.hypot(GRID_SIZE - 2 - b.x, GRID_SIZE - 2 - b.y);
      return distA - distB + (Math.random() - 0.5) * 2;
    });

    current = validMoves[0];
    visited.add(`${current.x},${current.y}`);
    path.push({ ...current });
  }

  const goal = path[path.length - 1];
  return { path, goal, gridSize: GRID_SIZE };
}

export async function POST() {
  try {
    const prompt = `Generate a single connected continuous path on a 20x20 grid (coordinates x from 0 to 19, y from 0 to 19).
The path must start at { "x": 1, "y": 1 } and end at a distinct goal point (e.g. x between 15-18, y between 15-18).
Each consecutive step in the path array MUST be strictly adjacent by Manhattan distance of 1 (moving up, down, left, or right by 1 cell only).
Keep the total path length between 25 and 50 steps so it is an interesting obstacle track for a snake game.
Return the path as an array of points and the goal point.`;

    const { object } = await generateObject({
      model: google("gemini-1.5-flash"), // or gemini-2.0-flash / default available
      schema: z.object({
        path: z.array(
          z.object({
            x: z.number().int().min(0).max(19),
            y: z.number().int().min(0).max(19),
          })
        ),
        goal: z.object({
          x: z.number().int().min(0).max(19),
          y: z.number().int().min(0).max(19),
        }),
      }),
      prompt,
    });

    return NextResponse.json({
      path: object.path,
      goal: object.goal,
      gridSize: 20,
      source: "gemini",
    });
  } catch (error) {
    console.warn("Gemini API call failed, using algorithmic fallback path:", error);
    const fallback = generateFallbackPath();
    return NextResponse.json({ ...fallback, source: "fallback" });
  }
}
