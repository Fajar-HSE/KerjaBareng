-- SUPABASE SCHEMA FOR KERJABARENG

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: Profile
CREATE TABLE "Profile" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "email" TEXT UNIQUE NOT NULL,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT DEFAULT 'user' NOT NULL,
    "division" TEXT,
    "avatarUrl" TEXT,
    "emailVerified" BOOLEAN DEFAULT false NOT NULL,
    "emailVerifyToken" TEXT UNIQUE,
    "emailVerifyExpires" TIMESTAMP WITH TIME ZONE,
    "resetPasswordToken" TEXT UNIQUE,
    "resetPasswordExpires" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table: Task
CREATE TABLE "Task" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignedToId" UUID NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
    "assignedById" UUID NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
    "status" TEXT DEFAULT 'pending' NOT NULL,
    "deadline" TIMESTAMP WITH TIME ZONE NOT NULL,
    "targetType" TEXT DEFAULT 'daily' NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table: TaskProgress
CREATE TABLE "TaskProgress" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "taskId" UUID NOT NULL REFERENCES "Task"("id") ON DELETE CASCADE,
    "userId" UUID NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
    "progressNote" TEXT,
    "attachmentUrls" TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    "isChecklist" BOOLEAN DEFAULT false NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table: ChatMessage
CREATE TABLE "ChatMessage" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "taskId" UUID REFERENCES "Task"("id") ON DELETE SET NULL,
    "senderId" UUID NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
    "receiverId" UUID NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
    "message" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "isRead" BOOLEAN DEFAULT false NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table: Notification
CREATE TABLE "Notification" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "userId" UUID NOT NULL REFERENCES "Profile"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN DEFAULT false NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Disable Row Level Security temporarily for backend API access (matching Prisma behavior)
-- Or leave RLS disabled since backend uses Service Role Key / Server-side queries
ALTER TABLE "Profile" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskProgress" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" DISABLE ROW LEVEL SECURITY;
