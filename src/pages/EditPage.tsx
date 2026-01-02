import { Link, useParams } from 'react-router-dom'

function EditPage() {
  const { publicId, editKey } = useParams()

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
      <h1>編集ページ</h1>
      <p>イベントID: {publicId}</p>
      <p>編集キー: {editKey}</p>
      <p>編集画面の雛形です。</p>
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

export default EditPage
