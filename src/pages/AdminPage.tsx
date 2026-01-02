import { Link, useParams } from 'react-router-dom'

/**
 * Renders the event organizer admin page using the route parameter `publicId`.
 *
 * Displays the event ID, an admin key input, and navigation links to the event, results, and admin subpages; `publicId` is read from route parameters.
 *
 * @returns The React element for the admin interface of the specified event.
 */
function AdminPage() {
  const { publicId } = useParams()

  return (
    <main>
      <h1>主催者ページ</h1>
      <p>イベントID: {publicId}</p>
      <p>主催者向けの管理画面の雛形です。</p>
      <label htmlFor="adminKey">管理キー</label>
      <input id="adminKey" name="adminKey" placeholder="admin-key" />
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

export default AdminPage