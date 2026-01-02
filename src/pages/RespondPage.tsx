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

function RespondPage() {
  const { publicId } = useParams()

  if (!publicId) {
    return (
      <main>
        <h1>エラー</h1>
        <p>イベントIDが指定されていません。</p>
      </main>
    )
  }

  const encodedPublicId = encodeURIComponent(publicId)
  const [eventData, setEventData] = useState<EventResponse | null>(null)
  const [fetchError, setFetchError] = useState<SubmitError | null>(null)
  const [respondentName, setRespondentName] = useState('')
  const [availabilityById, setAvailabilityById] = useState<
    Record<number, Availability>
  >({})
  const [submitError, setSubmitError] = useState<SubmitError | null>(null)
  const [editUrl, setEditUrl] = useState<string | null>(null)
  const [copyMessage, setCopyMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchEvent = async () => {
      try {
        setFetchError(null)
        const response = await fetch(`/api/events/${encodedPublicId}`)
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
        const data = (await response.json()) as EventResponse
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
      }
    }

    fetchEvent()

    return () => {
      isMounted = false
    }
  }, [encodedPublicId])

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
    if (!eventData) {
      return
    }
    try {
      setSubmitError(null)
      setEditUrl(null)
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
      const body = (await response.json()) as { editUrl?: string }
      setEditUrl(body.editUrl ?? '')
    } catch (error) {
      setSubmitError({
        status: null,
        message: error instanceof Error ? error.message : 'Unexpected error.',
      })
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
      <h1>回答ページ</h1>
      <p>イベントID: {publicId}</p>
      {fetchError && (
        <section>
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
          <label>
            回答者名
            <input
              type="text"
              value={respondentName}
              onChange={(event) => setRespondentName(event.target.value)}
            />
          </label>
          <h3>候補一覧</h3>
          <ul>
            {eventData.candidates.map((candidate) => (
              <li key={candidate.candidateSlotId}>
                <div>candidateSlotId: {candidate.candidateSlotId}</div>
                <div>
                  {new Date(candidate.startAt).toLocaleString()} -{' '}
                  {new Date(candidate.endAt).toLocaleString()}
                </div>
                <label>
                  Availability
                  <select
                    value={availabilityById[candidate.candidateSlotId] ?? 'MAYBE'}
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
                </label>
              </li>
            ))}
          </ul>
          <button type="button" onClick={handleSubmit}>
            送信
          </button>
          {submitError && (
            <section>
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
            <Link to={`/e/${encodedPublicId}`}>回答</Link>
          </li>
          <li>
            <Link to={`/e/${encodedPublicId}/results`}>結果</Link>
          </li>
          <li>
            <Link to={`/e/${encodedPublicId}/admin`}>主催者</Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}

export default RespondPage
