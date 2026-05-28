-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "deleteAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" TEXT NOT NULL DEFAULT '2';
