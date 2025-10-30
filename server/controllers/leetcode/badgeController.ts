import { Request, Response } from 'express';
import { BadgeModel } from '../../models/leetcode/Badge';

export const getBadge = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  try {
    const badge = await BadgeModel.findOne({ user: userId });
    if (!badge) {
      
      const newBadge = new BadgeModel({ user: userId });
      await newBadge.save();
      return res.status(200).json({ success: true, data: newBadge });
    }
    res.status(200).json({ success: true, data: badge });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getLeaderboard = async (_req: Request, res: Response) => {
  try {
    const top = await BadgeModel.find({})
      .populate('user', 'name email')
      .sort({ points: -1, maxStreak: -1 })
      .limit(20);
    res.status(200).json({ success: true, data: top });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateBadge = async (userId: string) => {
  try {
    let badge = await BadgeModel.findOne({ user: userId });
    if (!badge) {
      badge = new BadgeModel({ user: userId });
    }

    const oldLevel = badge.level;
    badge.points += 1;

    // Streak logic: increment if lastSolvedAt is yesterday or today, otherwise reset
    const now = new Date();
    const last = badge.lastSolvedAt ? new Date(badge.lastSolvedAt) : undefined;
    const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
    const isYesterday = (a: Date, b: Date) => {
      const y = new Date(b);
      y.setDate(b.getDate() - 1);
      return a.toDateString() === y.toDateString();
    };

    if (!last || isSameDay(last, now)) {
      // same day, count as continuation without breaking streak
      badge.currentStreak = Math.max(1, badge.currentStreak);
    } else if (isYesterday(last, now)) {
      badge.currentStreak += 1;
    } else {
      badge.currentStreak = 1;
    }

    badge.maxStreak = Math.max(badge.maxStreak, badge.currentStreak);
    badge.lastSolvedAt = now;

    if (badge.points >= 10 && badge.points < 20) {
      badge.level = 'Bronze';
    } else if (badge.points >= 20 && badge.points < 30) {
      badge.level = 'Silver';
    } else if (badge.points >= 30) {
      badge.level = 'Gold';
    }

    await badge.save();

    return {
      level: badge.level,
      points: badge.points,
      currentStreak: badge.currentStreak,
      maxStreak: badge.maxStreak,
      levelUp: oldLevel !== badge.level,
    };
  } catch (error) {
    console.error('Error updating badge:', error);
    return null;
  }
};

