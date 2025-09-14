import { MongoStorage } from '../mongoStorage';
import UserModel from '../models/User';
import ProfileModel from '../models/Profile';
import AchievementModel from '../models/Achievement';
import DynamicFormModel from '../models/DynamicForm';
import FollowModel from '../models/Follow';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Follow Functionality', () => {
  let mongoServer: MongoMemoryServer;
  let storage: MongoStorage;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    storage = new MongoStorage();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections before each test
    await UserModel.deleteMany({});
    await ProfileModel.deleteMany({});
    await AchievementModel.deleteMany({});
    await DynamicFormModel.deleteMany({});
    await FollowModel.deleteMany({});
  });

  it('should allow a user to follow another user', async () => {
    // Create two users
    const user1 = await storage.createUser({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'student'
    });

    const user2 = await storage.createUser({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'password123',
      role: 'student'
    });

    // User1 follows User2
    const follow = await storage.followUser(user1._id, user2._id);

    expect(follow.follower).toBe(user1._id);
    expect(follow.following).toBe(user2._id);

    // Check if follow relationship exists
    const isFollowing = await storage.isFollowing(user1._id, user2._id);
    expect(isFollowing).toBe(true);
  });

  it('should allow a user to unfollow another user', async () => {
    // Create two users
    const user1 = await storage.createUser({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'student'
    });

    const user2 = await storage.createUser({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'password123',
      role: 'student'
    });

    // User1 follows User2
    await storage.followUser(user1._id, user2._id);

    // User1 unfollows User2
    const unfollowed = await storage.unfollowUser(user1._id, user2._id);
    expect(unfollowed).toBe(true);

    // Check if follow relationship no longer exists
    const isFollowing = await storage.isFollowing(user1._id, user2._id);
    expect(isFollowing).toBe(false);
  });

  it('should get followers for a user', async () => {
    // Create three users
    const user1 = await storage.createUser({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'student'
    });

    const user2 = await storage.createUser({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'password123',
      role: 'student'
    });

    const user3 = await storage.createUser({
      name: 'Bob Johnson',
      email: 'bob@example.com',
      password: 'password123',
      role: 'student'
    });

    // User2 and User3 follow User1
    await storage.followUser(user2._id, user1._id);
    await storage.followUser(user3._id, user1._id);

    // Get followers for User1
    const followers = await storage.getFollowers(user1._id);
    expect(followers.length).toBe(2);
    expect(followers.map(f => f._id)).toContain(user2._id);
    expect(followers.map(f => f._id)).toContain(user3._id);
  });

  it('should get following for a user', async () => {
    // Create three users
    const user1 = await storage.createUser({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      role: 'student'
    });

    const user2 = await storage.createUser({
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'password123',
      role: 'student'
    });

    const user3 = await storage.createUser({
      name: 'Bob Johnson',
      email: 'bob@example.com',
      password: 'password123',
      role: 'student'
    });

    // User1 follows User2 and User3
    await storage.followUser(user1._id, user2._id);
    await storage.followUser(user1._id, user3._id);

    // Get following for User1
    const following = await storage.getFollowing(user1._id);
    expect(following.length).toBe(2);
    expect(following.map(f => f._id)).toContain(user2._id);
    expect(following.map(f => f._id)).toContain(user3._id);
  });
});