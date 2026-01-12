import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { deckService } from "@/app/lib/services/deckService";
import type { Deck } from "@/app/lib/types/user";
import DeckGrid from "@/app/components/DeckGrid";
import UserNameWithRank from "@/app/components/UserNameWithRank";
import RankIcon from "@/app/components/RankIcon";
import { achievementService } from "@/app/lib/services/achievementService";
import {
  getAchievementRarityLabel,
  getAchievementXp,
} from "@/app/lib/achievements/definitions";
import { getRankProgress } from "@/app/lib/achievements/ranks";

type LikedDeckItem = {
  deck: Deck;
  user: { name: string; username: string | null; achievementXp?: number };
  isLikedByCurrentUser: boolean;
  deckElements?: string[];
};

const toSerializable = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export default async function Profile() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  let decks: Deck[] = [];
  let likedDecks: LikedDeckItem[] = [];
  let achievementSnapshot = {
    achievementXp: 0,
    achievements: [] as any[],
    metrics: {
      totalLogs: 0,
      winLogs: 0,
      constructedLogs: 0,
      liveDraftLogs: 0,
      publicLogs: 0,
      mvpLogs: 0,
      elementLogs: {},
      elementWins: {},
    },
  };

  try {
    const [userDecks, likedDeckItems] = await Promise.all([
      deckService.getUserDecks(session.user.id),
      deckService.getUserLikedDecksWithUserInfo(session.user.id),
    ]);
    decks = toSerializable(userDecks);
    likedDecks = toSerializable(likedDeckItems);
  } catch (error) {
    console.error("Error loading profile decks:", error);
  }

  try {
    achievementSnapshot = await achievementService.getAchievementSnapshot(
      session.user.id
    );
  } catch (error) {
    console.error("Error loading achievements:", error);
  }

  const username = session.user.username ?? null;
  const achievementXp = achievementSnapshot.achievementXp ?? 0;
  const rankProgress = getRankProgress(achievementXp);
  const metrics = achievementSnapshot.metrics;

  const getProgress = (
    criteria: (typeof achievementSnapshot.achievements)[number]["definition"]["criteria"]
  ) => {
    const target = criteria.count;
    const current = (() => {
      switch (criteria.type) {
        case "total_logs":
          return metrics.totalLogs;
        case "wins":
          return metrics.winLogs;
        case "constructed_logs":
          return metrics.constructedLogs;
        case "live_draft_logs":
          return metrics.liveDraftLogs;
        case "public_logs":
          return metrics.publicLogs;
        case "mvp_logs":
          return metrics.mvpLogs;
        case "element_logs":
          return metrics.elementLogs?.[criteria.element] ?? 0;
        case "element_wins":
          return metrics.elementWins?.[criteria.element] ?? 0;
        default:
          return 0;
      }
    })();
    return { current, target };
  };

  const chainGroups = new Map<string, typeof achievementSnapshot.achievements>();
  const singleAchievements: typeof achievementSnapshot.achievements = [];

  achievementSnapshot.achievements.forEach((achievement) => {
    const seriesKey = achievement.definition.seriesKey;
    if (seriesKey) {
      const group = chainGroups.get(seriesKey) ?? [];
      group.push(achievement);
      chainGroups.set(seriesKey, group);
    } else {
      singleAchievements.push(achievement);
    }
  });

  const activeAchievements: typeof achievementSnapshot.achievements = [];
  const unlockedAchievements: typeof achievementSnapshot.achievements = [];

  singleAchievements.forEach((achievement) => {
    if (achievement.unlocked) {
      unlockedAchievements.push(achievement);
    } else {
      activeAchievements.push(achievement);
    }
  });

  chainGroups.forEach((group) => {
    const sorted = group
      .slice()
      .sort(
        (left, right) =>
          left.definition.criteria.count - right.definition.criteria.count
      );
    const unlockedTiers = sorted.filter((entry) => entry.unlocked);
    const nextTier = sorted.find((entry) => !entry.unlocked);

    if (nextTier) {
      activeAchievements.push(nextTier);
    }

    unlockedTiers.forEach((entry) => unlockedAchievements.push(entry));
  });

  const unlockedCount = unlockedAchievements.length;

  const isElementMastery = (
    achievement: (typeof achievementSnapshot.achievements)[number]
  ) => achievement.definition.criteria.type === "element_logs";

  const isElementSupremacy = (
    achievement: (typeof achievementSnapshot.achievements)[number]
  ) => achievement.definition.criteria.type === "element_wins";

  const activeElementMastery = activeAchievements.filter(isElementMastery);
  const activeElementSupremacy = activeAchievements.filter(isElementSupremacy);
  const activeCore = activeAchievements.filter(
    (achievement) =>
      !isElementMastery(achievement) && !isElementSupremacy(achievement)
  );

  const unlockedElementMastery = unlockedAchievements.filter(isElementMastery);
  const unlockedElementSupremacy = unlockedAchievements.filter(isElementSupremacy);
  const unlockedCore = unlockedAchievements.filter(
    (achievement) =>
      !isElementMastery(achievement) && !isElementSupremacy(achievement)
  );

  const sortAchievements = (
    left: (typeof achievementSnapshot.achievements)[number],
    right: (typeof achievementSnapshot.achievements)[number]
  ) => {
    const seriesLeft = left.definition.seriesKey ?? left.definition.key;
    const seriesRight = right.definition.seriesKey ?? right.definition.key;
    if (seriesLeft !== seriesRight) {
      return seriesLeft.localeCompare(seriesRight);
    }
    return left.definition.criteria.count - right.definition.criteria.count;
  };

  activeAchievements.sort(sortAchievements);
  unlockedAchievements.sort(sortAchievements);
  activeElementMastery.sort(sortAchievements);
  activeElementSupremacy.sort(sortAchievements);
  activeCore.sort(sortAchievements);
  unlockedElementMastery.sort(sortAchievements);
  unlockedElementSupremacy.sort(sortAchievements);
  unlockedCore.sort(sortAchievements);

  return (
    <div className='container mx-auto px-4 py-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='bg-algomancy-darker border border-algomancy-purple/30 rounded-lg overflow-hidden'>
          {/* Profile Header */}
          <div className='p-6 sm:p-8 border-b border-algomancy-purple/30'>
            <div className='flex flex-col sm:flex-row items-center sm:items-start gap-6'>
              <div className='w-24 h-24 rounded-full overflow-hidden bg-algomancy-purple flex items-center justify-center'>
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={96}
                    height={96}
                  />
                ) : (
                  <span className='text-white text-3xl'>
                    {session.user?.name?.charAt(0) || "U"}
                  </span>
                )}
              </div>
              <div className='text-center sm:text-left'>
                <h1 className='text-2xl font-bold text-white'>
                  {username ? (
                    <UserNameWithRank
                      name={session.user.name}
                      username={username}
                      achievementXp={achievementXp}
                      className='text-2xl font-bold text-white'
                      iconClassName='text-algomancy-gold'
                      iconSize={18}
                    />
                  ) : (
                    <div className='flex items-center'>
                      <span>No Username Set</span>
                      <Link
                        href='/profile/edit'
                        className='ml-2 text-sm text-algomancy-purple hover:text-algomancy-gold'>
                        (Set Username)
                      </Link>
                    </div>
                  )}
                </h1>
                <div className='flex flex-col gap-1 mt-1 mb-2'>
                  <div className='flex items-center'>
                    <span className='text-xs text-gray-500 w-20'>
                      Real Name:
                    </span>
                    <span className='text-gray-300'>{session.user.name}</span>
                  </div>
                  <div className='flex items-center'>
                    <span className='text-xs text-gray-500 w-20'>Email:</span>
                    <span className='text-gray-300'>{session.user.email}</span>
                  </div>
                </div>
                <div className='mt-4'>
                  <Link
                    href='/profile/edit'
                    className='px-4 py-2 text-sm rounded-md bg-algomancy-dark border border-algomancy-purple/30 hover:bg-algomancy-purple/20'>
                    Edit Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className='p-6 sm:p-8'>
            <div className='flex flex-wrap items-center justify-between gap-3 mb-6'>
              <div>
                <h2 className='text-lg font-semibold text-white'>My Logs</h2>
                <p className='text-sm text-gray-400'>
                  Review and edit your recorded matches.
                </p>
              </div>
              <Link
                href='/game-logs'
                className='px-4 py-2 text-sm rounded-md bg-algomancy-purple hover:bg-algomancy-purple-dark'>
                View My Logs
              </Link>
            </div>

            <div className='h-px w-full bg-algomancy-purple/20 mb-6'></div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* My Decks Section */}
              <div className='bg-algomancy-dark border border-algomancy-purple/20 rounded-lg p-6'>
                <div className='flex justify-between items-center mb-4'>
                  <h2 className='text-xl font-semibold text-white'>My Decks</h2>
                  <Link
                    href='/decks/create'
                    className='px-3 py-1 text-xs rounded-md bg-algomancy-purple hover:bg-algomancy-purple-dark'>
                    Create New
                  </Link>
                </div>
                <DeckGrid
                  decks={decks}
                  user={{
                    name: session.user.name || "",
                    username: username,
                    achievementXp: achievementXp,
                  }}
                  emptyMessage="You haven't created any decks yet."
                  createDeckLink='/decks/create'
                  createDeckText='Create Your First Deck'
                  viewAllLink='/profile/decks'
                  viewAllText={`View all ${decks.length} decks`}
                  maxDisplay={3}
                  columns={{ sm: 1, md: 1, lg: 1, xl: 1 }}
                />
              </div>

              {/* Liked Decks Section */}
              <div className='bg-algomancy-dark border border-algomancy-purple/20 rounded-lg p-6'>
                <div className='flex justify-between items-center mb-4'>
                  <h2 className='text-xl font-semibold text-white'>
                    Liked Decks
                  </h2>
                  <Link
                    href='/profile/liked-decks'
                    className='px-3 py-1 text-xs rounded-md bg-algomancy-purple hover:bg-algomancy-purple-dark'>
                    View All
                  </Link>
                </div>
                {likedDecks.length === 0 ? (
                  <div className='text-center py-8 text-gray-400'>
                    <p className='mb-4'>
                      Discover and like amazing decks from the community!
                    </p>
                    <Link
                      href='/decks'
                      className='inline-block px-4 py-2 bg-algomancy-purple hover:bg-algomancy-purple-dark rounded-md text-white text-sm transition-colors'>
                      Browse Community Decks
                    </Link>
                  </div>
                ) : (
                  <DeckGrid
                    decksWithUserInfo={likedDecks.slice(0, 3)}
                    emptyMessage="You haven't liked any decks yet."
                    emptyAction={{
                      text: "Browse Community Decks",
                      link: "/decks",
                    }}
                    columns={{ sm: 1, md: 1, lg: 1, xl: 1 }}
                  />
                )}
              </div>
            </div>

            <div className='h-px w-full bg-algomancy-purple/20 mt-8'></div>

            <div className='grid grid-cols-1 lg:grid-cols-[1.1fr,1.9fr] gap-6 mt-8'>
              <div className='bg-algomancy-dark border border-algomancy-purple/20 rounded-lg p-6'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='h-12 w-12 rounded-lg bg-algomancy-darker border border-algomancy-purple/20 flex items-center justify-center'>
                      <RankIcon
                        rankKey={rankProgress.current.key}
                        size={26}
                        className='text-algomancy-gold'
                        title={rankProgress.current.name}
                      />
                    </div>
                    <div>
                      <p className='text-xs uppercase text-gray-400'>Rank</p>
                      <p className='text-lg font-semibold text-white'>
                        {rankProgress.current.name}
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='text-xs text-gray-400'>Total XP</p>
                    <p className='text-lg font-semibold text-white'>
                      {achievementXp}
                    </p>
                  </div>
                </div>

                <div className='mt-4'>
                  <div className='flex items-center justify-between text-xs text-gray-400'>
                    <span>{rankProgress.current.minXp} XP</span>
                    <span>
                      {rankProgress.next ? `${rankProgress.next.minXp} XP` : "Max"}
                    </span>
                  </div>
                  <div className='mt-2 h-2 rounded-full bg-algomancy-darker border border-algomancy-purple/20 overflow-hidden'>
                    <div
                      className='h-full bg-algomancy-gold transition-all'
                      style={{ width: `${rankProgress.progress * 100}%` }}
                    />
                  </div>
                  <div className='mt-2 text-xs text-gray-400'>
                    {rankProgress.next
                      ? `${Math.max(
                          0,
                          rankProgress.next.minXp - rankProgress.currentXp
                        )} XP to ${rankProgress.next.name}`
                      : "Max rank achieved"}
                  </div>
                </div>
              </div>

              <div className='bg-algomancy-dark border border-algomancy-purple/20 rounded-lg p-6'>
                <div className='flex items-center justify-between mb-4'>
                  <div>
                    <h2 className='text-lg font-semibold text-white'>
                      Achievements
                    </h2>
                    <p className='text-sm text-gray-400'>
                      {unlockedCount} of {achievementSnapshot.achievements.length} unlocked
                    </p>
                  </div>
                </div>
                <div className='space-y-6'>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-sm font-semibold text-white'>Active</h3>
                      <span className='text-xs text-gray-500'>
                        {activeAchievements.length} active
                      </span>
                    </div>
                    {activeAchievements.length === 0 ? (
                      <div className='text-xs text-gray-500'>
                        No active achievements right now.
                      </div>
                    ) : (
                      <div className='space-y-3'>
                        {activeCore.length > 0 && (
                          <div className='space-y-3'>
                            {activeCore.map((achievement) => {
                              const xp = getAchievementXp(
                                achievement.definition.rarity
                              );
                              const rarityLabel = getAchievementRarityLabel(
                                achievement.definition.rarity
                              );
                              const progress = getProgress(
                                achievement.definition.criteria
                              );
                              const current = Math.min(
                                progress.current,
                                progress.target
                              );

                              return (
                                <div
                                  key={`active-${achievement.definition.key}`}
                                  className='flex items-start gap-3 rounded-lg border px-4 py-3 border-white/5 bg-algomancy-darker/20 opacity-80'>
                                  <div
                                    className='flex h-10 w-10 items-center justify-center rounded-md text-xs font-semibold'
                                    style={{
                                      color: achievement.definition.color,
                                      backgroundColor: `${achievement.definition.color}20`,
                                      border: `1px solid ${achievement.definition.color}`,
                                    }}>
                                    {achievement.definition.icon}
                                  </div>
                                  <div className='flex-1'>
                                    <div className='flex items-center justify-between'>
                                      <p className='text-sm font-semibold text-white'>
                                        {achievement.definition.title}
                                      </p>
                                      <div className='flex items-center gap-2 text-xs text-gray-400'>
                                        <span>{rarityLabel}</span>
                                        <span>+{xp} XP</span>
                                      </div>
                                    </div>
                                    <p className='text-xs text-gray-400'>
                                      {achievement.definition.description}
                                    </p>
                                    <p className='text-xs text-gray-500 mt-1'>
                                      Progress: {current} / {progress.target}
                                    </p>
                                  </div>
                                  <div className='text-xs text-gray-500'>
                                    Locked
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {activeElementMastery.length > 0 && (
                          <details className='rounded-lg border border-white/5 bg-algomancy-darker/20 px-4 py-3'>
                            <summary className='cursor-pointer text-sm font-semibold text-white'>
                              Element Mastery ({activeElementMastery.length})
                            </summary>
                            <div className='mt-3 space-y-3'>
                              {activeElementMastery.map((achievement) => {
                                const xp = getAchievementXp(
                                  achievement.definition.rarity
                                );
                                const rarityLabel = getAchievementRarityLabel(
                                  achievement.definition.rarity
                                );
                                const progress = getProgress(
                                  achievement.definition.criteria
                                );
                                const current = Math.min(
                                  progress.current,
                                  progress.target
                                );

                                return (
                                  <div
                                    key={`active-${achievement.definition.key}`}
                                    className='flex items-start gap-3 rounded-lg border px-4 py-3 border-white/5 bg-algomancy-darker/20 opacity-80'>
                                    <div
                                      className='flex h-10 w-10 items-center justify-center rounded-md text-xs font-semibold'
                                      style={{
                                        color: achievement.definition.color,
                                        backgroundColor: `${achievement.definition.color}20`,
                                        border: `1px solid ${achievement.definition.color}`,
                                      }}>
                                      {achievement.definition.icon}
                                    </div>
                                    <div className='flex-1'>
                                      <div className='flex items-center justify-between'>
                                        <p className='text-sm font-semibold text-white'>
                                          {achievement.definition.title}
                                        </p>
                                        <div className='flex items-center gap-2 text-xs text-gray-400'>
                                          <span>{rarityLabel}</span>
                                          <span>+{xp} XP</span>
                                        </div>
                                      </div>
                                      <p className='text-xs text-gray-400'>
                                        {achievement.definition.description}
                                      </p>
                                      <p className='text-xs text-gray-500 mt-1'>
                                        Progress: {current} / {progress.target}
                                      </p>
                                    </div>
                                    <div className='text-xs text-gray-500'>
                                      Locked
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        )}

                        {activeElementSupremacy.length > 0 && (
                          <details className='rounded-lg border border-white/5 bg-algomancy-darker/20 px-4 py-3'>
                            <summary className='cursor-pointer text-sm font-semibold text-white'>
                              Element Supremacy ({activeElementSupremacy.length})
                            </summary>
                            <div className='mt-3 space-y-3'>
                              {activeElementSupremacy.map((achievement) => {
                                const xp = getAchievementXp(
                                  achievement.definition.rarity
                                );
                                const rarityLabel = getAchievementRarityLabel(
                                  achievement.definition.rarity
                                );
                                const progress = getProgress(
                                  achievement.definition.criteria
                                );
                                const current = Math.min(
                                  progress.current,
                                  progress.target
                                );

                                return (
                                  <div
                                    key={`active-${achievement.definition.key}`}
                                    className='flex items-start gap-3 rounded-lg border px-4 py-3 border-white/5 bg-algomancy-darker/20 opacity-80'>
                                    <div
                                      className='flex h-10 w-10 items-center justify-center rounded-md text-xs font-semibold'
                                      style={{
                                        color: achievement.definition.color,
                                        backgroundColor: `${achievement.definition.color}20`,
                                        border: `1px solid ${achievement.definition.color}`,
                                      }}>
                                      {achievement.definition.icon}
                                    </div>
                                    <div className='flex-1'>
                                      <div className='flex items-center justify-between'>
                                        <p className='text-sm font-semibold text-white'>
                                          {achievement.definition.title}
                                        </p>
                                        <div className='flex items-center gap-2 text-xs text-gray-400'>
                                          <span>{rarityLabel}</span>
                                          <span>+{xp} XP</span>
                                        </div>
                                      </div>
                                      <p className='text-xs text-gray-400'>
                                        {achievement.definition.description}
                                      </p>
                                      <p className='text-xs text-gray-500 mt-1'>
                                        Progress: {current} / {progress.target}
                                      </p>
                                    </div>
                                    <div className='text-xs text-gray-500'>
                                      Locked
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        )}
                      </div>
                    )}
                  </div>

                  <details className='rounded-lg border border-white/5 bg-algomancy-darker/20 px-4 py-3'>
                    <summary className='cursor-pointer text-sm font-semibold text-white'>
                      Unlocked ({unlockedAchievements.length})
                    </summary>
                    <div className='mt-3 space-y-3'>
                      {unlockedAchievements.length === 0 ? (
                        <div className='text-xs text-gray-500'>
                          No unlocked achievements yet.
                        </div>
                      ) : (
                        <div className='space-y-3'>
                          {unlockedCore.length > 0 && (
                            <div className='space-y-3'>
                              {unlockedCore.map((achievement) => {
                                const xp = getAchievementXp(
                                  achievement.definition.rarity
                                );
                                const rarityLabel = getAchievementRarityLabel(
                                  achievement.definition.rarity
                                );

                                return (
                                  <div
                                    key={`unlocked-${achievement.definition.key}`}
                                    className='flex items-start gap-3 rounded-lg border px-4 py-3 border-algomancy-purple/30 bg-algomancy-darker/60'>
                                    <div
                                      className='flex h-10 w-10 items-center justify-center rounded-md text-xs font-semibold'
                                      style={{
                                        color: achievement.definition.color,
                                        backgroundColor: `${achievement.definition.color}20`,
                                        border: `1px solid ${achievement.definition.color}`,
                                      }}>
                                      {achievement.definition.icon}
                                    </div>
                                    <div className='flex-1'>
                                      <div className='flex items-center justify-between'>
                                        <p className='text-sm font-semibold text-white'>
                                          {achievement.definition.title}
                                        </p>
                                        <div className='flex items-center gap-2 text-xs text-gray-400'>
                                          <span>{rarityLabel}</span>
                                          <span>+{xp} XP</span>
                                        </div>
                                      </div>
                                      <p className='text-xs text-gray-400'>
                                        {achievement.definition.description}
                                      </p>
                                    </div>
                                    <div className='text-xs text-gray-500'>
                                      Unlocked
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {unlockedElementMastery.length > 0 && (
                            <details className='rounded-lg border border-white/5 bg-algomancy-darker/20 px-4 py-3'>
                              <summary className='cursor-pointer text-sm font-semibold text-white'>
                                Element Mastery ({unlockedElementMastery.length})
                              </summary>
                              <div className='mt-3 space-y-3'>
                                {unlockedElementMastery.map((achievement) => {
                                  const xp = getAchievementXp(
                                    achievement.definition.rarity
                                  );
                                  const rarityLabel = getAchievementRarityLabel(
                                    achievement.definition.rarity
                                  );

                                  return (
                                    <div
                                      key={`unlocked-${achievement.definition.key}`}
                                      className='flex items-start gap-3 rounded-lg border px-4 py-3 border-algomancy-purple/30 bg-algomancy-darker/60'>
                                      <div
                                        className='flex h-10 w-10 items-center justify-center rounded-md text-xs font-semibold'
                                        style={{
                                          color: achievement.definition.color,
                                          backgroundColor: `${achievement.definition.color}20`,
                                          border: `1px solid ${achievement.definition.color}`,
                                        }}>
                                        {achievement.definition.icon}
                                      </div>
                                      <div className='flex-1'>
                                        <div className='flex items-center justify-between'>
                                          <p className='text-sm font-semibold text-white'>
                                            {achievement.definition.title}
                                          </p>
                                          <div className='flex items-center gap-2 text-xs text-gray-400'>
                                            <span>{rarityLabel}</span>
                                            <span>+{xp} XP</span>
                                          </div>
                                        </div>
                                        <p className='text-xs text-gray-400'>
                                          {achievement.definition.description}
                                        </p>
                                      </div>
                                      <div className='text-xs text-gray-500'>
                                        Unlocked
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </details>
                          )}

                          {unlockedElementSupremacy.length > 0 && (
                            <details className='rounded-lg border border-white/5 bg-algomancy-darker/20 px-4 py-3'>
                              <summary className='cursor-pointer text-sm font-semibold text-white'>
                                Element Supremacy ({unlockedElementSupremacy.length})
                              </summary>
                              <div className='mt-3 space-y-3'>
                                {unlockedElementSupremacy.map((achievement) => {
                                  const xp = getAchievementXp(
                                    achievement.definition.rarity
                                  );
                                  const rarityLabel = getAchievementRarityLabel(
                                    achievement.definition.rarity
                                  );

                                  return (
                                    <div
                                      key={`unlocked-${achievement.definition.key}`}
                                      className='flex items-start gap-3 rounded-lg border px-4 py-3 border-algomancy-purple/30 bg-algomancy-darker/60'>
                                      <div
                                        className='flex h-10 w-10 items-center justify-center rounded-md text-xs font-semibold'
                                        style={{
                                          color: achievement.definition.color,
                                          backgroundColor: `${achievement.definition.color}20`,
                                          border: `1px solid ${achievement.definition.color}`,
                                        }}>
                                        {achievement.definition.icon}
                                      </div>
                                      <div className='flex-1'>
                                        <div className='flex items-center justify-between'>
                                          <p className='text-sm font-semibold text-white'>
                                            {achievement.definition.title}
                                          </p>
                                          <div className='flex items-center gap-2 text-xs text-gray-400'>
                                            <span>{rarityLabel}</span>
                                            <span>+{xp} XP</span>
                                          </div>
                                        </div>
                                        <p className='text-xs text-gray-400'>
                                          {achievement.definition.description}
                                        </p>
                                      </div>
                                      <div className='text-xs text-gray-500'>
                                        Unlocked
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </details>
                          )}
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
