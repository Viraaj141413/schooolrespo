import {
  users,
  projects,
  projectFiles,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type ProjectFile,
  type InsertProjectFile,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: string): Promise<Project | undefined>;
  getUserProjects(userId: string): Promise<Project[]>;
  updateProject(id: string, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Project file operations
  createProjectFile(file: InsertProjectFile): Promise<ProjectFile>;
  getProjectFiles(projectId: string): Promise<ProjectFile[]>;
  updateProjectFile(id: string, updates: Partial<InsertProjectFile>): Promise<ProjectFile>;
  deleteProjectFile(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Project operations
  async createProject(projectData: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(projectData)
      .returning();
    return project;
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.updatedAt));
  }

  async updateProject(id: string, updates: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Project file operations
  async createProjectFile(fileData: InsertProjectFile): Promise<ProjectFile> {
    const [file] = await db
      .insert(projectFiles)
      .values(fileData)
      .returning();
    return file;
  }

  async getProjectFiles(projectId: string): Promise<ProjectFile[]> {
    return await db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.projectId, projectId));
  }

  async updateProjectFile(id: string, updates: Partial<InsertProjectFile>): Promise<ProjectFile> {
    const [file] = await db
      .update(projectFiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projectFiles.id, id))
      .returning();
    return file;
  }

  async deleteProjectFile(id: string): Promise<void> {
    await db.delete(projectFiles).where(eq(projectFiles.id, id));
  }
}

export const storage = new DatabaseStorage();