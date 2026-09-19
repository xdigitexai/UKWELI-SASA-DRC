-- Restore the per-reader report dedup unique that the previous migration dropped.
CREATE UNIQUE INDEX "CommentReport_readerId_commentId_key" ON "CommentReport"("readerId", "commentId");
