import { Link, useParams } from 'react-router-dom'

/**
 * Renders a results page that displays the current route's `publicId` and navigation links for the event.
 *
 * The component reads `publicId` from route parameters and renders a heading, the event ID, placeholder result text,
 * and links to the event's answer, results, and admin pages.
 *
 * @returns A JSX element representing the results page UI
 */
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