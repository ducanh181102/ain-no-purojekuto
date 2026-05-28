-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deleteAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" TEXT NOT NULL DEFAULT '2';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "deleteAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" TEXT NOT NULL DEFAULT '2';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "deleteAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" TEXT NOT NULL DEFAULT '2';

-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "deleteAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" TEXT NOT NULL DEFAULT '2';
