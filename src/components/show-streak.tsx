import Link from "next/link";

const ShowStreak = ({ users }: { users: { username: string; streak: number }[] }) => {
    const sortedUsers = [...users].sort(
        (a, b) => b.streak - a.streak
    );
    return (
        <div className="w-full max-w-2xl">

            <div className="max-h-[calc(100dvh-10rem)] space-y-3 overflow-y-auto overscroll-contain pr-1">
                {sortedUsers.map((user, index) => (
                    <div
                        key={user.username}
                        className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            {/* Position */}
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 font-bold">
                                #{index + 1}
                            </div>

                            <div>
                                <Link href={`https://github.com/${user.username}`} target="_blank" className="font-semibold hover:underline">
                                    {user.username}
                                </Link>

                                <p className="text-sm text-gray-500">
                                    GitHub Streak
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <p className="text-xl font-bold text-orange-500">
                                {user.streak}
                            </p>

                            <p className="text-xs text-gray-500">
                                days
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ShowStreak;