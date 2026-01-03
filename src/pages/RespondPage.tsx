import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import '../styles/RespondPage.css'

type Availability = 'OK' | 'MAYBE' | 'NG'

type CandidateSlot = {
  candidateSlotId: number
  startAt: string
  endAt: string
}

type EventResponse = {
  title: string
  description: string
  candidates: CandidateSlot[]
}

type SubmitError = {
  status: number | null
  message: string
}

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return Number.isNaN(date.getTime()) ? '無効な日時' : date.toLocaleString()
}

const isCandidateSlot = (value: unknown): value is CandidateSlot => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as CandidateSlot
  return (
    typeof candidate.candidateSlotId === 'number' &&
    typeof candidate.startAt === 'string' &&
    typeof candidate.endAt === 'string'
  )
}

const parseEventResponse = (value: unknown): EventResponse | null => {
  if (!value || typeof value !== 'object') {
    return null
  }
  const event = value as EventResponse
  if (
    typeof event.title !== 'string' ||
    typeof event.description !== 'string' ||
    !Array.isArray(event.candidates) ||
    !event.candidates.every(isCandidateSlot)
  ) {
    return null
  }
  return event
}

function RespondPage() {
  const { publicId } = useParams()
  const location = useLocation()
  const encodedPublicId = publicId ? encodeURIComponent(publicId) : ''
  const [eventData, setEventData] = useState<EventResponse | null>(null)
  const [fetchError, setFetchError] = useState<SubmitError | null>(null)
  const [respondentName, setRespondentName] = useState('')
  const [availabilityById, setAvailabilityById] = useState<
    Record<number, Availability>
  >({})
  const [isLoading, setIsLoading] = useState(false)
  const [submitError, setSubmitError] = useState<SubmitError | null>(null)
  const [editUrl, setEditUrl] = useState<string | null>(null)
  const [editCopyMessage, setEditCopyMessage] = useState<string | null>(null)
  const [eventIdCopyMessage, setEventIdCopyMessage] = useState<string | null>(
    null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!publicId) {
      return
    }
    let isMounted = true

    const fetchEvent = async () => {
      try {
        setFetchError(null)
        setIsLoading(true)
        const response = await fetch(
          `/api/events/${encodeURIComponent(publicId)}`
        )
        if (!response.ok) {
          let message = response.statusText
          try {
            const body = (await response.json()) as { message?: string }
            message = body.message ?? message
          } catch {
            // noop
          }
          if (isMounted) {
            setFetchError({ status: response.status, message })
          }
          return
        }
        const body = await response.json()
        const data = parseEventResponse(body)
        if (!data) {
          if (isMounted) {
            setFetchError({
              status: null,
              message: 'Unexpected response payload.',
            })
          }
          return
        }
        if (isMounted) {
          setEventData(data)
          setAvailabilityById(
            data.candidates.reduce<Record<number, Availability>>(
              (accumulator, candidate) => {
                accumulator[candidate.candidateSlotId] = 'MAYBE'
                return accumulator
              },
              {}
            )
          )
        }
      } catch (error) {
        if (isMounted) {
          setFetchError({
            status: null,
            message:
              error instanceof Error ? error.message : 'Unexpected error.',
          })
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchEvent()

    return () => {
      isMounted = false
    }
  }, [publicId])

  useEffect(() => {
    if (!editCopyMessage) {
      return
    }
    const timeout = window.setTimeout(() => {
      setEditCopyMessage(null)
    }, 3000)
    return () => {
      window.clearTimeout(timeout)
    }
  }, [editCopyMessage])

  useEffect(() => {
    if (!eventIdCopyMessage) {
      return
    }
    const timeout = window.setTimeout(() => {
      setEventIdCopyMessage(null)
    }, 3000)
    return () => {
      window.clearTimeout(timeout)
    }
  }, [eventIdCopyMessage])

  const handleAvailabilityChange = (
    candidateSlotId: number,
    value: Availability
  ) => {
    setAvailabilityById((previous) => ({
      ...previous,
      [candidateSlotId]: value,
    }))
  }

  const handleSubmit = async () => {
    if (!eventData || !respondentName.trim()) {
      return
    }
    try {
      setSubmitError(null)
      setEditUrl(null)
      setIsSubmitting(true)
      const response = await fetch(
        `/api/events/${encodedPublicId}/responses`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            respondentName,
            items: eventData.candidates.map((candidate) => ({
              candidateSlotId: candidate.candidateSlotId,
              availability: availabilityById[candidate.candidateSlotId] ?? 'MAYBE',
            })),
          }),
        }
      )
      if (!response.ok) {
        let message = response.statusText
        try {
          const body = (await response.json()) as { message?: string }
          message = body.message ?? message
        } catch {
          // noop
        }
        setSubmitError({ status: response.status, message })
        return
      }
      const body = await response.json()
      if (typeof body === 'object' && body !== null) {
        const nextEditUrl =
          'editUrl' in body && typeof body.editUrl === 'string'
            ? body.editUrl
            : ''
        setEditUrl(nextEditUrl)
      } else {
        setEditUrl('')
      }
    } catch (error) {
      setSubmitError({
        status: null,
        message: error instanceof Error ? error.message : 'Unexpected error.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopyEditUrl = async () => {
    if (!editUrl) {
      return
    }
    try {
      await navigator.clipboard.writeText(editUrl)
      setEditCopyMessage('コピーしました。')
    } catch {
      setEditCopyMessage('コピーに失敗しました。')
    }
  }

  const handleCopyEventId = async () => {
    if (!publicId) {
      return
    }
    try {
      await navigator.clipboard.writeText(publicId)
      setEventIdCopyMessage('コピーしました。')
    } catch {
      setEventIdCopyMessage('コピーに失敗しました。')
    }
  }

  const isCurrentPath = (path: string) => location.pathname === path

  return (
    <main className="respond-page">
      {!publicId ? (
        <>
          <h1>エラー</h1>
          <p>イベントIDが指定されていません。</p>
        </>
      ) : (
        <div className="respond-page__container">
          <nav className="respond-page__tabs" aria-label="イベントナビゲーション">
            <Link
              className={`respond-page__tab ${
                isCurrentPath(`/e/${encodedPublicId}`)
                  ? 'respond-page__tab--active'
                  : ''
              }`}
              to={`/e/${encodedPublicId}`}
              aria-current={
                isCurrentPath(`/e/${encodedPublicId}`) ? 'page' : undefined
              }
            >
              回答
            </Link>
            <Link
              className={`respond-page__tab ${
                isCurrentPath(`/e/${encodedPublicId}/results`)
                  ? 'respond-page__tab--active'
                  : ''
              }`}
              to={`/e/${encodedPublicId}/results`}
              aria-current={
                isCurrentPath(`/e/${encodedPublicId}/results`)
                  ? 'page'
                  : undefined
              }
            >
              結果
            </Link>
            <Link
              className={`respond-page__tab ${
                isCurrentPath(`/e/${encodedPublicId}/admin`)
                  ? 'respond-page__tab--active'
                  : ''
              }`}
              to={`/e/${encodedPublicId}/admin`}
              aria-current={
                isCurrentPath(`/e/${encodedPublicId}/admin`)
                  ? 'page'
                  : undefined
              }
            >
              主催者
            </Link>
          </nav>
          <header className="respond-page__header">
            <div>
              <h1 className="respond-page__title">回答</h1>
              <p className="respond-page__subtitle">
                出欠回答を入力してください。
              </p>
              <p className="respond-page__subtitle">
                <Link to={`/e/${encodedPublicId}/results`}>
                  集計結果を見る
                </Link>
              </p>
            </div>
            <div className="respond-page__event-id">
              <span>イベントID</span>
              <code>{publicId}</code>
              <button
                type="button"
                className="respond-page__secondary-button"
                onClick={handleCopyEventId}
              >
                コピー
              </button>
              {eventIdCopyMessage && (
                <span className="respond-page__copy-message">
                  {eventIdCopyMessage}
                </span>
              )}
            </div>
          </header>
          {isLoading && <p>読み込み中...</p>}
          {fetchError && (
            <section role="alert" className="respond-page__alert">
              <h2>取得エラー</h2>
              <p>
                status: {fetchError.status ?? 'unknown'} / message:{' '}
                {fetchError.message}
              </p>
            </section>
          )}
          {eventData && (
            <>
              <section className="respond-page__card">
                <h2 className="respond-page__card-title">{eventData.title}</h2>
                <p className="respond-page__card-description">
                  {eventData.description}
                </p>
              </section>
              <section className="respond-page__section">
                <h3 className="respond-page__section-title">1) 回答者名</h3>
                <label className="respond-page__label" htmlFor="respondent-name">
                  回答者名
                </label>
                <input
                  id="respondent-name"
                  className="respond-page__input"
                  type="text"
                  aria-required="true"
                  placeholder="お名前を入力してください"
                  value={respondentName}
                  onChange={(event) => setRespondentName(event.target.value)}
                />
              </section>
              <section className="respond-page__section">
                <h3 className="respond-page__section-title">2) 候補を選ぶ</h3>
                {eventData.candidates.length === 0 ? (
                  <p>候補日時が登録されていません。</p>
                ) : (
                  <div className="respond-page__table-wrapper">
                    <table className="respond-page__table">
                      <thead>
                        <tr>
                          <th scope="col">候補</th>
                          <th scope="col">日時</th>
                          <th scope="col">出欠</th>
                        </tr>
                      </thead>
                      <tbody>
                        {eventData.candidates.map((candidate, index) => (
                          <tr key={candidate.candidateSlotId}>
                            <td>候補 {index + 1}</td>
                            <td>
                              {formatDateTime(candidate.startAt)} -{' '}
                              {formatDateTime(candidate.endAt)}
                            </td>
                            <td>
                              <label
                                className="respond-page__sr-only"
                                htmlFor={`availability-${candidate.candidateSlotId}`}
                              >
                                候補 {index + 1} の出欠
                              </label>
                              <select
                                id={`availability-${candidate.candidateSlotId}`}
                                className="respond-page__select"
                                value={
                                  availabilityById[candidate.candidateSlotId] ??
                                  'MAYBE'
                                }
                                onChange={(event) =>
                                  handleAvailabilityChange(
                                    candidate.candidateSlotId,
                                    event.target.value as Availability
                                  )
                                }
                              >
                                <option value="OK">OK</option>
                                <option value="MAYBE">MAYBE</option>
                                <option value="NG">NG</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
              <section className="respond-page__section">
                <h3 className="respond-page__section-title">3) 送信</h3>
                <button
                  type="button"
                  className="respond-page__primary-button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !respondentName.trim()}
                >
                  {isSubmitting ? '送信中...' : '送信'}
                </button>
                {submitError && (
                  <section role="alert" className="respond-page__alert">
                    <h3>送信エラー</h3>
                    <p>
                      status: {submitError.status ?? 'unknown'} / message:{' '}
                      {submitError.message}
                    </p>
                  </section>
                )}
              </section>
              {editUrl && (
                <section className="respond-page__highlight">
                  <h3>編集URL</h3>
                  <p className="respond-page__highlight-text">
                    このリンクは再編集に必要。控えてください。
                  </p>
                  <div className="respond-page__highlight-actions">
                    <code className="respond-page__highlight-code">
                      {editUrl}
                    </code>
                    <div className="respond-page__highlight-buttons">
                      <button
                        type="button"
                        className="respond-page__secondary-button"
                        onClick={handleCopyEditUrl}
                      >
                        コピー
                      </button>
                      <a
                        className="respond-page__link-button"
                        href={editUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        開く
                      </a>
                    </div>
                  </div>
                  {editCopyMessage && (
                    <p className="respond-page__copy-message">
                      {editCopyMessage}
                    </p>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      )}
    </main>
  )
}

export default RespondPage
