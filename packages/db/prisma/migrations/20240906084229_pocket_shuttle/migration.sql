/*
  Warnings:

  - You are about to drop the `_BusesToStudent` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_BusesToStudent" DROP CONSTRAINT "_BusesToStudent_A_fkey";

-- DropForeignKey
ALTER TABLE "_BusesToStudent" DROP CONSTRAINT "_BusesToStudent_B_fkey";

-- DropTable
DROP TABLE "_BusesToStudent";
