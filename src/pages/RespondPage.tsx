import { Link, useParams } from 'react-router-dom'

/**
 * Renders the event response page using the route parameter `publicId`.
 *
 * Displays the event ID, a placeholder description for the response form,
 * and navigation links to the response, results, and admin pages for the event.
 *
 * @returns A JSX element representing the respond page for the current event.
 */
function RespondPage() {
  const { publicId } = useParams()

  return (
    <main>
      <h1>回答ページ</h1>
      <p>イベントID: {publicId}</p>
      <p>回答フォームの雛形です。</p>
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

export default RespondPage