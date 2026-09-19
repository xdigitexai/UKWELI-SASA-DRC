import Link from "next/link";
import {revalidatePath} from "next/cache";
import {db} from "@/lib/db";
import {requireRole} from "@/lib/auth";

const FILTERS = [["all", "Tous"], ["reported", "Signalés"], ["hidden", "Masqués"], ["spam", "Spam"]] as const;
const LABELS: Record<string, string> = {APPROVED: "Publié", HIDDEN: "Masqué", SPAM: "Spam", PENDING: "En attente", REJECTED: "Rejeté"};

export default async function CommentsAdmin({searchParams}: {searchParams: Promise<{filtre?: string}>}) {
  await requireRole(["ADMINISTRATEUR", "REDACTEUR_EN_CHEF"]);
  const filter = (await searchParams).filtre || "all";

  const where =
    filter === "reported" ? {reports: {some: {resolved: false}}}
    : filter === "hidden" ? {status: "HIDDEN" as const}
    : filter === "spam" ? {status: "SPAM" as const}
    : {};

  const rows = await db.comment.findMany({
    where,
    include: {
      article: {select: {title: true, slug: true}},
      reports: {where: {resolved: false}, select: {id: true, reason: true}},
      _count: {select: {replies: true, reports: true}},
    },
    orderBy: {createdAt: "desc"},
    take: 200,
  });

  async function moderate(data: FormData) {
    "use server";
    const user = await requireRole(["ADMINISTRATEUR", "REDACTEUR_EN_CHEF"]);
    const id = String(data.get("id")), mode = String(data.get("mode"));
    if (mode === "delete") await db.comment.delete({where: {id}});
    else if (mode === "hide") await db.comment.update({where: {id}, data: {status: "HIDDEN", moderatedAt: new Date()}});
    else if (mode === "restore") await db.comment.update({where: {id}, data: {status: "APPROVED", moderatedAt: new Date()}});
    else if (mode === "spam") await db.comment.update({where: {id}, data: {status: "SPAM", moderatedAt: new Date()}});
    else if (mode === "resolve") await db.commentReport.updateMany({where: {commentId: id}, data: {resolved: true}});
    await db.auditLog.create({data: {userId: user.id, action: `COMMENT_${mode.toUpperCase()}`, entity: "Comment", entityId: id}});
    revalidatePath("/admin/commentaires");
  }

  const total = await db.comment.count();
  const pendingReports = await db.commentReport.count({where: {resolved: false}});

  return (
    <>
      <h1>Commentaires</h1>
      <p className="meta">
        Les commentaires sont publiés immédiatement, sans compte ni validation préalable. Vous intervenez ici après publication :
        masquer, restaurer, marquer comme spam ou supprimer. {total} commentaire(s) au total, {pendingReports} signalement(s) non traité(s).
      </p>

      <nav className="share" aria-label="Filtres">
        {FILTERS.map(([key, label]) => (
          <Link key={key} className={`pill${filter === key ? " active" : ""}`} href={`/admin/commentaires?filtre=${key}`}>{label}</Link>
        ))}
      </nav>

      {rows.length === 0
        ? <div className="empty compact">Aucun commentaire pour ce filtre.</div>
        : <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Commentaire</th><th>Article</th><th>État</th><th>Signalements</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {rows.map(c => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                      {c.parentId ? <small> · réponse</small> : null}
                      <br />
                      <span>{c.content}</span>
                      <br />
                      <small className="meta">{new Intl.DateTimeFormat("fr-CD", {dateStyle: "short", timeStyle: "short"}).format(c.createdAt)}{c._count.replies > 0 ? ` · ${c._count.replies} réponse(s)` : ""}</small>
                    </td>
                    <td>
                      <Link href={`/article/${c.article.slug}`} target="_blank" rel="noopener noreferrer">{c.article.title}</Link>
                    </td>
                    <td>{LABELS[c.status] || c.status}</td>
                    <td>
                      {c.reports.length === 0 ? "—" : c.reports.map(r => <div key={r.id}><small>{r.reason}</small></div>)}
                    </td>
                    <td>
                      <div className="admin-actions">
                        <Link className="pill" href={`/article/${c.article.slug}#commentaires`} target="_blank" rel="noopener noreferrer">Voir</Link>
                        <form action={moderate}>
                          <input type="hidden" name="id" value={c.id} />
                          {c.status !== "HIDDEN" && <button name="mode" value="hide">Masquer</button>}
                          {c.status !== "APPROVED" && <button name="mode" value="restore">Restaurer</button>}
                          {c.status !== "SPAM" && <button name="mode" value="spam">Marquer comme spam</button>}
                          {c.reports.length > 0 && <button name="mode" value="resolve">Signalements traités</button>}
                          <button name="mode" value="delete">Supprimer</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>}
    </>
  );
}
