import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { useAuth } from '../auth/useAuth'
import { Badge, Button, EmptyState, Input, Spinner, Textarea } from '../components/ui'
import {
  useAcceptApplication,
  useApplyToTask,
  useMyApplication,
  useRejectApplication,
  useTaskApplications,
} from '../features/applications/api'
import { useCreateReview, useRaiseDispute, useTaskReviews } from '../features/disputes/api'
import { useSendMessage, useTaskMessages } from '../features/messaging/api'
import {
  useCancelTask,
  useCompleteOpenWorkshop,
  useCompleteTask,
  useSubmitWork,
  useTask,
} from '../features/tasks/api'
import {
  CAMPUS_ROLE_LABELS,
  DIFFICULTY_LABELS,
  LISTING_TYPE_LABELS,
  MODE_LABELS,
  TASK_STATUS_LABELS,
  type CampusRole,
  type Difficulty,
  type ListingType,
  type Mode,
  type TaskStatus,
} from '../lib/constants'

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, profile } = useAuth()
  const { data: task, isLoading, error } = useTask(id)
  const { data: applications = [] } = useTaskApplications(id)
  const { data: myApp } = useMyApplication(id, user?.id)
  const { data: messages = [] } = useTaskMessages(id)
  const { data: reviews = [] } = useTaskReviews(id)

  const apply = useApplyToTask()
  const accept = useAcceptApplication()
  const reject = useRejectApplication()
  const submitWork = useSubmitWork()
  const complete = useCompleteTask()
  const cancel = useCancelTask()
  const completeWorkshop = useCompleteOpenWorkshop()
  const raiseDispute = useRaiseDispute()
  const createReview = useCreateReview()
  const sendMessage = useSendMessage()

  const [applyMsg, setApplyMsg] = useState('')
  const [proofUrl, setProofUrl] = useState('')
  const [disputeReason, setDisputeReason] = useState('')
  const [chat, setChat] = useState('')
  const [stars, setStars] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    )
  }

  if (error || !task) {
    return <EmptyState title="Listing not found" description="It may have been removed." />
  }

  const isPoster = user?.id === task.poster_id
  const isWorker = user?.id === task.worker_id
  const isParticipant = isPoster || isWorker
  const canApply =
    !!user &&
    !!profile &&
    profile.campus_role !== 'department' &&
    !isPoster &&
    task.status === 'open' &&
    !myApp &&
    task.listing_type !== 'workshop'

  const canJoinWorkshop =
    !!user &&
    !!profile &&
    profile.campus_role !== 'department' &&
    !isPoster &&
    task.status === 'open' &&
    task.listing_type === 'workshop' &&
    !myApp

  const run = async (fn: () => Promise<unknown>) => {
    setActionError(null)
    try {
      await fn()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Action failed')
    }
  }

  const onSend = (e: FormEvent) => {
    e.preventDefault()
    if (!user || !chat.trim()) return
    void run(async () => {
      await sendMessage.mutateAsync({
        task_id: task.id,
        sender_id: user.id,
        content: chat.trim(),
      })
      setChat('')
    })
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <div>
        <div className="flex flex-wrap gap-2">
          <Badge>{LISTING_TYPE_LABELS[task.listing_type as ListingType]}</Badge>
          <Badge tone="teal">{TASK_STATUS_LABELS[task.status as TaskStatus]}</Badge>
          <Badge tone="muted">{DIFFICULTY_LABELS[task.difficulty as Difficulty]}</Badge>
          {task.category && <Badge tone="muted">{task.category.name}</Badge>}
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold text-forest-900 sm:text-4xl">
          {task.title}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Posted by{' '}
          <Link to={`/profile/${task.poster_id}`} className="font-medium text-teal-600 hover:underline">
            {task.poster?.full_name ?? 'User'}
          </Link>
          {task.poster?.campus_role && (
            <> · {CAMPUS_ROLE_LABELS[task.poster.campus_role as CampusRole]}</>
          )}
        </p>

        <p className="prose-sm mt-6 whitespace-pre-wrap text-ink leading-relaxed">
          {task.description}
        </p>

        <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
          {task.deadline && (
            <div>
              <dt className="text-muted">Deadline</dt>
              <dd className="font-medium">{format(new Date(task.deadline), 'PP')}</dd>
            </div>
          )}
          {task.starts_at && (
            <div>
              <dt className="text-muted">Starts</dt>
              <dd className="font-medium">{format(new Date(task.starts_at), 'PPp')}</dd>
            </div>
          )}
          {task.ends_at && (
            <div>
              <dt className="text-muted">Ends</dt>
              <dd className="font-medium">{format(new Date(task.ends_at), 'PPp')}</dd>
            </div>
          )}
          {task.mode && (
            <div>
              <dt className="text-muted">Mode</dt>
              <dd className="font-medium">{MODE_LABELS[task.mode as Mode]}</dd>
            </div>
          )}
          {task.venue && (
            <div>
              <dt className="text-muted">Venue</dt>
              <dd className="font-medium">{task.venue}</dd>
            </div>
          )}
          {task.max_participants && (
            <div>
              <dt className="text-muted">Max participants</dt>
              <dd className="font-medium">{task.max_participants}</dd>
            </div>
          )}
          {task.proof_url && (
            <div className="sm:col-span-2">
              <dt className="text-muted">Proof of work</dt>
              <dd>
                <a href={task.proof_url} className="font-medium text-teal-600 hover:underline" target="_blank" rel="noreferrer">
                  {task.proof_url}
                </a>
              </dd>
            </div>
          )}
        </dl>

        {actionError && <p className="mt-4 text-sm text-red-700">{actionError}</p>}

        {(canApply || canJoinWorkshop) && (
          <section className="mt-8 border-t border-border pt-6">
            <h2 className="font-display text-lg font-semibold">
              {canJoinWorkshop ? 'Register interest' : 'Apply'}
            </h2>
            <Textarea
              className="mt-3"
              placeholder="Short note to the poster…"
              value={applyMsg}
              onChange={(e) => setApplyMsg(e.target.value)}
            />
            <Button
              className="mt-3"
              disabled={apply.isPending}
              onClick={() =>
                void run(async () => {
                  await apply.mutateAsync({
                    task_id: task.id,
                    applicant_id: user!.id,
                    message: applyMsg || undefined,
                  })
                  setApplyMsg('')
                })
              }
            >
              {canJoinWorkshop ? 'Register' : 'Submit application'}
            </Button>
          </section>
        )}

        {myApp && (
          <p className="mt-6 text-sm text-muted">
            Your application status: <strong>{myApp.status}</strong>
          </p>
        )}

        {isWorker && task.status === 'assigned' && (
          <section className="mt-8 space-y-3 border-t border-border pt-6">
            <h2 className="font-display text-lg font-semibold">Submit work</h2>
            <Input
              placeholder="Proof URL (optional)"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
            />
            <Button
              disabled={submitWork.isPending}
              onClick={() =>
                void run(() => submitWork.mutateAsync({ taskId: task.id, proofUrl: proofUrl || undefined }))
              }
            >
              Mark submitted
            </Button>
          </section>
        )}

        {isPoster && (
          <section className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6">
            {task.status === 'submitted' || task.status === 'assigned' ? (
              <Button
                disabled={complete.isPending}
                onClick={() => void run(() => complete.mutateAsync(task.id))}
              >
                Complete task
              </Button>
            ) : null}
            {task.listing_type === 'workshop' && task.status === 'open' && (
              <Button
                variant="secondary"
                disabled={completeWorkshop.isPending}
                onClick={() => void run(() => completeWorkshop.mutateAsync(task.id))}
              >
                Mark workshop done
              </Button>
            )}
            {!['completed', 'cancelled'].includes(task.status) && (
              <Button
                variant="outline"
                disabled={cancel.isPending}
                onClick={() => void run(() => cancel.mutateAsync({ taskId: task.id }))}
              >
                Cancel
              </Button>
            )}
          </section>
        )}

        {isWorker && !['completed', 'cancelled'].includes(task.status) && (
          <Button
            className="mt-4"
            variant="outline"
            disabled={cancel.isPending}
            onClick={() => void run(() => cancel.mutateAsync({ taskId: task.id }))}
          >
            Cancel as worker
          </Button>
        )}

        {isParticipant && ['assigned', 'submitted'].includes(task.status) && (
          <section className="mt-8 space-y-3 border-t border-border pt-6">
            <h2 className="font-display text-lg font-semibold">Raise dispute</h2>
            <Textarea value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} />
            <Button
              variant="danger"
              disabled={!disputeReason.trim() || raiseDispute.isPending}
              onClick={() =>
                void run(async () => {
                  await raiseDispute.mutateAsync({ taskId: task.id, reason: disputeReason.trim() })
                  setDisputeReason('')
                })
              }
            >
              Submit dispute
            </Button>
          </section>
        )}

        {task.status === 'completed' && isParticipant && (
          <section className="mt-8 space-y-3 border-t border-border pt-6">
            <h2 className="font-display text-lg font-semibold">Leave a review</h2>
            <SelectStars value={stars} onChange={setStars} />
            <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
            <Button
              disabled={createReview.isPending}
              onClick={() =>
                void run(async () => {
                  const revieweeId = isPoster ? task.worker_id : task.poster_id
                  if (!revieweeId) throw new Error('No counterparty to review')
                  await createReview.mutateAsync({
                    taskId: task.id,
                    revieweeId,
                    stars,
                    comment: reviewComment || undefined,
                  })
                  setReviewComment('')
                })
              }
            >
              Submit review
            </Button>
            {reviews.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm">
                {reviews.map((r) => (
                  <li key={r.id} className="border-b border-border/60 py-2">
                    <strong>{r.stars}/5</strong> — {r.reviewer?.full_name}: {r.comment}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      <aside className="space-y-8">
        {isPoster && (
          <section>
            <h2 className="font-display text-lg font-semibold text-forest-900">Applications</h2>
            {applications.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No applications yet.</p>
            ) : (
              <ul className="mt-3 space-y-4">
                {applications.map((a) => (
                  <li key={a.id} className="border-b border-border/70 pb-3">
                    <Link
                      to={`/profile/${a.applicant_id}`}
                      className="font-medium text-forest-800 hover:text-teal-600"
                    >
                      {a.applicant?.full_name ?? 'Applicant'}
                    </Link>
                    <p className="text-xs text-muted">{a.status}</p>
                    {a.message && <p className="mt-1 text-sm text-muted">{a.message}</p>}
                    {a.status === 'pending' && task.status === 'open' && (
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          disabled={accept.isPending}
                          onClick={() => void run(() => accept.mutateAsync(a.id))}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={reject.isPending}
                          onClick={() => void run(() => reject.mutateAsync(a.id))}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {isParticipant && (
          <section>
            <h2 className="font-display text-lg font-semibold text-forest-900">Messages</h2>
            <div className="mt-3 max-h-80 space-y-3 overflow-y-auto rounded-xl border border-border bg-white/60 p-3">
              {messages.length === 0 && (
                <p className="text-sm text-muted">No messages yet. Say hello.</p>
              )}
              {messages.map((m) => (
                <div key={m.id} className="text-sm">
                  <p className="font-medium text-forest-800">{m.sender?.full_name ?? 'User'}</p>
                  <p className="text-ink">{m.content}</p>
                  <p className="text-[10px] text-muted">
                    {format(new Date(m.created_at), 'PPp')}
                  </p>
                </div>
              ))}
            </div>
            <form onSubmit={onSend} className="mt-3 flex gap-2">
              <Input value={chat} onChange={(e) => setChat(e.target.value)} placeholder="Message…" />
              <Button type="submit" disabled={sendMessage.isPending}>
                Send
              </Button>
            </form>
          </section>
        )}
      </aside>
    </div>
  )
}

function SelectStars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <select
      className="h-10 rounded-lg border border-border bg-white/80 px-3 text-sm"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {[5, 4, 3, 2, 1].map((n) => (
        <option key={n} value={n}>
          {n} stars
        </option>
      ))}
    </select>
  )
}
