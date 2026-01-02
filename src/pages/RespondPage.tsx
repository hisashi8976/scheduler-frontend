import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

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
  const [copyMessage, setCopyMessage] = useState<string | null>(null)
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
    if (!copyMessage) {
      return
    }
    const timeout = window.setTimeout(() => {
      setCopyMessage(null)
    }, 3000)
    return () => {
      window.clearTimeout(timeout)
    }
  }, [copyMessage])

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

  const handleCopy = async () => {
    if (!editUrl) {
      return
    }
    try {
      await navigator.clipboard.writeText(editUrl)
      setCopyMessage('コピーしました。')
    } catch {
      setCopyMessage('コピーに失敗しました。')
    }
  }

  return (
    <main>
      {!publicId ? (
        <>
          <h1>エラー</h1>
          <p>イベントIDが指定されていません。</p>
        </>
      ) : (
        <>
          <h1>回答ページ</h1>
          <p>イベントID: {publicId}</p>
          {isLoading && <p>読み込み中...</p>}
          {fetchError && (
            <section role="alert">
              <h2>取得エラー</h2>
              <p>
                status: {fetchError.status ?? 'unknown'} / message:{' '}
                {fetchError.message}
              </p>
            </section>
          )}
          {eventData && (
            <section>
              <h2>{eventData.title}</h2>
              <p>{eventData.description}</p>
              <label htmlFor="respondent-name">回答者名</label>
              <input
                id="respondent-name"
                type="text"
                aria-required="true"
                value={respondentName}
                onChange={(event) => setRespondentName(event.target.value)}
              />
              <h3>候補一覧</h3>
              {eventData.candidates.length === 0 ? (
                <p>候補日時が登録されていません。</p>
              ) : (
                <ul>
                  {eventData.candidates.map((candidate, index) => (
                    <li key={candidate.candidateSlotId}>
                      <div>候補 {index + 1}</div>
                      <div>
                        {formatDateTime(candidate.startAt)} -{' '}
                        {formatDateTime(candidate.endAt)}
                      </div>
                      <label htmlFor={`availability-${candidate.candidateSlotId}`}>
                        Availability
                      </label>
                      <select
                        id={`availability-${candidate.candidateSlotId}`}
                        value={
                          availabilityById[candidate.candidateSlotId] ?? 'MAYBE'
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
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !respondentName.trim()}
              >
                {isSubmitting ? '送信中...' : '送信'}
              </button>
              {submitError && (
                <section role="alert">
                  <h3>送信エラー</h3>
                  <p>
                    status: {submitError.status ?? 'unknown'} / message:{' '}
                    {submitError.message}
                  </p>
                </section>
              )}
              {editUrl && (
                <section>
                  <h3>編集URL</h3>
                  <p>{editUrl}</p>
                  <button type="button" onClick={handleCopy}>
                    コピー
                  </button>
                  {copyMessage && <p>{copyMessage}</p>}
                </section>
              )}
            </section>
          )}
          <nav>
            <ul>
              <li>
                <Link to={`/e/${encodedPublicId}`} aria-current="page">
                  回答
                </Link>
              </li>
              <li>
                <Link to={`/e/${encodedPublicId}/results`}>結果</Link>
              </li>
              <li>
                <Link to={`/e/${encodedPublicId}/admin`}>主催者</Link>
              </li>
            </ul>
          </nav>
        </>
      )}
    </main>
  )
}

export default RespondPage
