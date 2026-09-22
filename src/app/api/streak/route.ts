import DbConnect from "@/lib/mongodb";
import GithubStreakModel from "@/models/GithubStreak";
import axios from "axios";
import { Worker } from "node:worker_threads";
import { NextResponse } from "next/server";

type StreakResult = {
    username: string;
    stats: number;
};

const streakWorkerCode = `
    const { parentPort } = require("node:worker_threads");

    parentPort.on("message", async ({ usernames }) => {
        const results = await Promise.allSettled(
            usernames.map(async (username) => {
                const response = await fetch(
                    "https://githubstatss.vercel.app/api/stats?username=" + encodeURIComponent(username),
                );

                if (!response.ok) {
                    throw new Error("Stats request failed with status " + response.status);
                }

                const stats = await response.json();

                return {
                    username,
                    stats: stats.contributions.currentStreak,
                };
            }),
        );

        parentPort.postMessage(
            results
                .filter((result) => result.status === "fulfilled")
                .map((result) => result.value),
        );
    });
`;

function fetchStreaksInWorker(usernames: string[]): Promise<StreakResult[]> {
    return new Promise((resolve, reject) => {
        const worker = new Worker(streakWorkerCode, { eval: true });

        worker.once("message", (data: StreakResult[]) => {
            resolve(data);
            void worker.terminate();
        });
        worker.once("error", (error) => {
            reject(error);
            void worker.terminate();
        });
        worker.once("exit", (code) => {
            if (code !== 0) {
                reject(new Error(`Streak stats worker stopped with exit code ${code}`));
            }
        });

        worker.postMessage({ usernames });
    });
}

export async function POST(request: Request) {
    try {
        await DbConnect();
        const { username } = await request.json();

        if (!username) {
            return NextResponse.json({ message: "Username is required" }, { status: 400 })
        }

        const realUsername = username.trim().toLowerCase();

        const isGithubUser = await axios.get(`https://api.github.com/users/${realUsername}`).then(res => res.status === 200).catch(() => false);
        if (!isGithubUser) {
            return NextResponse.json({ message: "GitHub user not found" }, { status: 404 })
        }

        const existingUser = await GithubStreakModel.findOne({ username: realUsername });
        if (existingUser) {
            return NextResponse.json({ message: "Username already exists" }, { status: 409 })
        }

        const saveUsername = await GithubStreakModel.create({ username: realUsername });

        return NextResponse.json({ message: "Username saved successfully", data: saveUsername }, { status: 201 })
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}

export async function GET(request: Request) {
    try {
        await DbConnect();
        const users = await GithubStreakModel.find().lean();

        const data = await fetchStreaksInWorker(users.map((user) => user.username));

        return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 })
    }
}