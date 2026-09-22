"use client";

import { useEffect, useState } from "react";
import AddStreak from "./AddStreak";
import ShowStreak from "./show-streak";
import axios from "axios";

type StreakUser = {
  username: string;
  streak: number;
};

type StreakApiUser = {
  username: string;
  stats: string | null;
};

const StreakMain = () => {
  const [users, setUsers] = useState<StreakUser[]>([]);

  const getStreakUsers = async () => {
    try {
      const response = await axios.get<{ data: StreakApiUser[] }>("/api/streak");

      setUsers(
        response.data.data.map((user) => ({
          username: user.username,
          streak: user.stats ? parseInt(user.stats) : 0,
        })),
      );
    } catch (error) {
      console.error("Error fetching streak users:", error);
    }
  };

  useEffect(() => {
    void getStreakUsers();
  }, []);

  const handleAddUser = async (username: string) => {
    try {
      const res = await axios.post("/api/streak", {
        username,
      });

      console.log(res.data);
      await getStreakUsers();
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  return (
    <main className="max-h-fit bg-gray-50  px-4 py-6 rounded-2xl">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 flex items-center justify-between">

          <AddStreak onAdd={handleAddUser} />
        </div>

        <ShowStreak users={users} />

      </div>
    </main>
  );
};

export default StreakMain;