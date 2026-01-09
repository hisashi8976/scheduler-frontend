import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import '../styles/AdminResponsesPage.css'

type TableData = {
  columns: string[]
  rows: Array<Record<string, unknown> | unknown>
  isObjectRows: boolean
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const buildTableData = (value: unknown): TableData | null => {
  if (!Array.isArray(value)) {
    return null
  }
  if (value.length === 0) {
    return {
      columns: ['value'],
      rows: [],
      isObjectRows: false,
    }
  }
  const allObjects = value.every(isRecord)
  if (allObjects) {
    const columns = Array.from(
      new Set(value.flatMap((item) => Object.keys(item as Record<string, unknown>)))
    )
    return {
      columns: columns.length > 0 ? columns : ['value'],
      rows: value as Record<string, unknown>[],
      isObjectRows: true,
    }
  }
  return {
    columns: ['value'],
    rows: value,
    isObjectRows: false,
  }
}

const urlRegex = /(https?:\/\/[^\s"'<>]+|\/(?:api|e)\/[^\s"'<>]+)/g

const linkifyText = (text: string) => {
  const parts: Array<string | JSX.Element> = []
  let lastIndex = 0
  let matchIndex = 0

  for (const match of text.matchAll(urlRegex)) {
    const index = match.index ?? 0
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index))
    }
    const url = match[0]
    const key = `${index}-${matchIndex}`
    parts.push(
      <a
        key={key}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="admin-responses__link"
      >
        {url}
      </a>
    )
    lastIndex = index + url.length
    matchIndex += 1
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

const formatValue = (value: unknown): string => {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (value === null) {
    return 'null'
  }
  if (value === undefined) {
    return 'undefined'
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function AdminResponsesPage() {
  const { publicId } = useParams()
  const [adminKey, setAdminKey] = useState('')
  const [adminKeyError, setAdminKeyError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [responseData, setResponseData] = useState<unknown>(null)
  const [copyMessage, setCopyMessage] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const encodedPublicId = publicId ? encodeURIComponent(publicId) : ''

  const jsonText = useMemo(() => {
    if (responseData === null || responseData === undefined) {
      return ''
    }
    try {
      return JSON.stringify(responseData, null, 2)
    } catch {
      return String(responseData)
    }
  }, [responseData])

  const tableData = useMemo(() => buildTableData(responseData), [responseData])

  useEffect(() => {
    if (!copyMessage) {
      return
    }
    const timer = window.setTimeout(() => {
      setCopyMessage(null)
    }, 3000)
    return () => {
      window.clearTimeout(timer)
    }
  }, [copyMessage])

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const handleFetch = async () => {
    if (!publicId) {
      setErrorMessage('イベントIDが指定されていません。')
      return
    }
    if (!adminKey.trim()) {
      setAdminKeyError('管理キーを入力してください。')
      return
    }
    setAdminKeyError(null)
    setErrorMessage(null)
    setResponseData(null)
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/events/${encodeURIComponent(publicId)}/admin/responses`,
        {
          method: 'GET',
          headers: {
            'X-Admin-Key': adminKey,
          },
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
        setErrorMessage(`取得に失敗しました。status=${response.status} ${message}`)
        return
      }
      const body = await response.json()
      setResponseData(body)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      setErrorMessage(
        error instanceof Error ? error.message : 'Unexpected error occurred.'
      )
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }

  const handleCopyJson = async () => {
    if (!jsonText) {
      return
    }
    try {
      await navigator.clipboard.writeText(jsonText)
      setCopyMessage('JSONをコピーしました。')
    } catch {
      setCopyMessage('コピーに失敗しました。')
    }
  }

  if (!publicId) {
    return (
      <main className="admin-responses">
        <h1>エラー</h1>
        <p>イベントIDが指定されていません。</p>
      </main>
    )
  }

  return (
    <main className="admin-responses">
      <header className="admin-responses__header">
        <div>
          <h1>主催者ページ</h1>
          <p>イベントID: {publicId}</p>
        </div>
        <Link className="admin-responses__back" to={`/e/${encodedPublicId}`}>
          イベント詳細へ戻る
        </Link>
      </header>

      <section className="admin-responses__form">
        <label htmlFor="adminKey" className="admin-responses__label">
          管理キー
        </label>
        <div className="admin-responses__input-row">
          <input
            id="adminKey"
            name="adminKey"
            type="password"
            value={adminKey}
            onChange={(event) => {
              setAdminKey(event.target.value)
              if (adminKeyError) {
                setAdminKeyError(null)
              }
            }}
            placeholder="admin-key"
            className="admin-responses__input"
          />
          <button
            type="button"
            className="admin-responses__button"
            onClick={handleFetch}
            disabled={isLoading}
          >
            {isLoading ? '取得中...' : '取得'}
          </button>
        </div>
        {adminKeyError && (
          <p className="admin-responses__error" role="alert">
            {adminKeyError}
          </p>
        )}
      </section>

      {errorMessage && (
        <section className="admin-responses__alert" role="alert">
          {errorMessage}
        </section>
      )}

      {responseData !== null && responseData !== undefined && (
        <section className="admin-responses__results">
          <div className="admin-responses__results-header">
            <h2>取得結果</h2>
            <button
              type="button"
              className="admin-responses__secondary-button"
              onClick={handleCopyJson}
              disabled={!jsonText}
            >
              Copy JSON
            </button>
          </div>
          {copyMessage && (
            <p className="admin-responses__copy-message">{copyMessage}</p>
          )}

          {tableData && (
            <div className="admin-responses__table-wrapper">
              <table className="admin-responses__table">
                <thead>
                  <tr>
                    {tableData.columns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.rows.length === 0 ? (
                    <tr>
                      <td colSpan={tableData.columns.length}>データが空です。</td>
                    </tr>
                  ) : (
                    tableData.rows.map((row, rowIndex) => (
                      <tr key={`${rowIndex}`}>
                        {tableData.columns.map((column) => {
                          const value = tableData.isObjectRows
                            ? (row as Record<string, unknown>)[column]
                            : row
                          const display = formatValue(value)
                          return (
                            <td key={`${rowIndex}-${column}`}>
                              <span>{linkifyText(display)}</span>
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="admin-responses__json-block">
            <h3>JSON</h3>
            <pre className="admin-responses__json">
              {linkifyText(jsonText)}
            </pre>
          </div>
        </section>
      )}
    </main>
  )
}

export default AdminResponsesPage
