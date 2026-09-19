-- DropForeignKey
ALTER TABLE "ArticleReaction" DROP CONSTRAINT "ArticleReaction_readerId_fkey";

-- AlterTable
ALTER TABLE "ArticleReaction" ADD COLUMN     "visitorHash" TEXT,
ALTER COLUMN "readerId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "ArticleReaction_articleId_visitorHash_idx" ON "ArticleReaction"("articleId", "visitorHash");

-- AddForeignKey
ALTER TABLE "ArticleReaction" ADD CONSTRAINT "ArticleReaction_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "Reader"("id") ON DELETE SET NULL ON UPDATE CASCADE;

