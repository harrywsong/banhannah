-- CreateTable
CREATE TABLE "LiveClass" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "timezone" TEXT DEFAULT 'Asia/Seoul',
    "duration" TEXT,
    "platform" TEXT DEFAULT 'Zoom',
    "meetingLink" TEXT,
    "instructor" TEXT,
    "maxParticipants" INTEGER DEFAULT 20,
    "registrationStart" TEXT,
    "registrationEnd" TEXT,
    "previewImage" TEXT,
    "registeredCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveClass_pkey" PRIMARY KEY ("id")
);
