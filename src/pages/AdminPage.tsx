import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

function AdminPage() {
  const { publicId } = useParams()
  const [adminKey, setAdminKey] = useState('')

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
      <h1>主催者ページ</h1>
      <p>イベントID: {publicId}</p>
      <p>主催者向けの管理画面の雛形です。</p>
      <label htmlFor="adminKey">管理キー</label>
      <input
        id="adminKey"
        name="adminKey"
        value={adminKey}
        onChange={(event) => setAdminKey(event.target.value)}
        placeholder="admin-key"
      />
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

export default AdminPage
