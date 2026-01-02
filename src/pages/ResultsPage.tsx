import { Link, useParams } from 'react-router-dom'

function ResultsPage() {
  const { publicId } = useParams()

  return (
    <main>
      <h1>結果ページ</h1>
      <p>イベントID: {publicId}</p>
      <p>結果表示の雛形です。</p>
      <nav>
        <ul>
          <li>
            <Link to={`/e/${publicId}`}>回答</Link>
          </li>
          <li>
            <Link to={`/e/${publicId}/results`}>結果</Link>
          </li>
          <li>
            <Link to={`/e/${publicId}/admin`}>主催者</Link>
          </li>
        </ul>
      </nav>
    </main>
  )
}

export default ResultsPage
