import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const lookupRobloxUser = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z.object({ username: z.string().min(1).max(32) }).parse(data),
  )
  .handler(async ({ data }) => {
    const userRes = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usernames: [data.username],
        excludeBannedUsers: false,
      }),
    });
    if (!userRes.ok) throw new Error("Lookup failed");
    const userJson = (await userRes.json()) as {
      data: { id: number; name: string; displayName: string }[];
    };
    const user = userJson.data?.[0];
    if (!user) return { found: false as const };

    let avatarUrl: string | null = null;
    try {
      const thumbRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=false`,
      );
      if (thumbRes.ok) {
        const thumbJson = (await thumbRes.json()) as {
          data: { imageUrl: string; state: string }[];
        };
        avatarUrl = thumbJson.data?.[0]?.imageUrl ?? null;
      }
    } catch {}

    return {
      found: true as const,
      id: user.id,
      name: user.name,
      displayName: user.displayName,
      avatarUrl,
    };
  });
