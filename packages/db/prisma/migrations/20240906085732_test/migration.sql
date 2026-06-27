-- CreateTable
CREATE TABLE "_BusesToStudent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_BusesToStudent_AB_unique" ON "_BusesToStudent"("A", "B");

-- CreateIndex
CREATE INDEX "_BusesToStudent_B_index" ON "_BusesToStudent"("B");

-- AddForeignKey
ALTER TABLE "_BusesToStudent" ADD CONSTRAINT "_BusesToStudent_A_fkey" FOREIGN KEY ("A") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BusesToStudent" ADD CONSTRAINT "_BusesToStudent_B_fkey" FOREIGN KEY ("B") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
