import { Link, useParams } from 'react-router-dom'

function ResultsPage() {
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

  return (
    <main>
      <h1>結果ページ</h1>
      <p>イベントID: {publicId}</p>
      <p>結果表示の雛形です。</p>
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

export default ResultsPage
