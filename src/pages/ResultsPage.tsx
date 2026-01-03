import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

type CandidateResult = {
  candidateSlotId: number
  startAt: string
  endAt: string
  ok: number
  maybe: number
  ng: number
}

type ResultsResponse = {
  publicId: string
  title: string
  description: string
  respondentCount: number
  candidates: CandidateResult[]
}

type FetchError = {
  status: number | null
  message: string
}

const formatDateTime = (value: string): string => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

const isCandidateResult = (value: unknown): value is CandidateResult => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as CandidateResult
  return (
    typeof candidate.candidateSlotId === 'number' &&
    typeof candidate.startAt === 'string' &&
    typeof candidate.endAt === 'string' &&
    typeof candidate.ok === 'number' &&
    typeof candidate.maybe === 'number' &&
    typeof candidate.ng === 'number'
  )
}

const parseResultsResponse = (value: unknown): ResultsResponse | null => {
  if (!value || typeof value !== 'object') {
    return null
  }
  const result = value as ResultsResponse
  if (
    typeof result.publicId !== 'string' ||
    typeof result.title !== 'string' ||
    typeof result.description !== 'string' ||
    typeof result.respondentCount !== 'number' ||
    !Array.isArray(result.candidates) ||
    !result.candidates.every(isCandidateResult)
  ) {
    return null
  }
  return result
}

function ResultsPage() {
  const { publicId } = useParams()
  const encodedPublicId = publicId ? encodeURIComponent(publicId) : ''
  const [results, setResults] = useState<ResultsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState<FetchError | null>(null)

  useEffect(() => {
    if (!publicId) {
      return
    }
    const controller = new AbortController()

    const fetchResults = async () => {
      try {
        setFetchError(null)
        setIsLoading(true)
        const response = await fetch(
          `/api/events/${encodedPublicId}/results`,
          {
            signal: controller.signal,
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
          setFetchError({ status: response.status, message })
          return
        }
        const body = await response.json()
        const parsed = parseResultsResponse(body)
        if (!parsed) {
          setFetchError({
            status: null,
            message: 'Unexpected response payload.',
          })
          return
        }
        setResults(parsed)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        setFetchError({
          status: null,
          message: error instanceof Error ? error.message : 'Unexpected error.',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchResults()

    return () => {
      controller.abort()
    }
  }, [encodedPublicId, publicId])

  if (!publicId) {
    return (
      <main>
        <h1>エラー</h1>
        <p>イベントIDが指定されていません。</p>
      </main>
    )
  }

  return (
    <main style={{ padding: '24px', display: 'grid', gap: '20px' }}>
      <header style={{ display: 'grid', gap: '8px' }}>
        <h1 style={{ margin: 0 }}>集計結果</h1>
        <p style={{ margin: 0, color: '#4b5563' }}>
          イベントID: {publicId}
        </p>
        <Link to={`/e/${encodedPublicId}`}>イベント詳細へ戻る</Link>
      </header>
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
      {results && (
        <>
          <section
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '16px',
              background: '#ffffff',
              display: 'grid',
              gap: '8px',
            }}
          >
            <h2 style={{ margin: 0 }}>{results.title}</h2>
            <p style={{ margin: 0, color: '#6b7280' }}>
              {results.description}
            </p>
            <p style={{ margin: 0 }}>回答者数: {results.respondentCount}</p>
          </section>
          <section style={{ display: 'grid', gap: '12px' }}>
            <h3 style={{ margin: 0 }}>候補別の集計</h3>
            {results.candidates.length === 0 ? (
              <p>候補が登録されていません。</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {results.candidates.map((candidate, index) => {
                  const total = candidate.ok + candidate.maybe + candidate.ng
                  const okRatio = total ? (candidate.ok / total) * 100 : 0
                  const maybeRatio = total
                    ? (candidate.maybe / total) * 100
                    : 0
                  const ngRatio = total ? (candidate.ng / total) * 100 : 0

                  return (
                    <div
                      key={candidate.candidateSlotId}
                      style={{
                        border: '1px solid #e5e7eb',
                        borderRadius: '10px',
                        padding: '12px',
                        display: 'grid',
                        gap: '8px',
                        background: '#f9fafb',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div>
                          <strong>候補 {index + 1}</strong>
                          <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                            {formatDateTime(candidate.startAt)} -{' '}
                            {formatDateTime(candidate.endAt)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          合計: {total}
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          height: '16px',
                          borderRadius: '9999px',
                          overflow: 'hidden',
                          background: '#e5e7eb',
                        }}
                        aria-label={`候補 ${index + 1} の集計バー`}
                      >
                        {okRatio > 0 && (
                          <div
                            style={{
                              width: `${okRatio}%`,
                              background: '#22c55e',
                            }}
                            role="img"
                            aria-label={`OK: ${candidate.ok}`}
                          />
                        )}
                        {maybeRatio > 0 && (
                          <div
                            style={{
                              width: `${maybeRatio}%`,
                              background: '#f59e0b',
                            }}
                            role="img"
                            aria-label={`MAYBE: ${candidate.maybe}`}
                          />
                        )}
                        {ngRatio > 0 && (
                          <div
                            style={{
                              width: `${ngRatio}%`,
                              background: '#ef4444',
                            }}
                            role="img"
                            aria-label={`NG: ${candidate.ng}`}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '12px',
                          fontSize: '0.9rem',
                          color: '#374151',
                        }}
                      >
                        <span>OK: {candidate.ok}</span>
                        <span>MAYBE: {candidate.maybe}</span>
                        <span>NG: {candidate.ng}</span>
                      </div>
                    </div>
                  )}
                )}
              </div>
            )}
          </section>
          <section style={{ display: 'grid', gap: '8px' }}>
            <h3 style={{ margin: 0 }}>詳細テーブル</h3>
            {results.candidates.length === 0 ? (
              <p>候補がありません。</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <caption style={{ textAlign: 'left', marginBottom: '8px' }}>
                    候補日時ごとの回答集計
                  </caption>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px' }}>
                        ID
                      </th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>
                        日時
                      </th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>
                        OK
                      </th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>
                        MAYBE
                      </th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>
                        NG
                      </th>
                      <th style={{ textAlign: 'right', padding: '8px' }}>
                        合計
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.candidates.map((candidate) => {
                      const total =
                        candidate.ok + candidate.maybe + candidate.ng
                      return (
                        <tr key={candidate.candidateSlotId}>
                          <td
                            style={{
                              padding: '8px',
                              borderTop: '1px solid #e5e7eb',
                            }}
                          >
                            {candidate.candidateSlotId}
                          </td>
                          <td
                            style={{
                              padding: '8px',
                              borderTop: '1px solid #e5e7eb',
                            }}
                          >
                            {formatDateTime(candidate.startAt)} -{' '}
                            {formatDateTime(candidate.endAt)}
                          </td>
                          <td
                            style={{
                              padding: '8px',
                              textAlign: 'right',
                              borderTop: '1px solid #e5e7eb',
                            }}
                          >
                            {candidate.ok}
                          </td>
                          <td
                            style={{
                              padding: '8px',
                              textAlign: 'right',
                              borderTop: '1px solid #e5e7eb',
                            }}
                          >
                            {candidate.maybe}
                          </td>
                          <td
                            style={{
                              padding: '8px',
                              textAlign: 'right',
                              borderTop: '1px solid #e5e7eb',
                            }}
                          >
                            {candidate.ng}
                          </td>
                          <td
                            style={{
                              padding: '8px',
                              textAlign: 'right',
                              borderTop: '1px solid #e5e7eb',
                            }}
                          >
                            {total}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}

export default ResultsPage
